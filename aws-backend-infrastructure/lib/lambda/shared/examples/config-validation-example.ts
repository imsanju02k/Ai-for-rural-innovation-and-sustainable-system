/**
 * Configuration Validation Example
 * 
 * This file demonstrates how to use the configuration validator
 * in Lambda functions to ensure all required environment variables
 * are present and valid before processing requests.
 * 
 * Requirements: 13.6, 13.7
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    createConfigValidator,
    getRequiredEnv,
    getOptionalEnv,
    isValidTableName,
    isValidBucketName,
} from '../utils/config-validator';

/**
 * Define configuration requirements for this Lambda function
 */
const validateConfig = createConfigValidator('ExampleFunction', [
    {
        name: 'FARMS_TABLE_NAME',
        required: true,
        description: 'DynamoDB table name for farms data',
        validator: isValidTableName,
    },
    {
        name: 'IMAGES_BUCKET_NAME',
        required: true,
        description: 'S3 bucket name for image storage',
        validator: isValidBucketName,
    },
    {
        name: 'MAX_ITEMS_PER_PAGE',
        required: false,
        description: 'Maximum number of items to return per page',
        defaultValue: '20',
        validator: (value) => {
            const num = Number(value);
            return !isNaN(num) && num > 0 && num <= 100;
        },
    },
    {
        name: 'ENABLE_CACHING',
        required: false,
        description: 'Enable response caching',
        defaultValue: 'false',
        validator: (value) => ['true', 'false'].includes(value.toLowerCase()),
    },
]);

/**
 * Validate configuration at Lambda initialization (cold start)
 * This runs once when the Lambda container starts, not on every invocation
 * 
 * If validation fails, the Lambda function will not start and will throw an error
 */
try {
    validateConfig();
    console.log('Lambda function initialized successfully');
} catch (error) {
    console.error('Lambda function initialization failed:', error);
    // The Lambda will fail to start and AWS will retry with a new container
    throw error;
}

/**
 * Load configuration values after validation
 * These are safe to use because validation passed
 */
const FARMS_TABLE_NAME = getRequiredEnv('FARMS_TABLE_NAME', 'DynamoDB table for farms');
const IMAGES_BUCKET_NAME = getRequiredEnv('IMAGES_BUCKET_NAME', 'S3 bucket for images');
const MAX_ITEMS_PER_PAGE = Number(getOptionalEnv('MAX_ITEMS_PER_PAGE', '20'));
const ENABLE_CACHING = getOptionalEnv('ENABLE_CACHING', 'false') === 'true';
const ENVIRONMENT = getRequiredEnv('ENVIRONMENT', 'Deployment environment');

/**
 * Lambda handler function
 * 
 * This only runs if configuration validation passed during initialization
 */
export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        console.log('Processing request with validated configuration:', {
            environment: ENVIRONMENT,
            farmsTable: FARMS_TABLE_NAME,
            imagesBucket: IMAGES_BUCKET_NAME,
            maxItemsPerPage: MAX_ITEMS_PER_PAGE,
            cachingEnabled: ENABLE_CACHING,
        });

        // Your business logic here...
        // All configuration values are guaranteed to be valid

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Success',
                config: {
                    environment: ENVIRONMENT,
                    cachingEnabled: ENABLE_CACHING,
                },
            }),
        };
    } catch (error) {
        console.error('Error processing request:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};

/**
 * Example CloudWatch Logs Output:
 * 
 * COLD START (first invocation):
 * --------------------------------
 * Validating configuration for ExampleFunction...
 * ⚠️  Using default value for MAX_ITEMS_PER_PAGE: 20
 * ⚠️  Using default value for ENABLE_CACHING: false
 * ✓ Configuration validation passed
 * Lambda function initialized successfully
 * Processing request with validated configuration: {
 *   environment: 'dev',
 *   farmsTable: 'dev-farms',
 *   imagesBucket: 'dev-farm-images-123456789012',
 *   maxItemsPerPage: 20,
 *   cachingEnabled: false
 * }
 * 
 * WARM START (subsequent invocations):
 * ------------------------------------
 * Processing request with validated configuration: {...}
 * 
 * VALIDATION FAILURE:
 * ------------------
 * Validating configuration for ExampleFunction...
 * Configuration validation failed:
 *   ❌ Missing required environment variable: FARMS_TABLE_NAME - DynamoDB table name for farms data
 *   ❌ Invalid value for IMAGES_BUCKET_NAME: "Invalid_Bucket_Name" - S3 bucket name for image storage
 * Error: Configuration validation failed with 2 error(s). Lambda function cannot start with invalid configuration.
 */
