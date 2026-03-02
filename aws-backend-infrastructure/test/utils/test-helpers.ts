/**
 * Test helper utilities
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

/**
 * Create a mock API Gateway event
 */
export function createMockAPIGatewayEvent(
    overrides?: Partial<APIGatewayProxyEvent>
): APIGatewayProxyEvent {
    return {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'GET',
        isBase64Encoded: false,
        path: '/test',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {
            accountId: '123456789012',
            apiId: 'test-api-id',
            authorizer: {
                userId: 'test-user-id',
            },
            protocol: 'HTTP/1.1',
            httpMethod: 'GET',
            identity: {
                accessKey: null,
                accountId: null,
                apiKey: null,
                apiKeyId: null,
                caller: null,
                clientCert: null,
                cognitoAuthenticationProvider: null,
                cognitoAuthenticationType: null,
                cognitoIdentityId: null,
                cognitoIdentityPoolId: null,
                principalOrgId: null,
                sourceIp: '127.0.0.1',
                user: null,
                userAgent: 'test-agent',
                userArn: null,
            },
            path: '/test',
            stage: 'test',
            requestId: 'test-request-id',
            requestTimeEpoch: Date.now(),
            resourceId: 'test-resource-id',
            resourcePath: '/test',
        },
        resource: '/test',
        ...overrides,
    };
}

/**
 * Create a mock Lambda context
 */
export function createMockContext(overrides?: Partial<Context>): Context {
    return {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'test-function',
        functionVersion: '$LATEST',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
        memoryLimitInMB: '256',
        awsRequestId: 'test-request-id',
        logGroupName: '/aws/lambda/test-function',
        logStreamName: '2024/01/01/[$LATEST]test',
        getRemainingTimeInMillis: () => 30000,
        done: () => { },
        fail: () => { },
        succeed: () => { },
        ...overrides,
    };
}

/**
 * Parse API Gateway response body
 */
export function parseResponseBody(response: APIGatewayProxyResult): any {
    return JSON.parse(response.body);
}

/**
 * Assert API Gateway response status
 */
export function assertResponseStatus(response: APIGatewayProxyResult, expectedStatus: number) {
    expect(response.statusCode).toBe(expectedStatus);
}

/**
 * Assert API Gateway response has error
 */
export function assertResponseError(response: APIGatewayProxyResult, expectedCode: string) {
    const body = parseResponseBody(response);
    expect(body).toHaveProperty('error');
    expect(body.error.code).toBe(expectedCode);
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await sleep(interval);
    }

    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock DynamoDB item
 */
export function createMockDynamoDBItem(item: any) {
    return {
        Item: item,
    };
}

/**
 * Create a mock DynamoDB query response
 */
export function createMockDynamoDBQueryResponse(items: any[], lastEvaluatedKey?: any) {
    return {
        Items: items,
        Count: items.length,
        ScannedCount: items.length,
        LastEvaluatedKey: lastEvaluatedKey,
    };
}

/**
 * Create a mock S3 pre-signed URL
 */
export function createMockPresignedUrl(bucket: string, key: string): string {
    return `https://${bucket}.s3.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=mock`;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Validate ISO date format
 */
export function isValidISODate(date: string): boolean {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()) && date === parsedDate.toISOString();
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/**
 * Create a mock error
 */
export function createMockError(message: string, code?: string, statusCode?: number) {
    const error: any = new Error(message);
    if (code) error.name = code;
    if (statusCode) error.statusCode = statusCode;
    return error;
}
