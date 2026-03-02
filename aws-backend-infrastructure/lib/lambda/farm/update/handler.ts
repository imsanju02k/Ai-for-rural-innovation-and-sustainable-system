/**
 * Farm Update Handler
 * Updates an existing farm
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    parseBody,
    getRequestId,
    ok,
    badRequest,
    notFound,
    forbidden,
    internalServerError,
} from '../../shared/utils/response';
import { queryItems, updateItem, buildUpdateExpression } from '../../shared/utils/dynamodb';
import { UpdateFarmInputSchema, Farm } from '../../shared/models/farm';
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

        // Parse and validate request body
        const body = parseBody(event.body);
        if (!body) {
            return badRequest('Request body is required', requestId);
        }

        const validationResult = UpdateFarmInputSchema.safeParse(body);
        if (!validationResult.success) {
            return badRequest(
                'Invalid farm data',
                requestId,
                validationResult.error.errors
            );
        }

        const updates = validationResult.data;

        // Check if there are any updates
        if (Object.keys(updates).length === 0) {
            return badRequest('No updates provided', requestId);
        }

        // Query farm using GSI-1 to verify existence and ownership
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
            return forbidden('You do not have permission to update this farm', requestId);
        }

        // Add updatedAt timestamp
        const updatesWithTimestamp = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        // Build update expression
        const { updateExpression, expressionAttributeNames, expressionAttributeValues } =
            buildUpdateExpression(updatesWithTimestamp);

        // Update farm in DynamoDB
        const updatedFarm = await updateItem(
            FARMS_TABLE,
            {
                userId: farm.userId,
                farmId: farm.farmId,
            },
            updateExpression,
            expressionAttributeValues,
            {
                expressionAttributeNames,
                returnValues: 'ALL_NEW',
            }
        );

        console.log('Farm updated successfully', {
            farmId,
            userId,
            requestId,
        });

        return ok(updatedFarm);
    } catch (error) {
        console.error('Error updating farm', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId,
        });

        return internalServerError('Failed to update farm', requestId);
    }
}
