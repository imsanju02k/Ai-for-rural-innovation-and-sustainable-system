import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const SENSOR_DATA_TABLE = process.env.SENSOR_DATA_TABLE || '';
const SENSOR_AGGREGATES_TABLE = process.env.SENSOR_AGGREGATES_TABLE || '';

interface QueryParams {
    farmId: string;
    sensorType?: string;
    startDate?: string;
    endDate?: string;
    aggregation?: 'raw' | 'hourly' | 'daily';
    deviceId?: string;
}

interface SensorReading {
    deviceId: string;
    timestamp: string;
    farmId: string;
    sensorType: string;
    value: number;
    unit: string;
}

interface AggregateReading {
    farmIdSensorType: string;
    period: string;
    farmId: string;
    sensorType: string;
    aggregation: {
        min: number;
        max: number;
        avg: number;
        count: number;
    };
    unit: string;
    timestamp: string;
}

interface DeviceInfo {
    deviceId: string;
    farmId: string;
    sensorType: string;
    status: string;
    lastReading: {
        value: number;
        unit: string;
        timestamp: string;
    };
    statistics: {
        min: number;
        max: number;
        avg: number;
        period: string;
    };
}

/**
 * IoT Query Lambda Handler
 * Query sensor data or aggregates by farmId
 * Supports filtering by sensor type and date range
 * Supports aggregation level (raw, hourly, daily)
 * Requirement: 9.3
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Received query request:', JSON.stringify(event));

    try {
        // Check if this is a device-specific query
        const deviceId = event.pathParameters?.deviceId;
        if (deviceId) {
            return await handleDeviceQuery(deviceId);
        }

        // Parse query parameters
        const params = parseQueryParams(event);

        // Validate required parameters
        if (!params.farmId) {
            return errorResponse(400, 'VALIDATION_ERROR', 'Missing required parameter: farmId');
        }

        // Validate date range if provided
        if (params.startDate && params.endDate) {
            const start = new Date(params.startDate);
            const end = new Date(params.endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return errorResponse(400, 'VALIDATION_ERROR', 'Invalid date format. Use ISO 8601 format.');
            }
            if (start > end) {
                return errorResponse(400, 'VALIDATION_ERROR', 'startDate must be before endDate');
            }
        }

        // Determine which table to query based on aggregation level
        const aggregation = params.aggregation || 'raw';

        let data;
        if (aggregation === 'raw') {
            data = await queryRawSensorData(params);
        } else {
            data = await queryAggregatedData(params, aggregation);
        }

        return successResponse(200, {
            data,
            count: data.length,
            aggregation,
            filters: {
                farmId: params.farmId,
                sensorType: params.sensorType,
                startDate: params.startDate,
                endDate: params.endDate,
                deviceId: params.deviceId,
            },
        });
    } catch (error) {
        console.error('Error querying sensor data:', error);
        return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
    }
};

/**
 * Handle device-specific query
 */
async function handleDeviceQuery(deviceId: string): Promise<APIGatewayProxyResult> {
    try {
        // Query recent readings for this device
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const command = new QueryCommand({
            TableName: SENSOR_DATA_TABLE,
            KeyConditionExpression: 'deviceId = :deviceId AND #ts >= :startTime',
            ExpressionAttributeNames: {
                '#ts': 'timestamp',
            },
            ExpressionAttributeValues: {
                ':deviceId': deviceId,
                ':startTime': oneDayAgo.toISOString(),
            },
            ScanIndexForward: false, // Most recent first
            Limit: 100,
        });

        const response = await docClient.send(command);
        const readings = (response.Items || []) as SensorReading[];

        if (readings.length === 0) {
            return errorResponse(404, 'NOT_FOUND', 'Device not found or no recent data');
        }

        // Get the most recent reading
        const lastReading = readings[0];

        // Calculate statistics from last 24 hours
        const values = readings.map((r) => r.value);
        const statistics = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((sum, val) => sum + val, 0) / values.length,
            period: '24h',
        };

        const deviceInfo: DeviceInfo = {
            deviceId: lastReading.deviceId,
            farmId: lastReading.farmId,
            sensorType: lastReading.sensorType,
            status: 'active',
            lastReading: {
                value: lastReading.value,
                unit: lastReading.unit,
                timestamp: lastReading.timestamp,
            },
            statistics: {
                min: Math.round(statistics.min * 100) / 100,
                max: Math.round(statistics.max * 100) / 100,
                avg: Math.round(statistics.avg * 100) / 100,
                period: statistics.period,
            },
        };

        return successResponse(200, deviceInfo);
    } catch (error) {
        console.error('Error querying device data:', error);
        return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error');
    }
}

/**
 * Parse query parameters from API Gateway event
 */
function parseQueryParams(event: APIGatewayProxyEvent): QueryParams {
    const queryParams = event.queryStringParameters || {};
    const pathParams = event.pathParameters || {};

    return {

        farmId: queryParams.farmId || pathParams.farmId || '',
        sensorType: queryParams.sensorType,
        startDate: queryParams.startDate || queryParams.startTime,
        endDate: queryParams.endDate || queryParams.endTime,
        aggregation: (queryParams.aggregation as 'raw' | 'hourly' | 'daily') || 'raw',
        deviceId: queryParams.deviceId,
    };
}

/**
 * Query raw sensor data from SensorData table
 */
async function queryRawSensorData(params: QueryParams): Promise<SensorReading[]> {
    console.log('Querying raw sensor data:', params);

    // Build query based on whether sensorType is specified
    let keyConditionExpression: string;
    let expressionAttributeValues: Record<string, any>;
    let indexName: string | undefined;

    if (params.sensorType) {
        // Query using farmId-sensorType GSI
        keyConditionExpression = 'farmIdSensorType = :farmIdSensorType';
        expressionAttributeValues = {
            ':farmIdSensorType': `${params.farmId}#${params.sensorType}`,
        };
        indexName = 'FarmIdSensorTypeIndex';

        // Add date range filter if provided
        if (params.startDate && params.endDate) {
            keyConditionExpression += ' AND #ts BETWEEN :startDate AND :endDate';
            expressionAttributeValues[':startDate'] = params.startDate;
            expressionAttributeValues[':endDate'] = params.endDate;
        } else if (params.startDate) {
            keyConditionExpression += ' AND #ts >= :startDate';
            expressionAttributeValues[':startDate'] = params.startDate;
        } else if (params.endDate) {
            keyConditionExpression += ' AND #ts <= :endDate';
            expressionAttributeValues[':endDate'] = params.endDate;
        }
    } else {
        // Query using farmId GSI
        keyConditionExpression = 'farmId = :farmId';
        expressionAttributeValues = {
            ':farmId': params.farmId,
        };
        indexName = 'FarmIdIndex';

        // Add date range filter if provided
        if (params.startDate && params.endDate) {
            keyConditionExpression += ' AND #ts BETWEEN :startDate AND :endDate';
            expressionAttributeValues[':startDate'] = params.startDate;
            expressionAttributeValues[':endDate'] = params.endDate;
        } else if (params.startDate) {
            keyConditionExpression += ' AND #ts >= :startDate';
            expressionAttributeValues[':startDate'] = params.startDate;
        } else if (params.endDate) {
            keyConditionExpression += ' AND #ts <= :endDate';
            expressionAttributeValues[':endDate'] = params.endDate;
        }
    }

    // Add deviceId filter if provided
    let filterExpression: string | undefined;
    if (params.deviceId) {
        filterExpression = 'deviceId = :deviceId';
        expressionAttributeValues[':deviceId'] = params.deviceId;
    }

    const command = new QueryCommand({
        TableName: SENSOR_DATA_TABLE,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ...(filterExpression && { FilterExpression: filterExpression }),
        ExpressionAttributeNames: {
            '#ts': 'timestamp',
        },
        ExpressionAttributeValues: expressionAttributeValues,
        ScanIndexForward: false, // Most recent first
        Limit: 1000, // Limit to prevent large responses
    });

    const response = await docClient.send(command);
    return (response.Items || []) as SensorReading[];
}

/**
 * Query aggregated sensor data from SensorAggregates table
 */
async function queryAggregatedData(
    params: QueryParams,
    aggregation: 'hourly' | 'daily'
): Promise<AggregateReading[]> {
    console.log('Querying aggregated sensor data:', params, aggregation);

    // For aggregates, we need to query by farmId-sensorType
    if (!params.sensorType) {
        // If no sensor type specified, we need to query all sensor types
        // This would require multiple queries or a scan, which is not efficient
        // For now, return empty array and log a warning
        console.warn('Aggregated queries require sensorType parameter');
        return [];
    }

    // Build query for aggregates
    let keyConditionExpression = 'farmIdSensorType = :farmIdSensorType';
    const expressionAttributeValues: Record<string, any> = {
        ':farmIdSensorType': `${params.farmId}#${params.sensorType}`,
    };

    // Add period filter based on aggregation level and date range
    if (params.startDate || params.endDate) {
        const startPeriod = params.startDate
            ? generatePeriodIdentifier(new Date(params.startDate), aggregation)
            : undefined;
        const endPeriod = params.endDate
            ? generatePeriodIdentifier(new Date(params.endDate), aggregation)
            : undefined;

        if (startPeriod && endPeriod) {
            keyConditionExpression += ' AND period BETWEEN :startPeriod AND :endPeriod';
            expressionAttributeValues[':startPeriod'] = startPeriod;
            expressionAttributeValues[':endPeriod'] = endPeriod;
        } else if (startPeriod) {
            keyConditionExpression += ' AND period >= :startPeriod';
            expressionAttributeValues[':startPeriod'] = startPeriod;
        } else if (endPeriod) {
            keyConditionExpression += ' AND period <= :endPeriod';
            expressionAttributeValues[':endPeriod'] = endPeriod;
        }
    }

    const command = new QueryCommand({
        TableName: SENSOR_AGGREGATES_TABLE,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ScanIndexForward: false, // Most recent first
        Limit: 1000,
    });

    const response = await docClient.send(command);
    const aggregates = (response.Items || []) as AggregateReading[];

    // Filter by aggregation level if needed
    return aggregates.filter((item) => {
        if (aggregation === 'hourly') {
            // Hourly periods have format: YYYY-MM-DD-HH-MM
            return item.period.split('-').length === 5;
        } else if (aggregation === 'daily') {
            // Daily periods have format: YYYY-MM-DD
            return item.period.split('-').length === 3;
        }
        return true;
    });
}

/**
 * Generate period identifier based on aggregation level
 */
function generatePeriodIdentifier(date: Date, aggregation: 'hourly' | 'daily'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (aggregation === 'daily') {
        return `${year}-${month}-${day}`;
    } else {
        // hourly
        const hour = String(date.getHours()).padStart(2, '0');
        const minutes = Math.floor(date.getMinutes() / 15) * 15;
        const minuteStr = String(minutes).padStart(2, '0');
        return `${year}-${month}-${day}-${hour}-${minuteStr}`;
    }
}

/**
 * Create a success response
 */
function successResponse(statusCode: number, data: any): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify(data),
    };
}

/**
 * Create an error response
 */
function errorResponse(statusCode: number, code: string, message: string): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({
            error: {
                code,
                message,
                timestamp: new Date().toISOString(),
            },
        }),
    };
}
