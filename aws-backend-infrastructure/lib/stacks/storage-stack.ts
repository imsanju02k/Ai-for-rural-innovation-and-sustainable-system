import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import { getResourceName } from '../utils/naming';
import { applyTags } from '../utils/tags';

/**
 * StorageStack - S3 buckets, DynamoDB tables, and ElastiCache Redis cluster
 * 
 * Creates:
 * - S3 buckets for images and backups with lifecycle policies
 * - DynamoDB tables for all application data
 * - ElastiCache Redis cluster for caching
 * 
 * Requirements: 3.1-3.10, 4.1, 4.6, 4.7, 4.9
 */
export interface StorageStackProps extends cdk.StackProps {
    vpc: ec2.IVpc;
    lambdaSecurityGroup: ec2.ISecurityGroup;
}

export class StorageStack extends cdk.Stack {
    public readonly imagesBucket: s3.Bucket;
    public readonly backupsBucket: s3.Bucket;
    public readonly usersTable: dynamodb.Table;
    public readonly farmsTable: dynamodb.Table;
    public readonly imagesTable: dynamodb.Table;
    public readonly diseaseAnalysesTable: dynamodb.Table;
    public readonly marketPricesTable: dynamodb.Table;
    public readonly sensorDataTable: dynamodb.Table;
    public readonly sensorAggregatesTable: dynamodb.Table;
    public readonly optimizationsTable: dynamodb.Table;
    public readonly chatMessagesTable: dynamodb.Table;
    public readonly alertsTable: dynamodb.Table;
    public readonly redisCluster: elasticache.CfnCacheCluster;
    public readonly redisSecurityGroup: ec2.SecurityGroup;

    constructor(scope: Construct, id: string, config: EnvironmentConfig, props: StorageStackProps) {
        super(scope, id, props);

        // ===== S3 BUCKETS =====

        // Images bucket for disease detection photos
        this.imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
            bucketName: `${config.environment}-farm-images-${this.account}`,
            encryption: s3.BucketEncryption.S3_MANAGED, // AES-256 encryption (Requirement 4.9)
            versioned: config.s3.versioning, // Enable versioning (Requirement 4.7)
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: config.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: config.environment !== 'prod',
            lifecycleRules: [
                {
                    id: 'TransitionToIntelligentTiering',
                    enabled: true,
                    transitions: [
                        {
                            storageClass: s3.StorageClass.INTELLIGENT_TIERING,
                            transitionAfter: cdk.Duration.days(config.s3.lifecycleRules.transitionToIA),
                        },
                        {
                            storageClass: s3.StorageClass.GLACIER, // Transition to Glacier after 90 days (Requirement 4.6)
                            transitionAfter: cdk.Duration.days(config.s3.lifecycleRules.transitionToGlacier),
                        },
                    ],
                    expiration: cdk.Duration.days(config.s3.lifecycleRules.expiration),
                },
            ],
            cors: [
                {
                    // CORS configuration for frontend uploads (Requirement 4.1)
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.DELETE,
                    ],
                    allowedOrigins: ['*'], // TODO: Restrict to frontend domain in production
                    allowedHeaders: ['*'],
                    exposedHeaders: ['ETag'],
                    maxAge: 3000,
                },
            ],
        });

        // Backups bucket with cross-region replication
        this.backupsBucket = new s3.Bucket(this, 'BackupsBucket', {
            bucketName: `${config.environment}-backups-${this.account}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            versioned: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN, // Always retain backups
            lifecycleRules: [
                {
                    id: 'TransitionToGlacier',
                    enabled: true,
                    transitions: [
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(7),
                        },
                    ],
                    expiration: cdk.Duration.days(90),
                },
            ],
        });

        // ===== DYNAMODB TABLES =====

        // Users table (Requirement 3.1)
        this.usersTable = new dynamodb.Table(this, 'UsersTable', {
            tableName: getResourceName(config.environment, 'dynamodb', 'users'),
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
                ? dynamodb.BillingMode.PAY_PER_REQUEST
                : dynamodb.BillingMode.PROVISIONED,
            pointInTimeRecovery: config.dynamodb.pointInTimeRecovery, // Requirement 3.9
            removalPolicy: config.dynamodb.deletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });

        // GSI for email lookup
        this.usersTable.addGlobalSecondaryIndex({
            indexName: 'EmailIndex',
            partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Farms table (Requirement 3.2)
        this.farmsTable = new dynamodb.Table(this, 'FarmsTable', {
            tableName: getResourceName(config.environment, 'dynamodb', 'farms'),
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'farmId', type: dynamodb.AttributeType.STRING },
            billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
                ? dynamodb.BillingMode.PAY_PER_REQUEST
                : dynamodb.BillingMode.PROVISIONED,
            pointInTimeRecovery: config.dynamodb.pointInTimeRecovery,
            removalPolicy: config.dynamodb.deletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });

        // GSI for direct farm lookup
        this.farmsTable.addGlobalSecondaryIndex({
            indexName: 'FarmIdIndex',
            partitionKey: { name: 'farmId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Images table (Requirement 3.3)
        this.imagesTable = new dynamodb.Table(this, 'ImagesTable', {
            tableName: getResourceName(config.environment, 'dynamodb', 'images'),
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'imageId', type: dynamodb.AttributeType.STRING },
            billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
                ? dynamodb.BillingMode.PAY_PER_REQUEST
                : dynamodb.BillingMode.PROVISIONED,
            pointInTimeRecovery: config.dynamodb.pointInTimeRecovery,
            removalPolicy: config.dynamodb.deletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });

        // GSI for querying images by farm
        this.imagesTable.addGlobalSecondaryIndex({
            indexName: 'FarmIdUploadedAtIndex',
            partitionKey: { name: 'farmId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'uploadedAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Disease Analyses table (Requirement 3.4)
        this.diseaseAnalysesTable = new dynamodb.Table(this, 'DiseaseAnalysesTable', {
            tableName: getResourceName(config.environment, 'dynamodb', 'disease-analyses'),
            partitionKey: { name: 'imageId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'analysisId', type: dynamodb.AttributeType.STRING },
            billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
                ? dynamodb.BillingMode.PAY_PER_REQUEST
                : dynamodb.BillingMode.PROVISIONED,
            pointInTimeRecovery: config.dynamodb.pointInTimeRecovery,
            removalPolicy: config.dynamodb.deletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });

        // GSI for querying analyses by farm
        this.diseaseAnalysesTable.addGlobalSecondaryIndex({
            indexName: 'FarmIdAnalyzedAtIndex',
            partitionKey: { name: 'farmId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'analyzedAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI for querying analyses by user
        this.diseaseAnalysesTable.addGlobalSecondaryIndex({
            indexName: 'UserIdAnalyzedAtIndex',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'analyzedAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Market Prices table (Requirement 3.5)
        this.marketPricesTable = new dynamodb.Table(this, 'MarketPricesTable', {
            tableName: getResourceName(config.environment, 'dynamodb', 'market-prices'),
            partitionKey: { name: 'commodity', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
                ? dynamodb.BillingMode.PAY_PER_REQUEST
                : dynamodb.BillingMode.PROVISIONED,
            pointInTimeRecovery: config.dynamodb.pointInTimeRecovery,
            removalPolicy: config.dynamodb.deletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            timeToLiveAttribute: 'ttl', // Auto-delete old price data
        });

        // GSI for querying by market location
        this.marketPricesTable.addGlobalSecondaryIndex({
            indexName: 'MarketLocationIndex',
            partitionKey: { name: 'marketLocation', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Sensor Data table (Requirement 3.8)
        this.sensorDataTable = new dynamodb.Table(this, 'SensorDataTable', {
            tableName: getResourceName(config.environment, 'dynamodb', 'sensor-data'),
            partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
                ? dynamodb.BillingMode.PAY_PER_REQUEST
                : dynamodb.BillingMode.PROVISIONED,
            pointInTimeRecovery: config.dynamodb.pointInTimeRecovery,
            removalPolicy: config.dynamodb.deletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            timeToLiveAttribute: 'ttl', // Auto-delete old sensor data after 90 days
        });

        // GSI for querying sensor data by farm
        this.sensorDataTable.addGlobalSecondaryIndex({
            indexName: 'FarmIdTimestampIndex',
            partitionKey: { name: 'farmId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI for querying specific sensor type by farm
        this.sensorDataTable.addGlobalSecondaryIndex({
            indexName: 'FarmIdSensorTypeIndex',
            partitionKey: { name: 'farmIdSensorType', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Sensor Aggregates table (Requirement 3.9)
        this.sensorAggregatesTable = new dynamodb.Table(this, 'SensorAggregatesTable', {
            tableName: getResourceName(config.environment, 'dynamodb', 'sensor-aggregates'),
            partitionKey: { name: 'farmIdSensorType', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'period', type: dynamodb.AttributeType.STRING },
            billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
                ? dynamodb.BillingMode.PAY_PER_REQUEST
                : dynamodb.BillingMode.PROVISIONED,
            pointInTimeRecovery: config.dynamodb.pointInTimeRecovery,
            removalPolicy: config.dynamodb.deletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });

        // Optimizations table (Requirement 3.10)
        // Enable DynamoDB Streams for threshold alert triggering (Requirement 8.9)
        this.optimizationsTable = new dynamodb.Table(this, 'OptimizationsTable', {
            tableName: getResourceName(config.environment, 'dynamodb', 'optimizations'),
            partitionKey: { name: 'farmId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'calculatedAt', type: dynamodb.AttributeType.STRING },
            billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
                ? dynamodb.BillingMode.PAY_PER_REQUEST
                : dynamodb.BillingMode.PROVISIONED,
            pointInTimeRecovery: config.dynamodb.pointInTimeRecovery,
            removalPolicy: config.dynamodb.deletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            stream: dynamodb.StreamViewType.NEW_IMAGE, // Enable streams to trigger alert-trigger Lambda
        });

        // GSI for querying optimizations by user
        this.optimizationsTable.addGlobalSecondaryIndex({
            indexName: 'UserIdCalculatedAtIndex',
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'calculatedAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Chat Messages table (Requirement 3.10)
        this.chatMessagesTable = new dynamodb.Table(this, 'ChatMessagesTable', {
            tableName: getResourceName(config.environment, 'dynamodb', 'chat-messages'),
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
                ? dynamodb.BillingMode.PAY_PER_REQUEST
                : dynamodb.BillingMode.PROVISIONED,
            pointInTimeRecovery: config.dynamodb.pointInTimeRecovery,
            removalPolicy: config.dynamodb.deletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });

        // GSI for querying chat by farm context
        this.chatMessagesTable.addGlobalSecondaryIndex({
            indexName: 'FarmIdTimestampIndex',
            partitionKey: { name: 'farmId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Alerts table (Requirement 3.10)
        this.alertsTable = new dynamodb.Table(this, 'AlertsTable', {
            tableName: getResourceName(config.environment, 'dynamodb', 'alerts'),
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
            billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
                ? dynamodb.BillingMode.PAY_PER_REQUEST
                : dynamodb.BillingMode.PROVISIONED,
            pointInTimeRecovery: config.dynamodb.pointInTimeRecovery,
            removalPolicy: config.dynamodb.deletionProtection ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });

        // GSI for querying alerts by farm
        this.alertsTable.addGlobalSecondaryIndex({
            indexName: 'FarmIdCreatedAtIndex',
            partitionKey: { name: 'farmId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // GSI for querying alerts by status
        this.alertsTable.addGlobalSecondaryIndex({
            indexName: 'StatusCreatedAtIndex',
            partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ===== ELASTICACHE REDIS CLUSTER =====

        // Create security group for Redis
        this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
            vpc: props.vpc,
            securityGroupName: getResourceName(config.environment, 'sg', 'redis'),
            description: 'Security group for ElastiCache Redis cluster',
            allowAllOutbound: true,
        });

        // Allow Lambda functions to access Redis
        this.redisSecurityGroup.addIngressRule(
            props.lambdaSecurityGroup,
            ec2.Port.tcp(6379),
            'Allow Lambda access to Redis'
        );

        // Create subnet group for Redis
        const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
            description: 'Subnet group for ElastiCache Redis cluster',
            subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
            cacheSubnetGroupName: getResourceName(config.environment, 'elasticache-subnet', 'redis'),
        });

        // Create Redis cluster
        this.redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
            cacheNodeType: 'cache.t3.micro', // Small instance for dev, scale up for prod
            engine: 'redis',
            numCacheNodes: 1,
            clusterName: getResourceName(config.environment, 'redis', 'cache'),
            cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
            vpcSecurityGroupIds: [this.redisSecurityGroup.securityGroupId],
            autoMinorVersionUpgrade: true,
            preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
        });

        this.redisCluster.addDependency(redisSubnetGroup);

        // Apply tags to all resources in this stack
        applyTags(this, config.tags);

        // ===== CLOUDFORMATION OUTPUTS =====

        new cdk.CfnOutput(this, 'ImagesBucketName', {
            value: this.imagesBucket.bucketName,
            description: 'Images S3 bucket name',
            exportName: `${config.environment}-images-bucket-name`,
        });

        new cdk.CfnOutput(this, 'ImagesBucketArn', {
            value: this.imagesBucket.bucketArn,
            description: 'Images S3 bucket ARN',
            exportName: `${config.environment}-images-bucket-arn`,
        });

        new cdk.CfnOutput(this, 'BackupsBucketName', {
            value: this.backupsBucket.bucketName,
            description: 'Backups S3 bucket name',
            exportName: `${config.environment}-backups-bucket-name`,
        });

        new cdk.CfnOutput(this, 'UsersTableName', {
            value: this.usersTable.tableName,
            description: 'Users DynamoDB table name',
            exportName: `${config.environment}-users-table-name`,
        });

        new cdk.CfnOutput(this, 'FarmsTableName', {
            value: this.farmsTable.tableName,
            description: 'Farms DynamoDB table name',
            exportName: `${config.environment}-farms-table-name`,
        });

        new cdk.CfnOutput(this, 'ImagesTableName', {
            value: this.imagesTable.tableName,
            description: 'Images DynamoDB table name',
            exportName: `${config.environment}-images-table-name`,
        });

        new cdk.CfnOutput(this, 'DiseaseAnalysesTableName', {
            value: this.diseaseAnalysesTable.tableName,
            description: 'Disease Analyses DynamoDB table name',
            exportName: `${config.environment}-disease-analyses-table-name`,
        });

        new cdk.CfnOutput(this, 'MarketPricesTableName', {
            value: this.marketPricesTable.tableName,
            description: 'Market Prices DynamoDB table name',
            exportName: `${config.environment}-market-prices-table-name`,
        });

        new cdk.CfnOutput(this, 'SensorDataTableName', {
            value: this.sensorDataTable.tableName,
            description: 'Sensor Data DynamoDB table name',
            exportName: `${config.environment}-sensor-data-table-name`,
        });

        new cdk.CfnOutput(this, 'SensorAggregatesTableName', {
            value: this.sensorAggregatesTable.tableName,
            description: 'Sensor Aggregates DynamoDB table name',
            exportName: `${config.environment}-sensor-aggregates-table-name`,
        });

        new cdk.CfnOutput(this, 'OptimizationsTableName', {
            value: this.optimizationsTable.tableName,
            description: 'Optimizations DynamoDB table name',
            exportName: `${config.environment}-optimizations-table-name`,
        });

        new cdk.CfnOutput(this, 'ChatMessagesTableName', {
            value: this.chatMessagesTable.tableName,
            description: 'Chat Messages DynamoDB table name',
            exportName: `${config.environment}-chat-messages-table-name`,
        });

        new cdk.CfnOutput(this, 'AlertsTableName', {
            value: this.alertsTable.tableName,
            description: 'Alerts DynamoDB table name',
            exportName: `${config.environment}-alerts-table-name`,
        });

        new cdk.CfnOutput(this, 'RedisEndpoint', {
            value: this.redisCluster.attrRedisEndpointAddress,
            description: 'Redis cluster endpoint address',
            exportName: `${config.environment}-redis-endpoint`,
        });

        new cdk.CfnOutput(this, 'RedisPort', {
            value: this.redisCluster.attrRedisEndpointPort,
            description: 'Redis cluster port',
            exportName: `${config.environment}-redis-port`,
        });
    }
}
