import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// Initialize AWS clients
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const lambdaClient = new LambdaClient({});

const FARMS_TABLE = process.env.FARMS_TABLE || '';
const SENSOR_DATA_TABLE = process.env.SENSOR_DATA_TABLE || '';
const ALERT_CREATE_LAMBDA_ARN = process.env.ALERT_CREATE_LAMBDA_ARN || '';

// Resource usage thresholds
interface ResourceThresholds {
    water: {
        optimal: number;
        warning: number;
        critical: number;
    };
    fertilizer: {
        optimal: number;
        warning: number;
        critical: number;
    };
    energy: {
        optimal: number;
        warning: number;
        critical: number;
    };
}

const DEFAULT_THRESHOLDS: ResourceThresholds = {
    water: {
        optimal: 100, // mm per day
        warning: 120,
        critical: 150,
    },
    fertilizer: {
        optimal: 50, // kg per acre per month
        warning: 60,
        critical: 75,
    },
    energy: {
        optimal: 100, // kWh per day
        warning: 120,
        critical: 150,
    },
};

interface OptimizationRecord {
    optimizationId: string;
    farmId: string;
    userId: string;
    type: string;
    recommendations: {
        dailyWaterRequirement?: number;
        estimatedSavings?: {
            water?: number;
            costSavings?: number;
        };
        [key: string]: any;
    };
    calculatedAt: string;
}

/**
 * Alert Trigger Lambda Handler
 * Monitors resource usage against thresholds and triggers alerts when exceeded
 * Triggered by DynamoDB Stream from Optimizations table
 * Requirements: 8.9
 */
export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
    console.log('Processing optimization records for threshold monitoring', {
        recordCount: event.Records.length,
    });

    for (const record of event.Records) {
        try {
            // Only process INSERT and MODIFY events
            if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') {
                continue;
            }

            // Extract the new optimization record
            const newImage = record.dynamodb?.NewImage;
            if (!newImage) {
                console.warn('No NewImage in record', { record });
                continue;
            }

            const optimization = unmarshall(newImage) as OptimizationRecord;
            console.log('Processing optimization record', {
                optimizationId: optimization.optimizationId,
                farmId: optimization.farmId,
                type: optimization.type,
            });

            // Check resource usage against thresholds
            await checkResourceThresholds(optimization);
        } catch (error: any) {
            console.error('Error processing record', {
                error: error.message,
                stack: error.stack,
                record,
            });
            // Continue processing other records even if one fails
        }
    }
};

/**
 * Check resource usage against configured thresholds
 * Requirement 8.9: Monitor resource usage and trigger alerts when thresholds exceeded
 */
async function checkResourceThresholds(optimization: OptimizationRecord): Promise<void> {
    const { farmId, userId, type, recommendations } = optimization;

    // Get farm details to check for custom thresholds
    const farm = await getFarmDetails(farmId, userId);
    if (!farm) {
        console.warn('Farm not found', { farmId, userId });
        return;
    }

    // Get recent sensor data to calculate actual usage
    const sensorData = await getRecentSensorData(farmId);

    // Determine thresholds (use custom if available, otherwise defaults)
    const thresholds = farm.thresholds || DEFAULT_THRESHOLDS;

    // Check thresholds based on optimization type
    if (type === 'water') {
        await checkWaterThreshold(optimization, sensorData, thresholds.water, farm);
    } else if (type === 'fertilizer') {
        await checkFertilizerThreshold(optimization, sensorData, thresholds.fertilizer, farm);
    } else if (type === 'energy') {
        await checkEnergyThreshold(optimization, sensorData, thresholds.energy, farm);
    }
}

/**
 * Check water usage against thresholds
 */
async function checkWaterThreshold(
    optimization: OptimizationRecord,
    sensorData: any,
    thresholds: { optimal: number; warning: number; critical: number },
    farm: any
): Promise<void> {
    const dailyWaterRequirement = optimization.recommendations.dailyWaterRequirement || 0;

    let severity: 'low' | 'medium' | 'high' | 'critical' | null = null;
    let message = '';

    if (dailyWaterRequirement >= thresholds.critical) {
        severity = 'critical';
        message = `Critical water usage detected: ${dailyWaterRequirement}mm/day exceeds critical threshold of ${thresholds.critical}mm/day. Immediate action required to reduce water consumption.`;
    } else if (dailyWaterRequirement >= thresholds.warning) {
        severity = 'high';
        message = `High water usage detected: ${dailyWaterRequirement}mm/day exceeds warning threshold of ${thresholds.warning}mm/day. Consider implementing water conservation measures.`;
    } else if (dailyWaterRequirement > thresholds.optimal) {
        severity = 'medium';
        message = `Water usage (${dailyWaterRequirement}mm/day) exceeds optimal threshold of ${thresholds.optimal}mm/day. Review irrigation schedule for optimization opportunities.`;
    }

    if (severity) {
        await triggerAlert({
            userId: optimization.userId,
            farmId: optimization.farmId,
            type: 'resource_usage_water',
            severity,
            message,
            metadata: {
                optimizationId: optimization.optimizationId,
                resourceType: 'water',
                currentUsage: dailyWaterRequirement,
                optimalThreshold: thresholds.optimal,
                warningThreshold: thresholds.warning,
                criticalThreshold: thresholds.critical,
                soilMoisture: sensorData.soilMoisture,
                recommendations: optimization.recommendations,
            },
        });
    }
}

/**
 * Check fertilizer usage against thresholds
 */
async function checkFertilizerThreshold(
    optimization: OptimizationRecord,
    sensorData: any,
    thresholds: { optimal: number; warning: number; critical: number },
    farm: any
): Promise<void> {
    // Extract fertilizer usage from recommendations
    const fertilizerUsage = optimization.recommendations.monthlyFertilizerRequirement || 0;

    let severity: 'low' | 'medium' | 'high' | 'critical' | null = null;
    let message = '';

    if (fertilizerUsage >= thresholds.critical) {
        severity = 'critical';
        message = `Critical fertilizer usage detected: ${fertilizerUsage}kg/acre/month exceeds critical threshold of ${thresholds.critical}kg/acre/month. Risk of soil degradation and environmental impact.`;
    } else if (fertilizerUsage >= thresholds.warning) {
        severity = 'high';
        message = `High fertilizer usage detected: ${fertilizerUsage}kg/acre/month exceeds warning threshold of ${thresholds.warning}kg/acre/month. Consider soil testing and precision application.`;
    } else if (fertilizerUsage > thresholds.optimal) {
        severity = 'medium';
        message = `Fertilizer usage (${fertilizerUsage}kg/acre/month) exceeds optimal threshold of ${thresholds.optimal}kg/acre/month. Review application rates for cost savings.`;
    }

    if (severity) {
        await triggerAlert({
            userId: optimization.userId,
            farmId: optimization.farmId,
            type: 'resource_usage_fertilizer',
            severity,
            message,
            metadata: {
                optimizationId: optimization.optimizationId,
                resourceType: 'fertilizer',
                currentUsage: fertilizerUsage,
                optimalThreshold: thresholds.optimal,
                warningThreshold: thresholds.warning,
                criticalThreshold: thresholds.critical,
                soilPh: sensorData.ph,
                recommendations: optimization.recommendations,
            },
        });
    }
}

/**
 * Check energy usage against thresholds
 */
async function checkEnergyThreshold(
    optimization: OptimizationRecord,
    sensorData: any,
    thresholds: { optimal: number; warning: number; critical: number },
    farm: any
): Promise<void> {
    // Extract energy usage from recommendations
    const energyUsage = optimization.recommendations.dailyEnergyRequirement || 0;

    let severity: 'low' | 'medium' | 'high' | 'critical' | null = null;
    let message = '';

    if (energyUsage >= thresholds.critical) {
        severity = 'critical';
        message = `Critical energy usage detected: ${energyUsage}kWh/day exceeds critical threshold of ${thresholds.critical}kWh/day. Review equipment efficiency and operating schedules.`;
    } else if (energyUsage >= thresholds.warning) {
        severity = 'high';
        message = `High energy usage detected: ${energyUsage}kWh/day exceeds warning threshold of ${thresholds.warning}kWh/day. Consider energy-efficient alternatives.`;
    } else if (energyUsage > thresholds.optimal) {
        severity = 'medium';
        message = `Energy usage (${energyUsage}kWh/day) exceeds optimal threshold of ${thresholds.optimal}kWh/day. Optimize equipment usage for cost savings.`;
    }

    if (severity) {
        await triggerAlert({
            userId: optimization.userId,
            farmId: optimization.farmId,
            type: 'resource_usage_energy',
            severity,
            message,
            metadata: {
                optimizationId: optimization.optimizationId,
                resourceType: 'energy',
                currentUsage: energyUsage,
                optimalThreshold: thresholds.optimal,
                warningThreshold: thresholds.warning,
                criticalThreshold: thresholds.critical,
                recommendations: optimization.recommendations,
            },
        });
    }
}

/**
 * Trigger alert by invoking alert-create Lambda
 * Requirement 8.9: Call alert-create Lambda when thresholds exceeded
 */
async function triggerAlert(alertData: {
    userId: string;
    farmId: string;
    type: string;
    severity: string;
    message: string;
    metadata: any;
}): Promise<void> {
    try {
        console.log('Triggering alert', {
            userId: alertData.userId,
            farmId: alertData.farmId,
            type: alertData.type,
            severity: alertData.severity,
        });

        const payload = {
            body: JSON.stringify(alertData),
            requestContext: {
                authorizer: {
                    userId: alertData.userId,
                },
                requestId: `alert-trigger-${Date.now()}`,
            },
        };

        const command = new InvokeCommand({
            FunctionName: ALERT_CREATE_LAMBDA_ARN,
            InvocationType: 'Event', // Async invocation
            Payload: JSON.stringify(payload),
        });

        await lambdaClient.send(command);

        console.log('Alert triggered successfully', {
            alertType: alertData.type,
            severity: alertData.severity,
        });
    } catch (error: any) {
        console.error('Error triggering alert', {
            error: error.message,
            stack: error.stack,
            alertData,
        });
        throw error;
    }
}

/**
 * Get farm details from DynamoDB
 */
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
        return null;
    }
}

/**
 * Get recent sensor data for threshold calculations
 */
async function getRecentSensorData(farmId: string): Promise<any> {
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