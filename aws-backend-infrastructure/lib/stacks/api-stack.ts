import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import { getResourceName } from '../utils/naming';
import { applyTags } from '../utils/tags';

/**
 * APIStack - API Gateway REST API with all endpoints
 * 
 * Creates:
 * - REST API with regional endpoint
 * - CORS configuration for frontend
 * - Lambda authorizer integration
 * - All API endpoints for the platform
 * - Request validation
 * - Rate limiting and usage plans
 * - API Gateway logging
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.6, 1.7, 2.7, 2.8
 */
export interface APIStackProps extends cdk.StackProps {
    authorizerFunction: lambda.IFunction;
    // Lambda functions for endpoints
    authRegisterFunction: lambda.IFunction;
    authLoginFunction: lambda.IFunction;
    authRefreshFunction: lambda.IFunction;
    farmCreateFunction: lambda.IFunction;
    farmListFunction: lambda.IFunction;
    farmGetFunction: lambda.IFunction;
    farmUpdateFunction: lambda.IFunction;
    farmDeleteFunction: lambda.IFunction;
    imageUploadUrlFunction: lambda.IFunction;
    imageDownloadUrlFunction: lambda.IFunction;
    diseaseDetectFunction: lambda.IFunction;
    diseaseHistoryFunction: lambda.IFunction;
    marketGetFunction: lambda.IFunction;
    marketPredictFunction: lambda.IFunction;
    optimizationCalculateFunction: lambda.IFunction;
    optimizationHistoryFunction: lambda.IFunction;
    advisoryChatFunction: lambda.IFunction;
    advisoryHistoryFunction: lambda.IFunction;
    iotQueryFunction: lambda.IFunction;
    alertListFunction: lambda.IFunction;
    alertAcknowledgeFunction: lambda.IFunction;
}

export class APIStack extends cdk.Stack {
    public readonly api: apigateway.RestApi;
    public readonly authorizer: apigateway.RequestAuthorizer;

    constructor(scope: Construct, id: string, config: EnvironmentConfig, props: APIStackProps) {
        super(scope, id, props);

        // ===== API GATEWAY LOG GROUP =====

        // Create CloudWatch log group for API Gateway access logs (Requirement 1.7)
        const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
            logGroupName: `/aws/apigateway/${config.environment}-farm-platform-api`,
            retention: config.cloudwatch.logRetention,
            removalPolicy: config.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });

        // ===== REST API =====

        // Create REST API with regional endpoint (Requirement 1.1)
        this.api = new apigateway.RestApi(this, 'FarmPlatformApi', {
            restApiName: getResourceName(config.environment, 'api', 'farm-platform'),
            description: 'AI Rural Innovation Platform REST API',

            // Regional endpoint type
            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL],
            },

            // CORS configuration for frontend domain (Requirement 1.3)
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

            // Enable CloudWatch logging (Requirement 1.7)
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

                // Throttling settings (Requirement 1.6)
                throttlingRateLimit: config.apiGateway.throttle.rateLimit,
                throttlingBurstLimit: config.apiGateway.throttle.burstLimit,
            },

            // API Gateway CloudWatch role
            cloudWatchRole: true,

            // Fail on warnings during deployment
            failOnWarnings: false,
        });

        // ===== LAMBDA AUTHORIZER =====

        // Create Lambda authorizer for JWT token validation (Requirements 2.7, 2.8)
        // Using RequestAuthorizer instead of TokenAuthorizer to avoid circular dependency
        this.authorizer = new apigateway.RequestAuthorizer(this, 'LambdaAuthorizer', {
            handler: props.authorizerFunction,
            identitySources: [apigateway.IdentitySource.header('Authorization')],
            authorizerName: getResourceName(config.environment, 'authorizer', 'jwt'),
            resultsCacheTtl: cdk.Duration.minutes(5), // Cache authorization results for 5 minutes
        });

        // ===== REQUEST VALIDATORS =====

        // Request validator for body and parameters (Requirement 1.4)
        const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
            restApi: this.api,
            requestValidatorName: 'request-body-validator',
            validateRequestBody: true,
            validateRequestParameters: true,
        });

        // ===== API ENDPOINTS =====

        // Authentication endpoints (no authorization required)
        const authResource = this.api.root.addResource('auth');

        this.addEndpoint(authResource, 'register', 'POST', props.authRegisterFunction, {
            validator: requestValidator,
            requiresAuth: false,
        });

        this.addEndpoint(authResource, 'login', 'POST', props.authLoginFunction, {
            validator: requestValidator,
            requiresAuth: false,
        });

        this.addEndpoint(authResource, 'refresh', 'POST', props.authRefreshFunction, {
            validator: requestValidator,
            requiresAuth: false,
        });

        // Farm management endpoints (authorized)
        const farmsResource = this.api.root.addResource('farms');

        this.addEndpoint(farmsResource, null, 'POST', props.farmCreateFunction, {
            validator: requestValidator,
            requiresAuth: true,
        });

        this.addEndpoint(farmsResource, null, 'GET', props.farmListFunction, {
            requiresAuth: true,
        });

        const farmIdResource = farmsResource.addResource('{farmId}');

        this.addEndpoint(farmIdResource, null, 'GET', props.farmGetFunction, {
            requiresAuth: true,
        });

        this.addEndpoint(farmIdResource, null, 'PUT', props.farmUpdateFunction, {
            validator: requestValidator,
            requiresAuth: true,
        });

        this.addEndpoint(farmIdResource, null, 'DELETE', props.farmDeleteFunction, {
            requiresAuth: true,
        });

        // Image processing endpoints (authorized)
        const imagesResource = this.api.root.addResource('images');

        this.addEndpoint(imagesResource, 'upload-url', 'POST', props.imageUploadUrlFunction, {
            validator: requestValidator,
            requiresAuth: true,
        });

        const imageIdResource = imagesResource.addResource('{imageId}');

        this.addEndpoint(imageIdResource, 'download-url', 'GET', props.imageDownloadUrlFunction, {
            requiresAuth: true,
        });

        // Disease detection endpoints (authorized)
        const diseaseDetectionResource = this.api.root.addResource('disease-detection');

        this.addEndpoint(diseaseDetectionResource, 'analyze', 'POST', props.diseaseDetectFunction, {
            validator: requestValidator,
            requiresAuth: true,
        });

        this.addEndpoint(diseaseDetectionResource, 'history', 'GET', props.diseaseHistoryFunction, {
            requiresAuth: true,
        });

        // Market prices endpoints (authorized)
        const marketPricesResource = this.api.root.addResource('market-prices');

        this.addEndpoint(marketPricesResource, null, 'GET', props.marketGetFunction, {
            requiresAuth: true,
        });

        const commodityResource = marketPricesResource.addResource('{commodity}');

        this.addEndpoint(commodityResource, null, 'GET', props.marketGetFunction, {
            requiresAuth: true,
        });

        this.addEndpoint(marketPricesResource, 'predict', 'POST', props.marketPredictFunction, {
            validator: requestValidator,
            requiresAuth: true,
        });

        // Optimization endpoints (authorized)
        const optimizationResource = this.api.root.addResource('optimization');

        this.addEndpoint(optimizationResource, 'calculate', 'POST', props.optimizationCalculateFunction, {
            validator: requestValidator,
            requiresAuth: true,
        });

        this.addEndpoint(optimizationResource, 'history', 'GET', props.optimizationHistoryFunction, {
            requiresAuth: true,
        });

        // Advisory chatbot endpoints (authorized)
        const advisoryResource = this.api.root.addResource('advisory');

        this.addEndpoint(advisoryResource, 'chat', 'POST', props.advisoryChatFunction, {
            validator: requestValidator,
            requiresAuth: true,
        });

        this.addEndpoint(advisoryResource, 'history', 'GET', props.advisoryHistoryFunction, {
            requiresAuth: true,
        });

        // IoT sensor data endpoints (authorized)
        const sensorsResource = this.api.root.addResource('sensors');
        const sensorsDataResource = sensorsResource.addResource('data');

        this.addEndpoint(sensorsDataResource, null, 'GET', props.iotQueryFunction, {
            requiresAuth: true,
        });

        const deviceIdResource = sensorsDataResource.addResource('{deviceId}');

        this.addEndpoint(deviceIdResource, null, 'GET', props.iotQueryFunction, {
            requiresAuth: true,
        });

        // Alerts endpoints (authorized)
        const alertsResource = this.api.root.addResource('alerts');

        this.addEndpoint(alertsResource, null, 'GET', props.alertListFunction, {
            requiresAuth: true,
        });

        const alertIdResource = alertsResource.addResource('{alertId}');

        this.addEndpoint(alertIdResource, 'acknowledge', 'PUT', props.alertAcknowledgeFunction, {
            validator: requestValidator,
            requiresAuth: true,
        });

        // ===== USAGE PLAN AND API KEY =====

        // Create usage plan for rate limiting (Requirement 1.6)
        const usagePlan = this.api.addUsagePlan('UsagePlan', {
            name: getResourceName(config.environment, 'usage-plan', 'default'),
            description: 'Default usage plan with rate limiting',
            throttle: {
                rateLimit: config.apiGateway.throttle.rateLimit, // 1000 requests per minute
                burstLimit: config.apiGateway.throttle.burstLimit,
            },
            quota: {
                limit: 100000,
                period: apigateway.Period.DAY,
            },
        });

        // Associate usage plan with API stage
        usagePlan.addApiStage({
            stage: this.api.deploymentStage,
        });

        // Apply tags to all resources in this stack
        applyTags(this, config.tags);

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
        // Add path part if specified
        const targetResource = pathPart ? resource.addResource(pathPart) : resource;

        // Grant API Gateway permission to invoke the Lambda function
        // This must be done explicitly to avoid circular dependency
        handler.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

        // Create Lambda integration without automatic permission granting
        const integration = new apigateway.LambdaIntegration(handler, {
            proxy: true,
            allowTestInvoke: true,
        });

        // Build method options
        const methodOptions: apigateway.MethodOptions = {
            requestValidator: options.validator,
            // Add authorizer if authentication is required
            ...(options.requiresAuth && {
                authorizer: this.authorizer,
                authorizationType: apigateway.AuthorizationType.CUSTOM,
            }),
        };

        return targetResource.addMethod(method, integration, methodOptions);
    }
}
