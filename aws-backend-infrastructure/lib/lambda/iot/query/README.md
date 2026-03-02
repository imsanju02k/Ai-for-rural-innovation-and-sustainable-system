# IoT Query Lambda Function

## Overview

The `iot-query` Lambda function provides API endpoints for querying historical sensor data from IoT devices. It supports flexible querying with filters for sensor type, date range, and aggregation level.

**Requirements**: 9.3

## Features

- Query sensor data by farmId
- Filter by sensor type (soil_moisture, temperature, humidity, ph, light_intensity)
- Filter by date range (startDate, endDate)
- Support multiple aggregation levels:
  - `raw`: Raw sensor readings from SensorData table
  - `hourly`: Hourly aggregated data from SensorAggregates table
  - `daily`: Daily aggregated data from SensorAggregates table
- Query specific device information by deviceId
- Return device statistics (min, max, avg) for last 24 hours

## API Endpoints

### Query Sensor Data

**GET /sensors/data**

Query sensor data with filters.

**Query Parameters:**
- `farmId` (required): Farm identifier
- `sensorType` (optional): Type of sensor (soil_moisture, temperature, humidity, ph, light_intensity)
- `startDate` (optional): Start date in ISO 8601 format
- `endDate` (optional): End date in ISO 8601 format
- `aggregation` (optional): Aggregation level (raw, hourly, daily) - default: raw
- `deviceId` (optional): Filter by specific device

**Example Request:**
```
GET /sensors/data?farmId=farm-123&sensorType=soil_moisture&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z&aggregation=daily
```

**Example Response:**
```json
{
  "data": [
    {
      "farmIdSensorType": "farm-123#soil_moisture",
      "period": "2024-01-15",
      "farmId": "farm-123",
      "sensorType": "soil_moisture",
      "aggregation": {
        "min": 32.5,
        "max": 68.2,
        "avg": 45.8,
        "count": 96
      },
      "unit": "percent",
      "timestamp": "2024-01-15T23:59:59Z"
    }
  ],
  "count": 31,
  "aggregation": "daily",
  "filters": {
    "farmId": "farm-123",
    "sensorType": "soil_moisture",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }
}
```

### Query Device Information

**GET /sensors/data/{deviceId}**

Get detailed information about a specific device including recent readings and statistics.

**Path Parameters:**
- `deviceId` (required): Device identifier

**Example Request:**
```
GET /sensors/data/sensor-001
```

**Example Response:**
```json
{
  "deviceId": "sensor-001",
  "farmId": "farm-123",
  "sensorType": "soil_moisture",
  "status": "active",
  "lastReading": {
    "value": 45.2,
    "unit": "percent",
    "timestamp": "2024-01-15T14:00:00Z"
  },
  "statistics": {
    "min": 32.1,
    "max": 58.3,
    "avg": 44.7,
    "period": "24h"
  }
}
```

## Environment Variables

- `SENSOR_DATA_TABLE`: DynamoDB table name for raw sensor data
- `SENSOR_AGGREGATES_TABLE`: DynamoDB table name for aggregated sensor data

## Data Models

### Raw Sensor Reading
```typescript
{
  deviceId: string;
  timestamp: string;
  farmId: string;
  sensorType: string;
  value: number;
  unit: string;
}
```

### Aggregate Reading
```typescript
{
  farmIdSensorType: string;
  period: string;
  farmId: string;
  sensorType: string;
  aggregation: {
    min: number;
    max: number;
    avg: number;
    count: number;
  };
  unit: string;
  timestamp: string;
}
```

## DynamoDB Queries

### Raw Data Query
- Uses `FarmIdSensorTypeIndex` GSI when sensorType is specified
- Uses `FarmIdIndex` GSI when querying all sensor types
- Supports date range filtering on timestamp
- Returns up to 1000 most recent readings

### Aggregated Data Query
- Queries `SensorAggregates` table by `farmIdSensorType` partition key
- Filters by period range based on aggregation level
- Requires `sensorType` parameter for efficient querying

## Error Handling

### 400 Bad Request
- Missing required `farmId` parameter
- Invalid date format
- `startDate` is after `endDate`

### 404 Not Found
- Device not found or no recent data

### 500 Internal Server Error
- DynamoDB query errors
- Unexpected errors

## Performance Considerations

- Queries are limited to 1000 items to prevent large responses
- Results are sorted by timestamp descending (most recent first)
- Aggregated queries are more efficient for large date ranges
- Device-specific queries only fetch last 24 hours of data

## Testing

Run unit tests:
```bash
npm test
```

## Deployment

This Lambda function is deployed as part of the IoT infrastructure stack and requires:
- DynamoDB tables: SensorData and SensorAggregates
- API Gateway integration
- IAM role with DynamoDB read permissions

## Related Functions

- `iot-ingest`: Ingests sensor data from IoT devices
- `iot-aggregate`: Aggregates sensor data into hourly/daily summaries
