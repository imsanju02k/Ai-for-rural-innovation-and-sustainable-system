import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';

export interface AIStackProps extends cdk.StackProps {
    config: EnvironmentConfig;
}

/**
 * AIStack - Amazon Bedrock and Rekognition configuration
 * 
 * This stack configures AI/ML services for the platform:
 * - Amazon Bedrock (Claude 3 Sonnet) for generative AI
 * - Amazon Rekognition for image analysis
 * - IAM roles and permissions for AI service access
 * - CloudWatch logging for model invocations
 */
export class AIStack extends cdk.Stack {
    public readonly bedrockRole: iam.Role;
    public readonly rekognitionRole: iam.Role;
    public readonly bedrockLogGroup: logs.LogGroup;

    constructor(scope: Construct, id: string, props: AIStackProps) {
        super(scope, id, props);

        const { config } = props;

        // CloudWatch Log Group for Bedrock invocations
        this.bedrockLogGroup = new logs.LogGroup(this, 'BedrockLogGroup', {
            logGroupName: `/aws/bedrock/${config.environment}`,
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: config.environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // IAM Role for Bedrock access
        this.bedrockRole = new iam.Role(this, 'BedrockRole', {
            roleName: `${config.environment}-bedrock-access-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for Lambda functions to invoke Amazon Bedrock models',
        });

        // Grant Bedrock model invocation permissions
        // Claude 3 Sonnet model access
        this.bedrockRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'bedrock:InvokeModel',
                    'bedrock:InvokeModelWithResponseStream',
                ],
                resources: [
                    // Claude 3 Sonnet
                    `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
                    // Claude 3.5 Sonnet (newer version)
                    `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0`,
                    // Claude 3 Haiku (for faster, cheaper operations)
                    `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
                ],
            })
        );

        // Grant CloudWatch Logs permissions for Bedrock logging
        this.bedrockRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                ],
                resources: [this.bedrockLogGroup.logGroupArn],
            })
        );

        // IAM Role for Rekognition access
        this.rekognitionRole = new iam.Role(this, 'RekognitionRole', {
            roleName: `${config.environment}-rekognition-access-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for Lambda functions to use Amazon Rekognition',
        });

        // Grant Rekognition permissions
        this.rekognitionRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'rekognition:DetectLabels',
                    'rekognition:DetectModerationLabels',
                    'rekognition:DetectText',
                    'rekognition:RecognizeCelebrities',
                ],
                resources: ['*'], // Rekognition doesn't support resource-level permissions
            })
        );

        // Grant S3 read permissions for Rekognition to access images
        this.rekognitionRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                ],
                resources: [
                    `arn:aws:s3:::${config.environment}-farm-images-*/*`,
                ],
            })
        );

        // CloudWatch Logs permissions for Rekognition role
        this.rekognitionRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                ],
                resources: ['*'],
            })
        );

        // Stack outputs
        new cdk.CfnOutput(this, 'BedrockRoleArn', {
            value: this.bedrockRole.roleArn,
            description: 'ARN of the IAM role for Bedrock access',
            exportName: `${config.environment}-BedrockRoleArn`,
        });

        new cdk.CfnOutput(this, 'RekognitionRoleArn', {
            value: this.rekognitionRole.roleArn,
            description: 'ARN of the IAM role for Rekognition access',
            exportName: `${config.environment}-RekognitionRoleArn`,
        });

        new cdk.CfnOutput(this, 'BedrockLogGroupName', {
            value: this.bedrockLogGroup.logGroupName,
            description: 'CloudWatch Log Group for Bedrock invocations',
            exportName: `${config.environment}-BedrockLogGroupName`,
        });

        // Add tags
        cdk.Tags.of(this).add('Stack', 'AIStack');
        cdk.Tags.of(this).add('Environment', config.environment);
        cdk.Tags.of(this).add('Service', 'AI-ML');
    }
}
