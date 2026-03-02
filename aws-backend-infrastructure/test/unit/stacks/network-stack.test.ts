import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { NetworkStack } from '../../../lib/stacks/network-stack';
import { devConfig } from '../../../lib/config/dev';

describe('NetworkStack', () => {
    let app: cdk.App;
    let stack: NetworkStack;
    let template: Template;

    beforeEach(() => {
        app = new cdk.App();
        stack = new NetworkStack(app, 'TestNetworkStack', devConfig);
        template = Template.fromStack(stack);
    });

    describe('VPC Configuration', () => {
        it('should create a VPC with correct CIDR block', () => {
            template.hasResourceProperties('AWS::EC2::VPC', {
                CidrBlock: '10.0.0.0/16',
                EnableDnsHostnames: true,
                EnableDnsSupport: true,
            });
        });

        it('should create public subnets in 2 AZs', () => {
            template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private

            // Check for public subnets
            template.hasResourceProperties('AWS::EC2::Subnet', {
                MapPublicIpOnLaunch: true,
            });
        });

        it('should create private subnets in 2 AZs', () => {
            template.hasResourceProperties('AWS::EC2::Subnet', {
                MapPublicIpOnLaunch: false,
            });
        });

        it('should create an Internet Gateway', () => {
            template.resourceCountIs('AWS::EC2::InternetGateway', 1);
        });
    });

    describe('NAT Gateways', () => {
        it('should create 2 NAT gateways (one per AZ)', () => {
            template.resourceCountIs('AWS::EC2::NatGateway', 2);
        });

        it('should create Elastic IPs for NAT gateways', () => {
            template.resourceCountIs('AWS::EC2::EIP', 2);
        });
    });

    describe('Security Groups', () => {
        it('should create a security group for Lambda functions', () => {
            template.hasResourceProperties('AWS::EC2::SecurityGroup', {
                GroupDescription: 'Security group for Lambda functions in VPC',
                GroupName: 'dev-sg-lambda',
            });
        });

        it('should allow Lambda-to-Lambda communication', () => {
            template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
                Description: 'Allow Lambda-to-Lambda communication',
                IpProtocol: '-1',
            });
        });

        it('should allow all outbound traffic', () => {
            template.hasResourceProperties('AWS::EC2::SecurityGroup', {
                SecurityGroupEgress: [
                    {
                        CidrIp: '0.0.0.0/0',
                        Description: 'Allow all outbound traffic by default',
                        IpProtocol: '-1',
                    },
                ],
            });
        });
    });

    describe('VPC Endpoints', () => {
        it('should create a DynamoDB VPC endpoint', () => {
            template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
                VpcEndpointType: 'Gateway',
                ServiceName: {
                    'Fn::Join': [
                        '',
                        [
                            'com.amazonaws.',
                            { Ref: 'AWS::Region' },
                            '.dynamodb',
                        ],
                    ],
                },
            });
        });

        it('should create an S3 VPC endpoint', () => {
            template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
                VpcEndpointType: 'Gateway',
                ServiceName: {
                    'Fn::Join': [
                        '',
                        [
                            'com.amazonaws.',
                            { Ref: 'AWS::Region' },
                            '.s3',
                        ],
                    ],
                },
            });
        });

        it('should create a Secrets Manager VPC endpoint', () => {
            template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
                VpcEndpointType: 'Interface',
                PrivateDnsEnabled: true,
            });
        });

        it('should attach gateway endpoints to private subnets', () => {
            // Gateway endpoints should be attached to route tables
            template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
                VpcEndpointType: 'Gateway',
                RouteTableIds: Match.anyValue(),
            });
        });
    });

    describe('CloudFormation Outputs', () => {
        it('should export VPC ID', () => {
            template.hasOutput('VpcId', {
                Export: {
                    Name: 'dev-vpc-id',
                },
            });
        });

        it('should export VPC CIDR', () => {
            template.hasOutput('VpcCidr', {
                Export: {
                    Name: 'dev-vpc-cidr',
                },
            });
        });

        it('should export private subnet IDs', () => {
            template.hasOutput('PrivateSubnetIds', {
                Export: {
                    Name: 'dev-private-subnet-ids',
                },
            });
        });

        it('should export public subnet IDs', () => {
            template.hasOutput('PublicSubnetIds', {
                Export: {
                    Name: 'dev-public-subnet-ids',
                },
            });
        });

        it('should export Lambda security group ID', () => {
            template.hasOutput('LambdaSecurityGroupId', {
                Export: {
                    Name: 'dev-lambda-sg-id',
                },
            });
        });

        it('should export DynamoDB endpoint ID', () => {
            template.hasOutput('DynamoDBEndpointId', {
                Export: {
                    Name: 'dev-dynamodb-endpoint-id',
                },
            });
        });

        it('should export S3 endpoint ID', () => {
            template.hasOutput('S3EndpointId', {
                Export: {
                    Name: 'dev-s3-endpoint-id',
                },
            });
        });

        it('should export Secrets Manager endpoint ID', () => {
            template.hasOutput('SecretsManagerEndpointId', {
                Export: {
                    Name: 'dev-secrets-manager-endpoint-id',
                },
            });
        });
    });

    describe('Resource Tagging', () => {
        it('should tag VPC with environment tags', () => {
            template.hasResourceProperties('AWS::EC2::VPC', {
                Tags: Match.arrayWith([
                    { Key: 'Environment', Value: 'dev' },
                    { Key: 'Project', Value: 'FarmPlatform' },
                ]),
            });
        });

        it('should tag security group with environment tags', () => {
            template.hasResourceProperties('AWS::EC2::SecurityGroup', {
                Tags: Match.arrayWith([
                    { Key: 'Environment', Value: 'dev' },
                    { Key: 'Project', Value: 'FarmPlatform' },
                ]),
            });
        });
    });

    describe('High Availability', () => {
        it('should distribute resources across 2 availability zones', () => {
            // Check that we have resources in multiple AZs
            const subnets = template.findResources('AWS::EC2::Subnet');
            const azs = new Set<string>();

            Object.values(subnets).forEach((subnet: any) => {
                if (subnet.Properties?.AvailabilityZone) {
                    azs.add(subnet.Properties.AvailabilityZone);
                }
            });

            // We should have at least 2 AZs (us-east-1a, us-east-1b, etc.)
            expect(azs.size).toBeGreaterThanOrEqual(2);
        });

        it('should create one NAT gateway per AZ for redundancy', () => {
            template.resourceCountIs('AWS::EC2::NatGateway', 2);
        });
    });
});
