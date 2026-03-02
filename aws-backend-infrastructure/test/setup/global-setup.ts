/**
 * Global setup for Jest tests
 * Runs once before all test suites
 */

export default async function globalSetup() {
  console.log('\n🚀 Starting test suite...\n');
  
  // Set test environment variables
  process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  process.env.ENVIRONMENT = 'test';
  process.env.NODE_ENV = 'test';
  
  // Disable AWS SDK retries for faster test execution
  process.env.AWS_MAX_ATTEMPTS = '1';
  
  // Set test-specific configuration
  process.env.DYNAMODB_TABLE_PREFIX = 'test';
  process.env.S3_BUCKET_NAME = 'test-farm-images';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
  
  console.log('✅ Global setup complete\n');
}
