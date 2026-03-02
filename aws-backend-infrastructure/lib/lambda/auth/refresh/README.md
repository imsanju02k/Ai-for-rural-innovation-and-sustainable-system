# Auth Refresh Lambda

## Overview

Handles token refresh using Cognito refresh tokens to obtain new access tokens.

## Requirements

- **2.4**: Support token refresh to maintain user sessions

## Environment Variables

- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID

## Request Format

```json
{
  "refreshToken": "eyJhbGc..."
}
```

### Fields

- `refreshToken` (required): Valid refresh token obtained from login

## Response Format

### Success (200 OK)

```json
{
  "accessToken": "eyJhbGc...",
  "idToken": "eyJhbGc...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### Token Details

- `accessToken`: New access token for API authorization
- `idToken`: New ID token with user claims
- `expiresIn`: Token expiration time in seconds (typically 3600 = 1 hour)
- `tokenType`: Always "Bearer"

**Note**: Refresh token is NOT returned - the original refresh token remains valid.

### Error Responses

- **400 Bad Request**: Missing or invalid refresh token format
- **401 Unauthorized**: Invalid or expired refresh token, or too many attempts
- **500 Internal Server Error**: Unexpected error

## Implementation Details

1. Validates refresh token presence and format
2. Calls Cognito with REFRESH_TOKEN_AUTH flow
3. Returns new access and ID tokens
4. Original refresh token remains valid and can be reused

## Usage Pattern

Clients should:
1. Store refresh token securely (e.g., httpOnly cookie, secure storage)
2. Use access token for API requests
3. When access token expires (401 response), call refresh endpoint
4. Update stored access token with new one
5. Retry original API request with new access token

## Error Handling

- Invalid/expired refresh tokens return 401
- Rate limiting prevents abuse
- All errors are logged with request context

## Security Notes

- Refresh tokens have longer expiration (7 days default)
- Refresh tokens can only be used to obtain new access tokens
- Refresh tokens are single-use in some configurations
- Implement secure storage for refresh tokens on client side
