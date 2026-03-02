import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE!;
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT!;

const apiGatewayClient = new ApiGatewayManagementApiClient({
    endpoint: WEBSOCKET_ENDPOINT,
});

interface IoTEvent {
    farmId: string;
    deviceId: string;
    sensorType: string;
    value: number;
    unit: string;
    timestamp: string;
}

interface AlertEvent {
    farmId: string;
    alertId: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
}

export const handler = async (event: any): Promise<void> => {
    console.log('IoT stream event:', JSON.stringify(event));

    try {
        // Determine event type
        const eventType = event.type || 'sensor_update';
        const farmId = event.farmId;

        if (!farmId) {
            console.error('No farmId in event');
            return;
        }

        // Query connections subscribed to this farm
        const connections = await getConnectionsForFarm(farmId);

        console.log(`Found ${connections.length} connections for farm ${farmId}`);

        // Send message to all connected clients
        const sendPromises = connections.map((connection) =>
            sendMessageToConnection(connection.connectionId, {
                type: eventType,
                payload: event,
                timestamp: new Date().toISOString(),
            })
        );

        await Promise.allSettled(sendPromises);
    } catch (error) {
        console.error('Error streaming IoT data:', error);
    }
};

async function getConnectionsForFarm(farmId: string): Promise<any[]> {
    const result = await docClient.send(
        new QueryCommand({
            TableName: CONNECTIONS_TABLE,
            IndexName: 'FarmIdIndex',
            KeyConditionExpression: 'farmId = :farmId',
            ExpressionAttributeValues: {
                ':farmId': farmId,
            },
        })
    );

    return result.Items || [];
}

async function sendMessageToConnection(
    connectionId: string,
    message: any
): Promise<void> {
    try {
        await apiGatewayClient.send(
            new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: Buffer.from(JSON.stringify(message)),
            })
        );
        console.log(`Message sent to connection ${connectionId}`);
    } catch (error: any) {
        if (error.statusCode === 410) {
            console.log(`Connection ${connectionId} is stale, removing...`);
            // Connection is stale, should be removed from DynamoDB
            // This would be handled by the disconnect handler
        } else {
            console.error(`Error sending to connection ${connectionId}:`, error);
        }
    }
}
