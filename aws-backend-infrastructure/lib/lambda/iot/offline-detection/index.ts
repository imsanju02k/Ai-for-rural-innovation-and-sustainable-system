import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { ScheduledEvent } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const lambdaClient = new LambdaClient({});

const SENSOR_DATA_TABLE = process.env.SENSOR_DATA_TABLE || '';
const ALERT_LAMBDA_ARN = process.env.ALERT_LAMBDA_ARN || '';
const OFFLINE_TIMEOUT_MINUTES = parseInt(process.env.OFFLINE_TIMEOUT_MINUTES || '30', 10);
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';

interface DeviceStatus {
    deviceId: string;
    farmId: string;
    userId: string;
    sensorType: string;
    lastMessageTimestamp: string;
    isOffline: boolean;
}

interface OfflineEvent {
    deviceId: string;
    farmId: string;
    userId: string;
    sensorType: string;
    lastSeen: string;
    offlineDuration: number;
}

/**
 * Device Offline Detection Lambda Handler
 * Scheduled function that runs periodically to detect offline devices
 * Requirements: 9.8
 * 
 * This function:
 * 1. Queries the SensorData table to find the last message timestamp for each device
 * 2. Compares timestamps against the configured timeout threshold
 * 3. Identifies devices that have been offline beyond the timeout
 * 4. Logs offline events to CloudWatch
 * 5. Sends notifications to users via the alert Lambda
 */
export const handler = async (event: ScheduledEvent): Promise<void> => {
    console.log('Starting device offline detection', {
        time: event.time,
        offlineTimeoutMinutes: OFFLINE_TIMEOUT_MINUTES,
    });

    try {
        // Get all unique devices and their last message timestamps
        const deviceStatuses = await getDeviceStatuses();
        console.log(`Found ${deviceStatuses.length} devices to check`);

        // Check each device for offline status
        const offlineDevices: OfflineEvent[] = [];
        const now = new Date();
        const timeoutThreshold = new Date(now.getTime() - OFFLINE_TIMEOUT_MINUTES * 60 * 1000);

        for (const device of deviceStatuses) {
            const lastMessageTime = new Date(device.lastMessageTimestamp);

            if (lastMessageTime < timeoutThreshold) {
                const offlineDurationMinutes = Math.floor(
                    (now.getTime() - lastMessageTime.getTime()) / (60 * 1000)
                );

                const offlineEvent: OfflineEvent = {
                    deviceId: device.deviceId,
                    farmId: device.farmId,
                    userId: device.userId,
                    sensorType: device.sensorType,
                    lastSeen: device.lastMessageTimestamp,
                    offlineDuration: offlineDurationMinutes,
                };

                offlineDevices.push(offlineEvent);

                // Log offline event to CloudWatch (Requirement 9.8)
                console.log('Device offline detected', {
                    deviceId: device.deviceId,
                    farmId: device.farmId,
                    userId: device.userId,
                    sensorType: device.sensorType,
                    lastSeen: device.lastMessageTimestamp,
                    offlineDurationMinutes,
                    timeoutThresholdMinutes: OFFLINE_TIMEOUT_MINUTES,
                });
            }
        }

        // Send notifications for offline devices (Requirement 9.8)
        if (offlineDevices.length > 0) {
            console.log(`Detected ${offlineDevices.length} offline devices, sending notifications`);
            await sendOfflineNotifications(offlineDevices);
        } else {
            console.log('No offline devices detected');
        }

        console.log('Device offline detection completed successfully', {
            totalDevices: deviceStatuses.length,
            offlineDevices: offlineDevices.length,
        });
    } catch (error) {
        console.error('Error during offline detection', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
};

/**
 * Get the status of all devices by querying their last message timestamps
 * Uses a scan with projection to get unique devices and their latest timestamps
 */
async function getDeviceStatuses(): Promise<DeviceStatus[]> {
    const deviceMap = new Map<string, DeviceStatus>();
    let lastEvaluatedKey: Record<string, any> | undefined;

    // Scan the sensor data table to find all unique devices
    // Note: In production, consider maintaining a separate DeviceRegistry table
    // to avoid scanning the entire sensor data table
    do {
        const command = new ScanCommand({
            TableName: SENSOR_DATA_TABLE,
            ProjectionExpression: 'deviceId, farmId, userId, sensorType, #ts',
            ExpressionAttributeNames: {
                '#ts': 'timestamp',
            },
            ExclusiveStartKey: lastEvaluatedKey,
            Limit: 1000, // Process in batches
        });

        const response = await docClient.send(command);
        const items = response.Items || [];

        // Track the latest timestamp for each device
        for (const item of items) {
            const deviceId = item.deviceId as string;
            const timestamp = item.timestamp as string;

            const existing = deviceMap.get(deviceId);
            if (!existing || timestamp > existing.lastMessageTimestamp) {
                deviceMap.set(deviceId, {
                    deviceId,
                    farmId: item.farmId as string,
                    userId: item.userId as string,
                    sensorType: item.sensorType as string,
                    lastMessageTimestamp: timestamp,
                    isOffline: false,
                });
            }
        }

        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return Array.from(deviceMap.values());
}

/**
 * Send offline notifications to users via the alert Lambda
 * Groups devices by user to send consolidated alerts
 */
async function sendOfflineNotifications(offlineDevices: OfflineEvent[]): Promise<void> {
    // Group offline devices by user
    const devicesByUser = new Map<string, OfflineEvent[]>();

    for (const device of offlineDevices) {
        const userDevices = devicesByUser.get(device.userId) || [];
        userDevices.push(device);
        devicesByUser.set(device.userId, userDevices);
    }

    // Send alert for each user
    const alertPromises: Promise<void>[] = [];

    for (const [userId, devices] of devicesByUser.entries()) {
        // Group by farm for better organization
        const devicesByFarm = new Map<string, OfflineEvent[]>();
        for (const device of devices) {
            const farmDevices = devicesByFarm.get(device.farmId) || [];
            farmDevices.push(device);
            devicesByFarm.set(device.farmId, farmDevices);
        }

        // Create alert for each farm
        for (const [farmId, farmDevices] of devicesByFarm.entries()) {
            alertPromises.push(
                sendOfflineAlert(userId, farmId, farmDevices)
            );
        }
    }

    // Send all alerts in parallel
    await Promise.allSettled(alertPromises);
}

/**
 * Send a single offline alert for a farm's devices
 */
async function sendOfflineAlert(
    userId: string,
    farmId: string,
    devices: OfflineEvent[]
): Promise<void> {
    try {
        const deviceCount = devices.length;
        const deviceList = devices
            .map(d => `${d.deviceId} (${d.sensorType})`)
            .join(', ');

        const message = deviceCount === 1
            ? `Sensor ${devices[0].deviceId} (${devices[0].sensorType}) has gone offline. Last seen: ${formatTimestamp(devices[0].lastSeen)}. Duration: ${devices[0].offlineDuration} minutes.`
            : `${deviceCount} sensors have gone offline: ${deviceList}. Please check your devices.`;

        const alertPayload = {
            userId,
            farmId,
            type: 'device_offline',
            severity: deviceCount > 2 ? 'high' : 'medium',
            message,
            metadata: {
                offlineDevices: devices.map(d => ({
                    deviceId: d.deviceId,
                    sensorType: d.sensorType,
                    lastSeen: d.lastSeen,
                    offlineDurationMinutes: d.offlineDuration,
                })),
                detectedAt: new Date().toISOString(),
                offlineTimeoutMinutes: OFFLINE_TIMEOUT_MINUTES,
            },
        };

        // Invoke alert Lambda function
        const command = new InvokeCommand({
            FunctionName: ALERT_LAMBDA_ARN,
            InvocationType: 'Event', // Async invocation
            Payload: Buffer.from(JSON.stringify(alertPayload)),
        });

        await lambdaClient.send(command);

        console.log('Offline alert sent successfully', {
            userId,
            farmId,
            deviceCount,
        });
    } catch (error) {
        console.error('Error sending offline alert', {
            error: error instanceof Error ? error.message : String(error),
            userId,
            farmId,
            deviceCount: devices.length,
        });
        // Don't throw - continue processing other alerts
    }
}

/**
 * Format timestamp for display in alert messages
 */
function formatTimestamp(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (60 * 1000));

    if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
    } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        const days = Math.floor(diffMinutes / 1440);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
}
