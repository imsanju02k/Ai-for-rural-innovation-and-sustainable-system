# WebSocket API Implementation

This directory contains Lambda functions for the WebSocket API that enables real-time updates for sensor data and alerts.

## Architecture

The WebSocket API consists of four Lambda functions:

1. **Connect Handler** (`connect/`) - Handles new WebSocket connections
2. **Disconnect Handler** (`disconnect/`) - Handles connection closures
3. **Message Handler** (`message/`) - Handles subscribe/unsubscribe messages
4. **IoT Stream Handler** (`iot-stream/`) - Streams IoT data to connected clients

## Connection Flow

### 1. Client Connects

```javascript
const ws = new WebSocket('wss://ws.farmplatform.example.com/dev');
```

The connect handler stores the connection in DynamoDB with a pending farmId.

### 2. Client Subscribes

```javascript
ws.send(JSON.stringify({
  action: 'subscribe',
  farmId: 'farm-123',
  topics: ['sensors', 'alerts']
}));
```

The message handler updates the connection with the farmId and topics.

### 3. Data Streaming

When IoT data arrives or alerts are triggered, the IoT stream handler:
1. Queries DynamoDB for connections subscribed to the farmId
2. Sends the data to all connected clients

### 4. Client Disconnects

The disconnect handler removes the connection from DynamoDB.

## DynamoDB Schema

### Connections Table

```
connectionId (PK) | farmId (SK) | topics | subscribedAt | ttl
------------------|-------------|--------|--------------|----
conn-abc-123      | farm-123    | [...]  | 2024-01-15   | 1705334400
```

**GSI: FarmIdIndex**
- Partition Key: farmId
- Used to query all connections for a specific farm

## Message Format

### Incoming Messages (Client → Server)

**Subscribe:**
```json
{
  "action": "subscribe",
  "farmId": "farm-123",
  "topics": ["sensors", "alerts", "notifications"]
}
```

**Unsubscribe:**
```json
{
  "action": "unsubscribe",
  "farmId": "farm-123",
  "topics": ["sensors"]
}
```

### Outgoing Messages (Server → Client)

**Sensor Update:**
```json
{
  "type": "sensor_update",
  "payload": {
    "deviceId": "sensor-001",
    "sensorType": "soil_moisture",
    "value": 45.2,
    "unit": "percent",
    "timestamp": "2024-01-15T14:00:00Z"
  },
  "timestamp": "2024-01-15T14:00:01Z"
}
```

**Alert:**
```json
{
  "type": "alert",
  "payload": {
    "alertId": "alert-456",
    "severity": "high",
    "message": "Soil moisture below threshold",
    "timestamp": "2024-01-15T14:00:00Z"
  },
  "timestamp": "2024-01-15T14:00:01Z"
}
```

## Integration with IoT Core

The IoT stream handler can be triggered by:
1. IoT Rules Engine (when sensor data arrives)
2. EventBridge (when alerts are created)
3. Direct Lambda invocation

Example IoT Rule:
```sql
SELECT * FROM 'farm/+/sensors/#'
```

This rule forwards all sensor data to the IoT stream handler, which then broadcasts to connected WebSocket clients.

## Error Handling

- **Stale Connections**: If a client disconnects without sending a disconnect message, the connection will be removed when a message send fails with a 410 status
- **TTL**: Connections have a 24-hour TTL to automatically clean up stale entries
- **Reconnection**: Clients should implement exponential backoff for reconnection attempts

## Deployment

The WebSocket API is deployed as part of the WebSocketStack:

```bash
cdk deploy WebSocketStack --context environment=dev
```

## Testing

### Using wscat

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c wss://ws.farmplatform.example.com/dev

# Subscribe
> {"action":"subscribe","farmId":"farm-123","topics":["sensors","alerts"]}

# Wait for messages...

# Unsubscribe
> {"action":"unsubscribe","farmId":"farm-123","topics":["sensors"]}
```

### Using JavaScript

```javascript
const ws = new WebSocket('wss://ws.farmplatform.example.com/dev');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    action: 'subscribe',
    farmId: 'farm-123',
    topics: ['sensors', 'alerts']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

## Monitoring

CloudWatch metrics to monitor:
- Connection count (from DynamoDB table)
- Message send success/failure rate
- Lambda invocation count and duration
- API Gateway connection count

## Security

- Connections are authenticated via query string parameters (JWT token)
- Each connection is associated with a specific farmId
- Clients can only subscribe to their own farms
- Messages are only sent to authorized connections

## Scaling

- API Gateway WebSocket APIs support up to 100,000 concurrent connections
- Lambda functions scale automatically
- DynamoDB uses on-demand billing for automatic scaling
- Consider using Lambda reserved concurrency for production workloads
