import { EnvironmentConfig } from './types';

/**
 * Production Environment Configuration
 * 
 * This configuration is optimized for production workloads:
 * - Maximum resource allocation and performance
 * - Full backup and recovery capabilities
 * - Required MFA and advanced security
 * - WAF protection enabled
 * - Cross-region replication
 * - Comprehensive monitoring and alarms
 * 
 * Requirements: 11.2, 11.7, 13.4, 13.5
 */
export const prodConfig: EnvironmentConfig = {
  environment: 'prod',
  region: process.env.AWS_REGION || 'us-east-1',
  account: process.env.CDK_DEFAULT_ACCOUNT,

  // Compute
  lambda: {
    memorySize: 512,
    timeout: 60,
    runtime: 'nodejs20.x',
    architecture: 'arm64',
    provisionedConcurrency: 5,
    reservedConcurrentExecutions: 100,
  },

  // Database
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST',
    pointInTimeRecovery: true,
    deletionProtection: true,
    backupRetention: 35,
  },

  // Storage
  s3: {
    lifecycleRules: {
      transitionToIA: 30,
      transitionToGlacier: 90,
      expiration: 730,
    },
    versioning: true,
    replication: {
      enabled: true,
      destinationRegion: 'us-west-2',
    },
  },

  // Monitoring
  cloudwatch: {
    logRetention: 90,
    metricsEnabled: true,
    alarmsEnabled: true,
    dashboardEnabled: true,
  },

  // Security
  cognito: {
    mfaConfiguration: 'REQUIRED',
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
    },
    advancedSecurity: 'ENFORCED',
  },

  // API
  apiGateway: {
    throttle: {
      rateLimit: 1000,
      burstLimit: 2000,
    },
    caching: true,
    cacheTtl: 300,
    wafEnabled: true,
  },

  // Tags
  tags: {
    Environment: 'prod',
    Project: 'FarmPlatform',
    ManagedBy: 'CDK',
    CostCenter: 'Engineering',
  },
};
