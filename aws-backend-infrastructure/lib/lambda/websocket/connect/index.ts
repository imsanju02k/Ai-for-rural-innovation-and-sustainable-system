import { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE!;

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  const timestamp = new Date().toISOString();

  console.log('WebSocket connection request:', { connectionId, timestamp });

  try {
    // Store connection in DynamoDB
    // Note: farmId will be set when client sends subscribe message
    await docClient.send(
      new PutCommand({
        TableName: CONNECTIONS_TABLE,
        Item: {
          connectionId,
          farmId: 'pending', // Will be updated on subscribe
          connectedAt: timestamp,
          ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        },
      })
    );

    console.log('Connection stored successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected' }),
    };
  } catch (error) {
    console.error('Error storing connection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to connect' }),
    };
  }
};
