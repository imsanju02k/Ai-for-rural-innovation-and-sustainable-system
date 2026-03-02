# Auth Login Lambda

## Overview

Handles user authentication with AWS Cognito and returns JWT tokens.

## Requirements

- **2.4**: Return JWT token valid for 24 hours on successful login
- **2.5**: Return 401 status code for invalid credentials

## Environment Variables

- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `USERS_TABLE`: DynamoDB Users table name

## Request Format

```json
{
  "email": "farmer@example.com",
  "password": "SecurePass123!"
}
```

### Fields

- `email` (required): User's email address
- `password` (required): User's password

## Response Format

### Success (200 OK)

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "idToken": "eyJhbGc...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "role": "farmer",
  "name": "John Farmer",
  "email": "farmer@example.com"
}
```

### Token Details

- `accessToken`: Used for API authorization (expires in 1 hour by default)
- `refreshToken`: Used to obtain new access tokens (expires in 7 days)
- `idToken`: Contains user identity claims
- `expiresIn`: Token expiration time in seconds

### Error Responses

- **400 Bad Request**: Invalid email format or missing fields
- **401 Unauthorized**: Invalid credentials or too many attempts
- **403 Forbidden**: Account not verified
- **500 Internal Server Error**: Unexpected error

## Implementation Details

1. Validates email format and required fields
2. Authenticates with Cognito using USER_PASSWORD_AUTH flow
3. Retrieves user details from Cognito (userId, role)
4. Fetches additional user metadata from DynamoDB
5. Returns tokens and user information

## Error Handling

- Invalid credentials return generic "Invalid credentials" message (security best practice)
- Unverified accounts receive specific message to check email
- Rate limiting errors inform user to try again later
- All errors are logged with request context

## Security Notes

- Uses USER_PASSWORD_AUTH flow (requires explicit enablement in Cognito)
- Does not reveal whether email exists in system
- Implements rate limiting via Cognito
- Tokens are signed by Cognito and can be verified independently
