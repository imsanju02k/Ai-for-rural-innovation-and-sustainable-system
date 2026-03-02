import { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE!;

interface SubscribeMessage {
    action: 'subscribe';
    farmId: string;
    topics: string[];
}

interface UnsubscribeMessage {
    action: 'unsubscribe';
    farmId: string;
    topics: string[];
}

export const handler = async (
    event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> => {
    const connectionId = event.requestContext.connectionId;
    const routeKey = event.requestContext.routeKey;

    console.log('WebSocket message:', { connectionId, routeKey });

    try {
        const body = JSON.parse(event.body || '{}');

        if (routeKey === 'subscribe') {
            return await handleSubscribe(connectionId, body as SubscribeMessage);
        } else if (routeKey === 'unsubscribe') {
            return await handleUnsubscribe(connectionId, body as UnsubscribeMessage);
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unknown action' }),
        };
    } catch (error) {
        console.error('Error handling message:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};

async function handleSubscribe(
    connectionId: string,
    message: SubscribeMessage
): Promise<APIGatewayProxyResultV2> {
    const { farmId, topics } = message;

    console.log('Subscribe request:', { connectionId, farmId, topics });

    // Update connection with farmId and topics
    await docClient.send(
        new PutCommand({
            TableName: CONNECTIONS_TABLE,
            Item: {
                connectionId,
                farmId,
                topics,
                subscribedAt: new Date().toISOString(),
                ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hours
            },
        })
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Subscribed successfully',
            farmId,
            topics,
        }),
    };
}

async function handleUnsubscribe(
    connectionId: string,
    message: UnsubscribeMessage
): Promise<APIGatewayProxyResultV2> {
    const { farmId } = message;

    console.log('Unsubscribe request:', { connectionId, farmId });

    // Remove connection
    await docClient.send(
        new DeleteCommand({
            TableName: CONNECTIONS_TABLE,
            Key: {
                connectionId,
                farmId,
            },
        })
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Unsubscribed successfully',
            farmId,
        }),
    };
}
