#!/usr/bin/env node
/**
 * Seed Sensor Data Script
 * 
 * Creates test sensor data in DynamoDB SensorData and SensorAggregates tables
 * 
 * Usage:
 *   npm run seed:sensor-data -- --environment dev
 *   npm run seed:sensor-data -- --environment dev --days 7 --interval 15
 * 
 * Requirements: 15.7
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'dev';
const days = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1] || '7');
const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1] || '15'); // minutes

// Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const SENSOR_DATA_TABLE = `${environment}-dynamodb-sensor-data`;

// Initialize DynamoDB client
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

// Sensor types and their value ranges
const SENSOR_TYPES = [
    { type: 'temperature', unit: '°C', min: 15, max: 40, baseline: 25 },
    { type: 'humidity', unit: '%', min: 30, max: 90, baseline: 60 },
    { type: 'soil_moisture', unit: '%', min: 20, max: 80, baseline: 50 },
    { type: 'ph', unit: 'pH', min: 5.5, max: 8.0, baseline: 6.5 },
];

/**
 * Generate a realistic sensor value with some randomness
 */
function generateSensorValue(sensorType: typeof SENSOR_TYPES[0], previousValue?: number): number {
    const { min, max, baseline } = sensorType;

    if (previousValue === undefined) {
        // First reading: start near baseline with some variation
        return baseline + (Math.random() - 0.5) * (max - min) * 0.2;
    }

    // Subsequent readings: small change from previous value
    const change = (Math.random() - 0.5) * (max - min) * 0.05;
    let newValue = previousValue + change;

    // Keep within bounds
    newValue = Math.max(min, Math.min(max, newValue));

    // Round to 1 decimal place
    return Math.round(newValue * 10) / 10;
}

/**
 * Get farms from the database
 */
async function getFarms(): Promise<Array<{ farmId: string; userId: string }>> {
    try {
        const response = await dynamoClient.send(new ScanCommand({
            TableName: `${environment}-dynamodb-farms`,
            ProjectionExpression: 'farmId, userId',
        }));

        if (response.Items && response.Items.length > 0) {
            return response.Items as Array<{ farmId: string; userId: string }>;
        }

        return [];
    } catch (error: any) {
        console.error('✗ Failed to fetch farms:', error.message);
        return [];
    }
}

/**
 * Create sensor data entry
 */
async function createSensorData(
    deviceId: string,
    farmId: string,
    userId: string,
    sensorType: typeof SENSOR_TYPES[0],
    timestamp: Date,
    value: number
): Promise<void> {
    const item = {
        deviceId,
        farmId,
        userId,
        sensorType: sensorType.type,
        value,
        unit: sensorType.unit,
        timestamp: timestamp.toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days from now
    };

    try {
        await dynamoClient.send(new PutCommand({
            TableName: SENSOR_DATA_TABLE,
            Item: item,
        }));
    } catch (error: any) {
        console.error(`✗ Failed to create sensor data:`, error.message);
        throw error;
    }
}

/**
 * Main seeding function
 */
async function seedSensorData() {
    console.log('\n=== Seeding Test Sensor Data ===\n');
    console.log(`Environment: ${environment}`);
    console.log(`Region: ${region}`);
    console.log(`Sensor Data Table: ${SENSOR_DATA_TABLE}`);
    console.log(`Days of data: ${days}`);
    console.log(`Interval: ${interval} minutes\n`);

    // Get farms
    console.log('Fetching farms...');
    const farms = await getFarms();

    if (farms.length === 0) {
        console.error('✗ Error: No farms found in the database');
        console.error('  Please run seed-farms.ts first');
        process.exit(1);
    }

    console.log(`Found ${farms.length} farms\n`);

    // Calculate number of readings per sensor
    const readingsPerDay = (24 * 60) / interval;
    const totalReadings = days * readingsPerDay;

    console.log(`Generating ${totalReadings} readings per sensor per farm...\n`);

    let totalEntries = 0;
    const startTime = Date.now();

    // For each farm, create sensors and generate data
    for (const farm of farms) {
        console.log(`Processing farm: ${farm.farmId}`);

        // Create 2 sensors per farm (one for each sensor type)
        for (let sensorNum = 1; sensorNum <= 2; sensorNum++) {
            const deviceId = `sensor-${farm.farmId.substring(0, 8)}-${sensorNum}`;

            // Track previous values for realistic data generation
            const previousValues: { [key: string]: number } = {};

            // Generate historical data
            for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
                for (let reading = 0; reading < readingsPerDay; reading++) {
                    const timestamp = new Date();
                    timestamp.setDate(timestamp.getDate() - dayOffset);
                    timestamp.setHours(0, reading * interval, 0, 0);

                    // Generate data for each sensor type
                    for (const sensorType of SENSOR_TYPES) {
                        const value = generateSensorValue(
                            sensorType,
                            previousValues[sensorType.type]
                        );
                        previousValues[sensorType.type] = value;

                        await createSensorData(
                            deviceId,
                            farm.farmId,
                            farm.userId,
                            sensorType,
                            timestamp,
                            value
                        );

                        totalEntries++;
                    }
                }

                // Progress indicator
                if ((days - dayOffset) % Math.max(1, Math.floor(days / 10)) === 0) {
                    process.stdout.write('.');
                }
            }

            console.log(` ✓ Completed sensor ${deviceId}`);
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n\n=== Seeding Complete ===\n');
    console.log(`Successfully created ${totalEntries} sensor data entries`);
    console.log(`Time taken: ${duration} seconds\n`);

    console.log('Summary:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Farms:              ${farms.length}`);
    console.log(`Sensors per farm:   2`);
    console.log(`Sensor types:       ${SENSOR_TYPES.length}`);
    console.log(`Days of data:       ${days}`);
    console.log(`Readings per day:   ${readingsPerDay}`);
    console.log(`Total entries:      ${totalEntries}`);
    console.log('─────────────────────────────────────────────────────\n');

    console.log('Sensor Types:');
    console.log('─────────────────────────────────────────────────────');
    for (const sensorType of SENSOR_TYPES) {
        console.log(`${sensorType.type.padEnd(20)} ${sensorType.min}-${sensorType.max} ${sensorType.unit}`);
    }
    console.log('─────────────────────────────────────────────────────\n');
}

// Run the script
seedSensorData().catch((error) => {
    console.error('\n✗ Seeding failed:', error.message);
    process.exit(1);
});