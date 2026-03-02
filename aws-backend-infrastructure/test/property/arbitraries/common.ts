/**
 * Common arbitraries for property-based testing
 */

import * as fc from 'fast-check';

/**
 * Generate valid UUID v4
 */
export const uuidArbitrary = fc.uuid();

/**
 * Generate valid email addresses
 */
export const emailArbitrary = fc.emailAddress();

/**
 * Generate valid phone numbers (international format)
 */
export const phoneArbitrary = fc.string({ minLength: 10, maxLength: 15 }).map(
    (s) => `+${s.replace(/\D/g, '').slice(0, 15)}`
);

/**
 * Generate valid ISO 8601 timestamps
 */
export const isoTimestampArbitrary = fc.date().map((d) => d.toISOString());

/**
 * Generate valid latitude values (-90 to 90)
 */
export const latitudeArbitrary = fc.double({ min: -90, max: 90, noNaN: true });

/**
 * Generate valid longitude values (-180 to 180)
 */
export const longitudeArbitrary = fc.double({ min: -180, max: 180, noNaN: true });

/**
 * Generate valid coordinates
 */
export const coordinatesArbitrary = fc.record({
    latitude: latitudeArbitrary,
    longitude: longitudeArbitrary,
});

/**
 * Generate valid passwords (meets requirements)
 */
export const passwordArbitrary = fc
    .tuple(
        fc.char().filter((c) => c >= 'A' && c <= 'Z'), // Uppercase
        fc.char().filter((c) => c >= 'a' && c <= 'z'), // Lowercase
        fc.char().filter((c) => c >= '0' && c <= '9'), // Number
        fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*'), // Special char
        fc.stringOf(fc.char(), { minLength: 4, maxLength: 20 }) // Additional chars
    )
    .map(([upper, lower, num, special, rest]) => {
        // Shuffle to avoid predictable patterns
        const chars = [upper, lower, num, special, ...rest.split('')];
        return chars.sort(() => Math.random() - 0.5).join('');
    });

/**
 * Generate valid user roles
 */
export const roleArbitrary = fc.constantFrom('farmer', 'admin', 'advisor');

/**
 * Generate valid crop types
 */
export const cropTypeArbitrary = fc.constantFrom(
    'wheat',
    'rice',
    'corn',
    'tomato',
    'potato',
    'sugarcane',
    'cotton',
    'soybean',
    'barley',
    'millet'
);

/**
 * Generate valid soil types
 */
export const soilTypeArbitrary = fc.constantFrom(
    'sandy',
    'loamy',
    'clay',
    'silt',
    'peaty',
    'chalky'
);

/**
 * Generate valid sensor types
 */
export const sensorTypeArbitrary = fc.constantFrom(
    'soil_moisture',
    'temperature',
    'humidity',
    'ph',
    'light_intensity'
);

/**
 * Generate valid alert severity levels
 */
export const severityArbitrary = fc.constantFrom('low', 'medium', 'high', 'critical');

/**
 * Generate valid alert status
 */
export const alertStatusArbitrary = fc.constantFrom('active', 'acknowledged', 'resolved');

/**
 * Generate valid image content types
 */
export const imageContentTypeArbitrary = fc.constantFrom(
    'image/jpeg',
    'image/png',
    'image/heic'
);

/**
 * Generate valid file sizes (in bytes, up to 10MB)
 */
export const fileSizeArbitrary = fc.integer({ min: 1024, max: 10 * 1024 * 1024 });

/**
 * Generate confidence scores (0 to 1)
 */
export const confidenceArbitrary = fc.double({ min: 0, max: 1, noNaN: true });

/**
 * Generate positive numbers
 */
export const positiveNumberArbitrary = fc.double({ min: 0.01, max: 1000000, noNaN: true });

/**
 * Generate positive integers
 */
export const positiveIntegerArbitrary = fc.integer({ min: 1, max: 1000000 });

/**
 * Generate valid acreage (farm size in acres)
 */
export const acreageArbitrary = fc.double({ min: 0.1, max: 10000, noNaN: true });

/**
 * Generate valid prices (in INR)
 */
export const priceArbitrary = fc.double({ min: 100, max: 100000, noNaN: true });

/**
 * Generate valid durations (in minutes)
 */
export const durationArbitrary = fc.integer({ min: 1, max: 1440 }); // Up to 24 hours

/**
 * Generate valid percentages (0 to 100)
 */
export const percentageArbitrary = fc.double({ min: 0, max: 100, noNaN: true });
