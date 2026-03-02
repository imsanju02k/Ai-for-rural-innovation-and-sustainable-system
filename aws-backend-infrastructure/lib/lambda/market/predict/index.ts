/**
 * Market Predict Lambda Function
 * Uses Amazon Bedrock to generate price predictions based on historical data
 * Generates predictions for 7, 14, and 30-day horizons with confidence intervals
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { MarketPrice, PricePrediction } from '../shared/types';
import { generateHistoricalPrices } from '../shared/mock-data';
import { randomUUID } from 'crypto';

// Initialize AWS clients
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const MARKET_PRICES_TABLE = process.env.MARKET_PRICES_TABLE || 'dev-market-prices';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';

// CORS headers
const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
};

/**
 * Fetch historical prices from DynamoDB
 */
async function fetchHistoricalPrices(commodity: string, daysBack: number = 90): Promise<MarketPrice[]> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        const result = await docClient.send(
            new QueryCommand({
                TableName: MARKET_PRICES_TABLE,
                KeyConditionExpression: 'commodity = :commodity AND #ts >= :startDate',
                ExpressionAttributeNames: {
                    '#ts': 'timestamp',
                },
                ExpressionAttributeValues: {
                    ':commodity': commodity,
                    ':startDate': startDate.toISOString(),
                },
                ScanIndexForward: true, // Sort by timestamp ascending
            })
        );

        const prices = (result.Items as MarketPrice[]) || [];

        // If no historical data, generate mock data for development
        if (prices.length === 0) {
            console.log('No historical data found, generating mock data');
            return generateHistoricalPrices(commodity, daysBack);
        }

        return prices;
    } catch (error) {
        console.error('Error fetching historical prices:', error);
        throw error;
    }
}

/**
 * Prepare historical data for AI model
 */
function prepareHistoricalData(prices: MarketPrice[]): string {
    // Group by date and calculate average price per day
    const dailyPrices = new Map<string, number[]>();

    for (const price of prices) {
        const date = price.timestamp.split('T')[0]; // Get date part
        if (!dailyPrices.has(date)) {
            dailyPrices.set(date, []);
        }
        dailyPrices.get(date)!.push(price.price);
    }

    // Calculate daily averages
    const dataPoints: { date: string; price: number }[] = [];
    for (const [date, priceList] of dailyPrices.entries()) {
        const avgPrice = priceList.reduce((sum, p) => sum + p, 0) / priceList.length;
        dataPoints.push({ date, price: Math.round(avgPrice) });
    }

    // Sort by date
    dataPoints.sort((a, b) => a.date.localeCompare(b.date));

    return JSON.stringify(dataPoints, null, 2);
}

/**
 * Call Amazon Bedrock for price prediction
 */
async function generatePrediction(
    commodity: string,
    historicalData: string,
    currentPrice: number
): Promise<PricePrediction> {
    const prompt = `You are an agricultural market analyst. Based on the following historical price data for ${commodity}, predict the prices for 7, 14, and 30 days from now.

Historical Price Data (INR per quintal):
${historicalData}

Current Price: ${currentPrice} INR/quintal

Please provide predictions with confidence intervals (lower and upper bounds). Consider seasonal trends, market volatility, and typical price patterns.

Respond in the following JSON format:
{
  "predictions": [
    {
      "horizon": 7,
      "predictedPrice": <number>,
      "confidenceInterval": {
        "lower": <number>,
        "upper": <number>
      }
    },
    {
      "horizon": 14,
      "predictedPrice": <number>,
      "confidenceInterval": {
        "lower": <number>,
        "upper": <number>
      }
    },
    {
      "horizon": 30,
      "predictedPrice": <number>,
      "confidenceInterval": {
        "lower": <number>,
        "upper": <number>
      }
    }
  ],
  "reasoning": "<brief explanation of the prediction>"
}`;

    try {
        const startTime = Date.now();

        const response = await bedrockClient.send(
            new InvokeModelCommand({
                modelId: BEDROCK_MODEL_ID,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    anthropic_version: 'bedrock-2023-05-31',
                    max_tokens: 2000,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    temperature: 0.3, // Lower temperature for more consistent predictions
                }),
            })
        );

        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiResponse = responseBody.content[0].text;

        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to extract JSON from AI response');
        }

        const predictionData = JSON.parse(jsonMatch[0]);
        const processingTime = Date.now() - startTime;

        console.log(`Bedrock prediction completed in ${processingTime}ms`);

        return {
            commodity,
            currentPrice,
            predictions: predictionData.predictions,
            generatedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error calling Bedrock:', error);

        // Fallback to simple statistical prediction if Bedrock fails
        console.log('Using fallback statistical prediction');
        return generateFallbackPrediction(commodity, currentPrice);
    }
}

/**
 * Generate fallback prediction using simple statistical methods
 */
function generateFallbackPrediction(commodity: string, currentPrice: number): PricePrediction {
    // Simple prediction: assume slight increase with increasing uncertainty
    const predictions = [
        {
            horizon: 7,
            predictedPrice: Math.round(currentPrice * 1.02), // 2% increase
            confidenceInterval: {
                lower: Math.round(currentPrice * 0.97),
                upper: Math.round(currentPrice * 1.07),
            },
        },
        {
            horizon: 14,
            predictedPrice: Math.round(currentPrice * 1.04), // 4% increase
            confidenceInterval: {
                lower: Math.round(currentPrice * 0.94),
                upper: Math.round(currentPrice * 1.14),
            },
        },
        {
            horizon: 30,
            predictedPrice: Math.round(currentPrice * 1.06), // 6% increase
            confidenceInterval: {
                lower: Math.round(currentPrice * 0.90),
                upper: Math.round(currentPrice * 1.22),
            },
        },
    ];

    return {
        commodity,
        currentPrice,
        predictions,
        generatedAt: new Date().toISOString(),
    };
}

/**
 * Store prediction in DynamoDB
 */
async function storePrediction(prediction: PricePrediction): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + 86400 * 7; // 7 days TTL

    try {
        await docClient.send(
            new PutCommand({
                TableName: MARKET_PRICES_TABLE,
                Item: {
                    priceId: randomUUID(),
                    commodity: prediction.commodity,
                    timestamp: prediction.generatedAt,
                    price: prediction.currentPrice,
                    unit: 'INR/quintal',
                    source: 'prediction',
                    predictions: prediction.predictions,
                    ttl,
                },
            })
        );

        console.log('Prediction stored in DynamoDB');
    } catch (error) {
        console.error('Error storing prediction:', error);
        // Don't throw - storage failure shouldn't fail the entire function
    }
}

/**
 * Lambda handler
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = event.requestContext.requestId;
    const startTime = Date.now();

    try {
        // Parse request body
        const body = event.body ? JSON.parse(event.body) : {};
        const commodity = body.commodity;

        // Validate commodity parameter
        if (!commodity) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Commodity parameter is required',
                        requestId,
                        timestamp: new Date().toISOString(),
                    },
                }),
            };
        }

        console.log('Generating price prediction', { commodity });

        // Fetch historical prices
        const historicalPrices = await fetchHistoricalPrices(commodity);

        if (historicalPrices.length === 0) {
            return {
                statusCode: 400,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    error: {
                        code: 'INSUFFICIENT_DATA',
                        message: 'Insufficient historical data for prediction',
                        requestId,
                        timestamp: new Date().toISOString(),
                    },
                }),
            };
        }

        // Calculate current price (average of most recent prices)
        const recentPrices = historicalPrices.slice(-7);
        const currentPrice = Math.round(
            recentPrices.reduce((sum, p) => sum + p.price, 0) / recentPrices.length
        );

        // Prepare historical data
        const historicalData = prepareHistoricalData(historicalPrices);

        // Generate prediction using Bedrock
        const prediction = await generatePrediction(commodity, historicalData, currentPrice);

        // Store prediction in DynamoDB
        await storePrediction(prediction);

        const processingTime = Date.now() - startTime;

        // Ensure response time is within 3 seconds requirement
        if (processingTime > 3000) {
            console.warn(`Prediction took ${processingTime}ms, exceeding 3s requirement`);
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                ...prediction,
                processingTimeMs: processingTime,
                requestId,
            }),
        };
    } catch (error) {
        console.error('Error in market-predict Lambda:', error);

        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred',
                    requestId,
                    timestamp: new Date().toISOString(),
                },
            }),
        };
    }
}
