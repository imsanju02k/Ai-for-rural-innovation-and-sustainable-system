import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Initialize AWS clients
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const OPTIMIZATIONS_TABLE = process.env.OPTIMIZATIONS_TABLE || '';

interface OptimizationHistoryQuery {
    farmId: string;
    type?: string;
    limit?: number;
}

/**
 * Optimization History Lambda Handler
 * Retrieves past optimization recommendations for a farm
 * Requirements: 8.7
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
        const farmId = event.queryStringParameters?.farmId;
        const type = event.queryStringParameters?.type;
        const limit = parseInt(event.queryStringParameters?.limit || '20', 10);

        // Validate required parameters
        if (!farmId) {
            return errorResponse(
                400,
                'VALIDATION_ERROR',
                'farmId query parameter is required',
                requestId
            );
        }

        // Validate optimization type if provided
        if (type) {
            const validTypes = ['water', 'fertilizer', 'schedule'];
            if (!validTypes.includes(type)) {
                return errorResponse(
                    400,
                    'VALIDATION_ERROR',
                    `type must be one of: ${validTypes.join(', ')}`,
                    requestId
                );
            }
        }

        // Validate limit
        if (limit < 1 || limit > 100) {
            return errorResponse(
                400,
                'VALIDATION_ERROR',
                'limit must be between 1 and 100',
                requestId
            );
        }

        // Query optimizations by farmId
        const optimizations = await queryOptimizationHistory(farmId, type, limit);

        // Return optimization history
        return successResponse(200, {
            optimizations,
            count: optimizations.length,
            farmId,
            ...(type && { type }),
        });
    } catch (error: any) {
        console.error('Error retrieving optimization history', {
            error: error.message,
            stack: error.stack,
            requestId,
        });

        return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred', requestId);
    }
};

async function queryOptimizationHistory(
    farmId: string,
    type?: string,
    limit: number = 20
): Promise<any[]> {
    try {
        const params: any = {
            TableName: OPTIMIZATIONS_TABLE,
            KeyConditionExpression: 'farmId = :farmId',
            ExpressionAttributeValues: {
                ':farmId': farmId,
            },
            ScanIndexForward: false, // Most recent first
            Limit: limit,
        };

        // Add filter for optimization type if specified
        if (type) {
            params.FilterExpression = '#type = :type';
            params.ExpressionAttributeNames = {
                '#type': 'type',
            };
            params.ExpressionAttributeValues[':type'] = type;
        }

        const result = await dynamoClient.send(new QueryCommand(params));

        // Transform results to match API response format
        return (result.Items || []).map((item: any) => ({
            optimizationId: item.optimizationId,
            type: item.type,
            estimatedSavings: item.recommendations?.estimatedSavings || {},
            calculatedAt: item.calculatedAt,
            recommendations: item.recommendations,
        }));
    } catch (error) {
        console.error('Error querying optimization history', { error, farmId, type });
        throw error;
    }
}

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
