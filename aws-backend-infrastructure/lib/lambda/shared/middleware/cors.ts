/**
 * CORS Middleware
 * Adds CORS headers to Lambda responses
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * CORS configuration options
 */
export interface CorsOptions {
    allowOrigin?: string | string[];
    allowMethods?: string[];
    allowHeaders?: string[];
    exposeHeaders?: string[];
    maxAge?: number;
    allowCredentials?: boolean;
}

/**
 * Default CORS options
 */
const DEFAULT_CORS_OPTIONS: CorsOptions = {
    allowOrigin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: [
        'Content-Type',
        'Authorization',
        'X-Amz-Date',
        'X-Api-Key',
        'X-Amz-Security-Token',
    ],
    exposeHeaders: ['X-Request-Id'],
    maxAge: 86400, // 24 hours
    allowCredentials: true,
};

/**
 * Lambda handler type
 */
export type LambdaHandler = (
    event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

/**
 * CORS middleware wrapper
 */
export function withCors(
    handler: LambdaHandler,
    options: CorsOptions = {}
): LambdaHandler {
    const corsOptions = { ...DEFAULT_CORS_OPTIONS, ...options };

    return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        // Handle preflight OPTIONS request
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: buildCorsHeaders(event, corsOptions),
                body: '',
            };
        }

        // Execute handler
        const result = await handler(event);

        // Add CORS headers to response
        return {
            ...result,
            headers: {
                ...result.headers,
                ...buildCorsHeaders(event, corsOptions),
            },
        };
    };
}

/**
 * Build CORS headers based on configuration
 */
function buildCorsHeaders(
    event: APIGatewayProxyEvent,
    options: CorsOptions
): Record<string, string> {
    const headers: Record<string, string> = {};

    // Handle Access-Control-Allow-Origin
    if (Array.isArray(options.allowOrigin)) {
        const origin = event.headers?.origin || event.headers?.Origin;
        if (origin && options.allowOrigin.includes(origin)) {
            headers['Access-Control-Allow-Origin'] = origin;
        } else {
            headers['Access-Control-Allow-Origin'] = options.allowOrigin[0];
        }
    } else {
        headers['Access-Control-Allow-Origin'] = options.allowOrigin || '*';
    }

    // Handle Access-Control-Allow-Methods
    if (options.allowMethods && options.allowMethods.length > 0) {
        headers['Access-Control-Allow-Methods'] = options.allowMethods.join(', ');
    }

    // Handle Access-Control-Allow-Headers
    if (options.allowHeaders && options.allowHeaders.length > 0) {
        headers['Access-Control-Allow-Headers'] = options.allowHeaders.join(', ');
    }

    // Handle Access-Control-Expose-Headers
    if (options.exposeHeaders && options.exposeHeaders.length > 0) {
        headers['Access-Control-Expose-Headers'] = options.exposeHeaders.join(', ');
    }

    // Handle Access-Control-Max-Age
    if (options.maxAge !== undefined) {
        headers['Access-Control-Max-Age'] = options.maxAge.toString();
    }

    // Handle Access-Control-Allow-Credentials
    if (options.allowCredentials) {
        headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
}

/**
 * Get CORS options from environment variables
 */
export function getCorsOptionsFromEnv(): CorsOptions {
    const allowOrigin = process.env.CORS_ALLOW_ORIGIN;
    const allowMethods = process.env.CORS_ALLOW_METHODS;
    const allowHeaders = process.env.CORS_ALLOW_HEADERS;

    return {
        ...(allowOrigin && {
            allowOrigin: allowOrigin.includes(',')
                ? allowOrigin.split(',').map((o) => o.trim())
                : allowOrigin,
        }),
        ...(allowMethods && {
            allowMethods: allowMethods.split(',').map((m) => m.trim()),
        }),
        ...(allowHeaders && {
            allowHeaders: allowHeaders.split(',').map((h) => h.trim()),
        }),
    };
}
