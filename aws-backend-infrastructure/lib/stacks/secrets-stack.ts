import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';

/**
 * Secrets Stack
 * 
 * Manages AWS Secrets Manager secrets for the application:
 * - Database credentials
 * - API keys for external services
 * - Encryption keys
 * - Lambda function access to secrets
 * 
 * Requirements: 13.2
 */
export class SecretsStack extends cdk.Stack {
    public readonly databaseCredentialsSecret: secretsmanager.ISecret;
    public readonly apiKeysSecret: secretsmanager.ISecret;
    public readonly encryptionKeysSecret: secretsmanager.ISecret;
    public readonly lambdaSecretsPolicy: iam.ManagedPolicy;

    constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
        super(scope, id, props);

        // Database credentials secret
        this.databaseCredentialsSecret = new secretsmanager.Secret(this, 'DatabaseCredentials', {
            secretName: `${config.environment}/database/credentials`,
            description: 'Database connection credentials and configuration',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    username: 'admin',
                    engine: 'dynamodb',
                }),
                generateStringKey: 'password',
                excludePunctuation: true,
                passwordLength: 32,
            },
            removalPolicy: config.environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // API keys secret for external services
        this.apiKeysSecret = new secretsmanager.Secret(this, 'APIKeys', {
            secretName: `${config.environment}/api/keys`,
            description: 'API keys for external services (weather, market data, etc.)',
            secretObjectValue: {
                weatherApiKey: cdk.SecretValue.unsafePlainText('REPLACE_WITH_ACTUAL_KEY'),
                marketApiKey: cdk.SecretValue.unsafePlainText('REPLACE_WITH_ACTUAL_KEY'),
                smsApiKey: cdk.SecretValue.unsafePlainText('REPLACE_WITH_ACTUAL_KEY'),
            },
            removalPolicy: config.environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // Encryption keys secret
        this.encryptionKeysSecret = new secretsmanager.Secret(this, 'EncryptionKeys', {
            secretName: `${config.environment}/encryption/keys`,
            description: 'Encryption keys for application-level encryption',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    algorithm: 'AES-256-GCM',
                }),
                generateStringKey: 'masterKey',
                excludePunctuation: true,
                passwordLength: 64,
            },
            removalPolicy: config.environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });

        // Enable automatic rotation for production
        if (config.environment === 'prod') {
            // Note: Automatic rotation requires a Lambda function
            // This is a placeholder for the rotation configuration
            cdk.Tags.of(this.databaseCredentialsSecret).add('AutoRotate', 'true');
            cdk.Tags.of(this.apiKeysSecret).add('AutoRotate', 'false'); // Manual rotation for API keys
            cdk.Tags.of(this.encryptionKeysSecret).add('AutoRotate', 'true');
        }

        // Create IAM policy for Lambda functions to access secrets
        this.lambdaSecretsPolicy = new iam.ManagedPolicy(this, 'LambdaSecretsPolicy', {
            managedPolicyName: `${config.environment}-lambda-secrets-access`,
            description: 'Allows Lambda functions to read secrets from Secrets Manager',
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'secretsmanager:GetSecretValue',
                        'secretsmanager:DescribeSecret',
                    ],
                    resources: [
                        this.databaseCredentialsSecret.secretArn,
                        this.apiKeysSecret.secretArn,
                        this.encryptionKeysSecret.secretArn,
                    ],
                }),
            ],
        });

        // Output secret ARNs for reference
        new cdk.CfnOutput(this, 'DatabaseCredentialsSecretArn', {
            value: this.databaseCredentialsSecret.secretArn,
            description: 'ARN of the database credentials secret',
            exportName: `${config.environment}-db-credentials-secret-arn`,
        });

        new cdk.CfnOutput(this, 'APIKeysSecretArn', {
            value: this.apiKeysSecret.secretArn,
            description: 'ARN of the API keys secret',
            exportName: `${config.environment}-api-keys-secret-arn`,
        });

        new cdk.CfnOutput(this, 'EncryptionKeysSecretArn', {
            value: this.encryptionKeysSecret.secretArn,
            description: 'ARN of the encryption keys secret',
            exportName: `${config.environment}-encryption-keys-secret-arn`,
        });

        // Add tags
        cdk.Tags.of(this).add('Stack', 'SecretsStack');
        Object.entries(config.tags).forEach(([key, value]) => {
            cdk.Tags.of(this).add(key, value);
        });
    }
}
