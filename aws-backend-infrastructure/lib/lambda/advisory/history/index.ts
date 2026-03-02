import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Initialize AWS clients
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const CHAT_MESSAGES_TABLE = process.env.CHAT_MESSAGES_TABLE || '';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

interface ChatMessage {
    messageId: string;
    userId: string;
    farmId?: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
        sources?: string[];
        recommendations?: Array<{
            type: string;
            action: string;
            timeframe?: string;
        }>;
        processingTimeMs?: number;
    };
    timestamp: string;
}

/**
 * Advisory History Lambda Handler
 * Retrieves conversation history for a user
 * Requirements: 7.7
 */
export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const requestId = event.requestContext.requestId;

    try {
        // Extract userId from authorizer context
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated', requestId);
        }

        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        const limit = Math.min(
            parseInt(queryParams.limit || String(DEFAULT_LIMIT), 10),
            MAX_LIMIT
        );
        const before = queryParams.before; // Timestamp for pagination
        const farmId = queryParams.farmId; // Optional filter by farmId

        // Validate limit
        if (isNaN(limit) || limit < 1) {
            return errorResponse(400, 'VALIDATION_ERROR', 'Invalid limit parameter', requestId);
        }

        // Query conversation history
        const messages = await getConversationHistory(userId, limit, before, farmId);

        // Check if there are more messages
        const hasMore = messages.length === limit;

        return successResponse(200, {
            messages,
            count: messages.length,
            hasMore,
            nextBefore: hasMore && messages.length > 0 ? messages[messages.length - 1].timestamp : null,
        });
    } catch (error: any) {
        console.error('Error retrieving conversation history', {
            error: error.message,
            stack: error.stack,
            requestId,
        });

        return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred', requestId);
    }
};

/**
 * Get conversation history from DynamoDB
 */
async function getConversationHistory(
    userId: string,
    limit: number,
    before?: string,
    farmId?: string
): Promise<ChatMessage[]> {
    const params: any = {
        TableName: CHAT_MESSAGES_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId,
        },
        ScanIndexForward: false, // Most recent first
        Limit: limit,
    };

    // Add pagination support with 'before' timestamp
    if (before) {
        params.KeyConditionExpression += ' AND #timestamp < :before';
        params.ExpressionAttributeNames = {
            '#timestamp': 'timestamp',
        };
        params.ExpressionAttributeValues[':before'] = before;
    }

    // Filter by farmId if provided
    if (farmId) {
        params.FilterExpression = 'farmId = :farmId';
        params.ExpressionAttributeValues[':farmId'] = farmId;
    }

    try {
        const result = await dynamoClient.send(new QueryCommand(params));
        return (result.Items || []) as ChatMessage[];
    } catch (error) {
        console.error('Error querying conversation history', { error, userId, farmId });
        throw error;
    }
}

/**
 * Success response helper
 */
function successResponse(statusCode: number, data: any): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(data),
    };
}

/**
 * Error response helper
 */
function errorResponse(
    statusCode: number,
    code: string,
    message: string,
    requestId: string
): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
            'X-Request-Id': requestId,
        },
        body: JSON.stringify({
            error: {
                code,
                message,
                requestId,
                timestamp: new Date().toISOString(),
            },
        }),
    };
}
