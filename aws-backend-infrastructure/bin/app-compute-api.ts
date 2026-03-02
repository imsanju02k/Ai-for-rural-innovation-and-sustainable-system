#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getConfig } from '../lib/config';
import { getStackName } from '../lib/utils/naming';
import { ComputeStack } from '../lib/stacks/compute-stack';
import { APIStack } from '../lib/stacks/api-stack';

// Get environment from context
const app = new cdk.App();
const environment = app.node.tryGetContext('environment') || 'dev';
const config = getConfig(environment);

// Define stack properties
const stackProps: cdk.StackProps = {
    env: {
        account: config.account || process.env.CDK_DEFAULT_ACCOUNT,
        region: config.region,
    },
};

// Import existing resources from deployed stacks
const userPoolId = 'us-east-1_XXXXXXXXX'; // TODO: Get from deployed AuthStack
const userPoolClientId = 'XXXXXXXXXXXXXXXXXXXXXXXXXX'; // TODO: Get from deployed AuthStack
const imagesBucketName = 'dev-farm-images-XXXXXXXXXXXX'; // TODO: Get from deployed StorageStack

// For now, we'll need to get these from the deployed stacks
// This is a temporary workaround to test if we can deploy ComputeStack alone

console.log('This is a test app to isolate the cyclic dependency issue');
console.log('It requires manual configuration of resource IDs from deployed stacks');
