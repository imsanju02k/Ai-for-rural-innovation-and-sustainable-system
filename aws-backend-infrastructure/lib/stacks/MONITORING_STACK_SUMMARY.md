# MonitoringStack Summary

## Overview

The MonitoringStack provides comprehensive monitoring, logging, and alerting infrastructure for the AWS Backend Infrastructure. It implements CloudWatch-based observability with dashboards, alarms, log groups, and SNS notifications.

## Components Created

### 1. CloudWatch Log Groups

**Purpose**: Centralized logging for all Lambda functions

**Configuration**:
- **Retention**: 30 days (Requirement 10.6)
- **Removal Policy**: RETAIN for production, DESTROY for dev/staging
- **Log Groups**: Created for all 24 Lambda functions

**Lambda Functions Monitored**:
- Authentication: auth-register, auth-login, auth-refresh, auth-verify
- Farm Management: farm-create, farm-list, farm-get, farm-update, farm-delete
- Image Processing: image-upload-url, image-download-url, image-process
- Disease Detection: disease-detect, disease-history
- Market Prices: market-fetch, market-get, market-predict
- Optimization: optimization-calculate, optimization-history
- Advisory: advisory-chat, advisory-history
- IoT: iot-query
- Alerts: alert-list, alert-acknowledge

### 2. SNS Topics

**Alerts Topic** (Critical Errors)
- Topic Name: `{env}-sns-alerts`
- Purpose: Critical system errors requiring immediate attention
- Subscribers: Email addresses (configurable per environment)

**Monitoring Topic** (Operational Alerts)
- Topic Name: `{env}-sns-monitoring`
- Purpose: Operational warnings and performance issues
- Subscribers: Email addresses (configurable per environment)

### 3. CloudWatch Dashboard

**Dashboard Name**: `{env}-dashboard-farm-platform`

**Widgets**:

1. **API Gateway - Request Count**
   - Metric: Count (Sum over 5 minutes)
   - Tracks total API requests

2. **API Gateway - Latency**
   - Metrics: Average and p99 latency
   - Monitors API response times

3. **API Gateway - Error Rates**
   - Metrics: 4XXError and 5XXError (Sum over 5 minutes)
   - Tracks client and server errors

4. **Lambda - Total Errors**
   - Metrics: Error count for all Lambda functions
   - Identifies failing functions

5. **Lambda - Average Duration**
   - Metrics: Average execution time for all Lambda functions
   - Monitors performance

6. **DynamoDB - Throttled Requests**
   - Metrics: UserErrors (throttling) for all tables
   - Identifies capacity issues

7. **DynamoDB - Consumed Read/Write Capacity**
   - Metrics: ConsumedReadCapacityUnits and ConsumedWriteCapacityUnits
   - Monitors database usage

### 4. CloudWatch Alarms

#### API Gateway Error Rate Alarm
- **Name**: `{env}-alarm-api-error-rate`
- **Condition**: Error rate > 5% over 5 minutes (Requirement 10.3)
- **Action**: Publish to Alerts Topic
- **Metric**: (5XXError / Count) * 100

#### Lambda Duration Alarms
- **Name**: `{env}-alarm-lambda-duration-{function-name}`
- **Condition**: Average duration > 10 seconds (Requirement 10.7)
- **Action**: Publish to Monitoring Topic
- **Created For**: All 24 Lambda functions

#### DynamoDB Throttling Alarms
- **Name**: `{env}-alarm-dynamodb-throttle-{table-name}`
- **Condition**: UserErrors > 10 over 5 minutes (Requirement 10.4)
- **Action**: Publish to Alerts Topic
- **Created For**: All 10 DynamoDB tables

#### S3 Bucket Size Alarms
- **Name**: `{env}-alarm-s3-size-{bucket-name}`
- **Condition**: BucketSizeBytes > 100GB
- **Action**: Publish to Monitoring Topic
- **Created For**: All S3 buckets

#### Bedrock API Usage Alarm
- **Name**: `{env}-alarm-bedrock-usage`
- **Condition**: Invocations > 1000 per hour (Requirement 10.8)
- **Action**: Publish to Monitoring Topic
- **Purpose**: Track AI service costs

### 5. CloudWatch Insights Queries

Pre-defined queries for common troubleshooting scenarios:

#### Error Patterns Query
```
fields @timestamp, @message, @logStream
| filter @message like /ERROR/ or @message like /Exception/
| sort @timestamp desc
| limit 100
```

#### Slow Lambda Functions Query
```
fields @timestamp, @duration, @requestId, @message
| filter @type = "REPORT"
| filter @duration > 10000
| sort @duration desc
| limit 50
```

#### API Usage by Endpoint Query
```
fields @timestamp, requestContext.path, requestContext.httpMethod, requestContext.requestId
| stats count() by requestContext.path, requestContext.httpMethod
| sort count() desc
```

#### User Activity Patterns Query
```
fields @timestamp, requestContext.authorizer.userId, requestContext.path
| filter requestContext.authorizer.userId != ""
| stats count() by requestContext.authorizer.userId
| sort count() desc
| limit 20
```

## X-Ray Tracing

**Status**: Enabled for all Lambda functions
- **Configuration**: `tracing: lambda.Tracing.ACTIVE`
- **IAM Policy**: AWSXRayDaemonWriteAccess attached to all Lambda roles
- **Purpose**: Distributed tracing for request flows

## Structured Logging

**Implementation**: Enhanced request logger middleware

**Features**:
- Request ID included in all log entries (Requirement 1.7)
- Lambda execution duration logged (Requirement 10.1)
- API Gateway request/response logged
- Error stack traces logged (Requirement 10.1)
- Warning logged when duration exceeds 10 seconds (Requirement 10.7)

**Log Format** (JSON):
```json
{
  "level": "INFO",
  "message": "Request completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "context": {
    "requestId": "abc-123-def",
    "userId": "user-456",
    "farmId": "farm-789"
  },
  "duration": 1234,
  "durationMs": 1234,
  "statusCode": 200
}
```

## Stack Outputs

1. **AlertsTopicArn**: ARN of the critical alerts SNS topic
2. **MonitoringTopicArn**: ARN of the operational monitoring SNS topic
3. **DashboardUrl**: Direct link to CloudWatch dashboard
4. **ErrorPatternsQuery**: CloudWatch Insights query for errors
5. **SlowLambdaQuery**: CloudWatch Insights query for slow functions
6. **ApiUsageQuery**: CloudWatch Insights query for API usage
7. **UserActivityQuery**: CloudWatch Insights query for user activity

## Requirements Satisfied

- ✅ **Requirement 10.1**: Monitoring_Service SHALL collect logs from all Lambda functions
- ✅ **Requirement 10.2**: Track API Gateway metrics (request count, latency, error rate)
- ✅ **Requirement 10.3**: When error rate exceeds 5% over 5 minutes, trigger an alarm
- ✅ **Requirement 10.4**: Track DynamoDB metrics (read/write capacity, throttling)
- ✅ **Requirement 10.5**: Create dashboards for key performance indicators
- ✅ **Requirement 10.6**: Retain logs for 30 days
- ✅ **Requirement 10.7**: When Lambda function duration exceeds 10 seconds, log a warning
- ✅ **Requirement 10.8**: Track Amazon Bedrock API usage and costs
- ✅ **Requirement 10.9**: Provide alerting via SNS for critical errors
- ✅ **Requirement 1.7**: Log request and response details to Monitoring_Service

## Integration

### Dependencies
- **APIStack**: Monitors API Gateway metrics
- **ComputeStack**: Monitors all Lambda functions
- **StorageStack**: Monitors DynamoDB tables and S3 buckets

### Configuration
Alert email addresses are configured per environment:
- **Production**: `alerts@farmplatform.example.com`
- **Dev/Staging**: No email subscriptions (optional)

### Alarm Behavior
Alarms are only enabled when `config.cloudwatch.alarmsEnabled` is `true`:
- **Development**: Alarms disabled (no notifications)
- **Staging**: Alarms enabled
- **Production**: Alarms enabled

## Usage

### Viewing Logs
```bash
# View logs for a specific Lambda function
aws logs tail /aws/lambda/{env}-auth-register --follow

# Query logs using CloudWatch Insights
aws logs start-query \
  --log-group-name /aws/lambda/{env}-auth-register \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/'
```

### Accessing Dashboard
Navigate to the CloudWatch console or use the DashboardUrl output from the stack.

### Subscribing to Alerts
```bash
# Subscribe email to alerts topic
aws sns subscribe \
  --topic-arn arn:aws:sns:region:account:{env}-sns-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Monitoring Best Practices

1. **Review Dashboard Daily**: Check for anomalies in request counts, latency, and errors
2. **Set Up Alert Routing**: Configure SNS to route critical alerts to on-call engineers
3. **Use CloudWatch Insights**: Run queries to investigate issues and identify patterns
4. **Monitor Costs**: Track Bedrock API usage to control AI service costs
5. **Adjust Thresholds**: Fine-tune alarm thresholds based on actual usage patterns
6. **Enable X-Ray Analysis**: Use X-Ray service map to visualize request flows
7. **Archive Logs**: Consider exporting logs to S3 for long-term retention beyond 30 days

## Future Enhancements

1. **Custom Metrics**: Add application-specific metrics (e.g., disease detection accuracy)
2. **Anomaly Detection**: Use CloudWatch Anomaly Detection for automatic threshold adjustment
3. **Composite Alarms**: Create composite alarms for complex failure scenarios
4. **Log Insights Dashboards**: Create saved queries and dashboards in CloudWatch Insights
5. **Cost Optimization**: Implement log filtering to reduce CloudWatch Logs costs
6. **Integration with PagerDuty**: Add PagerDuty integration for critical alerts
7. **Synthetic Monitoring**: Add CloudWatch Synthetics for proactive endpoint monitoring
