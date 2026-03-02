/**
 * Domain-specific arbitraries for property-based testing
 */

import * as fc from 'fast-check';
import {
    uuidArbitrary,
    emailArbitrary,
    phoneArbitrary,
    isoTimestampArbitrary,
    coordinatesArbitrary,
    roleArbitrary,
    cropTypeArbitrary,
    soilTypeArbitrary,
    sensorTypeArbitrary,
    severityArbitrary,
    alertStatusArbitrary,
    imageContentTypeArbitrary,
    fileSizeArbitrary,
    confidenceArbitrary,
    acreageArbitrary,
    priceArbitrary,
    percentageArbitrary,
} from './common';

/**
 * Generate valid user objects
 */
export const userArbitrary = fc.record({
    userId: uuidArbitrary,
    email: emailArbitrary,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    phone: phoneArbitrary,
    role: roleArbitrary,
    preferences: fc.record({
        language: fc.constantFrom('en', 'hi', 'ta', 'te'),
        notifications: fc.record({
            email: fc.boolean(),
            sms: fc.boolean(),
            push: fc.boolean(),
        }),
    }),
    createdAt: isoTimestampArbitrary,
    updatedAt: isoTimestampArbitrary,
});

/**
 * Generate valid farm objects
 */
export const farmArbitrary = fc.record({
    userId: uuidArbitrary,
    farmId: uuidArbitrary,
    name: fc.string({ minLength: 1, maxLength: 200 }),
    location: fc.record({
        latitude: coordinatesArbitrary.map((c) => c.latitude),
        longitude: coordinatesArbitrary.map((c) => c.longitude),
        address: fc.string({ minLength: 10, maxLength: 500 }),
    }),
    cropTypes: fc.array(cropTypeArbitrary, { minLength: 1, maxLength: 5 }),
    acreage: acreageArbitrary,
    soilType: soilTypeArbitrary,
    createdAt: isoTimestampArbitrary,
    updatedAt: isoTimestampArbitrary,
});

/**
 * Generate valid image objects
 */
export const imageArbitrary = fc.record({
    userId: uuidArbitrary,
    imageId: uuidArbitrary,
    farmId: uuidArbitrary,
    s3Key: fc.string({ minLength: 10, maxLength: 200 }),
    s3Bucket: fc.string({ minLength: 3, maxLength: 63 }),
    fileName: fc.string({ minLength: 1, maxLength: 255 }),
    contentType: imageContentTypeArbitrary,
    fileSize: fileSizeArbitrary,
    uploadedAt: isoTimestampArbitrary,
    status: fc.constantFrom('uploaded', 'processing', 'analyzed', 'failed'),
});

/**
 * Generate valid disease detection results
 */
export const diseaseResultArbitrary = fc.record({
    diseaseName: fc.string({ minLength: 3, maxLength: 100 }),
    confidence: confidenceArbitrary,
    severity: fc.constantFrom('low', 'moderate', 'high', 'severe'),
    affectedArea: fc.string({ minLength: 3, maxLength: 100 }),
    recommendations: fc.array(fc.string({ minLength: 10, maxLength: 500 }), {
        minLength: 1,
        maxLength: 5,
    }),
});

/**
 * Generate valid disease analysis objects
 */
export const diseaseAnalysisArbitrary = fc.record({
    analysisId: uuidArbitrary,
    imageId: uuidArbitrary,
    userId: uuidArbitrary,
    farmId: uuidArbitrary,
    cropType: cropTypeArbitrary,
    results: fc.array(diseaseResultArbitrary, { minLength: 0, maxLength: 5 }),
    isUncertain: fc.boolean(),
    modelVersion: fc.string({ minLength: 1, maxLength: 20 }),
    processingTimeMs: fc.integer({ min: 100, max: 60000 }),
    analyzedAt: isoTimestampArbitrary,
});

/**
 * Generate valid market price objects
 */
export const marketPriceArbitrary = fc.record({
    priceId: uuidArbitrary,
    commodity: cropTypeArbitrary,
    price: priceArbitrary,
    unit: fc.constantFrom('INR/quintal', 'INR/kg', 'USD/bushel'),
    marketLocation: fc.record({
        name: fc.string({ minLength: 3, maxLength: 100 }),
        latitude: coordinatesArbitrary.map((c) => c.latitude),
        longitude: coordinatesArbitrary.map((c) => c.longitude),
        distance: fc.double({ min: 0, max: 500, noNaN: true }),
    }),
    source: fc.string({ minLength: 3, maxLength: 100 }),
    timestamp: isoTimestampArbitrary,
    ttl: fc.integer({ min: Date.now() / 1000, max: Date.now() / 1000 + 86400 * 365 }),
});

/**
 * Generate valid sensor data objects
 */
export const sensorDataArbitrary = fc.record({
    deviceId: fc.string({ minLength: 5, maxLength: 50 }),
    farmId: uuidArbitrary,
    userId: uuidArbitrary,
    sensorType: sensorTypeArbitrary,
    value: fc.double({ min: -50, max: 100, noNaN: true }),
    unit: fc.constantFrom('percent', 'celsius', 'fahrenheit', 'pH', 'lux'),
    timestamp: isoTimestampArbitrary,
    ttl: fc.integer({ min: Date.now() / 1000, max: Date.now() / 1000 + 7776000 }),
});

/**
 * Generate valid optimization recommendation objects
 */
export const optimizationArbitrary = fc.record({
    optimizationId: uuidArbitrary,
    farmId: uuidArbitrary,
    userId: uuidArbitrary,
    type: fc.constantFrom('water', 'fertilizer', 'schedule'),
    parameters: fc.record({
        cropType: cropTypeArbitrary,
        currentStage: fc.constantFrom('germination', 'vegetative', 'flowering', 'fruiting', 'harvest'),
        soilMoisture: percentageArbitrary,
        weatherForecast: fc.constantFrom('sunny', 'cloudy', 'rainy', 'stormy'),
    }),
    recommendations: fc.record({
        dailyWaterRequirement: fc.double({ min: 1, max: 100, noNaN: true }),
        unit: fc.constantFrom('mm', 'liters', 'gallons'),
        irrigationSchedule: fc.array(
            fc.record({
                time: fc.constantFrom('06:00', '12:00', '18:00'),
                duration: fc.integer({ min: 15, max: 120 }),
                unit: fc.constant('minutes'),
            }),
            { minLength: 1, maxLength: 3 }
        ),
        estimatedSavings: fc.record({
            water: percentageArbitrary,
            unit: fc.constant('percent'),
            costSavings: priceArbitrary,
            currency: fc.constant('INR'),
        }),
    }),
    calculatedAt: isoTimestampArbitrary,
});

/**
 * Generate valid chat message objects
 */
export const chatMessageArbitrary = fc.record({
    messageId: uuidArbitrary,
    userId: uuidArbitrary,
    farmId: fc.option(uuidArbitrary, { nil: null }),
    role: fc.constantFrom('user', 'assistant'),
    content: fc.string({ minLength: 1, maxLength: 5000 }),
    metadata: fc.option(
        fc.record({
            sources: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
            recommendations: fc.array(fc.record({}), { minLength: 0, maxLength: 3 }),
            processingTimeMs: fc.integer({ min: 100, max: 30000 }),
        }),
        { nil: undefined }
    ),
    timestamp: isoTimestampArbitrary,
});

/**
 * Generate valid alert objects
 */
export const alertArbitrary = fc.record({
    alertId: uuidArbitrary,
    userId: uuidArbitrary,
    farmId: uuidArbitrary,
    type: fc.string({ minLength: 5, maxLength: 50 }),
    severity: severityArbitrary,
    message: fc.string({ minLength: 10, maxLength: 500 }),
    status: alertStatusArbitrary,
    metadata: fc.record({}),
    createdAt: isoTimestampArbitrary,
    acknowledgedAt: fc.option(isoTimestampArbitrary, { nil: null }),
    acknowledgedBy: fc.option(uuidArbitrary, { nil: null }),
    note: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
    resolvedAt: fc.option(isoTimestampArbitrary, { nil: null }),
});

/**
 * Generate valid API Gateway event bodies
 */
export const apiRequestBodyArbitrary = fc.record({
    // Generic request body structure
    data: fc.anything(),
});

/**
 * Generate invalid coordinates (for negative testing)
 */
export const invalidCoordinatesArbitrary = fc.oneof(
    fc.record({
        latitude: fc.double({ min: -1000, max: -90.01, noNaN: true }),
        longitude: coordinatesArbitrary.map((c) => c.longitude),
    }),
    fc.record({
        latitude: fc.double({ min: 90.01, max: 1000, noNaN: true }),
        longitude: coordinatesArbitrary.map((c) => c.longitude),
    }),
    fc.record({
        latitude: coordinatesArbitrary.map((c) => c.latitude),
        longitude: fc.double({ min: -1000, max: -180.01, noNaN: true }),
    }),
    fc.record({
        latitude: coordinatesArbitrary.map((c) => c.latitude),
        longitude: fc.double({ min: 180.01, max: 1000, noNaN: true }),
    })
);

/**
 * Generate invalid passwords (for negative testing)
 */
export const invalidPasswordArbitrary = fc.oneof(
    fc.string({ maxLength: 7 }), // Too short
    fc.string().filter((s) => !/[A-Z]/.test(s)), // No uppercase
    fc.string().filter((s) => !/[a-z]/.test(s)), // No lowercase
    fc.string().filter((s) => !/[0-9]/.test(s)), // No number
    fc.string().filter((s) => !/[!@#$%^&*]/.test(s)) // No special char
);
