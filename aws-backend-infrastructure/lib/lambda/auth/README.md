# Authentication Lambda Functions

## Overview

This directory contains Lambda functions for user authentication and authorization using AWS Cognito.

## Functions

### 1. Register (`register/`)
Handles new user registration with email verification.

**Endpoint**: `POST /auth/register`

**Features**:
- Email and password validation
- Password strength enforcement
- Cognito user creation
- DynamoDB metadata storage
- Automatic verification email

### 2. Login (`login/`)
Authenticates users and returns JWT tokens.

**Endpoint**: `POST /auth/login`

**Features**:
- Credential validation
- JWT token generation
- User metadata retrieval
- Role-based access control

### 3. Refresh (`refresh/`)
Refreshes expired access tokens using refresh tokens.

**Endpoint**: `POST /auth/refresh`

**Features**:
- Token refresh without re-authentication
- Maintains user sessions
- Secure token rotation

### 4. Authorizer (`authorizer/`)
API Gateway Lambda authorizer for request validation.

**Type**: Token-based authorizer

**Features**:
- JWT signature verification
- Token expiration checking
- User claim extraction
- IAM policy generation

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Register/Login/Refresh
       ▼
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
         │ 2. Invoke Lambda
         ▼
┌──────────────────┐      ┌──────────────┐
│  Auth Lambda     │─────▶│   Cognito    │
│  (register/      │      │  User Pool   │
│   login/refresh) │◀─────│              │
└────────┬─────────┘      └──────────────┘
         │
         │ 3. Store/Retrieve metadata
         ▼
┌──────────────────┐
│    DynamoDB      │
│  (Users table)   │
└──────────────────┘
```

## Authentication Flow

### Registration Flow
1. Client sends registration data
2. Lambda validates input
3. Lambda creates user in Cognito
4. Cognito sends verification email
5. Lambda stores metadata in DynamoDB
6. Lambda returns success response

### Login Flow
1. Client sends credentials
2. Lambda validates input
3. Lambda authenticates with Cognito
4. Cognito returns JWT tokens
5. Lambda retrieves user metadata
6. Lambda returns tokens and user info

### Token Refresh Flow
1. Client sends refresh token
2. Lambda validates token format
3. Lambda calls Cognito refresh
4. Cognito returns new access token
5. Lambda returns new tokens

### Authorization Flow (API Requests)
1. Client includes access token in Authorization header
2. API Gateway invokes authorizer Lambda
3. Authorizer verifies JWT signature
4. Authorizer extracts user claims
5. Authorizer generates IAM policy
6. API Gateway allows/denies request

## Environment Variables

All auth Lambda functions require:

- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `USERS_TABLE`: DynamoDB Users table name
- `AWS_REGION`: AWS region (auto-set by Lambda)

## Shared Dependencies

All functions use shared utilities from `lib/lambda/shared/`:

- `utils/response.ts`: Standardized API responses
- `utils/validation.ts`: Input validation functions
- `utils/dynamodb.ts`: DynamoDB helper functions
- `models/user.ts`: User data models

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Security
- Access tokens expire in 1 hour (configurable)
- Refresh tokens expire in 7 days (configurable)
- Tokens are signed by Cognito
- JWT verification includes signature and expiration

### Error Handling
- Generic error messages for authentication failures
- No information disclosure about user existence
- Rate limiting via Cognito
- Comprehensive error logging

## Role-Based Access Control

Users are assigned roles stored in Cognito custom attributes:

- `farmer`: Default role for farm owners
- `advisor`: Agricultural advisors
- `admin`: System administrators

Roles are included in JWT tokens and can be used for authorization in downstream services.

## Testing

Each Lambda function should be tested for:

1. **Valid inputs**: Successful operations
2. **Invalid inputs**: Proper error handling
3. **Edge cases**: Empty strings, special characters, etc.
4. **Security**: Password requirements, token validation
5. **Error scenarios**: Cognito errors, DynamoDB errors

See individual function README files for specific test cases.

## Deployment

These functions are deployed via CDK in the `ComputeStack`:

```typescript
const registerFunction = new lambda.Function(this, 'AuthRegister', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lib/lambda/auth/register'),
  environment: {
    USER_POOL_ID: userPool.userPoolId,
    USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
    USERS_TABLE: usersTable.tableName,
  },
});
```

## Monitoring

Key metrics to monitor:

- Invocation count
- Error rate
- Duration (p50, p95, p99)
- Cognito API errors
- DynamoDB throttling

CloudWatch alarms should be configured for:
- Error rate > 5%
- Duration > 10 seconds
- Cognito rate limiting

## Troubleshooting

### Common Issues

**"Email already registered"**
- User already exists in Cognito
- Check Cognito console for user status

**"Account not verified"**
- User hasn't clicked verification email
- Resend verification or manually confirm in Cognito

**"Invalid credentials"**
- Wrong password or user doesn't exist
- Check CloudWatch logs for specific error

**"Token expired"**
- Access token has expired
- Use refresh token to get new access token

**"Invalid refresh token"**
- Refresh token expired or revoked
- User must log in again

## References

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [API Gateway Lambda Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
