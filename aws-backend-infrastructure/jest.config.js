module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    'bin/**/*.ts',
    '!lib/**/*.d.ts',
    '!lib/**/index.ts',
    '!lib/**/.gitkeep',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 30000,
  // Separate test environments for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
        }],
      },
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 60000,
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
        }],
      },
    },
    {
      displayName: 'property',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/property/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 120000, // Property tests may take longer
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
        }],
      },
    },
    {
      displayName: 'smoke',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/smoke/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 30000,
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
        }],
      },
    },
  ],
  // Global setup and teardown
  globalSetup: '<rootDir>/test/setup/global-setup.ts',
  globalTeardown: '<rootDir>/test/setup/global-teardown.ts',
  // Setup files that run before each test file
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest-setup.ts'],
  // Verbose output for better debugging
  verbose: true,
  // Fail tests on console errors
  errorOnDeprecated: true,
  // Ignore cdk.out directory
  testPathIgnorePatterns: ['/node_modules/', '/cdk.out/'],
  modulePathIgnorePatterns: ['/cdk.out/'],
};
