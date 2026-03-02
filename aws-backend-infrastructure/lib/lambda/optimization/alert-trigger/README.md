# Optimization Alert Trigger Lambda

## Overview

This Lambda function monitors resource usage against configured thresholds and triggers alerts when thresholds are exceeded. It is triggered by DynamoDB Streams from the Optimizations table.

**Requirements**: 8.9

## Functionality

### Trigger Mechanism

- **Event Source**: DynamoDB Stream from Optimizations table
- **Stream View Type**: NEW_IMAGE (only new records)
- **Batch Size**: Configurable (default: 10)

### Threshold Monitoring

The function monitors three types of resource usage:

1. **Water Usage**
   - Optimal: 100 mm/day
   - Warning: 120 mm/day
   - Critical: 150 mm/day

2. **Fertilizer Usage**
   - Optimal: 50 kg/acre/month
   - Warning: 60 kg/acre/month
   - Critical: 75 kg/acre/month

3. **Energy Usage**
   - Optimal: 100 kWh/day
   - Warning: 120 kWh/day
   - Critical: 150 kWh/day

### Alert Severity Levels

- **Medium**: Usage exceeds optimal threshold
- **High**: Usage exceeds warning threshold
- **Critical**: Usage exceeds critical threshold

### Alert Triggering

When a threshold is exceeded, the function:

1. Determines the severity level based on the threshold exceeded
2. Constructs an alert message with context and recommendations
3. Invokes the alert-create Lambda function asynchronously
4. Includes metadata about the optimization and current resource usage

## Environment Variables

- `FARMS_TABLE`: DynamoDB table name for farms
- `SENSOR_DATA_TABLE`: DynamoDB table name for sensor data
- `ALERT_CREATE_LAMBDA_ARN`: ARN of the alert-create Lambda function

## IAM Permissions Required

- `dynamodb:Query` on Farms table
- `dynamodb:Query` on SensorData table
- `lambda:InvokeFunction` on alert-create Lambda
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` for CloudWatch Logs

## Integration

### DynamoDB Stream Configuration

The Optimizations table must have DynamoDB Streams enabled with `NEW_IMAGE` view type:

```typescript
stream: dynamodb.StreamViewType.NEW_IMAGE
```

### Lambda Event Source Mapping

The Lambda function should be configured with an event source mapping to the Optimizations table stream:

```typescript
new lambda.EventSourceMapping(this, 'OptimizationsStreamMapping', {
  target: alertTriggerLambda,
  eventSourceArn: optimizationsTable.tableStreamArn,
  startingPosition: lambda.StartingPosition.LATEST,
  batchSize: 10,
  retryAttempts: 3,
});
```

## Alert Payload Structure

When triggering an alert, the function sends the following payload to alert-create Lambda:

```json
{
  "userId": "user-uuid",
  "farmId": "farm-uuid",
  "type": "resource_usage_water|resource_usage_fertilizer|resource_usage_energy",
  "severity": "medium|high|critical",
  "message": "Descriptive alert message with context",
  "metadata": {
    "optimizationId": "optimization-uuid",
    "resourceType": "water|fertilizer|energy",
    "currentUsage": 125,
    "optimalThreshold": 100,
    "warningThreshold": 120,
    "criticalThreshold": 150,
    "soilMoisture": 45,
    "recommendations": { ... }
  }
}
```

## Error Handling

- Errors processing individual records are logged but don't stop processing of other records
- Failed invocations can be retried via DLQ configuration
- All errors are logged to CloudWatch with full context

## Testing

To test the function:

1. Create an optimization record in the Optimizations table with resource usage exceeding thresholds
2. Verify the DynamoDB Stream triggers the Lambda
3. Check CloudWatch Logs for processing details
4. Verify alert-create Lambda was invoked with correct payload

## Custom Thresholds

Farms can have custom thresholds configured in the Farms table:

```json
{
  "farmId": "farm-uuid",
  "userId": "user-uuid",
  "thresholds": {
    "water": {
      "optimal": 80,
      "warning": 100,
      "critical": 130
    },
    "fertilizer": {
      "optimal": 40,
      "warning": 50,
      "critical": 65
    },
    "energy": {
      "optimal": 90,
      "warning": 110,
      "critical": 140
    }
  }
}
```

If custom thresholds are not configured, the function uses default thresholds.
