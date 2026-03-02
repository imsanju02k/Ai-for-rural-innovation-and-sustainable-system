#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getConfig } from '../lib/config';
import { validateEnvironment, validateConfig } from '../lib/utils/validation';
import { getStackName } from '../lib/utils/naming';
import { NetworkStack } from '../lib/stacks/network-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { AuthStack } from '../lib/stacks/auth-stack';
import { AIStack } from '../lib/stacks/ai-stack';
import { ComputeStack } from '../lib/stacks/compute-stack';
// APIStack has been merged into ComputeStack to avoid circular dependencies
// import { APIStack } from '../lib/stacks/api-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { IoTStack } from '../lib/stacks/iot-stack';

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

// Create AIStack
const aiStack = new AIStack(
    app,
    getStackName(config.environment, 'AIStack'),
    {
        ...stackProps,
        config,
    }
);

// Create IoTStack
const iotStack = new IoTStack(
    app,
    getStackName(config.environment, 'IoTStack'),
    config,
    stackProps
);

// Create combined ComputeStack with API Gateway (merged to avoid circular dependency)
// The circular dependency was: ComputeStack -> APIStack (Lambda functions) -> ComputeStack (API Gateway permissions)
// Solution: Merge both stacks into one
const computeStack = new ComputeStack(
    app,
    getStackName(config.environment, 'ComputeStack'),
    config,
    {
        ...stackProps,
        userPool: authStack.userPool,
        userPoolClient: authStack.userPoolClient,
        imagesBucket: storageStack.imagesBucket,
        usersTable: storageStack.usersTable,
        farmsTable: storageStack.farmsTable,
        imagesTable: storageStack.imagesTable,
        diseaseAnalysesTable: storageStack.diseaseAnalysesTable,
        marketPricesTable: storageStack.marketPricesTable,
        sensorDataTable: storageStack.sensorDataTable,
        sensorAggregatesTable: storageStack.sensorAggregatesTable,
        optimizationsTable: storageStack.optimizationsTable,
        chatMessagesTable: storageStack.chatMessagesTable,
        alertsTable: storageStack.alertsTable,
    }
);

// APIStack is now merged into ComputeStack
// const apiStack = computeStack (for backward compatibility with MonitoringStack)

// Create MonitoringStack (depends on ComputeStack which now includes API Gateway)
const monitoringStack = new MonitoringStack(
    app,
    getStackName(config.environment, 'MonitoringStack'),
    config,
    {
        ...stackProps,
        lambdaFunctions: [
            computeStack.authRegisterFunction,
            computeStack.authLoginFunction,
            computeStack.authRefreshFunction,
            computeStack.farmCreateFunction,
            computeStack.farmListFunction,
            computeStack.farmGetFunction,
            computeStack.farmUpdateFunction,
            computeStack.farmDeleteFunction,
            computeStack.imageUploadUrlFunction,
            computeStack.imageDownloadUrlFunction,
            computeStack.imageProcessFunction,
            computeStack.diseaseDetectFunction,
            computeStack.diseaseHistoryFunction,
            computeStack.marketFetchFunction,
            computeStack.marketGetFunction,
            computeStack.marketPredictFunction,
            computeStack.optimizationCalculateFunction,
            computeStack.optimizationHistoryFunction,
            computeStack.advisoryChatFunction,
            computeStack.advisoryHistoryFunction,
            computeStack.iotQueryFunction,
            computeStack.alertListFunction,
            computeStack.alertAcknowledgeFunction,
        ],
        api: computeStack.api, // API is now in ComputeStack
        dynamodbTables: [
            storageStack.usersTable,
            storageStack.farmsTable,
            storageStack.imagesTable,
            storageStack.diseaseAnalysesTable,
            storageStack.marketPricesTable,
            storageStack.sensorDataTable,
            storageStack.sensorAggregatesTable,
            storageStack.optimizationsTable,
            storageStack.chatMessagesTable,
            storageStack.alertsTable,
        ],
        s3Buckets: [
            storageStack.imagesBucket,
        ],
        alertEmails: config.environment === 'prod'
            ? ['alerts@farmplatform.example.com']
            : undefined,
    }
);

monitoringStack.addDependency(computeStack);

// Add tags to all resources in the app
Object.entries(config.tags).forEach(([key, value]) => {
    cdk.Tags.of(app).add(key, value);
});

console.log(`CDK app initialized for environment: ${config.environment}`);
console.log(`Region: ${config.region}`);
console.log(`Account: ${config.account || 'default'}`);
console.log(`Stacks created: NetworkStack, StorageStack, AuthStack, AIStack, IoTStack, ComputeStack (includes API Gateway), MonitoringStack`);
console.log(`Note: APIStack has been merged into ComputeStack to avoid circular dependencies`);
