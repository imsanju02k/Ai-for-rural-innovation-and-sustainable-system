/**
 * Farm Create Handler
 * Creates a new farm for the authenticated user
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import {
    parseBody,
    getRequestId,
    created,
    badRequest,
    internalServerError,
} from '../../shared/utils/response';
import { putItem } from '../../shared/utils/dynamodb';
import { CreateFarmInputSchema, Farm } from '../../shared/models/farm';

const FARMS_TABLE = process.env.FARMS_TABLE || '';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = getRequestId(event);

    try {
        // Extract userId from authorizer context
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return badRequest('User ID not found in request context', requestId);
        }

        // Parse and validate request body
        const body = parseBody(event.body);
        if (!body) {
            return badRequest('Request body is required', requestId);
        }

        const validationResult = CreateFarmInputSchema.safeParse(body);
        if (!validationResult.success) {
            return badRequest(
                'Invalid farm data',
                requestId,
                validationResult.error.errors
            );
        }

        const input = validationResult.data;

        // Generate farmId and timestamps
        const farmId = randomUUID();
        const now = new Date().toISOString();

        // Create farm object
        const farm: Farm = {
            farmId,
            userId,
            name: input.name,
            location: input.location,
            cropTypes: input.cropTypes,
            acreage: input.acreage,
            soilType: input.soilType,
            createdAt: now,
            updatedAt: now,
        };

        // Store farm in DynamoDB
        await putItem(FARMS_TABLE, farm);

        console.log('Farm created successfully', {
            farmId,
            userId,
            requestId,
        });

        return created(farm);
    } catch (error) {
        console.error('Error creating farm', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId,
        });

        return internalServerError('Failed to create farm', requestId);
    }
}
