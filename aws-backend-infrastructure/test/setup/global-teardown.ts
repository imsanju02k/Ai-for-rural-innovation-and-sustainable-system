/**
 * Global teardown for Jest tests
 * Runs once after all test suites complete
 */

export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test environment...\n');
  
  // Cleanup logic can be added here if needed
  // For example: closing database connections, cleaning up test resources, etc.
  
  console.log('✅ Global teardown complete\n');
}
