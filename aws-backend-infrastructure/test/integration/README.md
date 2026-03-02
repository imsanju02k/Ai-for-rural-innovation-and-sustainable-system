# Integration Tests

This directory contains integration tests that verify the AWS backend infrastructure works correctly with real AWS services.

## Prerequisites

- AWS credentials configured (via AWS CLI or environment variables)
- Appropriate IAM permissions to create/delete test resources
- Node.js 20.x or later

## Environment Variables

Set the following environment variables before running integration tests:

```bash
export AWS_REGION=us-east-1
export AWS_PROFILE=your-test-profile  # Optional
export ENVIRONMENT=test
```

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm test -- test/integration/api/farm.test.ts

# Run with coverage
npm run test:integration -- --coverage
```

## Test Environment Setup

Integration tests automatically create and tear down test resources:

- **DynamoDB Tables**: Test tables with `test-integration-` prefix
- **S3 Buckets**: Test buckets for image storage
- **Cognito User Pool**: Test user pool for authentication

### Manual Setup

If you need to manually set up the test environment:

```typescript
import { testEnvironment } from './setup/test-environment';

// Set up test resources
await testEnvironment.setup();

// Seed test data
await testEnvironment.seedTestData();

// Run your tests...

// Clean up
await testEnvironment.teardown();
```

## Test Data Seeding

Test data is automatically seeded before integration tests run. You can also seed data manually:

```typescript
import { testDataSeeder } from './setup/seed-data';

const { userId, farmId, imageId } = await testDataSeeder.seedAll();
```

## Writing Integration Tests

Example integration test:

```typescript
import { testEnvironment } from './setup/test-environment';
import { testDataSeeder } from './setup/seed-data';

describe('Farm API Integration Tests', () => {
  beforeAll(async () => {
    await testEnvironment.setup();
    await testDataSeeder.seedAll();
  });
  
  afterAll(async () => {
    await testEnvironment.teardown();
  });
  
  it('should create a farm', async () => {
    // Your test code here
  });
});
```

## Cost Considerations

Integration tests create real AWS resources which may incur costs. To minimize costs:

- Tests use on-demand billing for DynamoDB
- S3 buckets are deleted after tests complete
- Resources are tagged with `Environment: test` for cost tracking
- Test resources are automatically cleaned up

## Troubleshooting

### Tests Fail to Create Resources

- Check AWS credentials are configured correctly
- Verify IAM permissions include DynamoDB, S3, and Cognito access
- Ensure no resource limits are reached in your AWS account

### Tests Timeout

- Increase Jest timeout in jest.config.js
- Check AWS service availability in your region
- Verify network connectivity to AWS services

### Resources Not Cleaned Up

If test resources are not cleaned up automatically:

```bash
# List test resources
aws dynamodb list-tables --query 'TableNames[?starts_with(@, `test-integration-`)]'
aws s3 ls | grep test-integration

# Delete manually
aws dynamodb delete-table --table-name test-integration-users
aws s3 rb s3://test-integration-bucket --force
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up resources in `afterAll` hooks
3. **Idempotency**: Tests should be able to run multiple times with same results
4. **Timeouts**: Set appropriate timeouts for AWS operations
5. **Error Handling**: Handle AWS service errors gracefully
6. **Cost Awareness**: Be mindful of AWS costs when writing tests
