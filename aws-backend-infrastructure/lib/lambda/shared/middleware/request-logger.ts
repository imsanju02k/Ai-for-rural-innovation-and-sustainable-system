/**
 * Request Logger Middleware
 * Logs incoming requests and responses
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/response';

/**
 * Lambda handler type
 */
export type LambdaHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

/**
 * Request logger middleware wrapper
 * Requirement 1.7: Log request and response details
 * Requirement 10.1: Log Lambda execution duration
 */
export function withRequestLogger(handler: LambdaHandler): LambdaHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const requestId = getRequestId(event);
    const startTime = Date.now();

    const log = logger.child({ requestId });

    // Log incoming request (Requirement 1.7)
    log.info('Incoming request', {
      method: event.httpMethod,
      path: event.path,
      queryParams: event.queryStringParameters,
      headers: sanitizeHeaders(event.headers),
      sourceIp: event.requestContext?.identity?.sourceIp,
      userAgent: event.headers?.['User-Agent'] || event.headers?.['user-agent'],
    });

    try {
      // Execute handler
      const result = await handler(event);

      const duration = Date.now() - startTime;

      // Log successful response (Requirement 10.1: Log Lambda execution duration)
      log.info('Request completed', {
        statusCode: result.statusCode,
        duration,
        durationMs: duration,
      });

      // Log warning if duration exceeds threshold (Requirement 10.7)
      if (duration > 10000) {
        log.warn('Lambda execution duration exceeded 10 seconds', {
          duration,
          durationMs: duration,
          threshold: 10000,
        });
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Log error response with stack trace (Requirement 10.1: Log error stack traces)
      log.error('Request failed', error, {
        duration,
        durationMs: duration,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      });

      throw error;
    }
  };
}

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(headers: { [key: string]: string | undefined }): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}
