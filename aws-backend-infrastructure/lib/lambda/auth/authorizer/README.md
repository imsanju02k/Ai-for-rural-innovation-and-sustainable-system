# Lambda Authorizer

This Lambda function validates JWT tokens from Cognito User Pool and returns IAM policies for API Gateway.

## Setup

Before deploying, install dependencies:

```bash
cd lib/lambda/auth/authorizer
npm install
```

## Environment Variables

- `USER_POOL_ID`: Cognito User Pool ID
- `CLIENT_ID`: Cognito User Pool Client ID
- `REGION`: AWS Region
- `LOG_LEVEL`: Logging level (info, debug, error)

## Requirements

- Requirements 2.7: Backend_API SHALL authorize requests with valid JWT tokens
- Requirements 2.8: Backend_API SHALL return 401 for invalid/expired tokens
