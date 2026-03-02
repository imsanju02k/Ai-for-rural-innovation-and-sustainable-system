# IoT Offline Detection Lambda

## Overview

This Lambda function runs on a scheduled basis to detect IoT devices that have gone offline. It monitors the last message timestamp for each device and triggers alerts when devices exceed the configured offline timeout threshold.

## Requirements

**Requirement 9.8**: WHEN a sensor goes offline, THE IoT_Gateway SHALL log the event and notify the user

## Functionality

### Core Features

1. **Device Status Monitoring**
   - Queries the SensorData table to find the last message timestamp for each device
   - Tracks all unique devices across all farms and users
   - Maintains device status based on recent activity

2. **Offline Detection**
   - Compares last message timestamps against configurable timeout threshold
   - Default timeout: 30 minutes (configurable via environment variable)
   - Identifies devices that have been offline beyond the threshold

3. **Event Logging**
   - Logs offline events to CloudWatch with full device details
   - Includes device ID, farm ID, user ID, sensor type, and offline duration
   - Provides structured logging for monitoring and debugging

4. **User Notifications**
   - Sends alerts to users when their devices go offline
   - Groups devices by user and farm for consolidated notifications
   - Includes offline duration and last seen timestamp in alerts
   - Adjusts alert severity based on number of offline devices

## Configuration

### Environment Variables

- `SENSOR_DATA_TABLE`: DynamoDB table name for sensor data (required)
- `ALERT_LAMBDA_ARN`: ARN of the alert Lambda function (required)
- `OFFLINE_TIMEOUT_MINUTES`: Timeout threshold in minutes (default: 30)
- `ENVIRONMENT`: Deployment environment (dev/staging/prod)

### Trigger

- **Type**: EventBridge scheduled rule
- **Frequency**: Every 5-15 minutes (configurable)
- **Recommended**: 10 minutes for balance between responsiveness and cost

### Lambda Configuration

- **Runtime**: Node.js 20.x
- **Memory**: 512 MB (handles scanning sensor data table)
- **Timeout**: 300 seconds (5 minutes)
- **Architecture**: ARM64 (Graviton2 for cost optimization)

## Implementation Details

### Device Status Tracking

The function scans the SensorData table to identify all unique devices and their last message timestamps. In production environments with high device counts, consider:

1. **Device Registry Table**: Maintain a separate table tracking device metadata and last seen timestamps
2. **Incremental Processing**: Use DynamoDB Streams to update device status in real-time
3. **Caching**: Cache device statuses in ElastiCache to reduce DynamoDB scans

### Offline Detection Logic

```typescript
const timeoutThreshold = now - OFFLINE_TIMEOUT_MINUTES * 60 * 1000;
if (lastMessageTime < timeoutThreshold) {
  // Device is offline
}
```

### Alert Grouping

Alerts are grouped by:
1. **User**: All offline devices for a user
2. **Farm**: Devices grouped by farm within user alerts
3. **Severity**: Based on number of offline devices
   - 1-2 devices: Medium severity
   - 3+ devices: High severity

## Alert Format

### Single Device Offline

```json
{
  "userId": "user-123",
  "farmId": "farm-456",
  "type": "device_offline",
  "severity": "medium",
  "message": "Sensor sensor-001 (soil_moisture) has gone offline. Last seen: 45 minutes ago. Duration: 45 minutes.",
  "metadata": {
    "offlineDevices": [
      {
        "deviceId": "sensor-001",
        "sensorType": "soil_moisture",
        "lastSeen": "2024-01-15T10:00:00Z",
        "offlineDurationMinutes": 45
      }
    ],
    "detectedAt": "2024-01-15T10:45:00Z",
    "offlineTimeoutMinutes": 30
  }
}
```

### Multiple Devices Offline

```json
{
  "userId": "user-123",
  "farmId": "farm-456",
  "type": "device_offline",
  "severity": "high",
  "message": "3 sensors have gone offline: sensor-001 (soil_moisture), sensor-002 (temperature), sensor-003 (humidity). Please check your devices.",
  "metadata": {
    "offlineDevices": [...],
    "detectedAt": "2024-01-15T10:45:00Z",
    "offlineTimeoutMinutes": 30
  }
}
```

## CloudWatch Logs

### Offline Detection Event

```json
{
  "level": "INFO",
  "message": "Device offline detected",
  "deviceId": "sensor-001",
  "farmId": "farm-456",
  "userId": "user-123",
  "sensorType": "soil_moisture",
  "lastSeen": "2024-01-15T10:00:00Z",
  "offlineDurationMinutes": 45,
  "timeoutThresholdMinutes": 30,
  "timestamp": "2024-01-15T10:45:00Z"
}
```

### Execution Summary

```json
{
  "level": "INFO",
  "message": "Device offline detection completed successfully",
  "totalDevices": 25,
  "offlineDevices": 3,
  "timestamp": "2024-01-15T10:45:30Z"
}
```

## Error Handling

- **DynamoDB Errors**: Logged and propagated to trigger Lambda retry
- **Alert Sending Errors**: Logged but don't block other alerts (Promise.allSettled)
- **Scan Pagination**: Handles large datasets with pagination
- **Timeout Protection**: 5-minute timeout prevents runaway executions

## Monitoring

### CloudWatch Metrics

Monitor these metrics:
- Lambda invocation count
- Lambda duration
- Lambda errors
- Number of offline devices detected per run
- Alert sending success/failure rate

### CloudWatch Alarms

Recommended alarms:
1. **High Error Rate**: Alert if error rate > 5% over 5 minutes
2. **Long Duration**: Alert if duration > 4 minutes (approaching timeout)
3. **Many Offline Devices**: Alert if > 10 devices offline (potential infrastructure issue)

## Performance Considerations

### Current Implementation

- **Scan Operation**: Scans entire SensorData table to find devices
- **Batch Size**: Processes 1000 items per scan iteration
- **Parallel Alerts**: Sends alerts in parallel using Promise.allSettled

### Optimization Opportunities

1. **Device Registry**: Maintain separate table with device metadata
2. **Stream Processing**: Use DynamoDB Streams for real-time status updates
3. **Caching**: Cache device statuses in ElastiCache
4. **Incremental Checks**: Only check devices that were recently online
5. **GSI**: Add GSI on timestamp for efficient "recent devices" queries

## Testing

### Unit Tests

```typescript
// Test offline detection logic
test('detects device offline when timestamp exceeds threshold', () => {
  const device = {
    deviceId: 'sensor-001',
    lastMessageTimestamp: '2024-01-15T09:00:00Z'
  };
  const now = new Date('2024-01-15T10:00:00Z');
  const timeout = 30; // minutes
  
  expect(isDeviceOffline(device, now, timeout)).toBe(true);
});
```

### Integration Tests

```typescript
// Test end-to-end offline detection
test('sends alert when device goes offline', async () => {
  // Setup: Insert old sensor reading
  await insertSensorReading({
    deviceId: 'test-sensor',
    timestamp: oldTimestamp
  });
  
  // Execute: Run offline detection
  await handler(scheduledEvent);
  
  // Verify: Alert was sent
  expect(mockLambdaInvoke).toHaveBeenCalledWith(
    expect.objectContaining({
      FunctionName: ALERT_LAMBDA_ARN
    })
  );
});
```

## Future Enhancements

1. **Device Status Table**: Dedicated table for device status tracking
2. **Real-time Detection**: Use DynamoDB Streams for immediate offline detection
3. **Configurable Timeouts**: Per-device or per-sensor-type timeout thresholds
4. **Auto-recovery Detection**: Detect when devices come back online
5. **Historical Tracking**: Track offline/online state transitions over time
6. **Predictive Alerts**: Warn users before devices are expected to go offline
7. **Batch Notifications**: Consolidate multiple offline events into digest emails
