/**
 * Configuration for property-based testing
 */

import * as fc from 'fast-check';

/**
 * Default configuration for property tests
 */
export const defaultPropertyTestConfig: fc.Parameters<unknown> = {
  // Minimum 100 iterations as per design requirements
  numRuns: 100,
  
  // Seed for reproducibility (can be overridden)
  seed: undefined,
  
  // Path for shrinking
  path: undefined,
  
  // Verbose output for debugging
  verbose: false,
  
  // Mark tests as slow if they take longer than this
  markInterruptAsFailure: false,
  
  // Interrupt after this many milliseconds
  interruptAfterTimeLimit: 30000,
  
  // Skip all runs after first failure
  skipAllAfterTimeLimit: undefined,
  
  // Number of shrink iterations
  numShrinks: 1000,
  
  // Enable async property testing
  asyncReporter: undefined,
};

/**
 * Configuration for fast property tests (fewer iterations)
 */
export const fastPropertyTestConfig: fc.Parameters<unknown> = {
  ...defaultPropertyTestConfig,
  numRuns: 50,
};

/**
 * Configuration for thorough property tests (more iterations)
 */
export const thoroughPropertyTestConfig: fc.Parameters<unknown> = {
  ...defaultPropertyTestConfig,
  numRuns: 500,
};

/**
 * Configuration for CI/CD property tests
 */
export const ciPropertyTestConfig: fc.Parameters<unknown> = {
  ...defaultPropertyTestConfig,
  numRuns: 200,
  verbose: false,
};

/**
 * Get property test configuration based on environment
 */
export function getPropertyTestConfig(): fc.Parameters<unknown> {
  const env = process.env.NODE_ENV || 'test';
  const ci = process.env.CI === 'true';
  
  if (ci) {
    return ciPropertyTestConfig;
  }
  
  switch (env) {
    case 'development':
      return fastPropertyTestConfig;
    case 'production':
      return thoroughPropertyTestConfig;
    default:
      return defaultPropertyTestConfig;
  }
}

/**
 * Helper to run property tests with default configuration
 */
export function testProperty<T>(
  property: fc.IProperty<T>,
  config?: fc.Parameters<T>
): void {
  fc.assert(property, {
    ...getPropertyTestConfig(),
    ...config,
  });
}
