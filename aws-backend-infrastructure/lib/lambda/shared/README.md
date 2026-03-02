# Shared Lambda Utilities

This module contains shared utilities, data models, and middleware functions used across all Lambda functions in the AWS backend infrastructure.

## Structure

```
shared/
├── utils/           # Utility functions
│   ├── dynamodb.ts  # DynamoDB helper functions
│   ├── s3.ts        # S3 helper functions
│   ├── validation.ts # Input validation utilities
│   ├── response.ts  # API response formatters
│   └── logger.ts    # Structured logging utilities
├── models/          # Data models and validation schemas
│   ├── user.ts      # User model
│   ├── farm.ts      # Farm model
│   ├── image.ts     # Image model
│   ├── disease.ts   # Disease analysis model
│   └── alert.ts     # Alert model
├── middleware/      # Lambda middleware functions
│   ├── error-handler.ts    # Error handling middleware
│   ├── request-logger.ts   # Request logging middleware
│   └── cors.ts             # CORS middleware
└── index.ts         # Main export file
```

## Usage

### Utilities

#### DynamoDB Helpers

```typescript
import { getItem, putItem, queryItems, updateItem } from 'shared/utils/dynamodb';

// Get an item
const user = await getItem<User>('users-table', { userId: '123' });

// Put an item
await putItem('users-table', { userId: '123', name: 'John' });

// Query items
const { items } = await queryItems<Farm>(
  'farms-table',
  'userId = :userId',
  { ':userId': '123' }
);

// Update an item
await updateItem(
  'users-table',
  { userId: '123' },
  'SET #name = :name',
  { ':name': 'Jane' },
  { expressionAttributeNames: { '#name': 'name' } }
);
```

#### S3 Helpers

```typescript
import {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  uploadFile,
  downloadFile,
} from 'shared/utils/s3';

// Generate pre-signed upload URL
const uploadUrl = await generatePresignedUploadUrl(
  'my-bucket',
  'path/to/file.jpg',
  900,
  'image/jpeg'
);

// Generate pre-signed download URL
const downloadUrl = await generatePresignedDownloadUrl(
  'my-bucket',
  'path/to/file.jpg'
);

// Upload a file
await uploadFile('my-bucket', 'path/to/file.jpg', buffer, {
  contentType: 'image/jpeg',
});

// Download a file
const buffer = await downloadFile('my-bucket', 'path/to/file.jpg');
```

#### Validation Utilities

```typescript
import {
  isValidEmail,
  isValidCoordinates,
  isValidImageType,
  validateRequiredFields,
} from 'shared/utils/validation';

// Validate email
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}

// Validate coordinates
if (!isValidCoordinates(lat, lng)) {
  throw new Error('Invalid coordinates');
}

// Validate required fields
const { valid, missingFields } = validateRequiredFields(data, [
  'name',
  'email',
  'farmId',
]);
```

#### Response Formatters

```typescript
import {
  ok,
  created,
  badRequest,
  notFound,
  internalServerError,
} from 'shared/utils/response';

// Success responses
return ok({ data: farm });
return created({ farmId: '123' });

// Error responses
return badRequest('Invalid input', requestId);
return notFound('Farm not found', requestId);
return internalServerError('Unexpected error', requestId);
```

#### Logging

```typescript
import { createLogger, LogLevel } from 'shared/utils/logger';

const logger = createLogger({ requestId: '123' }, LogLevel.INFO);

logger.info('Processing request', { farmId: '456' });
logger.error('Failed to process', error, { farmId: '456' });

// Create child logger with additional context
const childLogger = logger.child({ userId: '789' });
childLogger.info('User action');
```

### Models

All models use Zod for runtime validation:

```typescript
import { FarmSchema, CreateFarmInput } from 'shared/models/farm';

// Validate input
const input: CreateFarmInput = {
  name: 'My Farm',
  location: { latitude: 28.6, longitude: 77.2 },
  cropTypes: ['wheat'],
  acreage: 10,
};

// Parse and validate
const validatedInput = CreateFarmInputSchema.parse(input);

// Type-safe access
const farm: Farm = {
  farmId: '123',
  userId: '456',
  ...validatedInput,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

### Middleware

Middleware functions wrap Lambda handlers to add cross-cutting concerns:

```typescript
import {
  withErrorHandler,
  withRequestLogger,
  withCors,
  compose,
} from 'shared/middleware';

// Individual middleware
export const handler = withErrorHandler(async (event) => {
  // Your handler logic
});

// Compose multiple middleware
export const handler = compose(
  withCors,
  withRequestLogger,
  withErrorHandler
)(async (event) => {
  // Your handler logic
});
```

#### Error Handler

Catches and formats errors:

```typescript
import { ValidationError, NotFoundError } from 'shared/middleware';

// Throw custom errors
throw new ValidationError('Invalid input', { field: 'email' });
throw new NotFoundError('Farm not found');

// Automatically handled and formatted
```

#### Request Logger

Logs all requests and responses:

```typescript
// Automatically logs:
// - Incoming request (method, path, query params)
// - Request duration
// - Response status code
// - Errors
```

#### CORS

Adds CORS headers to responses:

```typescript
import { withCors, getCorsOptionsFromEnv } from 'shared/middleware';

// Use default CORS settings
export const handler = withCors(async (event) => {
  // Your handler logic
});

// Use custom CORS settings
export const handler = withCors(
  async (event) => {
    // Your handler logic
  },
  {
    allowOrigin: ['https://example.com'],
    allowMethods: ['GET', 'POST'],
  }
);

// Use environment-based CORS settings
export const handler = withCors(
  async (event) => {
    // Your handler logic
  },
  getCorsOptionsFromEnv()
);
```

## Best Practices

1. **Always use middleware**: Wrap handlers with error handling and logging
2. **Validate inputs**: Use Zod schemas to validate all inputs
3. **Use typed responses**: Use response formatter functions for consistency
4. **Log with context**: Include requestId and relevant IDs in logs
5. **Handle errors gracefully**: Throw custom error types for better error handling
6. **Keep utilities focused**: Each utility should do one thing well
7. **Document changes**: Update this README when adding new utilities

## Testing

Test utilities independently before using in Lambda functions:

```typescript
import { getItem } from 'shared/utils/dynamodb';

describe('DynamoDB utilities', () => {
  it('should get an item', async () => {
    const item = await getItem('test-table', { id: '123' });
    expect(item).toBeDefined();
  });
});
```

## Environment Variables

Some utilities use environment variables:

- `LOG_LEVEL`: Set logging level (DEBUG, INFO, WARN, ERROR)
- `CORS_ALLOW_ORIGIN`: Comma-separated list of allowed origins
- `CORS_ALLOW_METHODS`: Comma-separated list of allowed methods
- `CORS_ALLOW_HEADERS`: Comma-separated list of allowed headers
