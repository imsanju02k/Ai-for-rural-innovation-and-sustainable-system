import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import { getResourceName } from '../utils/naming';
import * as path from 'path';

/**
 * Lambda Authorizer Construct
 * 
 * Creates a Lambda function that validates JWT tokens from Cognito
 * and returns IAM policies for API Gateway
 * 
 * Requirements: 2.7, 2.8
 */
export interface LambdaAuthorizerProps {
    config: EnvironmentConfig;
    userPool: cognito.IUserPool;
    userPoolClient: cognito.IUserPoolClient;
}

export class LambdaAuthorizerConstruct extends Construct {
    public readonly authorizerFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: LambdaAuthorizerProps) {
        super(scope, id);

        const { config, userPool, userPoolClient } = props;

        // Create Lambda function for JWT validation
        this.authorizerFunction = new lambda.Function(this, 'AuthorizerFunction', {
            functionName: getResourceName(config.environment, 'lambda', 'auth-authorizer'),
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(
                path.join(__dirname, '../lambda/auth/authorizer')
            ),
            architecture: config.lambda.architecture === 'arm64'
                ? lambda.Architecture.ARM_64
                : lambda.Architecture.X86_64,
            memorySize: 256, // Authorizers need less memory
            timeout: cdk.Duration.seconds(10), // Quick validation
            environment: {
                USER_POOL_ID: userPool.userPoolId,
                CLIENT_ID: userPoolClient.userPoolClientId,
                REGION: config.region,
                LOG_LEVEL: 'info',
            },
            description: 'Lambda authorizer for API Gateway JWT validation',
            logRetention: logs.RetentionDays.ONE_WEEK,
            tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
        });

        // Add tags
        cdk.Tags.of(this.authorizerFunction).add('Environment', config.environment);
        cdk.Tags.of(this.authorizerFunction).add('Project', 'AI-Rural-Innovation-Platform');
        cdk.Tags.of(this.authorizerFunction).add('ManagedBy', 'CDK');
        cdk.Tags.of(this.authorizerFunction).add('Component', 'Authentication');

        // CloudFormation output
        new cdk.CfnOutput(this, 'AuthorizerFunctionArn', {
            value: this.authorizerFunction.functionArn,
            description: 'Lambda authorizer function ARN',
        });
    }
}
