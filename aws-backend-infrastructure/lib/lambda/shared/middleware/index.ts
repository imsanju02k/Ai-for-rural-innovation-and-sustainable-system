/**
 * Middleware Index
 * Exports all middleware functions
 */

export * from './error-handler';
export * from './request-logger';
export * from './cors';

/**
 * Compose multiple middleware functions
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export type LambdaHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

export type Middleware = (handler: LambdaHandler) => LambdaHandler;

/**
 * Compose middleware functions from right to left
 * Example: compose(withCors, withRequestLogger, withErrorHandler)(handler)
 * Execution order: withErrorHandler -> withRequestLogger -> withCors -> handler
 */
export function compose(...middlewares: Middleware[]): Middleware {
  return (handler: LambdaHandler): LambdaHandler => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}
