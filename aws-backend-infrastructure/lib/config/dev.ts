import { EnvironmentConfig } from './types';

/**
 * Development Environment Configuration
 * 
 * This configuration is optimized for local development and testing:
 * - Minimal resource allocation to reduce costs
 * - Short log retention periods
 * - No alarms or advanced security features
 * - Relaxed throttling limits
 * 
 * Requirements: 11.2, 11.7, 13.4, 13.5
 */
export const devConfig: EnvironmentConfig = {
  environment: 'dev',
  region: process.env.AWS_REGION || 'us-east-1',
  account: process.env.CDK_DEFAULT_ACCOUNT,

  // Compute
  lambda: {
    memorySize: 256,
    timeout: 30,
    runtime: 'nodejs20.x',
    architecture: 'arm64',
    provisionedConcurrency: 0,
  },

  // Database
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST',
    pointInTimeRecovery: false,
    deletionProtection: false,
  },

  // Storage
  s3: {
    lifecycleRules: {
      transitionToIA: 30,
      transitionToGlacier: 90,
      expiration: 365,
    },
    versioning: true,
  },

  // Monitoring
  cloudwatch: {
    logRetention: 7,
    metricsEnabled: true,
    alarmsEnabled: false,
  },

  // Security
  cognito: {
    mfaConfiguration: 'OPTIONAL',
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
    },
  },

  // API
  apiGateway: {
    throttle: {
      rateLimit: 100,
      burstLimit: 200,
    },
    caching: false,
  },

  // Tags
  tags: {
    Environment: 'dev',
    Project: 'FarmPlatform',
    ManagedBy: 'CDK',
  },
};
