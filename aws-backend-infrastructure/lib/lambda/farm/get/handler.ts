/**
 * Farm Get Handler
 * Retrieves a specific farm by farmId
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getRequestId,
    ok,
    badRequest,
    notFound,
    forbidden,
    internalServerError,
} from '../../shared/utils/response';
import { queryItems } from '../../shared/utils/dynamodb';
import { Farm } from '../../shared/models/farm';
import { isValidUUID } from '../../shared/utils/validation';

const FARMS_TABLE = process.env.FARMS_TABLE || '';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = getRequestId(event);

    try {
        // Extract userId from authorizer context
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return badRequest('User ID not found in request context', requestId);
        }

        // Extract farmId from path parameters
        const farmId = event.pathParameters?.farmId;
        if (!farmId) {
            return badRequest('Farm ID is required', requestId);
        }

        // Validate farmId format
        if (!isValidUUID(farmId)) {
            return badRequest('Invalid farm ID format', requestId);
        }

        // Query farm using GSI-1 (farmId as partition key)
        const result = await queryItems<Farm>(
            FARMS_TABLE,
            'farmId = :farmId',
            {
                ':farmId': farmId,
            },
            {
                indexName: 'GSI-1',
                limit: 1,
            }
        );

        // Check if farm exists
        if (result.items.length === 0) {
            return notFound('Farm not found', requestId);
        }

        const farm = result.items[0];

        // Check if farm is deleted
        if (farm.deletedAt) {
            return notFound('Farm not found', requestId);
        }

        // Verify user ownership
        if (farm.userId !== userId) {
            return forbidden('You do not have permission to access this farm', requestId);
        }

        console.log('Farm retrieved successfully', {
            farmId,
            userId,
            requestId,
        });

        return ok(farm);
    } catch (error) {
        console.error('Error retrieving farm', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId,
        });

        return internalServerError('Failed to retrieve farm', requestId);
    }
}
