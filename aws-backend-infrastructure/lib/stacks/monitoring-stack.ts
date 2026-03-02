import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import { getResourceName } from '../utils/naming';

/**
 * MonitoringStack - CloudWatch monitoring, logging, and alerting
 * 
 * Creates:
 * - Log groups for all Lambda functions with 30-day retention
 * - X-Ray tracing configuration
 * - CloudWatch dashboard for key metrics
 * - CloudWatch alarms for error rates, latency, and resource usage
 * - SNS topics for alerting
 * - CloudWatch Insights queries
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 1.7
 */
export interface MonitoringStackProps extends cdk.StackProps {
    // Lambda functions to monitor
    lambdaFunctions: lambda.IFunction[];

    // API Gateway to monitor
    api: apigateway.IRestApi;

    // DynamoDB tables to monitor
    dynamodbTables: dynamodb.ITable[];

    // S3 buckets to monitor
    s3Buckets: s3.IBucket[];

    // Email addresses for alerts
    alertEmails?: string[];
}

export class MonitoringStack extends cdk.Stack {
    public readonly alertsTopic: sns.Topic;
    public readonly monitoringTopic: sns.Topic;
    public readonly dashboard: cloudwatch.Dashboard;

    constructor(scope: Construct, id: string, config: EnvironmentConfig, props: MonitoringStackProps) {
        super(scope, id, props);

        // ===== LOG GROUPS FOR LAMBDA FUNCTIONS =====
        // Requirement 10.1: Collect logs from all Lambda functions
        // Requirement 10.6: Retain logs for 30 days
        // Note: Log groups are already created by Lambda functions automatically
        // We'll reference them instead of creating new ones to avoid conflicts

        // Log groups are managed by Lambda functions in ComputeStack
        // They are created with the logRetention property on each Lambda function

        // ===== SNS TOPICS FOR ALERTING =====
        // Requirement 10.9: Provide alerting via SNS for critical errors

        // Critical alerts topic
        this.alertsTopic = new sns.Topic(this, 'AlertsTopic', {
            topicName: getResourceName(config.environment, 'sns', 'alerts'),
            displayName: 'Critical Alerts for Farm Platform',
        });

        // Operational monitoring topic
        this.monitoringTopic = new sns.Topic(this, 'MonitoringTopic', {
            topicName: getResourceName(config.environment, 'sns', 'monitoring'),
            displayName: 'Operational Monitoring for Farm Platform',
        });

        // Subscribe email endpoints if provided
        if (props.alertEmails && props.alertEmails.length > 0) {
            props.alertEmails.forEach((email) => {
                this.alertsTopic.addSubscription(
                    new subscriptions.EmailSubscription(email)
                );
                this.monitoringTopic.addSubscription(
                    new subscriptions.EmailSubscription(email)
                );
            });
        }

        // ===== CLOUDWATCH DASHBOARD =====
        // Requirement 10.5: Create dashboards for key performance indicators

        this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
            dashboardName: getResourceName(config.environment, 'dashboard', 'farm-platform'),
        });

        // API Gateway metrics widget
        // Requirement 10.2: Track API Gateway metrics (request count, latency, error rate)
        const apiMetricNamespace = 'AWS/ApiGateway';
        const apiDimensions = {
            ApiName: props.api.restApiName,
        };

        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'API Gateway - Request Count',
                left: [
                    new cloudwatch.Metric({
                        namespace: apiMetricNamespace,
                        metricName: 'Count',
                        dimensionsMap: apiDimensions,
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                ],
                width: 12,
            }),
            new cloudwatch.GraphWidget({
                title: 'API Gateway - Latency',
                left: [
                    new cloudwatch.Metric({
                        namespace: apiMetricNamespace,
                        metricName: 'Latency',
                        dimensionsMap: apiDimensions,
                        statistic: 'Average',
                        period: cdk.Duration.minutes(5),
                    }),
                    new cloudwatch.Metric({
                        namespace: apiMetricNamespace,
                        metricName: 'Latency',
                        dimensionsMap: apiDimensions,
                        statistic: 'p99',
                        period: cdk.Duration.minutes(5),
                    }),
                ],
                width: 12,
            })
        );

        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'API Gateway - Error Rates',
                left: [
                    new cloudwatch.Metric({
                        namespace: apiMetricNamespace,
                        metricName: '4XXError',
                        dimensionsMap: apiDimensions,
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                    new cloudwatch.Metric({
                        namespace: apiMetricNamespace,
                        metricName: '5XXError',
                        dimensionsMap: apiDimensions,
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                ],
                width: 12,
            }),
            new cloudwatch.GraphWidget({
                title: 'API Gateway - 4xx/5xx Errors',
                left: [
                    new cloudwatch.Metric({
                        namespace: apiMetricNamespace,
                        metricName: '4XXError',
                        dimensionsMap: apiDimensions,
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                    new cloudwatch.Metric({
                        namespace: apiMetricNamespace,
                        metricName: '5XXError',
                        dimensionsMap: apiDimensions,
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                ],
                width: 12,
            })
        );

        // Lambda metrics widgets
        const lambdaErrorMetrics = props.lambdaFunctions.map((fn) =>
            fn.metricErrors({
                statistic: 'Sum',
                period: cdk.Duration.minutes(5),
            })
        );

        const lambdaDurationMetrics = props.lambdaFunctions.map((fn) =>
            fn.metricDuration({
                statistic: 'Average',
                period: cdk.Duration.minutes(5),
            })
        );

        this.dashboard.addWidgets(
            new cloudwatch.GraphWidget({
                title: 'Lambda - Total Errors',
                left: lambdaErrorMetrics.slice(0, 10), // First 10 functions
                width: 12,
            }),
            new cloudwatch.GraphWidget({
                title: 'Lambda - Average Duration',
                left: lambdaDurationMetrics.slice(0, 10), // First 10 functions
                width: 12,
            })
        );

        // DynamoDB metrics widgets
        // Requirement 10.4: Track DynamoDB metrics (read/write capacity, throttling)
        if (props.dynamodbTables.length > 0) {
            const readThrottleMetrics = props.dynamodbTables.map((table) =>
                table.metricUserErrors({
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5),
                })
            );

            this.dashboard.addWidgets(
                new cloudwatch.GraphWidget({
                    title: 'DynamoDB - Throttled Requests',
                    left: readThrottleMetrics,
                    width: 12,
                }),
                new cloudwatch.GraphWidget({
                    title: 'DynamoDB - Consumed Read/Write Capacity',
                    left: props.dynamodbTables.slice(0, 5).map((table) =>
                        table.metricConsumedReadCapacityUnits({
                            statistic: 'Sum',
                            period: cdk.Duration.minutes(5),
                        })
                    ),
                    right: props.dynamodbTables.slice(0, 5).map((table) =>
                        table.metricConsumedWriteCapacityUnits({
                            statistic: 'Sum',
                            period: cdk.Duration.minutes(5),
                        })
                    ),
                    width: 12,
                })
            );
        }

        // ===== CLOUDWATCH ALARMS =====

        // Requirement 10.3: When error rate exceeds 5% over 5 minutes, trigger an alarm
        const apiErrorRateAlarm = new cloudwatch.Alarm(this, 'ApiErrorRateAlarm', {
            alarmName: getResourceName(config.environment, 'alarm', 'api-error-rate'),
            alarmDescription: 'API Gateway error rate exceeds 5% over 5 minutes',
            metric: new cloudwatch.MathExpression({
                expression: '(m1 / m2) * 100',
                usingMetrics: {
                    m1: new cloudwatch.Metric({
                        namespace: apiMetricNamespace,
                        metricName: '5XXError',
                        dimensionsMap: apiDimensions,
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                    m2: new cloudwatch.Metric({
                        namespace: apiMetricNamespace,
                        metricName: 'Count',
                        dimensionsMap: apiDimensions,
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                },
                period: cdk.Duration.minutes(5),
            }),
            threshold: 5,
            evaluationPeriods: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });

        if (config.cloudwatch.alarmsEnabled) {
            apiErrorRateAlarm.addAlarmAction({
                bind: () => ({ alarmActionArn: this.alertsTopic.topicArn }),
            });
        }

        // Requirement 10.7: When Lambda function duration exceeds 10 seconds, log a warning
        props.lambdaFunctions.forEach((fn, index) => {
            const durationAlarm = new cloudwatch.Alarm(this, `LambdaDurationAlarm${index}`, {
                alarmName: getResourceName(config.environment, 'alarm', `lambda-duration-${index}`),
                alarmDescription: `Lambda function ${fn.functionName} duration exceeds 10 seconds`,
                metric: fn.metricDuration({
                    statistic: 'Average',
                    period: cdk.Duration.minutes(5),
                }),
                threshold: 10000, // 10 seconds in milliseconds
                evaluationPeriods: 1,
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            });

            if (config.cloudwatch.alarmsEnabled) {
                durationAlarm.addAlarmAction({
                    bind: () => ({ alarmActionArn: this.monitoringTopic.topicArn }),
                });
            }
        });

        // DynamoDB throttling alarms
        props.dynamodbTables.forEach((table, index) => {
            const throttleAlarm = new cloudwatch.Alarm(this, `DynamoDBThrottleAlarm${index}`, {
                alarmName: getResourceName(config.environment, 'alarm', `dynamodb-throttle-${index}`),
                alarmDescription: `DynamoDB table ${table.tableName} is being throttled`,
                metric: table.metricUserErrors({
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5),
                }),
                threshold: 10,
                evaluationPeriods: 1,
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            });

            if (config.cloudwatch.alarmsEnabled) {
                throttleAlarm.addAlarmAction({
                    bind: () => ({ alarmActionArn: this.alertsTopic.topicArn }),
                });
            }
        });

        // S3 bucket size alarms
        props.s3Buckets.forEach((bucket, index) => {
            const sizeAlarm = new cloudwatch.Alarm(this, `S3BucketSizeAlarm${index}`, {
                alarmName: getResourceName(config.environment, 'alarm', `s3-size-${index}`),
                alarmDescription: `S3 bucket ${bucket.bucketName} size exceeds 100GB`,
                metric: new cloudwatch.Metric({
                    namespace: 'AWS/S3',
                    metricName: 'BucketSizeBytes',
                    dimensionsMap: {
                        BucketName: bucket.bucketName,
                        StorageType: 'StandardStorage',
                    },
                    statistic: 'Average',
                    period: cdk.Duration.days(1),
                }),
                threshold: 100 * 1024 * 1024 * 1024, // 100GB in bytes
                evaluationPeriods: 1,
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            });

            if (config.cloudwatch.alarmsEnabled) {
                sizeAlarm.addAlarmAction({
                    bind: () => ({ alarmActionArn: this.monitoringTopic.topicArn }),
                });
            }
        });

        // Requirement 10.8: Track Amazon Bedrock API usage and costs
        // Note: Bedrock metrics would be added here when Bedrock integration is complete
        // For now, we'll create a placeholder alarm for Bedrock invocations
        const bedrockInvocationAlarm = new cloudwatch.Alarm(this, 'BedrockInvocationAlarm', {
            alarmName: getResourceName(config.environment, 'alarm', 'bedrock-usage'),
            alarmDescription: 'Bedrock API invocations exceed threshold',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/Bedrock',
                metricName: 'Invocations',
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
            }),
            threshold: 1000, // Adjust based on expected usage
            evaluationPeriods: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });

        if (config.cloudwatch.alarmsEnabled) {
            bedrockInvocationAlarm.addAlarmAction({
                bind: () => ({ alarmActionArn: this.monitoringTopic.topicArn }),
            });
        }

        // ===== CLOUDWATCH INSIGHTS QUERIES =====
        // Requirement 10.5: Create queries for error patterns, slow functions, API usage, user activity

        // These queries can be saved in CloudWatch Insights console or used programmatically
        // We'll output them as stack outputs for reference

        new cdk.CfnOutput(this, 'ErrorPatternsQuery', {
            description: 'CloudWatch Insights query for error patterns',
            value: `fields @timestamp, @message, @logStream
| filter @message like /ERROR/ or @message like /Exception/
| sort @timestamp desc
| limit 100`,
        });

        new cdk.CfnOutput(this, 'SlowLambdaQuery', {
            description: 'CloudWatch Insights query for slow Lambda functions',
            value: `fields @timestamp, @duration, @requestId, @message
| filter @type = "REPORT"
| filter @duration > 10000
| sort @duration desc
| limit 50`,
        });

        new cdk.CfnOutput(this, 'ApiUsageQuery', {
            description: 'CloudWatch Insights query for API usage by endpoint',
            value: `fields @timestamp, requestContext.path, requestContext.httpMethod, requestContext.requestId
| stats count() by requestContext.path, requestContext.httpMethod
| sort count() desc`,
        });

        new cdk.CfnOutput(this, 'UserActivityQuery', {
            description: 'CloudWatch Insights query for user activity patterns',
            value: `fields @timestamp, requestContext.authorizer.userId, requestContext.path
| filter requestContext.authorizer.userId != ""
| stats count() by requestContext.authorizer.userId
| sort count() desc
| limit 20`,
        });

        // ===== STACK OUTPUTS =====

        new cdk.CfnOutput(this, 'AlertsTopicArn', {
            description: 'SNS topic ARN for critical alerts',
            value: this.alertsTopic.topicArn,
            exportName: `${config.environment}-alerts-topic-arn`,
        });

        new cdk.CfnOutput(this, 'MonitoringTopicArn', {
            description: 'SNS topic ARN for operational monitoring',
            value: this.monitoringTopic.topicArn,
            exportName: `${config.environment}-monitoring-topic-arn`,
        });

        new cdk.CfnOutput(this, 'DashboardUrl', {
            description: 'CloudWatch Dashboard URL',
            value: `https://console.aws.amazon.com/cloudwatch/home?region=${config.region}#dashboards:name=${this.dashboard.dashboardName}`,
        });

        // Apply tags
        cdk.Tags.of(this).add('Stack', 'MonitoringStack');
        cdk.Tags.of(this).add('Environment', config.environment);
    }
}
