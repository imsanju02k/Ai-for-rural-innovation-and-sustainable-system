# Property-Based Testing

This directory contains property-based tests using [fast-check](https://github.com/dubzzz/fast-check) to verify correctness properties across many inputs.

## What is Property-Based Testing?

Property-based testing verifies that certain properties (invariants) hold true for all valid inputs, rather than testing specific examples. Instead of writing individual test cases, you define properties that should always be true, and the testing framework generates hundreds of random inputs to verify those properties.

## Running Property Tests

```bash
# Run all property tests
npm run test:property

# Run specific property test
npm test -- test/property/validation.test.ts

# Run with more iterations
NUM_RUNS=500 npm run test:property

# Run with specific seed for reproducibility
SEED=42 npm run test:property
```

## Configuration

Property tests are configured to run with:
- **Minimum 100 iterations** per test (as per design requirements)
- **30 second timeout** per test
- **1000 shrink iterations** to find minimal failing examples
- **Reproducible seeds** for debugging

Configuration can be customized in `test/property/config.ts`.

## Writing Property Tests

### Basic Structure

```typescript
import * as fc from 'fast-check';
import { testProperty } from './config';

describe('Property Tests', () => {
  it('should validate property X', () => {
    testProperty(
      fc.property(
        fc.integer(), // Arbitrary input generator
        (value) => {
          // Property assertion
          expect(someFunction(value)).toBeSatisfy(condition);
        }
      )
    );
  });
});
```

### Using Custom Arbitraries

```typescript
import { farmArbitrary } from './arbitraries/domain';

it('should validate farm coordinates', () => {
  testProperty(
    fc.property(farmArbitrary, (farm) => {
      expect(farm.location.latitude).toBeGreaterThanOrEqual(-90);
      expect(farm.location.latitude).toBeLessThanOrEqual(90);
      expect(farm.location.longitude).toBeGreaterThanOrEqual(-180);
      expect(farm.location.longitude).toBeLessThanOrEqual(180);
    })
  );
});
```

### Linking to Requirements

Each property test must reference the requirement(s) it validates:

```typescript
/**
 * Feature: aws-backend-infrastructure
 * Property 1: Request Validation Rejection
 * 
 * For any API endpoint and any request payload that fails schema validation,
 * the API SHALL return a 400 status code with a descriptive error message.
 * 
 * **Validates: Requirements 1.4, 1.5**
 */
it('should reject invalid requests with 400', () => {
  // Test implementation
});
```

## Available Arbitraries

### Common Arbitraries (`arbitraries/common.ts`)

- `uuidArbitrary` - Valid UUID v4
- `emailArbitrary` - Valid email addresses
- `phoneArbitrary` - Valid phone numbers
- `isoTimestampArbitrary` - Valid ISO 8601 timestamps
- `latitudeArbitrary` - Valid latitude (-90 to 90)
- `longitudeArbitrary` - Valid longitude (-180 to 180)
- `coordinatesArbitrary` - Valid coordinate pairs
- `passwordArbitrary` - Valid passwords (meets requirements)
- `roleArbitrary` - Valid user roles
- `cropTypeArbitrary` - Valid crop types
- `soilTypeArbitrary` - Valid soil types
- `sensorTypeArbitrary` - Valid sensor types
- `severityArbitrary` - Valid alert severity levels
- `confidenceArbitrary` - Confidence scores (0 to 1)

### Domain Arbitraries (`arbitraries/domain.ts`)

- `userArbitrary` - Complete user objects
- `farmArbitrary` - Complete farm objects
- `imageArbitrary` - Complete image objects
- `diseaseAnalysisArbitrary` - Disease detection results
- `marketPriceArbitrary` - Market price data
- `sensorDataArbitrary` - Sensor readings
- `optimizationArbitrary` - Optimization recommendations
- `chatMessageArbitrary` - Chat messages
- `alertArbitrary` - Alert objects

### Negative Testing Arbitraries

- `invalidCoordinatesArbitrary` - Invalid coordinate values
- `invalidPasswordArbitrary` - Passwords that don't meet requirements

## Correctness Properties

The design document defines 51 correctness properties that must be tested. Each property has a corresponding test file:

1. **API Gateway Properties** (`api-gateway.test.ts`)
   - Property 1: Request Validation Rejection
   - Property 2: Rate Limiting Enforcement
   - Property 3: Request Logging Completeness
   - Property 4: Unhandled Error Response

2. **Authentication Properties** (`authentication.test.ts`)
   - Property 5: Password Validation Enforcement
   - Property 6: Valid Login Token Generation
   - Property 7: Invalid Credentials Rejection
   - Property 8: Valid Token Authorization
   - Property 9: Invalid Token Rejection
   - Property 10: Role-Based Access Control

3. **Storage Properties** (`storage.test.ts`)
   - Property 11: Pre-Signed Upload URL Generation
   - Property 12: Image Format Validation
   - Property 13: Image Size Validation
   - Property 14: Image Metadata Persistence
   - Property 15: Pre-Signed Download URL Generation

4. **Disease Detection Properties** (`disease-detection.test.ts`)
   - Property 16-21: Disease detection and analysis

5. **Market Price Properties** (`market-prices.test.ts`)
   - Property 22-24: Price predictions and storage

6. **Advisory Chatbot Properties** (`advisory.test.ts`)
   - Property 25-29: Chat context and responses

7. **Resource Optimization Properties** (`optimization.test.ts`)
   - Property 30-36: Resource recommendations

8. **IoT Properties** (`iot.test.ts`)
   - Property 37-42: Sensor data and alerts

9. **Monitoring Properties** (`monitoring.test.ts`)
   - Property 43-46: Logging and alerting

10. **Infrastructure Properties** (`infrastructure.test.ts`)
    - Property 47-51: IaC and configuration

## Best Practices

1. **Keep properties simple**: Each property should test one invariant
2. **Use descriptive names**: Property names should clearly state what they verify
3. **Link to requirements**: Always reference the requirement(s) being validated
4. **Test edge cases**: Use arbitraries that generate boundary values
5. **Shrink effectively**: fast-check will find minimal failing examples
6. **Reproduce failures**: Use the seed from failed tests to reproduce issues
7. **Document assumptions**: Clearly state any assumptions in comments

## Debugging Failed Properties

When a property test fails, fast-check provides:

1. **Counterexample**: The specific input that caused the failure
2. **Seed**: A seed value to reproduce the exact test run
3. **Path**: The shrinking path to the minimal failing case

Example failure output:
```
Property failed after 42 runs
Counterexample: { latitude: 91.5, longitude: 0 }
Seed: 1234567890
Path: "42:0:1"

To reproduce:
fc.assert(property, { seed: 1234567890, path: "42:0:1" })
```

## Performance Considerations

- Property tests run 100+ iterations, so they're slower than unit tests
- Use `fastPropertyTestConfig` during development for quicker feedback
- CI/CD runs use `ciPropertyTestConfig` with 200 iterations
- Production validation uses `thoroughPropertyTestConfig` with 500 iterations

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check/tree/main/documentation)
- [Property-Based Testing Guide](https://github.com/dubzzz/fast-check/blob/main/documentation/Guides.md)
- [Design Document - Correctness Properties](../../.kiro/specs/aws-backend-infrastructure/design.md#correctness-properties)
