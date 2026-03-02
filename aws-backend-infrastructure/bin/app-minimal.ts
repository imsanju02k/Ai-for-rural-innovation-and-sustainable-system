#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getConfig } from '../lib/config';
import { validateEnvironment, validateConfig } from '../lib/utils/validation';
import { getStackName } from '../lib/utils/naming';
import { NetworkStack } from '../lib/stacks/network-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { AuthStack } from '../lib/stacks/auth-stack';

// Get environment from context or environment variable
const environment = process.env.ENVIRONMENT || 'dev';

// Validate environment
const envValidation = validateEnvironment(environment);
if (!envValidation.valid) {
    console.error('Environment validation failed:');
    envValidation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
}

// Load configuration
const config = getConfig(environment);

// Validate configuration
const configValidation = validateConfig(config);
if (!configValidation.valid) {
    console.error('Configuration validation failed:');
    configValidation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
}

// Create CDK app
const app = new cdk.App();

// Get environment from context if provided
const contextEnv = app.node.tryGetContext('environment');
if (contextEnv) {
    const contextConfig = getConfig(contextEnv);
    console.log(`Using environment from context: ${contextEnv}`);
}

// Define stack properties
const stackProps: cdk.StackProps = {
    env: {
        account: config.account || process.env.CDK_DEFAULT_ACCOUNT,
        region: config.region,
    },
    description: 'AWS Backend Infrastructure for AI Rural Innovation Platform',
};

// Create NetworkStack
const networkStack = new NetworkStack(
    app,
    getStackName(config.environment, 'NetworkStack'),
    config,
    stackProps
);

// Create StorageStack (depends on NetworkStack)
const storageStack = new StorageStack(
    app,
    getStackName(config.environment, 'StorageStack'),
    config,
    {
        ...stackProps,
        vpc: networkStack.vpc,
        lambdaSecurityGroup: networkStack.lambdaSecurityGroup,
    }
);

storageStack.addDependency(networkStack);

// Create AuthStack
const authStack = new AuthStack(
    app,
    getStackName(config.environment, 'AuthStack'),
    config,
    stackProps
);

// Add tags to all resources in the app
Object.entries(config.tags).forEach(([key, value]) => {
    cdk.Tags.of(app).add(key, value);
});

console.log(`CDK app initialized for environment: ${config.environment}`);
console.log(`Region: ${config.region}`);
console.log(`Account: ${config.account || 'default'}`);
console.log(`Stacks created: NetworkStack, StorageStack, AuthStack`);
