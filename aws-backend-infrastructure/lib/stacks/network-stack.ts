import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import { getResourceName, getStackName } from '../utils/naming';
import { applyTags } from '../utils/tags';

/**
 * NetworkStack - VPC and networking infrastructure
 * 
 * Creates:
 * - VPC with public and private subnets across 2 AZs
 * - NAT gateways for private subnet internet access
 * - Security groups for Lambda functions
 * - VPC endpoints for AWS services (DynamoDB, S3, Secrets Manager)
 * 
 * Requirements: 11.6
 */
export class NetworkStack extends cdk.Stack {
    public readonly vpc: ec2.Vpc;
    public readonly lambdaSecurityGroup: ec2.SecurityGroup;
    public readonly vpcEndpoints: {
        dynamodb: ec2.GatewayVpcEndpoint;
        s3: ec2.GatewayVpcEndpoint;
        secretsManager: ec2.InterfaceVpcEndpoint;
    };

    constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create VPC with public and private subnets across 2 AZs
        this.vpc = new ec2.Vpc(this, 'FarmPlatformVPC', {
            vpcName: getResourceName(config.environment, 'vpc', 'farm-platform'),
            maxAzs: 2,
            natGateways: 2, // One NAT gateway per AZ for high availability
            ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
            subnetConfiguration: [
                {
                    name: 'Public',
                    subnetType: ec2.SubnetType.PUBLIC,
                    cidrMask: 24,
                },
                {
                    name: 'Private',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidrMask: 24,
                },
            ],
            enableDnsHostnames: true,
            enableDnsSupport: true,
        });

        // Create security group for Lambda functions
        this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
            vpc: this.vpc,
            securityGroupName: getResourceName(config.environment, 'sg', 'lambda'),
            description: 'Security group for Lambda functions in VPC',
            allowAllOutbound: true,
        });

        // Allow Lambda functions to communicate with each other
        this.lambdaSecurityGroup.addIngressRule(
            this.lambdaSecurityGroup,
            ec2.Port.allTraffic(),
            'Allow Lambda-to-Lambda communication'
        );

        // Create VPC endpoint for DynamoDB (Gateway endpoint - no cost)
        const dynamodbEndpoint = this.vpc.addGatewayEndpoint('DynamoDBEndpoint', {
            service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets: [
                {
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
            ],
        });

        // Create VPC endpoint for S3 (Gateway endpoint - no cost)
        const s3Endpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
            service: ec2.GatewayVpcEndpointAwsService.S3,
            subnets: [
                {
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
            ],
        });

        // Create VPC endpoint for Secrets Manager (Interface endpoint)
        const secretsManagerEndpoint = new ec2.InterfaceVpcEndpoint(this, 'SecretsManagerEndpoint', {
            vpc: this.vpc,
            service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            subnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            privateDnsEnabled: true,
            securityGroups: [this.lambdaSecurityGroup],
        });

        // Store VPC endpoints for reference
        this.vpcEndpoints = {
            dynamodb: dynamodbEndpoint,
            s3: s3Endpoint,
            secretsManager: secretsManagerEndpoint,
        };

        // Apply tags to all resources in this stack
        applyTags(this, config.tags);

        // CloudFormation outputs
        new cdk.CfnOutput(this, 'VpcId', {
            value: this.vpc.vpcId,
            description: 'VPC ID',
            exportName: `${config.environment}-vpc-id`,
        });

        new cdk.CfnOutput(this, 'VpcCidr', {
            value: this.vpc.vpcCidrBlock,
            description: 'VPC CIDR block',
            exportName: `${config.environment}-vpc-cidr`,
        });

        new cdk.CfnOutput(this, 'PrivateSubnetIds', {
            value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
            description: 'Private subnet IDs',
            exportName: `${config.environment}-private-subnet-ids`,
        });

        new cdk.CfnOutput(this, 'PublicSubnetIds', {
            value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
            description: 'Public subnet IDs',
            exportName: `${config.environment}-public-subnet-ids`,
        });

        new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
            value: this.lambdaSecurityGroup.securityGroupId,
            description: 'Lambda security group ID',
            exportName: `${config.environment}-lambda-sg-id`,
        });

        new cdk.CfnOutput(this, 'DynamoDBEndpointId', {
            value: dynamodbEndpoint.vpcEndpointId,
            description: 'DynamoDB VPC endpoint ID',
            exportName: `${config.environment}-dynamodb-endpoint-id`,
        });

        new cdk.CfnOutput(this, 'S3EndpointId', {
            value: s3Endpoint.vpcEndpointId,
            description: 'S3 VPC endpoint ID',
            exportName: `${config.environment}-s3-endpoint-id`,
        });

        new cdk.CfnOutput(this, 'SecretsManagerEndpointId', {
            value: secretsManagerEndpoint.vpcEndpointId,
            description: 'Secrets Manager VPC endpoint ID',
            exportName: `${config.environment}-secrets-manager-endpoint-id`,
        });
    }
}
