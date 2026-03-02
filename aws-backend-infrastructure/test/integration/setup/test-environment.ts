/**
 * Integration test environment setup
 * Creates test resources in AWS for integration testing
 */

import {
    DynamoDBClient,
    CreateTableCommand,
    DeleteTableCommand,
    DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
    S3Client,
    CreateBucketCommand,
    DeleteBucketCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
    CognitoIdentityProviderClient,
    CreateUserPoolCommand,
    DeleteUserPoolCommand,
    CreateUserPoolClientCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const region = process.env.AWS_REGION || 'us-east-1';
const testPrefix = 'test-integration';

export class TestEnvironment {
    private dynamoDBClient: DynamoDBClient;
    private s3Client: S3Client;
    private cognitoClient: CognitoIdentityProviderClient;

    private createdResources: {
        tables: string[];
        buckets: string[];
        userPools: string[];
    } = {
            tables: [],
            buckets: [],
            userPools: [],
        };

    constructor() {
        this.dynamoDBClient = new DynamoDBClient({ region });
        this.s3Client = new S3Client({ region });
        this.cognitoClient = new CognitoIdentityProviderClient({ region });
    }

    /**
     * Set up all test resources
     */
    async setup() {
        console.log('Setting up integration test environment...');

        try {
            await this.createTestDynamoDBTables();
            await this.createTestS3Buckets();
            await this.createTestCognitoUserPool();

            console.log('Integration test environment setup complete');
        } catch (error) {
            console.error('Failed to set up test environment:', error);
            await this.teardown();
            throw error;
        }
    }

    /**
     * Tear down all test resources
     */
    async teardown() {
        console.log('Tearing down integration test environment...');

        try {
            await this.deleteTestDynamoDBTables();
            await this.deleteTestS3Buckets();
            await this.deleteTestCognitoUserPools();

            console.log('Integration test environment teardown complete');
        } catch (error) {
            console.error('Failed to tear down test environment:', error);
            throw error;
        }
    }

    /**
     * Create test DynamoDB tables
     */
    private async createTestDynamoDBTables() {
        const tables = [
            {
                name: `${testPrefix}-users`,
                partitionKey: 'userId',
            },
            {
                name: `${testPrefix}-farms`,
                partitionKey: 'userId',
                sortKey: 'farmId',
            },
            {
                name: `${testPrefix}-images`,
                partitionKey: 'userId',
                sortKey: 'imageId',
            },
            {
                name: `${testPrefix}-disease-analyses`,
                partitionKey: 'imageId',
                sortKey: 'analysisId',
            },
            {
                name: `${testPrefix}-sensor-data`,
                partitionKey: 'deviceId',
                sortKey: 'timestamp',
            },
        ];

        for (const table of tables) {
            try {
                const keySchema: any[] = [
                    { AttributeName: table.partitionKey, KeyType: 'HASH' },
                ];

                const attributeDefinitions: any[] = [
                    { AttributeName: table.partitionKey, AttributeType: 'S' },
                ];

                if (table.sortKey) {
                    keySchema.push({ AttributeName: table.sortKey, KeyType: 'RANGE' });
                    attributeDefinitions.push({ AttributeName: table.sortKey, AttributeType: 'S' });
                }

                await this.dynamoDBClient.send(new CreateTableCommand({
                    TableName: table.name,
                    KeySchema: keySchema,
                    AttributeDefinitions: attributeDefinitions,
                    BillingMode: 'PAY_PER_REQUEST',
                }));

                this.createdResources.tables.push(table.name);
                console.log(`Created test table: ${table.name}`);

                // Wait for table to be active
                await this.waitForTableActive(table.name);
            } catch (error: any) {
                if (error.name !== 'ResourceInUseException') {
                    throw error;
                }
                console.log(`Table ${table.name} already exists`);
            }
        }
    }

    /**
     * Wait for DynamoDB table to be active
     */
    private async waitForTableActive(tableName: string, maxAttempts: number = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await this.dynamoDBClient.send(new DescribeTableCommand({
                    TableName: tableName,
                }));

                if (response.Table?.TableStatus === 'ACTIVE') {
                    return;
                }
            } catch (error) {
                // Table might not exist yet
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        throw new Error(`Table ${tableName} did not become active within timeout`);
    }

    /**
     * Create test S3 buckets
     */
    private async createTestS3Buckets() {
        const buckets = [
            `${testPrefix}-farm-images-${Date.now()}`,
            `${testPrefix}-backups-${Date.now()}`,
        ];

        for (const bucket of buckets) {
            try {
                await this.s3Client.send(new CreateBucketCommand({
                    Bucket: bucket,
                }));

                this.createdResources.buckets.push(bucket);
                console.log(`Created test bucket: ${bucket}`);
            } catch (error: any) {
                if (error.name !== 'BucketAlreadyOwnedByYou') {
                    throw error;
                }
                console.log(`Bucket ${bucket} already exists`);
            }
        }
    }

    /**
     * Create test Cognito user pool
     */
    private async createTestCognitoUserPool() {
        try {
            const response = await this.cognitoClient.send(new CreateUserPoolCommand({
                PoolName: `${testPrefix}-user-pool`,
                Policies: {
                    PasswordPolicy: {
                        MinimumLength: 8,
                        RequireUppercase: true,
                        RequireLowercase: true,
                        RequireNumbers: true,
                        RequireSymbols: true,
                    },
                },
                AutoVerifiedAttributes: ['email'],
            }));

            if (response.UserPool?.Id) {
                this.createdResources.userPools.push(response.UserPool.Id);
                console.log(`Created test user pool: ${response.UserPool.Id}`);

                // Create user pool client
                await this.cognitoClient.send(new CreateUserPoolClientCommand({
                    UserPoolId: response.UserPool.Id,
                    ClientName: `${testPrefix}-client`,
                    ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
                }));
            }
        } catch (error: any) {
            console.error('Failed to create test user pool:', error);
            // Don't throw - Cognito might not be available in test environment
        }
    }

    /**
     * Delete test DynamoDB tables
     */
    private async deleteTestDynamoDBTables() {
        for (const tableName of this.createdResources.tables) {
            try {
                await this.dynamoDBClient.send(new DeleteTableCommand({
                    TableName: tableName,
                }));
                console.log(`Deleted test table: ${tableName}`);
            } catch (error) {
                console.error(`Failed to delete table ${tableName}:`, error);
            }
        }
    }

    /**
     * Delete test S3 buckets
     */
    private async deleteTestS3Buckets() {
        for (const bucket of this.createdResources.buckets) {
            try {
                // Delete all objects first
                const objects = await this.s3Client.send(new ListObjectsV2Command({
                    Bucket: bucket,
                }));

                if (objects.Contents && objects.Contents.length > 0) {
                    await this.s3Client.send(new DeleteObjectsCommand({
                        Bucket: bucket,
                        Delete: {
                            Objects: objects.Contents.map(obj => ({ Key: obj.Key! })),
                        },
                    }));
                }

                // Delete bucket
                await this.s3Client.send(new DeleteBucketCommand({
                    Bucket: bucket,
                }));
                console.log(`Deleted test bucket: ${bucket}`);
            } catch (error) {
                console.error(`Failed to delete bucket ${bucket}:`, error);
            }
        }
    }

    /**
     * Delete test Cognito user pools
     */
    private async deleteTestCognitoUserPools() {
        for (const userPoolId of this.createdResources.userPools) {
            try {
                await this.cognitoClient.send(new DeleteUserPoolCommand({
                    UserPoolId: userPoolId,
                }));
                console.log(`Deleted test user pool: ${userPoolId}`);
            } catch (error) {
                console.error(`Failed to delete user pool ${userPoolId}:`, error);
            }
        }
    }

    /**
     * Seed test data
     */
    async seedTestData() {
        console.log('Seeding test data...');
        // Test data seeding will be implemented in specific test files
        console.log('Test data seeding complete');
    }
}

// Export singleton instance
export const testEnvironment = new TestEnvironment();
