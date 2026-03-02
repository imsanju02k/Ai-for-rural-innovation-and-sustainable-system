/**
 * Environment configuration type definitions
 */

export interface EnvironmentConfig {
    environment: string;
    region: string;
    account?: string;
    lambda: LambdaConfig;
    dynamodb: DynamoDBConfig;
    s3: S3Config;
    cloudwatch: CloudWatchConfig;
    cognito: CognitoConfig;
    apiGateway: ApiGatewayConfig;
    tags: Record<string, string>;
}

export interface LambdaConfig {
    memorySize: number;
    timeout: number;
    runtime: string;
    architecture: 'arm64' | 'x86_64';
    provisionedConcurrency: number;
    reservedConcurrentExecutions?: number;
}

export interface DynamoDBConfig {
    billingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
    pointInTimeRecovery: boolean;
    deletionProtection: boolean;
    backupRetention?: number;
}

export interface S3Config {
    lifecycleRules: {
        transitionToIA: number;
        transitionToGlacier: number;
        expiration: number;
    };
    versioning: boolean;
    replication?: {
        enabled: boolean;
        destinationRegion: string;
    };
}

export interface CloudWatchConfig {
    logRetention: number;
    metricsEnabled: boolean;
    alarmsEnabled: boolean;
    dashboardEnabled?: boolean;
}

export interface CognitoConfig {
    mfaConfiguration: 'OFF' | 'OPTIONAL' | 'REQUIRED';
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireNumbers: boolean;
        requireSymbols: boolean;
    };
    advancedSecurity?: 'OFF' | 'AUDIT' | 'ENFORCED';
}

export interface ApiGatewayConfig {
    throttle: {
        rateLimit: number;
        burstLimit: number;
    };
    caching: boolean;
    cacheTtl?: number;
    wafEnabled?: boolean;
}
