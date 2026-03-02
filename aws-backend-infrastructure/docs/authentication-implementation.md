# Authentication Infrastructure Implementation

## Overview

This document describes the authentication infrastructure implemented for the AWS Backend Infrastructure project. The implementation includes Cognito User Pool, Identity Pool, and Lambda authorizer for API Gateway.

## Components Implemented

### 1. AuthStack (lib/stacks/auth-stack.ts)

The AuthStack creates all authentication-related resources:

#### Cognito User Pool
- **Email sign-in**: Users authenticate with email addresses (Requirement 2.1)
- **Password policy**: Enforces minimum 8 characters, uppercase, lowercase, number, and special character (Requirement 2.2)
- **Email verification**: Automatic email verification with verification codes (Requirement 2.3)
- **Token expiration**: Access tokens valid for 24 hours (Requirement 2.4)
- **Custom attributes**: Role attribute for role-based access control (Requirement 2.9)
- **MFA support**: Configurable MFA (OFF, OPTIONAL, REQUIRED)
- **Advanced security**: Optional advanced security features (audit/enforced mode)

#### User Pool Client
- **Auth flows**: User password and SRP authentication
- **OAuth configuration**: Authorization code grant flow
- **Token validity**: 
  - Access tokens: 24 hours
  - ID tokens: 24 hours
  - Refresh tokens: 30 days
- **Callback URLs**: Configured for localhost and production domains
- **Token revocation**: Enabled for security

#### Cognito Identity Pool
- **Authenticated access**: Links to User Pool for authenticated users (Requirement 2.10)
- **IAM roles**: Separate roles for authenticated and unauthenticated users
- **S3 access**: Authenticated users can access their own S3 prefix
- **API Gateway access**: Authenticated users can invoke API endpoints

### 2. Lambda Authorizer (lib/lambda/auth/authorizer/)

The Lambda authorizer validates JWT tokens and returns IAM policies:

#### Features
- **JWT validation**: Verifies token signature and expiration using aws-jwt-verify library
- **User claims extraction**: Extracts userId, username, and role from token
- **IAM policy generation**: Returns Allow/Deny policies for API Gateway (Requirement 2.7)
- **Error handling**: Returns 401 for invalid/expired tokens (Requirement 2.8)
- **Logging**: Structured logging for debugging and monitoring

#### Environment Variables
- `USER_POOL_ID`: Cognito User Pool ID
- `CLIENT_ID`: User Pool Client ID
- `REGION`: AWS Region
- `LOG_LEVEL`: Logging level

### 3. Lambda Authorizer Construct (lib/constructs/lambda-authorizer.ts)

Reusable CDK construct for creating the Lambda authorizer:

#### Configuration
- **Runtime**: Node.js 20.x
- **Memory**: 256 MB
- **Timeout**: 10 seconds
- **Architecture**: ARM64 or x86_64 (configurable)
- **Tracing**: X-Ray enabled
- **Log retention**: 1 week

## CloudFormation Outputs

The AuthStack exports the following outputs:

- `UserPoolId`: Cognito User Pool ID
- `UserPoolArn`: Cognito User Pool ARN
- `UserPoolClientId`: User Pool Client ID for frontend
- `IdentityPoolId`: Identity Pool ID
- `AuthenticatedRoleArn`: IAM role ARN for authenticated users
- `UnauthenticatedRoleArn`: IAM role ARN for unauthenticated users
- `AuthorizerFunctionArn`: Lambda authorizer function ARN

## Integration with Frontend

The frontend application (React) should use AWS Amplify SDK to integrate with Cognito:

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'us-east-1',
    userPoolId: '<USER_POOL_ID>',
    userPoolWebClientId: '<CLIENT_ID>',
    identityPoolId: '<IDENTITY_POOL_ID>',
  },
});
```

## Security Features

1. **Password Policy**: Strong password requirements enforced
2. **Email Verification**: Users must verify email before accessing resources
3. **Token Expiration**: Short-lived access tokens (24 hours)
4. **Least Privilege**: IAM roles follow principle of least privilege
5. **S3 Access Control**: Users can only access their own S3 prefix
6. **Token Revocation**: Tokens can be revoked if compromised
7. **Advanced Security**: Optional protection against compromised credentials

## Requirements Satisfied

- ✅ 2.1: Auth_Service SHALL support user registration with email and password
- ✅ 2.2: Auth_Service SHALL enforce password requirements
- ✅ 2.3: Auth_Service SHALL send verification email
- ✅ 2.4: JWT tokens SHALL be valid for 24 hours
- ✅ 2.7: Backend_API SHALL authorize requests with valid JWT tokens
- ✅ 2.8: Backend_API SHALL return 401 for invalid/expired tokens
- ✅ 2.9: Auth_Service SHALL support role-based access control
- ✅ 2.10: Auth_Service SHALL integrate with Frontend_Client using AWS Amplify SDK

## Deployment

The AuthStack is automatically deployed when running:

```bash
cdk deploy dev-AuthStack --context environment=dev
```

## Testing

To test the authentication flow:

1. Register a new user via Cognito
2. Verify email address
3. Login to get JWT tokens
4. Use access token in Authorization header: `Bearer <token>`
5. Lambda authorizer validates token and grants access

## Next Steps

1. Implement authentication Lambda functions (register, login, refresh)
2. Create API Gateway stack with authorizer integration
3. Add unit tests for Lambda authorizer
4. Add integration tests for authentication flow
