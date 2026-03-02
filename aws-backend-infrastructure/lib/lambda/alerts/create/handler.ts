/**
 * Alert Create Handler
 * Creates alerts and sends notifications via SNS and SES
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
    parseBody,
    getRequestId,
    created,
    badRequest,
    internalServerError,
} from '../../shared/utils/response';
import { putItem } from '../../shared/utils/dynamodb';
import { CreateAlertInputSchema, Alert } from '../../shared/models/alert';

const ALERTS_TABLE = process.env.ALERTS_TABLE || '';
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || '';
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || 'alerts@farmplatform.example.com';
const SES_ENABLED = process.env.SES_ENABLED === 'true';

const snsClient = new SNSClient({});
const sesClient = new SESClient({});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = getRequestId(event);

    try {
        // Parse and validate request body
        const body = parseBody(event.body);
        if (!body) {
            return badRequest('Request body is required', requestId);
        }

        const validationResult = CreateAlertInputSchema.safeParse(body);
        if (!validationResult.success) {
            return badRequest(
                'Invalid alert data',
                requestId,
                validationResult.error.errors
            );
        }

        const input = validationResult.data;

        // Generate alertId and timestamp
        const alertId = randomUUID();
        const now = new Date().toISOString();

        // Create alert object
        const alert: Alert = {
            alertId,
            userId: input.userId,
            farmId: input.farmId,
            type: input.type,
            severity: input.severity,
            message: input.message,
            status: 'active',
            metadata: input.metadata,
            createdAt: now,
            acknowledgedAt: null,
            acknowledgedBy: null,
            note: null,
            resolvedAt: null,
        };

        // Store alert in DynamoDB
        await putItem(ALERTS_TABLE, alert);

        console.log('Alert created successfully', {
            alertId,
            userId: input.userId,
            farmId: input.farmId,
            severity: input.severity,
            requestId,
        });

        // Publish to SNS topic for notifications
        try {
            await snsClient.send(
                new PublishCommand({
                    TopicArn: SNS_TOPIC_ARN,
                    Message: JSON.stringify({
                        alertId,
                        userId: input.userId,
                        farmId: input.farmId,
                        type: input.type,
                        severity: input.severity,
                        message: input.message,
                        createdAt: now,
                    }),
                    Subject: `Farm Alert: ${input.severity.toUpperCase()} - ${input.type}`,
                    MessageAttributes: {
                        severity: {
                            DataType: 'String',
                            StringValue: input.severity,
                        },
                        alertType: {
                            DataType: 'String',
                            StringValue: input.type,
                        },
                    },
                })
            );

            console.log('Alert published to SNS', { alertId, requestId });
        } catch (snsError) {
            console.error('Failed to publish to SNS', {
                error: snsError instanceof Error ? snsError.message : 'Unknown error',
                alertId,
                requestId,
            });
            // Continue execution - SNS failure shouldn't block alert creation
        }

        // Send email via SES if critical and SES is enabled
        if (input.severity === 'critical' && SES_ENABLED) {
            try {
                // In production, fetch user email from Users table
                // For now, using a placeholder
                const userEmail = input.metadata?.userEmail || 'user@example.com';

                await sesClient.send(
                    new SendEmailCommand({
                        Source: SES_FROM_EMAIL,
                        Destination: {
                            ToAddresses: [userEmail],
                        },
                        Message: {
                            Subject: {
                                Data: `CRITICAL ALERT: ${input.type}`,
                            },
                            Body: {
                                Text: {
                                    Data: `Critical Alert Notification\n\n` +
                                        `Alert ID: ${alertId}\n` +
                                        `Type: ${input.type}\n` +
                                        `Severity: ${input.severity}\n` +
                                        `Message: ${input.message}\n\n` +
                                        `Farm ID: ${input.farmId}\n` +
                                        `Time: ${now}\n\n` +
                                        `Please take immediate action.`,
                                },
                                Html: {
                                    Data: `
                                        <html>
                                        <body>
                                            <h2 style="color: #d32f2f;">Critical Alert Notification</h2>
                                            <p><strong>Alert ID:</strong> ${alertId}</p>
                                            <p><strong>Type:</strong> ${input.type}</p>
                                            <p><strong>Severity:</strong> <span style="color: #d32f2f;">${input.severity.toUpperCase()}</span></p>
                                            <p><strong>Message:</strong> ${input.message}</p>
                                            <hr>
                                            <p><strong>Farm ID:</strong> ${input.farmId}</p>
                                            <p><strong>Time:</strong> ${now}</p>
                                            <p style="color: #d32f2f;"><strong>Please take immediate action.</strong></p>
                                        </body>
                                        </html>
                                    `,
                                },
                            },
                        },
                    })
                );

                console.log('Critical alert email sent via SES', { alertId, userEmail, requestId });
            } catch (sesError) {
                console.error('Failed to send email via SES', {
                    error: sesError instanceof Error ? sesError.message : 'Unknown error',
                    alertId,
                    requestId,
                });
                // Continue execution - SES failure shouldn't block alert creation
            }
        }

        return created(alert);
    } catch (error) {
        console.error('Error creating alert', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId,
        });

        return internalServerError('Failed to create alert', requestId);
    }
}
