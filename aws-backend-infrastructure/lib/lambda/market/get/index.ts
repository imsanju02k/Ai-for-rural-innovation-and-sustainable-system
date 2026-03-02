/**
 * Market Get Lambda Function
 * Retrieves market prices by commodity with optional location filtering
 * Checks Redis cache before querying DynamoDB
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import Redis from 'ioredis';
import { MarketPrice, CachedPrice } from '../shared/types';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize Redis client (lazy initialization)
let redisClient: Redis | null = null;

// Environment variables
const MARKET_PRICES_TABLE = process.env.MARKET_PRICES_TABLE || 'dev-market-prices';
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT;
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const CACHE_TTL = 300; // 5 minutes

// CORS headers
const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
};

/**
 * Get or create Redis client
 */
function getRedisClient(): Redis | null {
    if (!REDIS_ENDPOINT) {
        console.log('Redis endpoint not configured, skipping cache');
        return null;
    }

    if (!redisClient) {
        redisClient = new Redis({
            host: REDIS_ENDPOINT,
            port: REDIS_PORT,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.error('Redis connection failed after 3 retries');
                    return null;
                }
                return Math.min(times * 100, 3000);
            },
        });

        redisClient.on('error', (err) => {
            console.error('Redis error:', err);
        });
    }

    return redisClient;
}

/**
 * Check Redis cache for prices
 */
async function checkCache(commodity: string, location?: string): Promise<CachedPrice[]> {
    const redis = getRedisClient();
    if (!redis) {
        return [];
    }

    try {
        const pattern = location
            ? `market:price:${commodity}:${location}`
            : `market:price:${commodity}:*`;

        const keys = await redis.keys(pattern);
        if (keys.length === 0) {
            return [];
        }

        const values = await redis.mget(...keys);
        const cachedPrices: CachedPrice[] = [];

        for (const value of values) {
            if (value) {
                try {
                    cachedPrices.push(JSON.parse(value));
                } catch (error) {
                    console.error('Error parsing cached price:', error);
                }
            }
        }

        console.log(`Found ${cachedPrices.length} cached prices for ${commodity}`);
        return cachedPrices;
    } catch (error) {
        console.error('Error checking cache:', error);
        return [];
    }
}

/**
 * Query DynamoDB for market prices
 */
async function queryPricesFromDynamoDB(
    commodity: string,
    limit: number = 20
): Promise<MarketPrice[]> {
    try {
        const result = await docClient.send(
            new QueryCommand({
                TableName: MARKET_PRICES_TABLE,
                KeyConditionExpression: 'commodity = :commodity',
                ExpressionAttributeValues: {
                    ':commodity': commodity,
                },
                ScanIndexForward: false, // Sort by timestamp descending
                Limit: limit,
            })
        );

        return (result.Items as MarketPrice[]) || [];
    } catch (error) {
        console.error('Error querying DynamoDB:', error);
        throw error;
    }
}

/**
 * Filter prices by location (within radius)
 */
function filterByLocation(
    prices: MarketPrice[] | CachedPrice[],
    latitude: number,
    longitude: number,
    radiusKm: number = 50
): (MarketPrice | CachedPrice)[] {
    return prices.filter((price) => {
        const distance = calculateDistance(
            latitude,
            longitude,
            price.marketLocation.latitude,
            price.marketLocation.longitude
        );
        return distance <= radiusKm;
    });
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Add distance to price objects
 */
function addDistanceToPrice(
    price: MarketPrice | CachedPrice,
    userLat: number,
    userLon: number
): any {
    const distance = calculateDistance(
        userLat,
        userLon,
        price.marketLocation.latitude,
        price.marketLocation.longitude
    );

    return {
        ...price,
        marketLocation: {
            ...price.marketLocation,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        },
    };
}

/**
 * Lambda handler
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = event.requestContext.requestId;

    try {
        // Parse query parameters
        const commodity = event.queryStringParameters?.commodity;
        const location = event.queryStringParameters?.location; // Format: "lat,lon"
        const radius = parseInt(event.queryStringParameters?.radius || '50');

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

        // Parse location if provided
        let userLat: number | undefined;
        let userLon: number | undefined;
        if (location) {
            const [lat, lon] = location.split(',').map(parseFloat);
            if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Invalid location format. Use: latitude,longitude',
                            requestId,
                            timestamp: new Date().toISOString(),
                        },
                    }),
                };
            }
            userLat = lat;
            userLon = lon;
        }

        console.log('Fetching market prices', {
            commodity,
            location: location || 'all',
            radius,
        });

        // Check cache first
        let prices: any[] = await checkCache(commodity);
        let fromCache = prices.length > 0;

        // If not in cache, query DynamoDB
        if (prices.length === 0) {
            prices = await queryPricesFromDynamoDB(commodity);
            fromCache = false;
        }

        // Filter by location if provided
        if (userLat !== undefined && userLon !== undefined) {
            prices = filterByLocation(prices, userLat, userLon, radius);
            // Add distance to each price
            prices = prices.map((price) => addDistanceToPrice(price, userLat!, userLon!));
        }

        // Sort by timestamp descending
        prices.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });

        // Get the most recent timestamp
        const lastUpdated = prices.length > 0 ? prices[0].timestamp : new Date().toISOString();

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                prices,
                count: prices.length,
                lastUpdated,
                fromCache,
                requestId,
            }),
        };
    } catch (error) {
        console.error('Error in market-get Lambda:', error);

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
    } finally {
        // Don't close Redis connection in Lambda - reuse across invocations
    }
}
