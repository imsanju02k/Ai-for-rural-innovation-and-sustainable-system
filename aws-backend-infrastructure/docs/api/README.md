# API Documentation

Complete API documentation for the AI Rural Innovation Platform backend infrastructure.

## Overview

The API provides RESTful endpoints for:
- User authentication and authorization
- Farm management
- AI-powered disease detection
- Market price data and predictions
- Resource optimization recommendations
- Advisory chatbot
- IoT sensor data management
- Alert notifications

## Base URLs

- **Production**: `https://api.farmplatform.example.com`
- **Staging**: `https://api-staging.farmplatform.example.com`
- **Development**: `https://api-dev.farmplatform.example.com`

## Authentication

All API endpoints (except `/auth/register` and `/auth/login`) require authentication using JWT Bearer tokens.

### Getting a Token

1. Register a new user or login with existing credentials
2. Include the `accessToken` in the `Authorization` header for all subsequent requests

```bash
Authorization: Bearer <your-access-token>
```

### Token Expiration

- Access tokens expire after 24 hours
- Use the `/auth/refresh` endpoint with your refresh token to get a new access token

## Error Handling

All errors follow a standardized format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "fieldName",
      "constraint": "Validation constraint"
    },
    "requestId": "uuid",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description | Retry |
|------|-------------|-------------|-------|
| `VALIDATION_ERROR` | 400 | Invalid input parameters | No |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication | No |
| `FORBIDDEN` | 403 | Insufficient permissions | No |
| `NOT_FOUND` | 404 | Resource does not exist | No |
| `CONFLICT` | 409 | Resource already exists | No |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Yes (after delay) |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Yes |
| `SERVICE_UNAVAILABLE` | 503 | External service unavailable | Yes |
| `GATEWAY_TIMEOUT` | 504 | Request timeout | Yes |

## Rate Limiting

- **Rate Limit**: 1000 requests per minute per user
- **Headers**: Rate limit information is included in response headers
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## Documentation Formats

### OpenAPI/Swagger

- **YAML**: `openapi.yaml`
- **JSON**: `openapi.json`
- **Interactive**: Import into [Swagger Editor](https://editor.swagger.io/) or [Swagger UI](https://swagger.io/tools/swagger-ui/)

### Postman Collection

- **File**: `postman-collection.json`
- **Import**: File → Import → Upload the JSON file
- **Variables**: Set `baseUrl` and `accessToken` in collection variables

## Quick Start

### 1. Register a User

```bash
curl -X POST https://api-dev.farmplatform.example.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "SecurePass123!",
    "name": "John Farmer",
    "role": "farmer"
  }'
```

### 2. Login

```bash
curl -X POST https://api-dev.farmplatform.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "userId": "uuid-v4",
  "role": "farmer"
}
```

### 3. Create a Farm

```bash
curl -X POST https://api-dev.farmplatform.example.com/farms \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Green Valley Farm",
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "Village Rampur, District Meerut, UP"
    },
    "cropTypes": ["wheat", "rice"],
    "acreage": 15.5,
    "soilType": "loamy"
  }'
```

### 4. Upload and Analyze Disease Image

```bash
# Step 1: Get upload URL
curl -X POST https://api-dev.farmplatform.example.com/images/upload-url \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "farmId": "<farm-id>",
    "fileName": "crop_disease.jpg",
    "contentType": "image/jpeg"
  }'

# Step 2: Upload image to pre-signed URL
curl -X PUT "<pre-signed-url>" \
  --upload-file crop_disease.jpg \
  -H "Content-Type: image/jpeg"

# Step 3: Analyze image
curl -X POST https://api-dev.farmplatform.example.com/disease-detection/analyze \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "<image-id>",
    "farmId": "<farm-id>",
    "cropType": "wheat"
  }'
```

### 5. Get Market Prices

```bash
curl -X GET "https://api-dev.farmplatform.example.com/market-prices?commodity=wheat" \
  -H "Authorization: Bearer <your-access-token>"
```

### 6. Chat with Advisory Bot

```bash
curl -X POST https://api-dev.farmplatform.example.com/advisory/chat \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the best time to plant wheat?",
    "farmId": "<farm-id>",
    "includeContext": true
  }'
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT tokens
- `POST /auth/refresh` - Refresh access token

### Farms

- `GET /farms` - List all farms
- `POST /farms` - Create a new farm
- `GET /farms/{farmId}` - Get farm details
- `PUT /farms/{farmId}` - Update farm
- `DELETE /farms/{farmId}` - Delete farm

### Disease Detection

- `POST /images/upload-url` - Get pre-signed upload URL
- `POST /disease-detection/analyze` - Analyze image for diseases
- `GET /disease-detection/history` - Get analysis history

### Market Prices

- `GET /market-prices` - Get market prices
- `GET /market-prices/{commodity}` - Get commodity-specific prices

### Resource Optimization

- `POST /optimization/calculate` - Calculate optimization recommendations
- `GET /optimization/history` - Get optimization history

### Advisory Chat

- `POST /advisory/chat` - Send message to chatbot
- `GET /advisory/history` - Get chat history

### IoT Sensors

- `GET /sensors/data` - Get sensor data
- `GET /sensors/data/{deviceId}` - Get device-specific data

### Alerts

- `GET /alerts` - List alerts
- `PUT /alerts/{alertId}/acknowledge` - Acknowledge alert

## WebSocket API

For real-time updates (sensor data, alerts), connect to the WebSocket endpoint:

```javascript
const ws = new WebSocket('wss://ws.farmplatform.example.com');

ws.onopen = () => {
  // Subscribe to topics
  ws.send(JSON.stringify({
    action: 'subscribe',
    farmId: '<farm-id>',
    topics: ['sensors', 'alerts']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## SDKs and Client Libraries

### TypeScript/JavaScript

Use the generated TypeScript types for type-safe API calls:

```typescript
import { Farm, CreateFarmRequest } from '@ai-rural-platform/types';

async function createFarm(data: CreateFarmRequest): Promise<Farm> {
  const response = await fetch('/api/farms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

### AWS Amplify

Use the generated Amplify configuration:

```typescript
import { Amplify } from 'aws-amplify';
import { amplifyConfig } from './amplify-config';

Amplify.configure(amplifyConfig);

// Use Amplify Auth, API, and Storage
import { signIn, signOut } from 'aws-amplify/auth';
import { get, post } from 'aws-amplify/api';
```

## Support

For API support, please contact:
- Email: support@farmplatform.example.com
- Documentation: https://docs.farmplatform.example.com

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Authentication endpoints
- Farm management
- Disease detection
- Market prices
- Resource optimization
- Advisory chatbot
- IoT sensor integration
- Alert management
