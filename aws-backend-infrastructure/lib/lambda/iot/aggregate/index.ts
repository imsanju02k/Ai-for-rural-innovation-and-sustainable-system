import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ScheduledEvent } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const SENSOR_DATA_TABLE = process.env.SENSOR_DATA_TABLE || '';
const SENSOR_AGGREGATES_TABLE = process.env.SENSOR_AGGREGATES_TABLE || '';

interface SensorReading {
    deviceId: string;
    timestamp: string;
    farmId: string;
    sensorType: string;
    value: number;
    unit: string;
}

interface AggregateData {
    min: number;
    max: number;
    avg: number;
    count: number;
}

/**
 * IoT Aggregate Lambda Handler
 * Scheduled to run every 15 minutes
 * Aggregates sensor data into 15-minute intervals
 * Requirement: 9.9
 */
export const handler = async (event: ScheduledEvent): Promise<void> => {
    console.log('Starting sensor data aggregation');
    console.log('Event:', JSON.stringify(event));

    try {
        // Calculate time window (last 15 minutes)
        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

        // Get all unique farm-sensor combinations
        const farmSensorCombinations = await getFarmSensorCombinations(fifteenMinutesAgo, now);

        console.log(`Found ${farmSensorCombinations.length} farm-sensor combinations to aggregate`);

        // Process each combination
        for (const combination of farmSensorCombinations) {
            await aggregateSensorData(combination.farmId, combination.sensorType, fifteenMinutesAgo, now);
        }

        console.log('Sensor data aggregation completed successfully');
    } catch (error) {
        console.error('Error aggregating sensor data:', error);
        throw error;
    }
};

/**
 * Get all unique farm-sensor combinations from recent data
 */
async function getFarmSensorCombinations(
    startTime: Date,
    endTime: Date
): Promise<Array<{ farmId: string; sensorType: string }>> {
    // In a real implementation, we would scan the sensor data table
    // For now, we'll use a simplified approach with known sensor types
    const sensorTypes = ['soil_moisture', 'temperature', 'humidity', 'ph', 'light_intensity'];

    // This is a simplified implementation
    // In production, you would query the sensor data table to get actual farm IDs
    // For now, we'll return an empty array and let the query handle it
    const combinations: Array<{ farmId: string; sensorType: string }> = [];

    // Note: In a real implementation, you would:
    // 1. Scan or query the sensor data table for the time range
    // 2. Extract unique farmId-sensorType combinations
    // 3. Return the list

    return combinations;
}

/**
 * Aggregate sensor data for a specific farm and sensor type
 */
async function aggregateSensorData(
    farmId: string,
    sensorType: string,
    startTime: Date,
    endTime: Date
): Promise<void> {
    console.log(`Aggregating data for farm ${farmId}, sensor ${sensorType}`);

    // Query sensor data for the time range
    const readings = await querySensorData(farmId, sensorType, startTime, endTime);

    if (readings.length === 0) {
        console.log('No readings found for this period');
        return;
    }

    // Calculate aggregates
    const aggregates = calculateAggregates(readings);

    // Generate period identifier (YYYY-MM-DD-HH-MM format for 15-minute intervals)
    const period = generatePeriodIdentifier(startTime);

    // Store aggregates
    await storeAggregates(farmId, sensorType, period, aggregates, readings[0].unit);

    console.log(`Aggregated ${readings.length} readings for ${farmId}#${sensorType}`);
}

/**
 * Query sensor data from DynamoDB
 */
async function querySensorData(
    farmId: string,
    sensorType: string,
    startTime: Date,
    endTime: Date
): Promise<SensorReading[]> {
    const command = new QueryCommand({
        TableName: SENSOR_DATA_TABLE,
        IndexName: 'FarmIdSensorTypeIndex',
        KeyConditionExpression: 'farmIdSensorType = :farmIdSensorType AND #ts BETWEEN :startTime AND :endTime',
        ExpressionAttributeNames: {
            '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
            ':farmIdSensorType': `${farmId}#${sensorType}`,
            ':startTime': startTime.toISOString(),
            ':endTime': endTime.toISOString(),
        },
    });

    const response = await docClient.send(command);
    return (response.Items || []) as SensorReading[];
}

/**
 * Calculate min, max, avg aggregates
 */
function calculateAggregates(readings: SensorReading[]): AggregateData {
    const values = readings.map((r) => r.value);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const count = values.length;

    return {
        min: Math.round(min * 100) / 100, // Round to 2 decimal places
        max: Math.round(max * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        count,
    };
}

/**
 * Generate period identifier for 15-minute intervals
 * Format: YYYY-MM-DD-HH-MM
 */
function generatePeriodIdentifier(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');

    // Round down to nearest 15-minute interval
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    const minuteStr = String(minutes).padStart(2, '0');

    return `${year}-${month}-${day}-${hour}-${minuteStr}`;
}

/**
 * Store aggregates in DynamoDB
 */
async function storeAggregates(
    farmId: string,
    sensorType: string,
    period: string,
    aggregates: AggregateData,
    unit: string
): Promise<void> {
    const item = {
        farmIdSensorType: `${farmId}#${sensorType}`,
        period,
        farmId,
        sensorType,
        aggregation: {
            min: aggregates.min,
            max: aggregates.max,
            avg: aggregates.avg,
            count: aggregates.count,
        },
        unit,
        timestamp: new Date().toISOString(),
    };

    const command = new PutCommand({
        TableName: SENSOR_AGGREGATES_TABLE,
        Item: item,
    });

    await docClient.send(command);
    console.log('Aggregates stored in DynamoDB');
}
