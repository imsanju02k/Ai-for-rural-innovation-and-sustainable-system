/**
 * Integration Test Suite - Master File
 * Runs all integration tests for the dev environment
 * 
 * Requirements: 12.3
 * 
 * This file imports and runs all integration tests in sequence:
 * 1. Authentication flow
 * 2. Farm CRUD operations
 * 3. Image upload and disease detection
 * 4. Market price retrieval
 * 5. Advisory chat
 * 6. IoT data ingestion
 */

import './auth.test';
import './farm-crud.test';
import './image-disease.test';
import './market-prices.test';
import './advisory-chat.test';
import './iot-data.test';

describe('Integration Test Suite', () => {
    it('should run all integration tests', () => {
        // This is a placeholder test to ensure the suite runs
        expect(true).toBe(true);
    });
});
