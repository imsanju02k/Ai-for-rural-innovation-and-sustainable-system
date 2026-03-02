/**
 * Jest setup file
 * Runs before each test file
 */

// Extend Jest matchers if needed
import { expect } from '@jest/globals';

// Set longer timeout for integration and property tests
if (process.env.JEST_WORKER_ID) {
  jest.setTimeout(30000);
}

// Mock console methods to reduce noise during tests
// Uncomment if you want to suppress console output during tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Add custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  
  toBeValidISODate(received: string) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime()) && received === date.toISOString();
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ISO date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ISO date`,
        pass: false,
      };
    }
  },
  
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidISODate(): R;
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}
