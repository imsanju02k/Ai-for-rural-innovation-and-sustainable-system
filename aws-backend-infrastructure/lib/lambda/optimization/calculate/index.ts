import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize AWS clients
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const OPTIMIZATIONS_TABLE = process.env.OPTIMIZATIONS_TABLE || '';
const SENSOR_DATA_TABLE = process.env.SENSOR_DATA_TABLE || '';
const FARMS_TABLE = process.env.FARMS_TABLE || '';
const ALERT_LAMBDA_ARN = process.env.ALERT_LAMBDA_ARN || '';

interface OptimizationRequest {
    farmId: string;
    optimizationType: string;
    parameters: {
        cropType?: string;
        currentStage?: string;
        soilMoisture?: number;
        weatherForecast?: string;
        [key: string]: any;
    };
}

interface OptimizationRecommendation {
    optimizationId: string;
    farmId: string;
    userId: string;
    type: string;
    recommendations: {
        dailyWaterRequirement?: number;
        unit?: string;
        irrigationSchedule?: Array<{
            time: string;
            duration: number;
            unit: string;
        }>;
        estimatedSavings: {
            water?: number;
            unit: string;
            costSavings: number;
            currency: string;
        };
        [key: string]: any;
    };
    calculatedAt: string;
}

/**
 * Optimization Calculate Lambda Handler
 * Calculates resource optimization recommendations using sensor data and AI
 * Requirements: 8.1, 8.2, 8.4, 8.5, 8.7
 */
export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const startTime = Date.now();
    const requestId = event.requestContext.requestId;

    try {
        // Extract userId from authorizer context
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated', requestId);
        }

        // Parse and validate request body
        const body: OptimizationRequest = JSON.parse(event.body || '{}');
        const validationError = validateOptimizationRequest(body);
        if (validationError) {
            return errorResponse(400, 'VALIDATION_ERROR', validationError, requestId);
        }

        const { farmId, optimizationType, parameters } = body;

        // Verify farm exists and belongs to user
        const farm = await getFarmDetails(farmId, userId);
        if (!farm) {
            return errorResponse(404, 'NOT_FOUND', 'Farm not found', requestId);
        }

        // Query sensor data for the farm (Requirement 8.1)
        const sensorData = await querySensorData(farmId);

        // Build optimization context
        const optimizationContext = {
            farm,
            sensorData,
            parameters,
            optimizationType,
        };

        // Call Amazon Bedrock for optimization recommendations (Requirement 8.4)
        const bedrockRecommendations = await generateOptimizationRecommendations(
            optimizationContext
        );

        // Calculate irrigation schedules based on soil moisture (Requirement 8.2)
        const irrigationSchedule = calculateIrrigationSchedule(
            parameters.soilMoisture || sensorData.soilMoisture,
            parameters.cropType || farm.cropTypes?.[0],
            parameters.currentStage || 'vegetative'
        );

        // Estimate cost savings (Requirement 8.5)
        const costSavings = estimateCostSavings(
            optimizationType,
            irrigationSchedule,
            bedrockRecommendations
        );

        // Build final recommendations
        const recommendations = {
            dailyWaterRequirement: irrigationSchedule.dailyRequirement,
            unit: 'mm',
            irrigationSchedule: irrigationSchedule.schedule,
            estimatedSavings: costSavings,
            additionalRecommendations: bedrockRecommendations.recommendations,
        };

        // Store recommendations in Optimizations table (Requirement 8.7)
        const optimizationId = uuidv4();
        const calculatedAt = new Date().toISOString();

        const optimizationRecord: OptimizationRecommendation = {
            optimizationId,
            farmId,
            userId,
            type: optimizationType,
            recommendations,
            calculatedAt,
        };

        await storeOptimization(optimizationRecord);

        // Return recommendations
        return successResponse(200, {
            optimizationId,
            farmId,
            type: optimizationType,
            recommendations,
            calculatedAt,
        });
    } catch (error: any) {
        console.error('Error calculating optimization', {
            error: error.message,
            stack: error.stack,
            requestId,
        });

        if (error.name === 'ThrottlingException') {
            return errorResponse(
                503,
                'SERVICE_UNAVAILABLE',
                'AI service temporarily unavailable',
                requestId
            );
        }

        return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred', requestId);
    }
};

function validateOptimizationRequest(body: OptimizationRequest): string | null {
    if (!body.farmId || typeof body.farmId !== 'string') {
        return 'farmId is required and must be a string';
    }
    if (!body.optimizationType || typeof body.optimizationType !== 'string') {
        return 'optimizationType is required and must be a string';
    }
    const validTypes = ['water', 'fertilizer', 'schedule'];
    if (!validTypes.includes(body.optimizationType)) {
        return `optimizationType must be one of: ${validTypes.join(', ')}`;
    }
    if (!body.parameters || typeof body.parameters !== 'object') {
        return 'parameters is required and must be an object';
    }
    return null;
}

async function getFarmDetails(farmId: string, userId: string): Promise<any> {
    try {
        const result = await dynamoClient.send(
            new QueryCommand({
                TableName: FARMS_TABLE,
                KeyConditionExpression: 'userId = :userId',
                FilterExpression: 'farmId = :farmId',
                ExpressionAttributeValues: {
                    ':userId': userId,
                    ':farmId': farmId,
                },
                Limit: 1,
            })
        );

        return result.Items?.[0] || null;
    } catch (error) {
        console.error('Error fetching farm details', { error, farmId, userId });
        throw error;
    }
}

async function querySensorData(farmId: string): Promise<any> {
    try {
        const result = await dynamoClient.send(
            new QueryCommand({
                TableName: SENSOR_DATA_TABLE,
                IndexName: 'FarmIdTimestampIndex',
                KeyConditionExpression: 'farmId = :farmId',
                ExpressionAttributeValues: {
                    ':farmId': farmId,
                },
                ScanIndexForward: false,
                Limit: 20,
            })
        );

        const items = result.Items || [];

        // Aggregate sensor data by type
        const aggregated: any = {};
        items.forEach((item: any) => {
            if (!aggregated[item.sensorType]) {
                aggregated[item.sensorType] = item.value;
            }
        });

        return {
            soilMoisture: aggregated.soil_moisture || 45,
            temperature: aggregated.temperature || 25,
            humidity: aggregated.humidity || 60,
            ph: aggregated.ph || 6.5,
            rawData: items,
        };
    } catch (error) {
        console.error('Error querying sensor data', { error, farmId });
        return {
            soilMoisture: 45,
            temperature: 25,
            humidity: 60,
            ph: 6.5,
            rawData: [],
        };
    }
}

async function generateOptimizationRecommendations(context: any): Promise<any> {
    const { farm, sensorData, parameters, optimizationType } = context;

    const prompt = buildOptimizationPrompt(farm, sensorData, parameters, optimizationType);

    try {
        const modelId = 'anthropic.claude-3-sonnet-20240229-v1:0';

        const payload = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 1500,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.5,
            top_p: 0.9,
        };

        const command = new InvokeModelCommand({
            modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(payload),
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        return {
            recommendations: parseRecommendations(responseBody.content[0].text),
            rawResponse: responseBody.content[0].text,
        };
    } catch (error) {
        console.error('Error calling Bedrock', { error });
        return {
            recommendations: [],
            rawResponse: '',
        };
    }
}

function buildOptimizationPrompt(
    farm: any,
    sensorData: any,
    parameters: any,
    optimizationType: string
): string {
    let prompt = `You are an agricultural optimization expert. Provide specific, actionable recommendations for ${optimizationType} optimization.\n\n`;

    prompt += `Farm Details:\n`;
    prompt += `- Name: ${farm.name}\n`;
    prompt += `- Location: ${farm.location?.address || 'N/A'}\n`;
    prompt += `- Crops: ${farm.cropTypes?.join(', ') || 'N/A'}\n`;
    prompt += `- Size: ${farm.acreage || 'N/A'} acres\n`;
    prompt += `- Soil Type: ${farm.soilType || 'N/A'}\n\n`;

    prompt += `Current Sensor Data:\n`;
    prompt += `- Soil Moisture: ${sensorData.soilMoisture}%\n`;
    prompt += `- Temperature: ${sensorData.temperature}°C\n`;
    prompt += `- Humidity: ${sensorData.humidity}%\n`;
    prompt += `- pH: ${sensorData.ph}\n\n`;

    prompt += `Optimization Parameters:\n`;
    prompt += `- Crop Type: ${parameters.cropType || 'N/A'}\n`;
    prompt += `- Growth Stage: ${parameters.currentStage || 'N/A'}\n`;
    prompt += `- Weather Forecast: ${parameters.weatherForecast || 'N/A'}\n\n`;

    prompt += `Please provide:\n`;
    prompt += `1. Specific recommendations for ${optimizationType} optimization\n`;
    prompt += `2. Best practices considering the crop type and growth stage\n`;
    prompt += `3. Potential risks to avoid\n`;
    prompt += `4. Expected outcomes\n\n`;
    prompt += `Response:`;

    return prompt;
}

function parseRecommendations(response: string): string[] {
    const recommendations: string[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (
            trimmed &&
            (trimmed.match(/^\d+\./) || trimmed.match(/^[-*]/) || trimmed.match(/recommend|should|advise/i))
        ) {
            recommendations.push(trimmed.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''));
        }
    }

    return recommendations.slice(0, 10);
}

function calculateIrrigationSchedule(
    soilMoisture: number,
    cropType: string,
    growthStage: string
): any {
    // Crop-specific moisture thresholds
    const thresholds: Record<string, number> = {
        wheat: 40,
        rice: 60,
        corn: 45,
        tomato: 50,
        potato: 45,
        default: 45,
    };

    const threshold = thresholds[cropType?.toLowerCase()] || thresholds.default;

    // Calculate daily water requirement based on crop and stage
    let dailyRequirement = 25; // mm per day (default)

    if (growthStage === 'vegetative') {
        dailyRequirement = 20;
    } else if (growthStage === 'flowering') {
        dailyRequirement = 30;
    } else if (growthStage === 'fruiting') {
        dailyRequirement = 35;
    }

    // Adjust based on current soil moisture
    if (soilMoisture < threshold - 10) {
        dailyRequirement *= 1.3;
    } else if (soilMoisture < threshold) {
        dailyRequirement *= 1.1;
    } else if (soilMoisture > threshold + 10) {
        dailyRequirement *= 0.7;
    }

    // Generate irrigation schedule
    const schedule = [];

    if (soilMoisture < threshold) {
        // Morning irrigation
        schedule.push({
            time: '06:00',
            duration: Math.round((dailyRequirement / 2) * 2), // Convert mm to minutes (rough estimate)
            unit: 'minutes',
        });

        // Evening irrigation if very dry
        if (soilMoisture < threshold - 10) {
            schedule.push({
                time: '18:00',
                duration: Math.round((dailyRequirement / 2) * 2),
                unit: 'minutes',
            });
        }
    }

    return {
        dailyRequirement: Math.round(dailyRequirement),
        schedule,
        threshold,
        currentMoisture: soilMoisture,
    };
}

function estimateCostSavings(
    optimizationType: string,
    irrigationSchedule: any,
    bedrockRecommendations: any
): any {
    let waterSavingsPercent = 0;
    let costSavingsAmount = 0;

    if (optimizationType === 'water') {
        // Estimate water savings based on optimized schedule
        const baselineWater = 40; // mm per day (unoptimized)
        const optimizedWater = irrigationSchedule.dailyRequirement;
        waterSavingsPercent = Math.round(
            ((baselineWater - optimizedWater) / baselineWater) * 100
        );

        // Estimate cost savings (assuming $0.50 per mm per acre)
        costSavingsAmount = Math.round(
            (baselineWater - optimizedWater) * 0.5 * 30 * 75
        ); // 30 days, convert to INR
    } else if (optimizationType === 'fertilizer') {
        waterSavingsPercent = 15;
        costSavingsAmount = 500;
    } else {
        waterSavingsPercent = 20;
        costSavingsAmount = 300;
    }

    return {
        water: Math.max(0, waterSavingsPercent),
        unit: 'percent',
        costSavings: Math.max(0, costSavingsAmount),
        currency: 'INR',
    };
}

async function storeOptimization(optimization: OptimizationRecommendation): Promise<void> {
    try {
        await dynamoClient.send(
            new PutCommand({
                TableName: OPTIMIZATIONS_TABLE,
                Item: optimization,
            })
        );
    } catch (error) {
        console.error('Error storing optimization', { error, optimization });
        throw error;
    }
}

function successResponse(statusCode: number, data: any): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(data),
    };
}

function errorResponse(
    statusCode: number,
    code: string,
    message: string,
    requestId: string
): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
            'X-Request-Id': requestId,
        },
        body: JSON.stringify({
            error: {
                code,
                message,
                requestId,
                timestamp: new Date().toISOString(),
            },
        }),
    };
}
