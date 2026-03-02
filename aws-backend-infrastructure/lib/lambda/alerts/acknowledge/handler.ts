/**
 * Alert Acknowledge Handler
 * Acknowledges an alert and updates its status
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
import { getItem, updateItem } from '../../shared/utils/dynamodb';
import { AcknowledgeAlertInputSchema, Alert } from '../../shared/models/alert';

const ALERTS_TABLE = process.env.ALERTS_TABLE || '';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = getRequestId(event);

    try {
        // Extract userId from authorizer context
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return badRequest('User ID not found in request context', requestId);
        }

        // Extract alertId from path parameters
        const alertId = event.pathParameters?.alertId;
        if (!alertId) {
            return badRequest('Alert ID is required', requestId);
        }

        // Parse and validate request body
        const body = parseBody(event.body);
        const validationResult = AcknowledgeAlertInputSchema.safeParse(body || {});
        if (!validationResult.success) {
            return badRequest(
                'Invalid acknowledgment data',
                requestId,
                validationResult.error.errors
            );
        }

        const input = validationResult.data;

        // First, we need to find the alert by alertId
        // Since alertId is not the primary key, we need to query by userId and filter
        // For simplicity, we'll use a scan approach or assume we have the createdAt
        // In production, consider adding a GSI on alertId

        // For now, let's query by userId and find the matching alertId
        // This is a workaround - ideally alertId should be a GSI
        const { queryItems } = await import('../../shared/utils/dynamodb');
        
        const result = await queryItems<Alert>(
            ALERTS_TABLE,
            'userId = :userId',
            {
                ':userId': userId,
            },
            {
                filterExpression: 'alertId = :alertId',
                expressionAttributeValues: {
                    ':alertId': alertId,
                },
            }
        );

        if (result.items.length === 0) {
            return notFound('Alert not found', requestId);
        }

        const alert = result.items[0];

        // Verify user ownership
        if (alert.userId !== userId) {
            return forbidden('You do not have permission to acknowledge this alert', requestId);
        }

        // Check if alert is already acknowledged
        if (alert.status === 'acknowledged' || alert.status === 'resolved') {
            return badRequest(
                `Alert is already ${alert.status}`,
                requestId
            );
        }

        // Update alert status
        const now = new Date().toISOString();
        const updatedAlert = await updateItem(
            ALERTS_TABLE,
            {
                userId: alert.userId,
                createdAt: alert.createdAt,
            },
            'SET #status = :status, acknowledgedAt = :acknowledgedAt, acknowledgedBy = :acknowledgedBy, note = :note',
            {
                ':status': 'acknowledged',
                ':acknowledgedAt': now,
                ':acknowledgedBy': userId,
                ':note': input.note || null,
            },
            {
                expressionAttributeNames: {
                    '#status': 'status',
                },
            }
        );

        console.log('Alert acknowledged successfully', {
            alertId,
            userId,
            requestId,
        });

        return ok({
            alertId: alert.alertId,
            status: 'acknowledged',
            acknowledgedAt: now,
            acknowledgedBy: userId,
            note: input.note || null,
            ...updatedAlert,
        });
    } catch (error) {
        console.error('Error acknowledging alert', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId,
        });

        return internalServerError('Failed to acknowledge alert', requestId);
    }
}
