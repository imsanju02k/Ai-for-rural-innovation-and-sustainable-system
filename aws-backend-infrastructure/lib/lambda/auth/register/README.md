# Auth Register Lambda

## Overview

Handles user registration with AWS Cognito User Pool and stores user metadata in DynamoDB.

## Requirements

- **2.1**: Support user registration with email and password
- **2.2**: Send verification email within 30 seconds
- **2.3**: Enforce password requirements (min 8 chars, uppercase, lowercase, number, special char)

## Environment Variables

- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `USERS_TABLE`: DynamoDB Users table name

## Request Format

```json
{
  "email": "farmer@example.com",
  "password": "SecurePass123!",
  "name": "John Farmer",
  "phone": "+1234567890",
  "role": "farmer"
}
```

### Fields

- `email` (required): Valid email address
- `password` (required): Must meet password requirements
- `name` (required): User's full name (1-100 characters)
- `phone` (optional): Phone number in international format
- `role` (optional): User role - `farmer`, `advisor`, or `admin` (default: `farmer`)

## Response Format

### Success (201 Created)

```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "farmer@example.com",
  "message": "Verification email sent"
}
```

### Error Responses

- **400 Bad Request**: Invalid input (email format, weak password, invalid phone)
- **409 Conflict**: Email already registered
- **500 Internal Server Error**: Unexpected error

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Implementation Details

1. Validates all input fields
2. Creates user in Cognito User Pool with custom attributes (userId, role)
3. Stores user metadata in DynamoDB Users table
4. Cognito automatically sends verification email
5. Returns success response with userId

## Error Handling

- Cognito errors are mapped to appropriate HTTP status codes
- All errors are logged with request context
- User-friendly error messages returned to client
