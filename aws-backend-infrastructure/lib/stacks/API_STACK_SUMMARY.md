# API Gateway Stack Implementation Summary

## Overview

The API Gateway stack (`api-stack.ts`) provides a complete REST API infrastructure for the AI Rural Innovation Platform. It serves as the single entry point for all HTTP requests from the frontend application.

## Features Implemented

### 1. REST API Configuration
- **Regional endpoint** for optimal performance
- **CORS configuration** for frontend domain integration
- **CloudWatch logging** for request/response tracking
- **Metrics enabled** for monitoring
- **Throttling** configured at 1000 requests/minute per user

### 2. Lambda Authorizer Integration
- JWT token validation using custom Lambda authorizer
- 5-minute authorization result caching
- Token source from Authorization header
- Automatic authorization for protected endpoints

### 3. Request Validation
- Request body validation
- Request parameter validation
- Schema-based validation for POST/PUT endpoints

### 4. API Endpoints

#### Authentication Endpoints (Public)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh

#### Farm Management Endpoints (Authorized)
- `POST /farms` - Create farm
- `GET /farms` - List user farms
- `GET /farms/{farmId}` - Get farm details
- `PUT /farms/{farmId}` - Update farm
- `DELETE /farms/{farmId}` - Delete farm

#### Image Processing Endpoints (Authorized)
- `POST /images/upload-url` - Generate pre-signed upload URL
- `GET /images/{imageId}/download-url` - Generate pre-signed download URL

#### Disease Detection Endpoints (Authorized)
- `POST /disease-detection/analyze` - Analyze crop disease
- `GET /disease-detection/history` - Get analysis history

#### Market Prices Endpoints (Authorized)
- `GET /market-prices` - Get all market prices
- `GET /market-prices/{commodity}` - Get commodity-specific prices
- `POST /market-prices/predict` - Predict future prices

#### Optimization Endpoints (Authorized)
- `POST /optimization/calculate` - Calculate resource optimization
- `GET /optimization/history` - Get optimization history

#### Advisory Chatbot Endpoints (Authorized)
- `POST /advisory/chat` - Send chat message
- `GET /advisory/history` - Get chat history

#### IoT Sensor Data Endpoints (Authorized)
- `GET /sensors/data` - Query sensor data
- `GET /sensors/data/{deviceId}` - Get device-specific data

#### Alerts Endpoints (Authorized)
- `GET /alerts` - List alerts
- `PUT /alerts/{alertId}/acknowledge` - Acknowledge alert

### 5. Rate Limiting and Usage Plans
- Default usage plan with 1000 requests/minute rate limit
- 2000 burst limit for traffic spikes
- 100,000 requests per day quota
- Associated with API deployment stage

### 6. CloudWatch Integration
- Access logs in JSON format with standard fields
- Request/response logging
- Error tracking
- Performance metrics

## Stack Dependencies

The API Stack depends on:
1. **AuthStack** - Provides Lambda authorizer function
2. **ComputeStack** - Provides all Lambda function handlers

## CloudFormation Outputs

- `ApiEndpoint` - Full API Gateway URL
- `ApiId` - REST API identifier
- `ApiStage` - Deployment stage name

## Requirements Validated

- ✅ Requirement 1.1: RESTful endpoints for all platform features
- ✅ Requirement 1.3: CORS configuration for frontend domain
- ✅ Requirement 1.4: Request payload validation
- ✅ Requirement 1.6: Rate limiting (1000 requests/minute per user)
- ✅ Requirement 1.7: Request/response logging to CloudWatch
- ✅ Requirement 2.7: JWT token authorization for protected endpoints
- ✅ Requirement 2.8: Invalid token rejection with 401 status

## Integration with Compute Stack

The API Stack receives Lambda function references from the Compute Stack:
- Authentication functions (register, login, refresh)
- Farm management functions (CRUD operations)
- Image processing functions (upload/download URLs)
- Disease detection functions (analyze, history)
- Market price functions (get, predict)
- Optimization functions (calculate, history)
- Advisory chatbot functions (chat, history)
- IoT query functions (sensor data)
- Alert functions (list, acknowledge)

## Usage

The API Stack is instantiated in `bin/app.ts` with all required Lambda function references:

```typescript
const apiStack = new APIStack(
    app,
    getStackName(config.environment, 'APIStack'),
    config,
    {
        ...stackProps,
        authorizerFunction: authStack.authorizerFunction,
        // ... all Lambda function references
    }
);
```

## Deployment

Deploy the API Stack along with its dependencies:

```bash
# Deploy all stacks
cdk deploy --all --context environment=dev

# Deploy API Stack only (after dependencies)
cdk deploy APIStack --context environment=dev
```

## Testing

After deployment, test the API endpoints:

```bash
# Get API endpoint from outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name dev-APIStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Test public endpoint (no auth)
curl -X POST $API_ENDPOINT/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Test protected endpoint (with auth)
curl -X GET $API_ENDPOINT/farms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

1. Deploy the stack to development environment
2. Test all API endpoints
3. Configure custom domain name (optional)
4. Set up AWS WAF for additional security (optional)
5. Configure API Gateway caching for frequently accessed endpoints
6. Set up CloudWatch alarms for error rates and latency
