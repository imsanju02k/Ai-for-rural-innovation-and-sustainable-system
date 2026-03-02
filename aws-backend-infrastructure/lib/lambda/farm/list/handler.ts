/**
 * Farm List Handler
 * Retrieves all farms for the authenticated user
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getRequestId,
    ok,
    badRequest,
    internalServerError,
} from '../../shared/utils/response';
import { queryItems } from '../../shared/utils/dynamodb';
import { Farm } from '../../shared/models/farm';

const FARMS_TABLE = process.env.FARMS_TABLE || '';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = getRequestId(event);

    try {
        // Extract userId from authorizer context
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return badRequest('User ID not found in request context', requestId);
        }

        // Parse pagination parameters
        const limit = event.queryStringParameters?.limit
            ? parseInt(event.queryStringParameters.limit, 10)
            : 50;
        const exclusiveStartKey = event.queryStringParameters?.nextToken
            ? JSON.parse(Buffer.from(event.queryStringParameters.nextToken, 'base64').toString())
            : undefined;

        // Query farms by userId (partition key)
        const result = await queryItems<Farm>(
            FARMS_TABLE,
            'userId = :userId',
            {
                ':userId': userId,
            },
            {
                filterExpression: 'attribute_not_exists(deletedAt)',
                limit,
                exclusiveStartKey,
                scanIndexForward: false, // Most recent first
            }
        );

        // Filter out deleted farms and prepare response
        const farms = result.items.filter((farm) => !farm.deletedAt);

        // Encode nextToken for pagination
        const nextToken = result.lastEvaluatedKey
            ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
            : undefined;

        console.log('Farms retrieved successfully', {
            userId,
            count: farms.length,
            requestId,
        });

        return ok({
            farms,
            count: farms.length,
            ...(nextToken && { nextToken }),
        });
    } catch (error) {
        console.error('Error listing farms', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId,
        });

        return internalServerError('Failed to retrieve farms', requestId);
    }
}
