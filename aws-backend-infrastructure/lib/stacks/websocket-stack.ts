import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import { applyTags } from '../utils/tags';
import { getResourceName } from '../utils/naming';

interface WebSocketStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  iotTopicArn: string;
}

export class WebSocketStack extends cdk.Stack {
  public readonly webSocketApi: apigatewayv2.CfnApi;
  public readonly webSocketEndpoint: string;

  constructor(scope: Construct, id: string, props: WebSocketStackProps) {
    super(scope, id, props);

    const { config } = props;

    // DynamoDB table for WebSocket connections
    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: getResourceName(config.environment, 'websocket-connections'),
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'farmId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: config.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: config.environment === 'prod',
      timeToLiveAttribute: 'ttl',
    });

    // Add GSI for querying by farmId
    connectionsTable.addGlobalSecondaryIndex({
      indexName: 'FarmIdIndex',
      partitionKey: { name: 'farmId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'WebSocketLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions
    connectionsTable.grantReadWriteData(lambdaRole);

    // Connection handler Lambda
    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      functionName: getResourceName(config.environment, 'websocket-connect'),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/websocket/connect'),
      role: lambdaRole,
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        ENVIRONMENT: config.environment,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Disconnect handler Lambda
    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      functionName: getResourceName(config.environment, 'websocket-disconnect'),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/websocket/disconnect'),
      role: lambdaRole,
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        ENVIRONMENT: config.environment,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Message handler Lambda
    const messageHandler = new lambda.Function(this, 'MessageHandler', {
      functionName: getResourceName(config.environment, 'websocket-message'),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/websocket/message'),
      role: lambdaRole,
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        ENVIRONMENT: config.environment,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // IoT data streaming handler Lambda
    const iotStreamHandler = new lambda.Function(this, 'IoTStreamHandler', {
      functionName: getResourceName(config.environment, 'websocket-iot-stream'),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/websocket/iot-stream'),
      role: lambdaRole,
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        ENVIRONMENT: config.environment,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Create WebSocket API
    this.webSocketApi = new apigatewayv2.CfnApi(this, 'WebSocketApi', {
      name: getResourceName(config.environment, 'websocket-api'),
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
    });

    // Create integrations
    const connectIntegration = new apigatewayv2.CfnIntegration(this, 'ConnectIntegration', {
      apiId: this.webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${connectHandler.functionArn}/invocations`,
    });

    const disconnectIntegration = new apigatewayv2.CfnIntegration(this, 'DisconnectIntegration', {
      apiId: this.webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${disconnectHandler.functionArn}/invocations`,
    });

    const messageIntegration = new apigatewayv2.CfnIntegration(this, 'MessageIntegration', {
      apiId: this.webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${messageHandler.functionArn}/invocations`,
    });

    // Create routes
    new apigatewayv2.CfnRoute(this, 'ConnectRoute', {
      apiId: this.webSocketApi.ref,
      routeKey: '$connect',
      authorizationType: 'NONE',
      target: `integrations/${connectIntegration.ref}`,
    });

    new apigatewayv2.CfnRoute(this, 'DisconnectRoute', {
      apiId: this.webSocketApi.ref,
      routeKey: '$disconnect',
      target: `integrations/${disconnectIntegration.ref}`,
    });

    new apigatewayv2.CfnRoute(this, 'SubscribeRoute', {
      apiId: this.webSocketApi.ref,
      routeKey: 'subscribe',
      target: `integrations/${messageIntegration.ref}`,
    });

    new apigatewayv2.CfnRoute(this, 'UnsubscribeRoute', {
      apiId: this.webSocketApi.ref,
      routeKey: 'unsubscribe',
      target: `integrations/${messageIntegration.ref}`,
    });

    // Create deployment
    const deployment = new apigatewayv2.CfnDeployment(this, 'Deployment', {
      apiId: this.webSocketApi.ref,
    });

    // Create stage
    const stage = new apigatewayv2.CfnStage(this, 'Stage', {
      apiId: this.webSocketApi.ref,
      stageName: config.environment,
      deploymentId: deployment.ref,
      defaultRouteSettings: {
        throttlingBurstLimit: 500,
        throttlingRateLimit: 1000,
      },
    });

    // Grant API Gateway permission to invoke Lambda functions
    connectHandler.addPermission('ApiGatewayInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.ref}/*`,
    });

    disconnectHandler.addPermission('ApiGatewayInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.ref}/*`,
    });

    messageHandler.addPermission('ApiGatewayInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.ref}/*`,
    });

    // Grant permission to post to connections
    const apiGatewayManagementPolicy = new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: [
        `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.ref}/${config.environment}/POST/@connections/*`,
      ],
    });

    messageHandler.addToRolePolicy(apiGatewayManagementPolicy);
    iotStreamHandler.addToRolePolicy(apiGatewayManagementPolicy);

    // WebSocket endpoint
    this.webSocketEndpoint = `wss://${this.webSocketApi.ref}.execute-api.${this.region}.amazonaws.com/${config.environment}`;

    // Outputs
    new cdk.CfnOutput(this, 'WebSocketEndpoint', {
      value: this.webSocketEndpoint,
      description: 'WebSocket API endpoint',
      exportName: `${config.environment}-WebSocketEndpoint`,
    });

    new cdk.CfnOutput(this, 'ConnectionsTableName', {
      value: connectionsTable.tableName,
      description: 'WebSocket connections table name',
      exportName: `${config.environment}-ConnectionsTableName`,
    });

    // Apply tags
    applyTags(this, config);
  }
}
