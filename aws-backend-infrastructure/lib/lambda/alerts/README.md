# Alert Lambda Functions

This directory contains Lambda functions for managing alerts in the AWS Backend Infrastructure.

## Functions

### 1. alert-create (`create/`)

Creates new alerts and sends notifications via SNS and SES.

**Endpoint**: Internal (called by other Lambda functions or API)

**Features**:
- Validates alert input (userId, farmId, type, severity, message)
- Generates unique alertId
- Stores alert in Alerts DynamoDB table
- Publishes alert to SNS topic for notifications
- Sends email via SES for critical alerts
- Returns created alert object

**Environment Variables**:
- `ALERTS_TABLE`: DynamoDB table name for alerts
- `SNS_TOPIC_ARN`: SNS topic ARN for alert notifications
- `SES_FROM_EMAIL`: Email address for sending SES notifications
- `SES_ENABLED`: Enable/disable SES email notifications (true/false)

**Request Body**:
```json
{
  "userId": "uuid-v4",
  "farmId": "uuid-v4",
  "type": "soil_moisture_low",
  "severity": "high",
  "message": "Soil moisture has dropped below 30% in Field A",
  "metadata": {
    "sensorId": "sensor-001",
    "currentValue": 28.5,
    "threshold": 30
  }
}
```

**Response** (201 Created):
```json
{
  "alertId": "uuid-v4",
  "userId": "uuid-v4",
  "farmId": "uuid-v4",
  "type": "soil_moisture_low",
  "severity": "high",
  "message": "Soil moisture has dropped below 30% in Field A",
  "status": "active",
  "metadata": {...},
  "createdAt": "2024-01-15T15:00:00Z",
  "acknowledgedAt": null,
  "acknowledgedBy": null,
  "note": null,
  "resolvedAt": null
}
```

### 2. alert-list (`list/`)

Lists alerts with filtering and pagination support.

**Endpoint**: `GET /alerts`

**Features**:
- Queries alerts by userId (authenticated user)
- Supports filtering by farmId, severity, and status
- Supports pagination with configurable limit
- Returns list of alerts sorted by creation time (most recent first)

**Environment Variables**:
- `ALERTS_TABLE`: DynamoDB table name for alerts

**Query Parameters**:
- `farmId` (optional): Filter by farm ID
- `severity` (optional): Filter by severity (low, medium, high, critical)
- `status` (optional): Filter by status (active, acknowledged, resolved)
- `limit` (optional): Number of results (1-100, default: 20)

**Response** (200 OK):
```json
{
  "alerts": [
    {
      "alertId": "uuid-v4",
      "farmId": "uuid-v4",
      "type": "soil_moisture_low",
      "severity": "high",
      "message": "Soil moisture has dropped below 30% in Field A",
      "status": "active",
      "createdAt": "2024-01-15T15:00:00Z"
    }
  ],
  "count": 3,
  "nextToken": "..."
}
```

### 3. alert-acknowledge (`acknowledge/`)

Acknowledges an alert and updates its status.

**Endpoint**: `PUT /alerts/{alertId}/acknowledge`

**Features**:
- Validates alertId parameter
- Verifies user ownership of the alert
- Updates alert status to "acknowledged"
- Stores acknowledgment note and timestamp
- Returns updated alert object

**Environment Variables**:
- `ALERTS_TABLE`: DynamoDB table name for alerts

**Path Parameters**:
- `alertId`: UUID of the alert to acknowledge

**Request Body**:
```json
{
  "note": "Irrigation scheduled for tomorrow morning"
}
```

**Response** (200 OK):
```json
{
  "alertId": "uuid-v4",
  "status": "acknowledged",
  "acknowledgedAt": "2024-01-15T15:30:00Z",
  "acknowledgedBy": "uuid-v4",
  "note": "Irrigation scheduled for tomorrow morning"
}
```

## DynamoDB Table Schema

**Table Name**: `{env}-alerts`

**Primary Key**:
- Partition Key: `userId` (String)
- Sort Key: `createdAt` (String)

**Attributes**:
- `alertId`: String (UUID)
- `userId`: String (UUID)
- `farmId`: String (UUID)
- `type`: String
- `severity`: String (low|medium|high|critical)
- `message`: String
- `status`: String (active|acknowledged|resolved)
- `metadata`: Map (optional)
- `createdAt`: String (ISO 8601)
- `acknowledgedAt`: String (ISO 8601, nullable)
- `acknowledgedBy`: String (UUID, nullable)
- `note`: String (nullable)
- `resolvedAt`: String (ISO 8601, nullable)

**Global Secondary Indexes**:
- **GSI-1**: `farmId` (PK), `createdAt` (SK) - Query alerts by farm
- **GSI-2**: `status` (PK), `createdAt` (SK) - Query active/unacknowledged alerts

## Integration with Other Services

### SNS Integration

The `alert-create` function publishes alerts to an SNS topic for fan-out notifications:

```typescript
await snsClient.send(
  new PublishCommand({
    TopicArn: SNS_TOPIC_ARN,
    Message: JSON.stringify(alertData),
    Subject: `Farm Alert: ${severity.toUpperCase()} - ${type}`,
    MessageAttributes: {
      severity: { DataType: 'String', StringValue: severity },
      alertType: { DataType: 'String', StringValue: type }
    }
  })
);
```

### SES Integration

For critical alerts, the `alert-create` function sends email notifications:

```typescript
if (severity === 'critical' && SES_ENABLED) {
  await sesClient.send(
    new SendEmailCommand({
      Source: SES_FROM_EMAIL,
      Destination: { ToAddresses: [userEmail] },
      Message: {
        Subject: { Data: `CRITICAL ALERT: ${type}` },
        Body: { Text: { Data: alertMessage } }
      }
    })
  );
}
```

## Error Handling

All functions implement comprehensive error handling:

- **400 Bad Request**: Invalid input data or parameters
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Alert not found
- **500 Internal Server Error**: Unexpected errors

Errors are logged with context for debugging:

```typescript
console.error('Error creating alert', {
  error: error.message,
  requestId,
  userId,
  farmId
});
```

## Usage Examples

### Creating an Alert (Internal)

```typescript
// Called by IoT ingest Lambda when threshold exceeded
const alert = await createAlert({
  userId: 'user-123',
  farmId: 'farm-456',
  type: 'soil_moisture_low',
  severity: 'high',
  message: 'Soil moisture below threshold',
  metadata: {
    sensorId: 'sensor-001',
    currentValue: 28.5,
    threshold: 30
  }
});
```

### Listing Alerts (API)

```bash
# List all alerts for authenticated user
GET /alerts

# Filter by farm
GET /alerts?farmId=farm-456

# Filter by severity
GET /alerts?severity=high

# Filter by status
GET /alerts?status=active

# Combine filters with pagination
GET /alerts?farmId=farm-456&severity=high&limit=10
```

### Acknowledging an Alert (API)

```bash
PUT /alerts/{alertId}/acknowledge
Content-Type: application/json

{
  "note": "Irrigation scheduled for tomorrow morning"
}
```

## Testing

Each function includes unit tests:

```bash
# Run tests for all alert functions
cd alerts/create && npm test
cd alerts/list && npm test
cd alerts/acknowledge && npm test
```

## Requirements Mapping

- **Requirement 8.9**: Resource optimization alerts when thresholds exceeded
- **Requirement 9.5**: IoT sensor threshold alerts
- **Requirement 10.9**: SNS alerting for critical errors

## Related Components

- **IoT Ingest Lambda**: Triggers alert creation when sensor thresholds exceeded
- **Optimization Lambda**: Triggers alerts for resource optimization recommendations
- **SNS Topic**: Receives alert notifications for fan-out
- **SES**: Sends email notifications for critical alerts
- **Alerts DynamoDB Table**: Stores alert data
