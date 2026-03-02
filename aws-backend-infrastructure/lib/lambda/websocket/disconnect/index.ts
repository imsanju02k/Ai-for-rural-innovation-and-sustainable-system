import { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE!;

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  console.log('WebSocket disconnect request:', { connectionId });

  try {
    // Query to find the connection with its farmId
    const queryResult = await docClient.send(
      new QueryCommand({
        TableName: CONNECTIONS_TABLE,
        KeyConditionExpression: 'connectionId = :connectionId',
        ExpressionAttributeValues: {
          ':connectionId': connectionId,
        },
      })
    );

    // Delete all matching connections
    if (queryResult.Items && queryResult.Items.length > 0) {
      for (const item of queryResult.Items) {
        await docClient.send(
          new DeleteCommand({
            TableName: CONNECTIONS_TABLE,
            Key: {
              connectionId: item.connectionId,
              farmId: item.farmId,
            },
          })
        );
      }
    }

    console.log('Connection removed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Disconnected' }),
    };
  } catch (error) {
    console.error('Error removing connection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to disconnect' }),
    };
  }
};
