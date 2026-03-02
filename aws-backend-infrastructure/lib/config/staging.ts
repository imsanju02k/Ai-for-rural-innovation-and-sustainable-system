import { EnvironmentConfig } from './types';

/**
 * Staging Environment Configuration
 * 
 * This configuration mirrors production with some cost optimizations:
 * - Moderate resource allocation
 * - Point-in-time recovery enabled
 * - Alarms enabled for monitoring
 * - Optional MFA for testing
 * - Caching enabled
 * 
 * Requirements: 11.2, 11.7, 13.4, 13.5
 */
export const stagingConfig: EnvironmentConfig = {
    environment: 'staging',
    region: process.env.AWS_REGION || 'us-east-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,

    // Compute
    lambda: {
        memorySize: 512,
        timeout: 45,
        runtime: 'nodejs20.x',
        architecture: 'arm64',
        provisionedConcurrency: 2,
    },

    // Database
    dynamodb: {
        billingMode: 'PAY_PER_REQUEST',
        pointInTimeRecovery: true,
        deletionProtection: false,
    },

    // Storage
    s3: {
        lifecycleRules: {
            transitionToIA: 30,
            transitionToGlacier: 90,
            expiration: 545,
        },
        versioning: true,
    },

    // Monitoring
    cloudwatch: {
        logRetention: 30,
        metricsEnabled: true,
        alarmsEnabled: true,
    },

    // Security
    cognito: {
        mfaConfiguration: 'OPTIONAL',
        passwordPolicy: {
            minLength: 10,
            requireUppercase: true,
            requireNumbers: true,
            requireSymbols: true,
        },
    },

    // API
    apiGateway: {
        throttle: {
            rateLimit: 500,
            burstLimit: 1000,
        },
        caching: true,
        cacheTtl: 300,
    },

    // Tags
    tags: {
        Environment: 'staging',
        Project: 'FarmPlatform',
        ManagedBy: 'CDK',
    },
};
