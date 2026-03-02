/**
 * Alert List Handler
 * Lists alerts with filtering and pagination support
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    getRequestId,
    ok,
    badRequest,
    internalServerError,
} from '../../shared/utils/response';
import { queryItems } from '../../shared/utils/dynamodb';
import { Alert, AlertSeverity, AlertStatus } from '../../shared/models/alert';

const ALERTS_TABLE = process.env.ALERTS_TABLE || '';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = getRequestId(event);

    try {
        // Extract userId from authorizer context
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return badRequest('User ID not found in request context', requestId);
        }

        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        const farmId = queryParams.farmId;
        const severity = queryParams.severity;
        const status = queryParams.status;
        const limit = parseInt(queryParams.limit || '20', 10);

        // Validate severity if provided
        if (severity && !['low', 'medium', 'high', 'critical'].includes(severity)) {
            return badRequest('Invalid severity value', requestId);
        }

        // Validate status if provided
        if (status && !['active', 'acknowledged', 'resolved'].includes(status)) {
            return badRequest('Invalid status value', requestId);
        }

        // Validate limit
        if (limit < 1 || limit > 100) {
            return badRequest('Limit must be between 1 and 100', requestId);
        }

        let alerts: Alert[] = [];
        let lastEvaluatedKey: Record<string, any> | undefined;

        // Query by farmId if provided (using GSI-1)
        if (farmId) {
            const result = await queryItems<Alert>(
                ALERTS_TABLE,
                'farmId = :farmId',
                {
                    ':farmId': farmId,
                },
                {
                    indexName: 'GSI-1',
                    limit,
                    scanIndexForward: false, // Most recent first
                }
            );

            alerts = result.items;
            lastEvaluatedKey = result.lastEvaluatedKey;
        }
        // Query by status if provided (using GSI-2)
        else if (status) {
            const result = await queryItems<Alert>(
                ALERTS_TABLE,
                '#status = :status',
                {
                    ':status': status,
                },
                {
                    indexName: 'GSI-2',
                    expressionAttributeNames: {
                        '#status': 'status',
                    },
                    limit,
                    scanIndexForward: false, // Most recent first
                }
            );

            alerts = result.items;
            lastEvaluatedKey = result.lastEvaluatedKey;
        }
        // Query by userId (primary key)
        else {
            const result = await queryItems<Alert>(
                ALERTS_TABLE,
                'userId = :userId',
                {
                    ':userId': userId,
                },
                {
                    limit,
                    scanIndexForward: false, // Most recent first
                }
            );

            alerts = result.items;
            lastEvaluatedKey = result.lastEvaluatedKey;
        }

        // Apply client-side filtering for severity if provided
        // (DynamoDB doesn't support multiple GSI queries simultaneously)
        if (severity) {
            alerts = alerts.filter((alert) => alert.severity === severity);
        }

        // Apply client-side filtering for status if not already queried by status
        if (status && !queryParams.status) {
            alerts = alerts.filter((alert) => alert.status === status);
        }

        // Apply client-side filtering for userId if queried by farmId or status
        if (farmId || status) {
            alerts = alerts.filter((alert) => alert.userId === userId);
        }

        console.log('Alerts retrieved successfully', {
            userId,
            farmId,
            severity,
            status,
            count: alerts.length,
            requestId,
        });

        return ok({
            alerts,
            count: alerts.length,
            ...(lastEvaluatedKey && { nextToken: JSON.stringify(lastEvaluatedKey) }),
        });
    } catch (error) {
        console.error('Error listing alerts', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId,
        });

        return internalServerError('Failed to list alerts', requestId);
    }
}
