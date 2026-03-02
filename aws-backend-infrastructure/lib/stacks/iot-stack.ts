import * as cdk from 'aws-cdk-lib';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import { getResourceName } from '../utils/naming';

/**
 * IoT Stack
 * Creates AWS IoT Core infrastructure for sensor data ingestion
 * Requirements: 9.1, 9.6
 */
export class IoTStack extends cdk.Stack {
    public readonly iotEndpoint: string;
    public readonly devicePolicy: iot.CfnPolicy;
    public readonly sensorDataRule: iot.CfnTopicRule;

    constructor(scope: Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
        super(scope, id, props);

        const { environment, region, account } = config;
        const accountId = account || cdk.Aws.ACCOUNT_ID;

        // IoT Core endpoint (data-ats endpoint)
        this.iotEndpoint = `${accountId}.iot.${region}.amazonaws.com`;

        // Create IoT Policy for device authentication (Requirement 9.6)
        this.devicePolicy = new iot.CfnPolicy(this, 'DevicePolicy', {
            policyName: getResourceName(environment, 'iot-policy', 'device'),
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['iot:Connect'],
                        Resource: `arn:aws:iot:${region}:${accountId}:client/\${iot:ClientId}`,
                        Condition: {
                            Bool: {
                                'iot:Connection.Thing.IsAttached': 'true',
                            },
                        },
                    },
                    {
                        Effect: 'Allow',
                        Action: ['iot:Publish'],
                        Resource: `arn:aws:iot:${region}:${accountId}:topic/farm/\${iot:Connection.Thing.ThingName}/sensors/*`,
                    },
                    {
                        Effect: 'Allow',
                        Action: ['iot:Subscribe'],
                        Resource: `arn:aws:iot:${region}:${accountId}:topicfilter/farm/\${iot:Connection.Thing.ThingName}/commands/*`,
                    },
                    {
                        Effect: 'Allow',
                        Action: ['iot:Receive'],
                        Resource: `arn:aws:iot:${region}:${accountId}:topic/farm/\${iot:Connection.Thing.ThingName}/commands/*`,
                    },
                ],
            },
        });

        // Create IAM role for IoT Rules Engine to invoke Lambda
        const iotRuleRole = new iam.Role(this, 'IoTRuleRole', {
            roleName: getResourceName(environment, 'iot-rule', 'role'),
            assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
            description: 'Role for IoT Rules Engine to invoke Lambda functions',
        });

        iotRuleRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['lambda:InvokeFunction'],
                resources: [`arn:aws:lambda:${region}:${accountId}:function:${environment}-iot-*`],
            })
        );

        // Create IoT Rule for sensor data routing (Requirement 9.1)
        // Topic filter: farm/+/sensors/*
        this.sensorDataRule = new iot.CfnTopicRule(this, 'SensorDataRule', {
            topicRulePayload: {
                sql: "SELECT * FROM 'farm/+/sensors/#'",
                description: 'Route sensor data from IoT devices to Lambda for processing',
                actions: [
                    {
                        lambda: {
                            functionArn: `arn:aws:lambda:${region}:${accountId}:function:${environment}-iot-ingest`,
                        },
                    },
                ],
                ruleDisabled: false,
                awsIotSqlVersion: '2016-03-23',
            },
            ruleName: getResourceName(environment, 'iot-rule', 'sensor-data').replace(/-/g, '_'),
        });

        // Add tags
        cdk.Tags.of(this).add('Environment', environment);
        cdk.Tags.of(this).add('Project', 'AI-Rural-Innovation-Platform');
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
        cdk.Tags.of(this).add('Stack', 'IoT');

        // Outputs
        new cdk.CfnOutput(this, 'IoTEndpoint', {
            value: this.iotEndpoint,
            description: 'AWS IoT Core data endpoint',
            exportName: `${environment}-iot-endpoint`,
        });

        new cdk.CfnOutput(this, 'DevicePolicyName', {
            value: this.devicePolicy.policyName!,
            description: 'IoT device policy name',
            exportName: `${environment}-device-policy-name`,
        });

        new cdk.CfnOutput(this, 'SensorDataRuleName', {
            value: this.sensorDataRule.ruleName!,
            description: 'IoT rule name for sensor data routing',
            exportName: `${environment}-sensor-data-rule-name`,
        });
    }
}
