import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const lambdaClient = new LambdaClient({});

const SENSOR_DATA_TABLE = process.env.SENSOR_DATA_TABLE || '';
const ALERT_LAMBDA_ARN = process.env.ALERT_LAMBDA_ARN || '';
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';

// Sensor thresholds for alerts
const THRESHOLDS = {
    soil_moisture: { min: 30, max: 80 },
    temperature: { min: 10, max: 40 },
    humidity: { min: 40, max: 90 },
    ph: { min: 5.5, max: 7.5 },
    light_intensity: { min: 0, max: 100000 },
};

interface SensorMessage {
    deviceId: string;
    farmId: string;
    userId: string;
    sensorType: 'soil_moisture' | 'temperature' | 'humidity' | 'ph' | 'light_intensity';
    value: number;
    unit: string;
    timestamp: string;
}

interface IoTEvent {
    deviceId: string;
    farmId: string;
    userId: string;
    sensorType: string;
    value: number;
    unit: string;
    timestamp?: string;
}

/**
 * IoT Ingest Lambda Handler
 * Triggered by IoT Core rule when sensor data is published
 * Requirements: 9.2, 9.3, 9.5
 */
export const handler = async (event: IoTEvent): Promise<void> => {
    console.log('Received IoT event:', JSON.stringify(event));

    try {
        // Validate sensor message format (Requirement 9.2)
        const validationError = validateSensorMessage(event);
        if (validationError) {
            console.error('Validation error:', validationError);
            throw new Error(validationError);
        }

        // Parse sensor data
        const sensorData: SensorMessage = {
            deviceId: event.deviceId,
            farmId: event.farmId,
            userId: event.userId,
            sensorType: event.sensorType as SensorMessage['sensorType'],
            value: event.value,
            unit: event.unit,
            timestamp: event.timestamp || new Date().toISOString(),
        };

        // Store data in SensorData table (Requirement 9.3)
        await storeSensorData(sensorData);

        // Check threshold exceedance (Requirement 9.5)
        const thresholdExceeded = checkThresholdExceedance(sensorData);
        if (thresholdExceeded) {
            await triggerAlert(sensorData, thresholdExceeded);
        }

        console.log('Sensor data processed successfully');
    } catch (error) {
        console.error('Error processing sensor data:', error);
        throw error;
    }
};

/**
 * Validate sensor message format
 */
function validateSensorMessage(event: IoTEvent): string | null {
    if (!event.deviceId || typeof event.deviceId !== 'string') {
        return 'Missing or invalid deviceId';
    }

    if (!event.farmId || typeof event.farmId !== 'string') {
        return 'Missing or invalid farmId';
    }

    if (!event.userId || typeof event.userId !== 'string') {
        return 'Missing or invalid userId';
    }

    if (!event.sensorType || typeof event.sensorType !== 'string') {
        return 'Missing or invalid sensorType';
    }

    const validSensorTypes = ['soil_moisture', 'temperature', 'humidity', 'ph', 'light_intensity'];
    if (!validSensorTypes.includes(event.sensorType)) {
        return `Invalid sensorType. Must be one of: ${validSensorTypes.join(', ')}`;
    }

    if (typeof event.value !== 'number' || isNaN(event.value)) {
        return 'Missing or invalid value (must be a number)';
    }

    if (!event.unit || typeof event.unit !== 'string') {
        return 'Missing or invalid unit';
    }

    return null;
}

/**
 * Store sensor data in DynamoDB
 */
async function storeSensorData(sensorData: SensorMessage): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60; // 90 days from now

    const item = {
        deviceId: sensorData.deviceId,
        timestamp: sensorData.timestamp,
        farmId: sensorData.farmId,
        userId: sensorData.userId,
        sensorType: sensorData.sensorType,
        value: sensorData.value,
        unit: sensorData.unit,
        farmIdSensorType: `${sensorData.farmId}#${sensorData.sensorType}`,
        ttl,
    };

    const command = new PutCommand({
        TableName: SENSOR_DATA_TABLE,
        Item: item,
    });

    await docClient.send(command);
    console.log('Sensor data stored in DynamoDB');
}

/**
 * Check if sensor value exceeds configured thresholds
 */
function checkThresholdExceedance(
    sensorData: SensorMessage
): { type: 'low' | 'high'; threshold: number } | null {
    const threshold = THRESHOLDS[sensorData.sensorType];
    if (!threshold) {
        return null;
    }

    if (sensorData.value < threshold.min) {
        return { type: 'low', threshold: threshold.min };
    }

    if (sensorData.value > threshold.max) {
        return { type: 'high', threshold: threshold.max };
    }

    return null;
}

/**
 * Trigger alert if threshold exceeded
 */
async function triggerAlert(
    sensorData: SensorMessage,
    exceedance: { type: 'low' | 'high'; threshold: number }
): Promise<void> {
    console.log('Threshold exceeded, triggering alert');

    const alertPayload = {
        userId: sensorData.userId,
        farmId: sensorData.farmId,
        type: `${sensorData.sensorType}_${exceedance.type}`,
        severity: 'high',
        message: `${getSensorDisplayName(sensorData.sensorType)} ${exceedance.type === 'low' ? 'dropped below' : 'exceeded'} threshold. Current value: ${sensorData.value}${sensorData.unit}, Threshold: ${exceedance.threshold}${sensorData.unit}`,
        metadata: {
            deviceId: sensorData.deviceId,
            sensorType: sensorData.sensorType,
            value: sensorData.value,
            unit: sensorData.unit,
            threshold: exceedance.threshold,
            exceedanceType: exceedance.type,
        },
    };

    // Invoke alert Lambda function
    const command = new InvokeCommand({
        FunctionName: ALERT_LAMBDA_ARN,
        InvocationType: 'Event', // Async invocation
        Payload: Buffer.from(JSON.stringify(alertPayload)),
    });

    await lambdaClient.send(command);
    console.log('Alert triggered successfully');
}

/**
 * Get display name for sensor type
 */
function getSensorDisplayName(sensorType: string): string {
    const displayNames: Record<string, string> = {
        soil_moisture: 'Soil moisture',
        temperature: 'Temperature',
        humidity: 'Humidity',
        ph: 'pH level',
        light_intensity: 'Light intensity',
    };
    return displayNames[sensorType] || sensorType;
}
