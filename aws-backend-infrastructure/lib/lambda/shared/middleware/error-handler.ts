/**
 * Error Handler Middleware
 * Catches and formats errors in Lambda functions
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ZodError } from 'zod';
import {
    badRequest,
    internalServerError,
    serviceUnavailable,
    getRequestId,
} from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Custom error classes
 */
export class ValidationError extends Error {
    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class ConflictError extends Error {
    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'ConflictError';
    }
}

export class ServiceUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ServiceUnavailableError';
    }
}

/**
 * Lambda handler type
 */
export type LambdaHandler = (
    event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

/**
 * Error handler middleware wrapper
 */
export function withErrorHandler(handler: LambdaHandler): LambdaHandler {
    return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        const requestId = getRequestId(event);
        const log = logger.child({ requestId });

        try {
            return await handler(event);
        } catch (error: any) {
            // Log error with context
            log.error('Lambda function error', error, {
                path: event.path,
                method: event.httpMethod,
                errorName: error.name,
            });

            // Handle Zod validation errors
            if (error instanceof ZodError) {
                const details = error.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                }));
                return badRequest('Validation failed', requestId, details);
            }

            // Handle custom validation errors
            if (error instanceof ValidationError) {
                return badRequest(error.message, requestId, error.details);
            }

            // Handle not found errors
            if (error instanceof NotFoundError) {
                return {
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: {
                            code: 'NOT_FOUND',
                            message: error.message,
                            requestId,
                            timestamp: new Date().toISOString(),
                        },
                    }),
                };
            }

            // Handle unauthorized errors
            if (error instanceof UnauthorizedError) {
                return {
                    statusCode: 401,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: {
                            code: 'UNAUTHORIZED',
                            message: error.message,
                            requestId,
                            timestamp: new Date().toISOString(),
                        },
                    }),
                };
            }

            // Handle forbidden errors
            if (error instanceof ForbiddenError) {
                return {
                    statusCode: 403,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: {
                            code: 'FORBIDDEN',
                            message: error.message,
                            requestId,
                            timestamp: new Date().toISOString(),
                        },
                    }),
                };
            }

            // Handle conflict errors
            if (error instanceof ConflictError) {
                return {
                    statusCode: 409,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: {
                            code: 'CONFLICT',
                            message: error.message,
                            requestId,
                            details: error.details,
                            timestamp: new Date().toISOString(),
                        },
                    }),
                };
            }

            // Handle service unavailable errors
            if (error instanceof ServiceUnavailableError) {
                return serviceUnavailable(error.message, requestId);
            }

            // Handle AWS SDK errors
            if (error.name === 'ResourceNotFoundException') {
                return {
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Resource not found',
                            requestId,
                            timestamp: new Date().toISOString(),
                        },
                    }),
                };
            }

            if (error.name === 'ConditionalCheckFailedException') {
                return {
                    statusCode: 409,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: {
                            code: 'CONFLICT',
                            message: 'Resource already exists or condition not met',
                            requestId,
                            timestamp: new Date().toISOString(),
                        },
                    }),
                };
            }

            // Default to internal server error
            return internalServerError('An unexpected error occurred', requestId);
        }
    };
}
