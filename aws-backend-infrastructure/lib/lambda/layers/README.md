# Lambda Layers

This directory contains Lambda layers that package common dependencies and shared utilities for reuse across Lambda functions.

## Layers

### 1. Common Dependencies Layer

**Location**: `common-dependencies/`

**Contents**:
- AWS SDK v3 clients (DynamoDB, S3)
- lodash - Utility library
- date-fns - Date manipulation library
- zod - Schema validation library

**Usage**: This layer is automatically included in all Lambda functions that need these common dependencies.

### 2. Shared Utilities Layer

**Location**: `../shared/`

**Contents**:
- Utility functions (DynamoDB, S3, validation, response, logging)
- Data models and TypeScript types
- Middleware functions (error handling, request logging, CORS)

**Usage**: Import from the `shared` module in your Lambda functions:

```typescript
import { getItem, putItem } from 'shared/utils/dynamodb';
import { successResponse, errorResponse } from 'shared/utils/response';
import { FarmSchema, CreateFarmInput } from 'shared/models/farm';
import { withErrorHandler, withRequestLogger } from 'shared/middleware';
```

## Layer Versioning

Lambda layers are versioned automatically by CDK. Each deployment creates a new version if the layer content changes. The `removalPolicy` is set to `RETAIN` to preserve old versions for rollback purposes.

## Building Layers

Layers are built automatically during CDK deployment using Docker bundling. The build process:

1. Copies the layer source code
2. Runs `npm install --production` to install dependencies
3. Packages the result in the correct directory structure for Lambda layers

## Layer Structure

Lambda layers must follow this directory structure:

```
layer.zip
└── nodejs/
    └── node_modules/
        ├── @aws-sdk/
        ├── lodash/
        ├── date-fns/
        ├── zod/
        └── shared/  (for shared utilities layer)
```

## Adding New Dependencies

### To Common Dependencies Layer:

1. Add the dependency to `common-dependencies/package.json`
2. Deploy the stack - CDK will rebuild the layer

### To Shared Utilities Layer:

1. Add your utility/model/middleware to the appropriate directory in `../shared/`
2. Export it from the relevant index file
3. Deploy the stack - CDK will rebuild the layer

## Performance Considerations

- Layers are cached by Lambda, reducing cold start times
- Keep layers under 50MB unzipped for optimal performance
- Split large dependencies into separate layers if needed
- Use layers for code that changes infrequently

## Best Practices

1. **Version Control**: Layer versions are immutable - always create new versions
2. **Size Optimization**: Only include production dependencies
3. **Compatibility**: Ensure layer runtime matches Lambda function runtime
4. **Documentation**: Document layer contents and usage
5. **Testing**: Test layers with actual Lambda functions before production deployment
