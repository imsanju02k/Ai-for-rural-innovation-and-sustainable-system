import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { IamRolesConstruct } from '../../../lib/constructs/iam-roles';
import { devConfig } from '../../../lib/config/dev';

describe('IamRolesConstruct', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let construct: IamRolesConstruct;
    let template: Template;

    beforeEach(() => {
        app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack', {
            env: {
                account: devConfig.account,
                region: devConfig.region,
            },
        });
        construct = new IamRolesConstruct(stack, 'TestIamRoles', devConfig);
        template = Template.fromStack(stack);
    });

    describe('Role Creation', () => {
        it('should create exactly 10 IAM roles', () => {
            template.resourceCountIs('AWS::IAM::Role', 10);
        });

        it('should create base Lambda execution role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-base-lambda-role',
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: 'lambda.amazonaws.com',
                            },
                            Action: 'sts:AssumeRole',
                        },
                    ],
                },
            });
        });

        it('should create farm management role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-farm-management-role',
            });
        });

        it('should create image processing role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-image-processing-role',
            });
        });

        it('should create disease detection role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-disease-detection-role',
            });
        });

        it('should create market data role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-market-data-role',
            });
        });

        it('should create optimization role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-optimization-role',
            });
        });

        it('should create advisory chat role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-advisory-chat-role',
            });
        });

        it('should create IoT data role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-iot-data-role',
            });
        });

        it('should create alert role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-alert-role',
            });
        });

        it('should create API Gateway execution role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-api-gateway-role',
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: 'apigateway.amazonaws.com',
                            },
                            Action: 'sts:AssumeRole',
                        },
                    ],
                },
            });
        });
    });

    describe('Managed Policies', () => {
        it('should attach basic execution policy to base Lambda role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-base-lambda-role',
                ManagedPolicyArns: Match.arrayWith([
                    Match.objectLike({
                        'Fn::Join': Match.arrayWith([
                            Match.arrayWith([Match.stringLikeRegexp('AWSLambdaBasicExecutionRole')]),
                        ]),
                    }),
                ]),
            });
        });

        it('should attach X-Ray policy to Lambda roles', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-base-lambda-role',
                ManagedPolicyArns: Match.arrayWith([
                    Match.objectLike({
                        'Fn::Join': Match.arrayWith([Match.arrayWith([Match.stringLikeRegexp('AWSXRayDaemonWriteAccess')])]),
                    }),
                ]),
            });
        });
    });

    describe('Inline Policies', () => {
        it('should create inline policies for roles with custom permissions', () => {
            // Count policies - should have one for each role except base Lambda role
            const policyCount = template.findResources('AWS::IAM::Policy');
            expect(Object.keys(policyCount).length).toBeGreaterThanOrEqual(9);
        });

        it('should include DynamoDB permissions in farm management policy', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            const farmPolicy = Object.values(policies).find((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                return statements.some((stmt: any) => {
                    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
                    return actions.some((action: string) => action?.includes('dynamodb:'));
                });
            });
            expect(farmPolicy).toBeDefined();
        });

        it('should include S3 permissions in image processing policy', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            const imagePolicy = Object.values(policies).find((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                return statements.some((stmt: any) => {
                    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
                    return actions.some((action: string) => action?.includes('s3:'));
                });
            });
            expect(imagePolicy).toBeDefined();
        });

        it('should include Rekognition permissions in disease detection policy', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            const diseasePolicy = Object.values(policies).find((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                return statements.some((stmt: any) => {
                    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
                    return actions.some((action: string) => action?.includes('rekognition:'));
                });
            });
            expect(diseasePolicy).toBeDefined();
        });

        it('should include Bedrock permissions in AI-related policies', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            const bedrockPolicies = Object.values(policies).filter((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                return statements.some((stmt: any) => {
                    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
                    return actions.some((action: string) => action?.includes('bedrock:'));
                });
            });
            // Should have at least 3 policies with Bedrock permissions (disease, market, advisory, optimization)
            expect(bedrockPolicies.length).toBeGreaterThanOrEqual(3);
        });

        it('should include IoT permissions in IoT data policy', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            const iotPolicy = Object.values(policies).find((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                return statements.some((stmt: any) => {
                    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
                    return actions.some((action: string) => action?.includes('iot:'));
                });
            });
            expect(iotPolicy).toBeDefined();
        });

        it('should include SNS permissions in alert policy', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            const alertPolicy = Object.values(policies).find((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                return statements.some((stmt: any) => {
                    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
                    return actions.some((action: string) => action?.includes('sns:'));
                });
            });
            expect(alertPolicy).toBeDefined();
        });

        it('should include SES permissions in alert policy', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            const sesPolicy = Object.values(policies).find((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                return statements.some((stmt: any) => {
                    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
                    return actions.some((action: string) => action?.includes('ses:'));
                });
            });
            expect(sesPolicy).toBeDefined();
        });

        it('should include Lambda invoke permissions in API Gateway policy', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            const apiPolicy = Object.values(policies).find((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                return statements.some((stmt: any) => {
                    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
                    return actions.some((action: string) => action?.includes('lambda:InvokeFunction'));
                });
            });
            expect(apiPolicy).toBeDefined();
        });
    });

    describe('Resource Tagging', () => {
        it('should tag all roles with environment', () => {
            const roles = template.findResources('AWS::IAM::Role');
            Object.values(roles).forEach((role: any) => {
                expect(role.Properties?.Tags).toEqual(
                    expect.arrayContaining([
                        { Key: 'Environment', Value: 'dev' },
                        { Key: 'Project', Value: 'AI-Rural-Innovation-Platform' },
                        { Key: 'ManagedBy', Value: 'CDK' },
                    ])
                );
            });
        });
    });

    describe('Least Privilege Principle', () => {
        it('should not grant wildcard permissions on DynamoDB tables', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            Object.values(policies).forEach((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                statements.forEach((statement: any) => {
                    const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
                    const hasDynamoAction = actions.some((action: string) => action?.startsWith('dynamodb:'));

                    if (hasDynamoAction) {
                        const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
                        resources.forEach((resource: any) => {
                            // Resource should not be just '*' for DynamoDB
                            if (typeof resource === 'string') {
                                expect(resource).not.toBe('*');
                            }
                        });
                    }
                });
            });
        });

        it('should scope S3 permissions to specific bucket patterns', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            Object.values(policies).forEach((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                statements.forEach((statement: any) => {
                    const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
                    const hasS3Action = actions.some((action: string) => action?.startsWith('s3:'));

                    if (hasS3Action) {
                        const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
                        resources.forEach((resource: any) => {
                            // Resource should not be 'arn:aws:s3:::*'
                            if (typeof resource === 'string') {
                                expect(resource).not.toBe('arn:aws:s3:::*');
                            }
                        });
                    }
                });
            });
        });

        it('should have SES condition for from address', () => {
            const policies = template.findResources('AWS::IAM::Policy');
            const sesPolicy = Object.values(policies).find((policy: any) => {
                const statements = policy.Properties?.PolicyDocument?.Statement || [];
                return statements.some((stmt: any) => {
                    const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
                    const hasSES = actions.some((action: string) => action?.includes('ses:'));
                    return hasSES && stmt.Condition;
                });
            });
            expect(sesPolicy).toBeDefined();
        });
    });

    describe('Service Principals', () => {
        it('should use lambda.amazonaws.com for Lambda roles', () => {
            const lambdaRoles = [
                'dev-base-lambda-role',
                'dev-farm-management-role',
                'dev-image-processing-role',
                'dev-disease-detection-role',
                'dev-market-data-role',
                'dev-optimization-role',
                'dev-advisory-chat-role',
                'dev-iot-data-role',
                'dev-alert-role',
            ];

            lambdaRoles.forEach((roleName) => {
                template.hasResourceProperties('AWS::IAM::Role', {
                    RoleName: roleName,
                    AssumeRolePolicyDocument: {
                        Statement: Match.arrayWith([
                            {
                                Effect: 'Allow',
                                Principal: {
                                    Service: 'lambda.amazonaws.com',
                                },
                                Action: 'sts:AssumeRole',
                            },
                        ]),
                    },
                });
            });
        });

        it('should use apigateway.amazonaws.com for API Gateway role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'dev-api-gateway-role',
                AssumeRolePolicyDocument: {
                    Statement: Match.arrayWith([
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: 'apigateway.amazonaws.com',
                            },
                            Action: 'sts:AssumeRole',
                        },
                    ]),
                },
            });
        });
    });

    describe('Construct Exports', () => {
        it('should export all role objects', () => {
            expect(construct.baseLambdaRole).toBeDefined();
            expect(construct.farmManagementRole).toBeDefined();
            expect(construct.imageProcessingRole).toBeDefined();
            expect(construct.diseaseDetectionRole).toBeDefined();
            expect(construct.marketDataRole).toBeDefined();
            expect(construct.optimizationRole).toBeDefined();
            expect(construct.advisoryChatRole).toBeDefined();
            expect(construct.iotDataRole).toBeDefined();
            expect(construct.alertRole).toBeDefined();
            expect(construct.apiGatewayRole).toBeDefined();
        });
    });
});
