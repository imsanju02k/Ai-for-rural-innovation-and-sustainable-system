import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';

/**
 * IAM Roles and Policies Construct
 * Creates all IAM roles and policies for the AWS Backend Infrastructure
 * Following the principle of least privilege
 */
export class IamRolesConstruct extends Construct {
    public readonly baseLambdaRole: iam.Role;
    public readonly farmManagementRole: iam.Role;
    public readonly imageProcessingRole: iam.Role;
    public readonly diseaseDetectionRole: iam.Role;
    public readonly marketDataRole: iam.Role;
    public readonly optimizationRole: iam.Role;
    public readonly advisoryChatRole: iam.Role;
    public readonly iotDataRole: iam.Role;
    public readonly alertRole: iam.Role;
    public readonly apiGatewayRole: iam.Role;

    constructor(scope: Construct, id: string, config: EnvironmentConfig) {
        super(scope, id);

        const { environment, region, account } = config;
        const accountId = account || cdk.Aws.ACCOUNT_ID;

        // Base Lambda Execution Role - CloudWatch Logs and X-Ray
        this.baseLambdaRole = new iam.Role(this, 'BaseLambdaRole', {
            roleName: `${environment}-base-lambda-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Base execution role for Lambda functions with CloudWatch and X-Ray permissions',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
            ],
        });

        // Farm Management Lambda Role
        this.farmManagementRole = new iam.Role(this, 'FarmManagementRole', {
            roleName: `${environment}-farm-management-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for farm management Lambda functions',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
            ],
        });

        this.farmManagementRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:Query',
                ],
                resources: [
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-farms`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-farms/index/*`,
                ],
            })
        );

        // Image Processing Lambda Role
        this.imageProcessingRole = new iam.Role(this, 'ImageProcessingRole', {
            roleName: `${environment}-image-processing-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for image processing Lambda functions',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
            ],
        });

        this.imageProcessingRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:GetObject', 's3:PutObject'],
                resources: [`arn:aws:s3:::${environment}-farm-images-*/*`],
            })
        );

        this.imageProcessingRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
                resources: [
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-images`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-images/index/*`,
                ],
            })
        );

        // Disease Detection Lambda Role
        this.diseaseDetectionRole = new iam.Role(this, 'DiseaseDetectionRole', {
            roleName: `${environment}-disease-detection-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for disease detection Lambda functions with AI service access',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
            ],
        });

        this.diseaseDetectionRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:GetObject'],
                resources: [`arn:aws:s3:::${environment}-farm-images-*/*`],
            })
        );

        this.diseaseDetectionRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['rekognition:DetectLabels', 'rekognition:DetectModerationLabels'],
                resources: ['*'],
            })
        );

        this.diseaseDetectionRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['bedrock:InvokeModel'],
                resources: ['arn:aws:bedrock:*::foundation-model/anthropic.claude-3-*'],
            })
        );

        this.diseaseDetectionRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sagemaker:InvokeEndpoint'],
                resources: [`arn:aws:sagemaker:${region}:${accountId}:endpoint/disease-detection-*`],
            })
        );

        this.diseaseDetectionRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:PutItem', 'dynamodb:Query', 'dynamodb:GetItem'],
                resources: [
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-disease-analyses`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-disease-analyses/index/*`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-images`,
                ],
            })
        );

        // Market Data Lambda Role
        this.marketDataRole = new iam.Role(this, 'MarketDataRole', {
            roleName: `${environment}-market-data-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for market data Lambda functions',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
            ],
        });

        this.marketDataRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query', 'dynamodb:BatchWriteItem'],
                resources: [
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-market-prices`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-market-prices/index/*`,
                ],
            })
        );

        this.marketDataRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['bedrock:InvokeModel'],
                resources: ['arn:aws:bedrock:*::foundation-model/anthropic.claude-3-*'],
            })
        );

        // Optimization Lambda Role
        this.optimizationRole = new iam.Role(this, 'OptimizationRole', {
            roleName: `${environment}-optimization-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for resource optimization Lambda functions',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
            ],
        });

        this.optimizationRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query'],
                resources: [
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-optimizations`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-optimizations/index/*`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-sensor-data`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-sensor-data/index/*`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-farms`,
                ],
            })
        );

        this.optimizationRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['bedrock:InvokeModel'],
                resources: ['arn:aws:bedrock:*::foundation-model/anthropic.claude-3-*'],
            })
        );

        // Advisory Chat Lambda Role
        this.advisoryChatRole = new iam.Role(this, 'AdvisoryChatRole', {
            roleName: `${environment}-advisory-chat-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for advisory chatbot Lambda functions',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
            ],
        });

        this.advisoryChatRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['bedrock:InvokeModel'],
                resources: ['arn:aws:bedrock:*::foundation-model/anthropic.claude-3-*'],
            })
        );

        this.advisoryChatRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:PutItem', 'dynamodb:Query', 'dynamodb:GetItem'],
                resources: [
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-chat-messages`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-chat-messages/index/*`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-farms`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-sensor-data`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-sensor-data/index/*`,
                ],
            })
        );

        // IoT Data Lambda Role
        this.iotDataRole = new iam.Role(this, 'IoTDataRole', {
            roleName: `${environment}-iot-data-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for IoT data processing Lambda functions',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
            ],
        });

        this.iotDataRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['iot:Publish', 'iot:Subscribe', 'iot:Receive'],
                resources: [`arn:aws:iot:${region}:${accountId}:topic/farm/+/sensors/*`],
            })
        );

        this.iotDataRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:PutItem', 'dynamodb:BatchWriteItem', 'dynamodb:Query', 'dynamodb:GetItem'],
                resources: [
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-sensor-data`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-sensor-data/index/*`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-sensor-aggregates`,
                ],
            })
        );

        // Alert Lambda Role
        this.alertRole = new iam.Role(this, 'AlertRole', {
            roleName: `${environment}-alert-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for alert Lambda functions with SNS and SES permissions',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
            ],
        });

        this.alertRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sns:Publish'],
                resources: [`arn:aws:sns:${region}:${accountId}:${environment}-alerts-topic`],
            })
        );

        this.alertRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['ses:SendEmail', 'ses:SendRawEmail'],
                resources: ['*'],
                conditions: {
                    StringEquals: {
                        'ses:FromAddress': 'alerts@farmplatform.example.com',
                    },
                },
            })
        );

        this.alertRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:Query', 'dynamodb:GetItem'],
                resources: [
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-alerts`,
                    `arn:aws:dynamodb:${region}:${accountId}:table/${environment}-alerts/index/*`,
                ],
            })
        );

        // API Gateway Execution Role
        this.apiGatewayRole = new iam.Role(this, 'ApiGatewayRole', {
            roleName: `${environment}-api-gateway-role`,
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            description: 'Role for API Gateway to invoke Lambda functions and write logs',
        });

        this.apiGatewayRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['lambda:InvokeFunction'],
                resources: [`arn:aws:lambda:${region}:${accountId}:function:${environment}-*`],
            })
        );

        this.apiGatewayRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                resources: ['*'],
            })
        );

        // Add tags to all roles
        const roles = [
            this.baseLambdaRole,
            this.farmManagementRole,
            this.imageProcessingRole,
            this.diseaseDetectionRole,
            this.marketDataRole,
            this.optimizationRole,
            this.advisoryChatRole,
            this.iotDataRole,
            this.alertRole,
            this.apiGatewayRole,
        ];

        roles.forEach((role) => {
            cdk.Tags.of(role).add('Environment', environment);
            cdk.Tags.of(role).add('Project', 'AI-Rural-Innovation-Platform');
            cdk.Tags.of(role).add('ManagedBy', 'CDK');
        });
    }
}
