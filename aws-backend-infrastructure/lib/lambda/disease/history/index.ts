/**
 * Disease History Lambda Function
 * 
 * - Query DiseaseAnalyses table by farmId or userId
 * - Support filtering by date range
 * - Support pagination
 * - Return list of past analyses
 * 
 * Requirements: 5.6
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems } from '../../shared/utils/dynamodb';
import { ok, badRequest, getRequestId } from '../../shared/utils/response';

// Environment variables
const DISEASE_ANALYSES_TABLE = process.env.DISEASE_ANALYSES_TABLE || '';

interface QueryParams {
    farmId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    nextToken?: string;
}

interface DiseaseAnalysisSummary {
    analysisId: string;
    imageId: string;
    farmId: string;
    diseaseName: string;
    confidence: number;
    severity: string;
    analyzedAt: string;
}

/**
 * Main handler
 */
export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const requestId = getRequestId(event);

    try {
        // Get user ID from authorizer context
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return badRequest('User ID not found in request context', requestId);
        }

        // Parse query parameters
        const params = parseQueryParams(event.queryStringParameters || {});

        // Validate parameters
        if (!params.farmId && !params.userId) {
            // Default to current user's analyses
            params.userId = userId;
        }

        // Verify user has access to the requested data
        if (params.userId && params.userId !== userId) {
            return badRequest('Cannot access other users\' data', requestId);
        }

        // Query disease analyses
        const result = await queryDiseaseHistory(params);

        return ok({
            analyses: result.analyses,
            count: result.analyses.length,
            nextToken: result.nextToken,
        });
    } catch (error) {
        console.error('Error retrieving disease history:', error);
        return badRequest('Failed to retrieve disease history', requestId);
    }
};

/**
 * Parse and validate query parameters
 */
function parseQueryParams(queryParams: Record<string, string | undefined>): QueryParams {
    const params: QueryParams = {};

    if (queryParams.farmId) {
        params.farmId = queryParams.farmId;
    }

    if (queryParams.userId) {
        params.userId = queryParams.userId;
    }

    if (queryParams.startDate) {
        params.startDate = queryParams.startDate;
    }

    if (queryParams.endDate) {
        params.endDate = queryParams.endDate;
    }

    if (queryParams.limit) {
        const limit = parseInt(queryParams.limit, 10);
        params.limit = Math.min(Math.max(1, limit), 100); // Clamp between 1 and 100
    } else {
        params.limit = 20; // Default limit
    }

    if (queryParams.nextToken) {
        params.nextToken = queryParams.nextToken;
    }

    return params;
}

/**
 * Query disease history from DynamoDB
 */
async function queryDiseaseHistory(params: QueryParams): Promise<{
    analyses: DiseaseAnalysisSummary[];
    nextToken?: string;
}> {
    let keyConditionExpression: string;
    let expressionAttributeValues: Record<string, any>;
    let indexName: string | undefined;
    let filterExpression: string | undefined;

    // Determine which index to use
    if (params.farmId) {
        // Query by farmId using GSI-1
        indexName = 'farmId-analyzedAt-index';
        keyConditionExpression = 'farmId = :farmId';
        expressionAttributeValues = {
            ':farmId': params.farmId,
        };

        // Add date range filter if provided
        if (params.startDate && params.endDate) {
            keyConditionExpression += ' AND analyzedAt BETWEEN :startDate AND :endDate';
            expressionAttributeValues[':startDate'] = params.startDate;
            expressionAttributeValues[':endDate'] = params.endDate;
        } else if (params.startDate) {
            keyConditionExpression += ' AND analyzedAt >= :startDate';
            expressionAttributeValues[':startDate'] = params.startDate;
        } else if (params.endDate) {
            keyConditionExpression += ' AND analyzedAt <= :endDate';
            expressionAttributeValues[':endDate'] = params.endDate;
        }
    } else if (params.userId) {
        // Query by userId using GSI-2
        indexName = 'userId-analyzedAt-index';
        keyConditionExpression = 'userId = :userId';
        expressionAttributeValues = {
            ':userId': params.userId,
        };

        // Add date range filter if provided
        if (params.startDate && params.endDate) {
            keyConditionExpression += ' AND analyzedAt BETWEEN :startDate AND :endDate';
            expressionAttributeValues[':startDate'] = params.startDate;
            expressionAttributeValues[':endDate'] = params.endDate;
        } else if (params.startDate) {
            keyConditionExpression += ' AND analyzedAt >= :startDate';
            expressionAttributeValues[':startDate'] = params.startDate;
        } else if (params.endDate) {
            keyConditionExpression += ' AND analyzedAt <= :endDate';
            expressionAttributeValues[':endDate'] = params.endDate;
        }
    } else {
        throw new Error('Either farmId or userId must be provided');
    }

    // Parse nextToken if provided
    let exclusiveStartKey: Record<string, any> | undefined;
    if (params.nextToken) {
        try {
            exclusiveStartKey = JSON.parse(Buffer.from(params.nextToken, 'base64').toString());
        } catch (error) {
            console.error('Invalid nextToken:', error);
            // Ignore invalid token and start from beginning
        }
    }

    // Query DynamoDB
    const result = await queryItems(
        DISEASE_ANALYSES_TABLE,
        keyConditionExpression,
        expressionAttributeValues,
        {
            indexName,
            filterExpression,
            limit: params.limit,
            scanIndexForward: false, // Sort by analyzedAt descending (newest first)
            exclusiveStartKey,
        }
    );

    // Transform results to summary format
    const analyses: DiseaseAnalysisSummary[] = result.items.map((item: any) => {
        // Get the primary disease (highest confidence)
        const primaryDisease = item.results && item.results.length > 0
            ? item.results[0]
            : null;

        return {
            analysisId: item.analysisId,
            imageId: item.imageId,
            farmId: item.farmId,
            diseaseName: primaryDisease?.diseaseName || 'No disease detected',
            confidence: primaryDisease?.confidence || 0,
            severity: primaryDisease?.severity || 'unknown',
            analyzedAt: item.analyzedAt,
        };
    });

    // Encode nextToken if there are more results
    let nextToken: string | undefined;
    if (result.lastEvaluatedKey) {
        nextToken = Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64');
    }

    return {
        analyses,
        nextToken,
    };
}
