import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { StorageStack } from '../../../lib/stacks/storage-stack';
import { devConfig } from '../../../lib/config/dev';

describe('StorageStack', () => {
    let app: cdk.App;
    let stack: StorageStack;
    let template: Template;
    let mockVpc: ec2.IVpc;
    let mockSecurityGroup: ec2.ISecurityGroup;

    beforeEach(() => {
        app = new cdk.App();
        
        // Create a mock VPC for testing
        const vpcStack = new cdk.Stack(app, 'MockVpcStack');
        mockVpc = new ec2.Vpc(vpcStack, 'MockVpc', {
            maxAzs: 2,
        });
        
        mockSecurityGroup = new ec2.SecurityGroup(vpcStack, 'MockSG', {
            vpc: mockVpc,
        });

        stack = new StorageStack(app, 'TestStorageStack', devConfig, {
            vpc: mockVpc,
            lambdaSecurityGroup: mockSecurityGroup,
        });
        
        template = Template.fromStack(stack);
    });

    describe('S3 Buckets', () => {
        describe('Images Bucket', () => {
            it('should create images bucket with encryption', () => {
                template.hasResourceProperties('AWS::S3::Bucket', {
                    BucketName: 'dev-s3-farm-images',
                    BucketEncryption: {
                        ServerSideEncryptionConfiguration: [
                            {
                                ServerSideEncryptionByDefault: {
                                    SSEAlgorithm: 'AES256',
                                },
                            },
                        ],
                    },
                });
            });

            it('should enable versioning on images bucket', () => {
                template.hasResourceProperties('AWS::S3::Bucket', {
                    BucketName: 'dev-s3-farm-images',
                    VersioningConfiguration: {
                        Status: 'Enabled',
                    },
                });
            });

            it('should configure lifecycle policies for images bucket', () => {
                template.hasResourceProperties('AWS::S3::Bucket', {
                    BucketName: 'dev-s3-farm-images',
                    LifecycleConfiguration: {
                        Rules: [
                            {
                                Id: 'TransitionToIntelligentTiering',
                                Status: 'Enabled',
                                Transitions: Match.arrayWith([
                                    {
                                        StorageClass: 'INTELLIGENT_TIERING',
                                        TransitionInDays: 30,
                                    },
                                    {
                                        StorageClass: 'GLACIER',
                                        TransitionInDays: 90,
                                    },
                                ]),
                                ExpirationInDays: 365,
                            },
                        ],
                    },
                });
            });

            it('should configure CORS for frontend uploads', () => {
                template.hasResourceProperties('AWS::S3::Bucket', {
                    BucketName: 'dev-s3-farm-images',
                    CorsConfiguration: {
                        CorsRules: [
                            {
                                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
                                AllowedOrigins: ['*'],
                                AllowedHeaders: ['*'],
                                ExposedHeaders: ['ETag'],
                                MaxAge: 3000,
                            },
                        ],
                    },
                });
            });

            it('should block all public access', () => {
                template.hasResourceProperties('AWS::S3::Bucket', {
                    BucketName: 'dev-s3-farm-images',
                    PublicAccessBlockConfiguration: {
                        BlockPublicAcls: true,
                        BlockPublicPolicy: true,
                        IgnorePublicAcls: true,
                        RestrictPublicBuckets: true,
                    },
                });
            });
        });

        describe('Backups Bucket', () => {
            it('should create backups bucket with encryption', () => {
                template.hasResourceProperties('AWS::S3::Bucket', {
                    BucketName: 'dev-s3-backups',
                    BucketEncryption: {
                        ServerSideEncryptionConfiguration: [
                            {
                                ServerSideEncryptionByDefault: {
                                    SSEAlgorithm: 'AES256',
                                },
                            },
                        ],
                    },
                });
            });

            it('should enable versioning on backups bucket', () => {
                template.hasResourceProperties('AWS::S3::Bucket', {
                    BucketName: 'dev-s3-backups',
                    VersioningConfiguration: {
                        Status: 'Enabled',
                    },
                });
            });

            it('should configure lifecycle policies for backups bucket', () => {
                template.hasResourceProperties('AWS::S3::Bucket', {
                    BucketName: 'dev-s3-backups',
                    LifecycleConfiguration: {
                        Rules: [
                            {
                                Id: 'TransitionToGlacier',
                                Status: 'Enabled',
                                Transitions: [
                                    {
                                        StorageClass: 'GLACIER',
                                        TransitionInDays: 7,
                                    },
                                ],
                                ExpirationInDays: 90,
                            },
                        ],
                    },
                });
            });
        });
    });

    describe('DynamoDB Tables', () => {
        describe('Users Table', () => {
            it('should create users table with correct partition key', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-users',
                    KeySchema: [
                        {
                            AttributeName: 'userId',
                            KeyType: 'HASH',
                        },
                    ],
                });
            });

            it('should enable point-in-time recovery based on config', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-users',
                    PointInTimeRecoverySpecification: {
                        PointInTimeRecoveryEnabled: devConfig.dynamodb.pointInTimeRecovery,
                    },
                });
            });

            it('should use PAY_PER_REQUEST billing mode', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-users',
                    BillingMode: 'PAY_PER_REQUEST',
                });
            });

            it('should create email GSI', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-users',
                    GlobalSecondaryIndexes: Match.arrayWith([
                        {
                            IndexName: 'EmailIndex',
                            KeySchema: [
                                {
                                    AttributeName: 'email',
                                    KeyType: 'HASH',
                                },
                            ],
                            Projection: {
                                ProjectionType: 'ALL',
                            },
                        },
                    ]),
                });
            });
        });

        describe('Farms Table', () => {
            it('should create farms table with partition and sort keys', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-farms',
                    KeySchema: [
                        {
                            AttributeName: 'userId',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'farmId',
                            KeyType: 'RANGE',
                        },
                    ],
                });
            });

            it('should create farmId GSI', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-farms',
                    GlobalSecondaryIndexes: Match.arrayWith([
                        {
                            IndexName: 'FarmIdIndex',
                            KeySchema: [
                                {
                                    AttributeName: 'farmId',
                                    KeyType: 'HASH',
                                },
                            ],
                            Projection: {
                                ProjectionType: 'ALL',
                            },
                        },
                    ]),
                });
            });
        });

        describe('Images Table', () => {
            it('should create images table with correct keys', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-images',
                    KeySchema: [
                        {
                            AttributeName: 'userId',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'imageId',
                            KeyType: 'RANGE',
                        },
                    ],
                });
            });

            it('should create farmId-uploadedAt GSI', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-images',
                    GlobalSecondaryIndexes: Match.arrayWith([
                        {
                            IndexName: 'FarmIdUploadedAtIndex',
                            KeySchema: [
                                {
                                    AttributeName: 'farmId',
                                    KeyType: 'HASH',
                                },
                                {
                                    AttributeName: 'uploadedAt',
                                    KeyType: 'RANGE',
                                },
                            ],
                            Projection: {
                                ProjectionType: 'ALL',
                            },
                        },
                    ]),
                });
            });
        });

        describe('Disease Analyses Table', () => {
            it('should create disease analyses table with correct keys', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-disease-analyses',
                    KeySchema: [
                        {
                            AttributeName: 'imageId',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'analysisId',
                            KeyType: 'RANGE',
                        },
                    ],
                });
            });

            it('should create farmId and userId GSIs', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-disease-analyses',
                    GlobalSecondaryIndexes: Match.arrayWith([
                        Match.objectLike({
                            IndexName: 'FarmIdAnalyzedAtIndex',
                        }),
                        Match.objectLike({
                            IndexName: 'UserIdAnalyzedAtIndex',
                        }),
                    ]),
                });
            });
        });

        describe('Market Prices Table', () => {
            it('should create market prices table with correct keys', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-market-prices',
                    KeySchema: [
                        {
                            AttributeName: 'commodity',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'timestamp',
                            KeyType: 'RANGE',
                        },
                    ],
                });
            });

            it('should enable TTL for automatic data expiration', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-market-prices',
                    TimeToLiveSpecification: {
                        AttributeName: 'ttl',
                        Enabled: true,
                    },
                });
            });

            it('should create market location GSI', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-market-prices',
                    GlobalSecondaryIndexes: Match.arrayWith([
                        {
                            IndexName: 'MarketLocationIndex',
                            KeySchema: [
                                {
                                    AttributeName: 'marketLocation',
                                    KeyType: 'HASH',
                                },
                                {
                                    AttributeName: 'timestamp',
                                    KeyType: 'RANGE',
                                },
                            ],
                            Projection: {
                                ProjectionType: 'ALL',
                            },
                        },
                    ]),
                });
            });
        });

        describe('Sensor Data Table', () => {
            it('should create sensor data table with correct keys', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-sensor-data',
                    KeySchema: [
                        {
                            AttributeName: 'deviceId',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'timestamp',
                            KeyType: 'RANGE',
                        },
                    ],
                });
            });

            it('should enable TTL for sensor data', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-sensor-data',
                    TimeToLiveSpecification: {
                        AttributeName: 'ttl',
                        Enabled: true,
                    },
                });
            });

            it('should create farmId and farmIdSensorType GSIs', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-sensor-data',
                    GlobalSecondaryIndexes: Match.arrayWith([
                        Match.objectLike({
                            IndexName: 'FarmIdTimestampIndex',
                        }),
                        Match.objectLike({
                            IndexName: 'FarmIdSensorTypeIndex',
                        }),
                    ]),
                });
            });
        });

        describe('Sensor Aggregates Table', () => {
            it('should create sensor aggregates table', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-sensor-aggregates',
                    KeySchema: [
                        {
                            AttributeName: 'farmIdSensorType',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'period',
                            KeyType: 'RANGE',
                        },
                    ],
                });
            });
        });

        describe('Optimizations Table', () => {
            it('should create optimizations table', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-optimizations',
                    KeySchema: [
                        {
                            AttributeName: 'farmId',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'calculatedAt',
                            KeyType: 'RANGE',
                        },
                    ],
                });
            });

            it('should create userId GSI', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-optimizations',
                    GlobalSecondaryIndexes: Match.arrayWith([
                        {
                            IndexName: 'UserIdCalculatedAtIndex',
                            KeySchema: [
                                {
                                    AttributeName: 'userId',
                                    KeyType: 'HASH',
                                },
                                {
                                    AttributeName: 'calculatedAt',
                                    KeyType: 'RANGE',
                                },
                            ],
                            Projection: {
                                ProjectionType: 'ALL',
                            },
                        },
                    ]),
                });
            });
        });

        describe('Chat Messages Table', () => {
            it('should create chat messages table', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-chat-messages',
                    KeySchema: [
                        {
                            AttributeName: 'userId',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'timestamp',
                            KeyType: 'RANGE',
                        },
                    ],
                });
            });

            it('should create farmId GSI', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-chat-messages',
                    GlobalSecondaryIndexes: Match.arrayWith([
                        {
                            IndexName: 'FarmIdTimestampIndex',
                            KeySchema: [
                                {
                                    AttributeName: 'farmId',
                                    KeyType: 'HASH',
                                },
                                {
                                    AttributeName: 'timestamp',
                                    KeyType: 'RANGE',
                                },
                            ],
                            Projection: {
                                ProjectionType: 'ALL',
                            },
                        },
                    ]),
                });
            });
        });

        describe('Alerts Table', () => {
            it('should create alerts table', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-alerts',
                    KeySchema: [
                        {
                            AttributeName: 'userId',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'createdAt',
                            KeyType: 'RANGE',
                        },
                    ],
                });
            });

            it('should create farmId and status GSIs', () => {
                template.hasResourceProperties('AWS::DynamoDB::Table', {
                    TableName: 'dev-dynamodb-alerts',
                    GlobalSecondaryIndexes: Match.arrayWith([
                        Match.objectLike({
                            IndexName: 'FarmIdCreatedAtIndex',
                        }),
                        Match.objectLike({
                            IndexName: 'StatusCreatedAtIndex',
                        }),
                    ]),
                });
            });
        });
    });

    describe('ElastiCache Redis Cluster', () => {
        it('should create Redis security group', () => {
            template.hasResourceProperties('AWS::EC2::SecurityGroup', {
                GroupName: 'dev-sg-redis',
                GroupDescription: 'Security group for ElastiCache Redis cluster',
            });
        });

        it('should allow Lambda access to Redis on port 6379', () => {
            template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
                IpProtocol: 'tcp',
                FromPort: 6379,
                ToPort: 6379,
                Description: 'Allow Lambda access to Redis',
            });
        });

        it('should create Redis subnet group', () => {
            template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
                CacheSubnetGroupName: 'dev-elasticache-subnet-redis',
                Description: 'Subnet group for ElastiCache Redis cluster',
            });
        });

        it('should create Redis cache cluster', () => {
            template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
                CacheNodeType: 'cache.t3.micro',
                Engine: 'redis',
                NumCacheNodes: 1,
                ClusterName: 'dev-redis-cache',
                AutoMinorVersionUpgrade: true,
            });
        });
    });

    describe('CloudFormation Outputs', () => {
        it('should export images bucket name', () => {
            template.hasOutput('ImagesBucketName', {
                Export: {
                    Name: 'dev-images-bucket-name',
                },
            });
        });

        it('should export all DynamoDB table names', () => {
            const tableNames = [
                'UsersTableName',
                'FarmsTableName',
                'ImagesTableName',
                'DiseaseAnalysesTableName',
                'MarketPricesTableName',
                'SensorDataTableName',
                'SensorAggregatesTableName',
                'OptimizationsTableName',
                'ChatMessagesTableName',
                'AlertsTableName',
            ];

            tableNames.forEach((outputName) => {
                template.hasOutput(outputName, {});
            });
        });

        it('should export Redis endpoint', () => {
            template.hasOutput('RedisEndpoint', {
                Export: {
                    Name: 'dev-redis-endpoint',
                },
            });
        });

        it('should export Redis port', () => {
            template.hasOutput('RedisPort', {
                Export: {
                    Name: 'dev-redis-port',
                },
            });
        });
    });

    describe('Resource Count', () => {
        it('should create exactly 2 S3 buckets', () => {
            template.resourceCountIs('AWS::S3::Bucket', 2);
        });

        it('should create exactly 10 DynamoDB tables', () => {
            template.resourceCountIs('AWS::DynamoDB::Table', 10);
        });

        it('should create exactly 1 ElastiCache cluster', () => {
            template.resourceCountIs('AWS::ElastiCache::CacheCluster', 1);
        });

        it('should create exactly 1 ElastiCache subnet group', () => {
            template.resourceCountIs('AWS::ElastiCache::SubnetGroup', 1);
        });
    });

    describe('Security and Encryption', () => {
        it('should encrypt all DynamoDB tables', () => {
            const tables = template.findResources('AWS::DynamoDB::Table');
            Object.values(tables).forEach((table: any) => {
                expect(table.Properties.SSESpecification).toBeDefined();
            });
        });

        it('should encrypt all S3 buckets', () => {
            const buckets = template.findResources('AWS::S3::Bucket');
            Object.values(buckets).forEach((bucket: any) => {
                expect(bucket.Properties.BucketEncryption).toBeDefined();
            });
        });

        it('should block public access on all S3 buckets', () => {
            const buckets = template.findResources('AWS::S3::Bucket');
            Object.values(buckets).forEach((bucket: any) => {
                expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
                    BlockPublicAcls: true,
                    BlockPublicPolicy: true,
                    IgnorePublicAcls: true,
                    RestrictPublicBuckets: true,
                });
            });
        });
    });
});
