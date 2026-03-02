import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import { getResourceName } from '../utils/naming';
import { applyTags } from '../utils/tags';
import * as path from 'path';

/**
 * ComputeStack - Lambda functions and API Gateway for all endpoints
 * 
 * Creates:
 * - Lambda functions for authentication
 * - Lambda functions for farm management
 * - Lambda functions for image processing
 * - Lambda functions for disease detection
 * - Lambda functions for market prices
 * - Lambda functions for optimization
 * - Lambda functions for advisory chatbot
 * - Lambda functions for IoT data
 * - Lambda functions for alerts
 * - API Gateway REST API with all endpoints
 * - IAM roles and permissions
 * 
 * Note: This stack combines Lambda functions and API Gateway to avoid circular dependencies
 * that would occur if they were in separate stacks.
 * 
 * Requirements: All Lambda-related requirements + API Gateway requirements
 */
export interface ComputeStackProps extends cdk.StackProps {
    userPool: cognito.IUserPool;
    userPoolClient: cognito.IUserPoolClient;
    imagesBucket: s3.IBucket;
    usersTable: dynamodb.ITable;
    farmsTable: dynamodb.ITable;
    imagesTable: dynamodb.ITable;
    diseaseAnalysesTable: dynamodb.ITable;
    marketPricesTable: dynamodb.ITable;
    sensorDataTable: dynamodb.ITable;
    sensorAggregatesTable: dynamodb.ITable;
    optimizationsTable: dynamodb.ITable;
    chatMessagesTable: dynamodb.ITable;
    alertsTable: dynamodb.ITable;
}

export class ComputeStack extends cdk.Stack {
    // API Gateway
    public readonly api: apigateway.RestApi;
    public readonly authorizer: apigateway.RequestAuthorizer;

    // Authorizer function
    public readonly authorizerFunction: lambda.Function;

    // Authentication functions
    public readonly authRegisterFunction: lambda.Function;
    public readonly authLoginFunction: lambda.Function;
    public readonly authRefreshFunction: lambda.Function;

    // Farm management functions
    public readonly farmCreateFunction: lambda.Function;
    public readonly farmListFunction: lambda.Function;
    public readonly farmGetFunction: lambda.Function;
    public readonly farmUpdateFunction: lambda.Function;
    public readonly farmDeleteFunction: lambda.Function;

    // Image processing functions
    public readonly imageUploadUrlFunction: lambda.Function;
    public readonly imageDownloadUrlFunction: lambda.Function;
    public readonly imageProcessFunction: lambda.Function;

    // Disease detection functions
    public readonly diseaseDetectFunction: lambda.Function;
    public readonly diseaseHistoryFunction: lambda.Function;

    // Market prices functions
    public readonly marketFetchFunction: lambda.Function;
    public readonly marketGetFunction: lambda.Function;
    public readonly marketPredictFunction: lambda.Function;

    // Optimization functions
    public readonly optimizationCalculateFunction: lambda.Function;
    public readonly optimizationHistoryFunction: lambda.Function;

    // Advisory chatbot functions
    public readonly advisoryChatFunction: lambda.Function;
    public readonly advisoryHistoryFunction: lambda.Function;

    // IoT functions
    public readonly iotQueryFunction: lambda.Function;

    // Alert functions
    public readonly alertListFunction: lambda.Function;
    public readonly alertAcknowledgeFunction: lambda.Function;

    constructor(scope: Construct, id: string, config: EnvironmentConfig, props: ComputeStackProps) {
        super(scope, id, props);

        // Common environment variables for all Lambda functions
        const commonEnv = {
            ENVIRONMENT: config.environment,
            REGION: config.region,
            LOG_LEVEL: config.environment === 'prod' ? 'info' : 'debug',
            USERS_TABLE: props.usersTable.tableName,
            FARMS_TABLE: props.farmsTable.tableName,
            IMAGES_TABLE: props.imagesTable.tableName,
            DISEASE_ANALYSES_TABLE: props.diseaseAnalysesTable.tableName,
            MARKET_PRICES_TABLE: props.marketPricesTable.tableName,
            SENSOR_DATA_TABLE: props.sensorDataTable.tableName,
            SENSOR_AGGREGATES_TABLE: props.sensorAggregatesTable.tableName,
            OPTIMIZATIONS_TABLE: props.optimizationsTable.tableName,
            CHAT_MESSAGES_TABLE: props.chatMessagesTable.tableName,
            ALERTS_TABLE: props.alertsTable.tableName,
            IMAGES_BUCKET: props.imagesBucket.bucketName,
            USER_POOL_ID: props.userPool.userPoolId,
            USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
        };

        // ===== AUTHORIZER FUNCTION =====

        // Create Lambda authorizer for API Gateway (Requirement 2.7, 2.8)
        // Moved from AuthStack to avoid circular dependency
        this.authorizerFunction = this.createFunction('Authorizer', {
            entry: path.join(__dirname, '../lambda/auth/authorizer/index.ts'),
            description: 'JWT token validation for API Gateway',
            environment: {
                USER_POOL_ID: props.userPool.userPoolId,
                CLIENT_ID: props.userPoolClient.userPoolClientId,
                REGION: config.region,
                LOG_LEVEL: 'info',
            },
            config,
            memorySize: 256, // Authorizers need less memory
            timeout: 10, // Quick validation (seconds)
        });

        // ===== AUTHENTICATION FUNCTIONS =====

        this.authRegisterFunction = this.createFunction('AuthRegister', {
            entry: path.join(__dirname, '../lambda/auth/register/index.ts'),
            description: 'Handle user registration',
            environment: commonEnv,
            config,
        });
        props.usersTable.grantReadWriteData(this.authRegisterFunction);

        this.authLoginFunction = this.createFunction('AuthLogin', {
            entry: path.join(__dirname, '../lambda/auth/login/index.ts'),
            description: 'Handle user login',
            environment: commonEnv,
            config,
        });
        props.usersTable.grantReadData(this.authLoginFunction);

        this.authRefreshFunction = this.createFunction('AuthRefresh', {
            entry: path.join(__dirname, '../lambda/auth/refresh/index.ts'),
            description: 'Handle token refresh',
            environment: commonEnv,
            config,
        });

        // ===== FARM MANAGEMENT FUNCTIONS =====

        this.farmCreateFunction = this.createFunction('FarmCreate', {
            entry: path.join(__dirname, '../lambda/farm/create/index.ts'),
            description: 'Create new farm',
            environment: commonEnv,
            config,
        });
        props.farmsTable.grantReadWriteData(this.farmCreateFunction);

        this.farmListFunction = this.createFunction('FarmList', {
            entry: path.join(__dirname, '../lambda/farm/list/index.ts'),
            description: 'List user farms',
            environment: commonEnv,
            config,
        });
        props.farmsTable.grantReadData(this.farmListFunction);

        this.farmGetFunction = this.createFunction('FarmGet', {
            entry: path.join(__dirname, '../lambda/farm/get/index.ts'),
            description: 'Get farm details',
            environment: commonEnv,
            config,
        });
        props.farmsTable.grantReadData(this.farmGetFunction);

        this.farmUpdateFunction = this.createFunction('FarmUpdate', {
            entry: path.join(__dirname, '../lambda/farm/update/index.ts'),
            description: 'Update farm',
            environment: commonEnv,
            config,
        });
        props.farmsTable.grantReadWriteData(this.farmUpdateFunction);

        this.farmDeleteFunction = this.createFunction('FarmDelete', {
            entry: path.join(__dirname, '../lambda/farm/delete/index.ts'),
            description: 'Delete farm',
            environment: commonEnv,
            config,
        });
        props.farmsTable.grantReadWriteData(this.farmDeleteFunction);

        // ===== IMAGE PROCESSING FUNCTIONS =====

        this.imageUploadUrlFunction = this.createFunction('ImageUploadUrl', {
            entry: path.join(__dirname, '../lambda/image/upload-url/index.ts'),
            description: 'Generate pre-signed upload URL',
            environment: commonEnv,
            config,
        });
        props.imagesBucket.grantPut(this.imageUploadUrlFunction);
        props.imagesTable.grantReadWriteData(this.imageUploadUrlFunction);

        this.imageDownloadUrlFunction = this.createFunction('ImageDownloadUrl', {
            entry: path.join(__dirname, '../lambda/image/download-url/index.ts'),
            description: 'Generate pre-signed download URL',
            environment: commonEnv,
            config,
        });
        props.imagesBucket.grantRead(this.imageDownloadUrlFunction);
        props.imagesTable.grantReadData(this.imageDownloadUrlFunction);

        this.imageProcessFunction = this.createFunction('ImageProcess', {
            entry: path.join(__dirname, '../lambda/image/process/index.ts'),
            description: 'Process uploaded images',
            environment: commonEnv,
            config,
        });
        props.imagesBucket.grantRead(this.imageProcessFunction);
        props.imagesTable.grantReadWriteData(this.imageProcessFunction);

        // ===== DISEASE DETECTION FUNCTIONS =====

        this.diseaseDetectFunction = this.createFunction('DiseaseDetect', {
            entry: path.join(__dirname, '../lambda/disease/detect/index.ts'),
            description: 'Detect crop diseases',
            environment: commonEnv,
            config,
            memorySize: 1024, // Higher memory for AI processing
            timeout: 60, // Longer timeout for AI processing
        });
        props.imagesBucket.grantRead(this.diseaseDetectFunction);
        props.imagesTable.grantReadData(this.diseaseDetectFunction);
        props.diseaseAnalysesTable.grantReadWriteData(this.diseaseDetectFunction);
        // Grant Rekognition permissions
        this.diseaseDetectFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['rekognition:DetectLabels', 'rekognition:DetectModerationLabels'],
            resources: ['*'],
        }));

        this.diseaseHistoryFunction = this.createFunction('DiseaseHistory', {
            entry: path.join(__dirname, '../lambda/disease/history/index.ts'),
            description: 'Get disease detection history',
            environment: commonEnv,
            config,
        });
        props.diseaseAnalysesTable.grantReadData(this.diseaseHistoryFunction);

        // ===== MARKET PRICES FUNCTIONS =====

        this.marketFetchFunction = this.createFunction('MarketFetch', {
            entry: path.join(__dirname, '../lambda/market/fetch/index.ts'),
            description: 'Fetch market prices (scheduled)',
            environment: commonEnv,
            config,
        });
        props.marketPricesTable.grantReadWriteData(this.marketFetchFunction);

        this.marketGetFunction = this.createFunction('MarketGet', {
            entry: path.join(__dirname, '../lambda/market/get/index.ts'),
            description: 'Get market prices',
            environment: commonEnv,
            config,
        });
        props.marketPricesTable.grantReadData(this.marketGetFunction);

        this.marketPredictFunction = this.createFunction('MarketPredict', {
            entry: path.join(__dirname, '../lambda/market/predict/index.ts'),
            description: 'Predict market prices',
            environment: commonEnv,
            config,
            memorySize: 1024,
            timeout: 60,
        });
        props.marketPricesTable.grantReadWriteData(this.marketPredictFunction);
        // Grant Bedrock permissions
        this.marketPredictFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel'],
            resources: ['*'],
        }));

        // ===== OPTIMIZATION FUNCTIONS =====

        this.optimizationCalculateFunction = this.createFunction('OptimizationCalculate', {
            entry: path.join(__dirname, '../lambda/optimization/calculate/index.ts'),
            description: 'Calculate resource optimization',
            environment: commonEnv,
            config,
            memorySize: 512,
        });
        props.optimizationsTable.grantReadWriteData(this.optimizationCalculateFunction);
        props.farmsTable.grantReadData(this.optimizationCalculateFunction);
        props.sensorDataTable.grantReadData(this.optimizationCalculateFunction);

        this.optimizationHistoryFunction = this.createFunction('OptimizationHistory', {
            entry: path.join(__dirname, '../lambda/optimization/history/index.ts'),
            description: 'Get optimization history',
            environment: commonEnv,
            config,
        });
        props.optimizationsTable.grantReadData(this.optimizationHistoryFunction);

        // ===== ADVISORY CHATBOT FUNCTIONS =====

        this.advisoryChatFunction = this.createFunction('AdvisoryChat', {
            entry: path.join(__dirname, '../lambda/advisory/chat/index.ts'),
            description: 'Advisory chatbot',
            environment: commonEnv,
            config,
            memorySize: 1024,
            timeout: 60,
        });
        props.chatMessagesTable.grantReadWriteData(this.advisoryChatFunction);
        props.farmsTable.grantReadData(this.advisoryChatFunction);
        props.sensorDataTable.grantReadData(this.advisoryChatFunction);
        // Grant Bedrock permissions
        this.advisoryChatFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel'],
            resources: ['*'],
        }));

        this.advisoryHistoryFunction = this.createFunction('AdvisoryHistory', {
            entry: path.join(__dirname, '../lambda/advisory/history/index.ts'),
            description: 'Get chat history',
            environment: commonEnv,
            config,
        });
        props.chatMessagesTable.grantReadData(this.advisoryHistoryFunction);

        // ===== IOT FUNCTIONS =====

        this.iotQueryFunction = this.createFunction('IotQuery', {
            entry: path.join(__dirname, '../lambda/iot/query/index.ts'),
            description: 'Query IoT sensor data',
            environment: commonEnv,
            config,
        });
        props.sensorDataTable.grantReadData(this.iotQueryFunction);
        props.sensorAggregatesTable.grantReadData(this.iotQueryFunction);

        // ===== ALERT FUNCTIONS =====

        this.alertListFunction = this.createFunction('AlertList', {
            entry: path.join(__dirname, '../lambda/alerts/list/index.ts'),
            description: 'List alerts',
            environment: commonEnv,
            config,
        });
        props.alertsTable.grantReadData(this.alertListFunction);

        this.alertAcknowledgeFunction = this.createFunction('AlertAcknowledge', {
            entry: path.join(__dirname, '../lambda/alerts/acknowledge/index.ts'),
            description: 'Acknowledge alert',
            environment: commonEnv,
            config,
        });
        props.alertsTable.grantReadWriteData(this.alertAcknowledgeFunction);

        // ===== API GATEWAY =====

        // Create CloudWatch log group for API Gateway access logs
        const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
            logGroupName: `/aws/apigateway/${config.environment}-farm-platform-api`,
            retention: config.cloudwatch.logRetention,
            removalPolicy: config.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });

        // Create REST API with regional endpoint
        this.api = new apigateway.RestApi(this, 'FarmPlatformApi', {
            restApiName: getResourceName(config.environment, 'api', 'farm-platform'),
            description: 'AI Rural Innovation Platform REST API',

            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL],
            },

            // CORS configuration for frontend domain
            defaultCorsPreflightOptions: {
                allowOrigins: config.environment === 'prod'
                    ? ['https://farmplatform.example.com']
                    : apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                ],
                allowCredentials: true,
                maxAge: cdk.Duration.hours(1),
            },

            // Enable CloudWatch logging
            deployOptions: {
                stageName: config.environment,
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                metricsEnabled: config.cloudwatch.metricsEnabled,
                accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
                    caller: true,
                    httpMethod: true,
                    ip: true,
                    protocol: true,
                    requestTime: true,
                    resourcePath: true,
                    responseLength: true,
                    status: true,
                    user: true,
                }),

                // Throttling settings
                throttlingRateLimit: config.apiGateway.throttle.rateLimit,
                throttlingBurstLimit: config.apiGateway.throttle.burstLimit,
            },

            cloudWatchRole: true,
            failOnWarnings: false,
        });

        // Create Lambda authorizer for JWT token validation
        this.authorizer = new apigateway.RequestAuthorizer(this, 'LambdaAuthorizer', {
            handler: this.authorizerFunction,
            identitySources: [apigateway.IdentitySource.header('Authorization')],
            authorizerName: getResourceName(config.environment, 'authorizer', 'jwt'),
            resultsCacheTtl: cdk.Duration.minutes(5),
        });

        // Request validator for body and parameters
        const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
            restApi: this.api,
            requestValidatorName: 'request-body-validator',
            validateRequestBody: true,
            validateRequestParameters: true,
        });

        // ===== API ENDPOINTS =====

        // Authentication endpoints (no authorization required)
        const authResource = this.api.root.addResource('auth');
        this.addEndpoint(authResource, 'register', 'POST', this.authRegisterFunction, { validator: requestValidator, requiresAuth: false });
        this.addEndpoint(authResource, 'login', 'POST', this.authLoginFunction, { validator: requestValidator, requiresAuth: false });
        this.addEndpoint(authResource, 'refresh', 'POST', this.authRefreshFunction, { validator: requestValidator, requiresAuth: false });

        // Farm management endpoints (authorized)
        const farmsResource = this.api.root.addResource('farms');
        this.addEndpoint(farmsResource, null, 'POST', this.farmCreateFunction, { validator: requestValidator, requiresAuth: true });
        this.addEndpoint(farmsResource, null, 'GET', this.farmListFunction, { requiresAuth: true });
        const farmIdResource = farmsResource.addResource('{farmId}');
        this.addEndpoint(farmIdResource, null, 'GET', this.farmGetFunction, { requiresAuth: true });
        this.addEndpoint(farmIdResource, null, 'PUT', this.farmUpdateFunction, { validator: requestValidator, requiresAuth: true });
        this.addEndpoint(farmIdResource, null, 'DELETE', this.farmDeleteFunction, { requiresAuth: true });

        // Image processing endpoints (authorized)
        const imagesResource = this.api.root.addResource('images');
        this.addEndpoint(imagesResource, 'upload-url', 'POST', this.imageUploadUrlFunction, { validator: requestValidator, requiresAuth: true });
        const imageIdResource = imagesResource.addResource('{imageId}');
        this.addEndpoint(imageIdResource, 'download-url', 'GET', this.imageDownloadUrlFunction, { requiresAuth: true });

        // Disease detection endpoints (authorized)
        const diseaseDetectionResource = this.api.root.addResource('disease-detection');
        this.addEndpoint(diseaseDetectionResource, 'analyze', 'POST', this.diseaseDetectFunction, { validator: requestValidator, requiresAuth: true });
        this.addEndpoint(diseaseDetectionResource, 'history', 'GET', this.diseaseHistoryFunction, { requiresAuth: true });

        // Market prices endpoints (authorized)
        const marketPricesResource = this.api.root.addResource('market-prices');
        this.addEndpoint(marketPricesResource, null, 'GET', this.marketGetFunction, { requiresAuth: true });
        const commodityResource = marketPricesResource.addResource('{commodity}');
        this.addEndpoint(commodityResource, null, 'GET', this.marketGetFunction, { requiresAuth: true });
        this.addEndpoint(marketPricesResource, 'predict', 'POST', this.marketPredictFunction, { validator: requestValidator, requiresAuth: true });

        // Optimization endpoints (authorized)
        const optimizationResource = this.api.root.addResource('optimization');
        this.addEndpoint(optimizationResource, 'calculate', 'POST', this.optimizationCalculateFunction, { validator: requestValidator, requiresAuth: true });
        this.addEndpoint(optimizationResource, 'history', 'GET', this.optimizationHistoryFunction, { requiresAuth: true });

        // Advisory chatbot endpoints (authorized)
        const advisoryResource = this.api.root.addResource('advisory');
        this.addEndpoint(advisoryResource, 'chat', 'POST', this.advisoryChatFunction, { validator: requestValidator, requiresAuth: true });
        this.addEndpoint(advisoryResource, 'history', 'GET', this.advisoryHistoryFunction, { requiresAuth: true });

        // IoT sensor data endpoints (authorized)
        const sensorsResource = this.api.root.addResource('sensors');
        const sensorsDataResource = sensorsResource.addResource('data');
        this.addEndpoint(sensorsDataResource, null, 'GET', this.iotQueryFunction, { requiresAuth: true });
        const deviceIdResource = sensorsDataResource.addResource('{deviceId}');
        this.addEndpoint(deviceIdResource, null, 'GET', this.iotQueryFunction, { requiresAuth: true });

        // Alerts endpoints (authorized)
        const alertsResource = this.api.root.addResource('alerts');
        this.addEndpoint(alertsResource, null, 'GET', this.alertListFunction, { requiresAuth: true });
        const alertIdResource = alertsResource.addResource('{alertId}');
        this.addEndpoint(alertIdResource, 'acknowledge', 'PUT', this.alertAcknowledgeFunction, { validator: requestValidator, requiresAuth: true });

        // ===== USAGE PLAN =====

        const usagePlan = this.api.addUsagePlan('UsagePlan', {
            name: getResourceName(config.environment, 'usage-plan', 'default'),
            description: 'Default usage plan with rate limiting',
            throttle: {
                rateLimit: config.apiGateway.throttle.rateLimit,
                burstLimit: config.apiGateway.throttle.burstLimit,
            },
            quota: {
                limit: 100000,
                period: apigateway.Period.DAY,
            },
        });

        usagePlan.addApiStage({
            stage: this.api.deploymentStage,
        });

        // ===== CLOUDFORMATION OUTPUTS =====

        new cdk.CfnOutput(this, 'ApiEndpoint', {
            value: this.api.url,
            description: 'API Gateway endpoint URL',
        });

        new cdk.CfnOutput(this, 'ApiId', {
            value: this.api.restApiId,
            description: 'API Gateway REST API ID',
        });

        new cdk.CfnOutput(this, 'ApiStage', {
            value: this.api.deploymentStage.stageName,
            description: 'API Gateway deployment stage',
        });

        // Apply tags to all resources in this stack
        applyTags(this, config.tags);
    }

    /**
     * Helper method to add an endpoint to a resource
     */
    private addEndpoint(
        resource: apigateway.IResource,
        pathPart: string | null,
        method: string,
        handler: lambda.IFunction,
        options: {
            validator?: apigateway.IRequestValidator;
            requiresAuth?: boolean;
        } = {}
    ): apigateway.Method {
        const targetResource = pathPart ? resource.addResource(pathPart) : resource;
        const integration = new apigateway.LambdaIntegration(handler, {
            proxy: true,
            allowTestInvoke: true,
        });

        const methodOptions: apigateway.MethodOptions = {
            requestValidator: options.validator,
            ...(options.requiresAuth && {
                authorizer: this.authorizer,
                authorizationType: apigateway.AuthorizationType.CUSTOM,
            }),
        };

        return targetResource.addMethod(method, integration, methodOptions);
    }

    /**
     * Helper method to create a Lambda function with common configuration
     */
    private createFunction(
        id: string,
        options: {
            entry: string;
            description: string;
            environment: Record<string, string>;
            config: EnvironmentConfig;
            memorySize?: number;
            timeout?: number;
        }
    ): lambda.Function {
        const functionName = getResourceName(options.config.environment, 'lambda', id.toLowerCase());

        return new lambda.Function(this, id, {
            functionName,
            runtime: lambda.Runtime.NODEJS_20_X,
            architecture: options.config.lambda.architecture === 'arm64'
                ? lambda.Architecture.ARM_64
                : lambda.Architecture.X86_64,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.dirname(options.entry)),
            memorySize: options.memorySize || options.config.lambda.memorySize,
            timeout: cdk.Duration.seconds(options.timeout || options.config.lambda.timeout),
            environment: options.environment,
            description: options.description,
            logRetention: options.config.cloudwatch.logRetention,
            tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
            reservedConcurrentExecutions: options.config.lambda.reservedConcurrentExecutions,
        });
    }
}
