/**
 * Response Formatter Utilities
 * Provides standardized response formats for API Gateway Lambda functions
 */

import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Standard API response headers
 */
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Configure based on environment
    'Access-Control-Allow-Credentials': 'true',
};

/**
 * Create a success response
 */
export function successResponse(
    statusCode: number,
    data: any,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            ...DEFAULT_HEADERS,
            ...headers,
        },
        body: JSON.stringify(data),
    };
}

/**
 * Create an error response
 */
export function errorResponse(
    statusCode: number,
    code: string,
    message: string,
    requestId?: string,
    details?: any,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            ...DEFAULT_HEADERS,
            ...headers,
            ...(requestId && { 'X-Request-Id': requestId }),
        },
        body: JSON.stringify({
            error: {
                code,
                message,
                ...(details && { details }),
                ...(requestId && { requestId }),
                timestamp: new Date().toISOString(),
            },
        }),
    };
}

/**
 * Create a 200 OK response
 */
export function ok(data: any, headers?: Record<string, string>): APIGatewayProxyResult {
    return successResponse(200, data, headers);
}

/**
 * Create a 201 Created response
 */
export function created(data: any, headers?: Record<string, string>): APIGatewayProxyResult {
    return successResponse(201, data, headers);
}

/**
 * Create a 204 No Content response
 */
export function noContent(headers?: Record<string, string>): APIGatewayProxyResult {
    return {
        statusCode: 204,
        headers: {
            ...DEFAULT_HEADERS,
            ...headers,
        },
        body: '',
    };
}

/**
 * Create a 400 Bad Request response
 */
export function badRequest(
    message: string,
    requestId?: string,
    details?: any,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return errorResponse(400, 'VALIDATION_ERROR', message, requestId, details, headers);
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorized(
    message: string = 'Unauthorized',
    requestId?: string,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return errorResponse(401, 'UNAUTHORIZED', message, requestId, undefined, headers);
}

/**
 * Create a 403 Forbidden response
 */
export function forbidden(
    message: string = 'Forbidden',
    requestId?: string,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return errorResponse(403, 'FORBIDDEN', message, requestId, undefined, headers);
}

/**
 * Create a 404 Not Found response
 */
export function notFound(
    message: string = 'Resource not found',
    requestId?: string,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return errorResponse(404, 'NOT_FOUND', message, requestId, undefined, headers);
}

/**
 * Create a 409 Conflict response
 */
export function conflict(
    message: string,
    requestId?: string,
    details?: any,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return errorResponse(409, 'CONFLICT', message, requestId, details, headers);
}

/**
 * Create a 429 Too Many Requests response
 */
export function tooManyRequests(
    message: string = 'Rate limit exceeded',
    requestId?: string,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return errorResponse(429, 'RATE_LIMIT_EXCEEDED', message, requestId, undefined, headers);
}

/**
 * Create a 500 Internal Server Error response
 */
export function internalServerError(
    message: string = 'An unexpected error occurred',
    requestId?: string,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return errorResponse(500, 'INTERNAL_ERROR', message, requestId, undefined, headers);
}

/**
 * Create a 503 Service Unavailable response
 */
export function serviceUnavailable(
    message: string = 'Service temporarily unavailable',
    requestId?: string,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return errorResponse(503, 'SERVICE_UNAVAILABLE', message, requestId, undefined, headers);
}

/**
 * Create a 504 Gateway Timeout response
 */
export function gatewayTimeout(
    message: string = 'Request timeout',
    requestId?: string,
    headers?: Record<string, string>
): APIGatewayProxyResult {
    return errorResponse(504, 'GATEWAY_TIMEOUT', message, requestId, undefined, headers);
}

/**
 * Parse request body safely
 */
export function parseBody<T = any>(body: string | null): T | null {
    if (!body) return null;

    try {
        return JSON.parse(body) as T;
    } catch (error) {
        return null;
    }
}

/**
 * Extract request ID from event
 */
export function getRequestId(event: any): string {
    return event.requestContext?.requestId || 'unknown';
}
