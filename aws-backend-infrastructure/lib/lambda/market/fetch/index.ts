/**
 * Market Fetch Lambda Function
 * Scheduled to run daily at 00:00 UTC
 * Fetches market price data and stores in DynamoDB and Redis cache
 */

import { ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import Redis from 'ioredis';
import { generateMockPrices } from '../shared/mock-data';
import { MarketPrice } from '../shared/types';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize Redis client (lazy initialization)
let redisClient: Redis | null = null;

// Environment variables
const MARKET_PRICES_TABLE = process.env.MARKET_PRICES_TABLE || 'dev-market-prices';
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT;
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';
const CACHE_TTL = 300; // 5 minutes

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
 * Fetch market prices from external API or generate mock data
 */
async function fetchMarketPrices(): Promise<MarketPrice[]> {
    // In production, this would call external market price APIs
    // For now, we generate mock data
    console.log('Generating mock market price data');
    const timestamp = new Date().toISOString();
    return generateMockPrices(timestamp);
}

/**
 * Store prices in DynamoDB using batch write
 */
async function storePricesInDynamoDB(prices: MarketPrice[]): Promise<void> {
    console.log(`Storing ${prices.length} prices in DynamoDB`);

    // DynamoDB batch write supports max 25 items per request
    const batchSize = 25;
    const batches: MarketPrice[][] = [];

    for (let i = 0; i < prices.length; i += batchSize) {
        batches.push(prices.slice(i, i + batchSize));
    }

    for (const batch of batches) {
        const putRequests = batch.map((price) => ({
            PutRequest: {
                Item: price,
            },
        }));

        try {
            await docClient.send(
                new BatchWriteCommand({
                    RequestItems: {
                        [MARKET_PRICES_TABLE]: putRequests,
                    },
                })
            );
            console.log(`Stored batch of ${batch.length} prices`);
        } catch (error) {
            console.error('Error storing batch in DynamoDB:', error);
            throw error;
        }
    }
}

/**
 * Cache prices in Redis
 */
async function cachePricesInRedis(prices: MarketPrice[]): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
        console.log('Redis not available, skipping cache');
        return;
    }

    console.log(`Caching ${prices.length} prices in Redis`);

    try {
        const pipeline = redis.pipeline();

        for (const price of prices) {
            const cacheKey = `market:price:${price.commodity}:${price.marketLocation.name}`;
            const cacheValue = JSON.stringify({
                commodity: price.commodity,
                price: price.price,
                unit: price.unit,
                marketLocation: price.marketLocation,
                timestamp: price.timestamp,
                isStale: false,
            });

            pipeline.setex(cacheKey, CACHE_TTL, cacheValue);
        }

        await pipeline.exec();
        console.log('Successfully cached prices in Redis');
    } catch (error) {
        console.error('Error caching prices in Redis:', error);
        // Don't throw - caching failure shouldn't fail the entire function
    }
}

/**
 * Lambda handler
 */
export async function handler(event: ScheduledEvent): Promise<void> {
    console.log('Market fetch Lambda triggered', {
        time: event.time,
        environment: ENVIRONMENT,
    });

    try {
        // Fetch market prices
        const prices = await fetchMarketPrices();
        console.log(`Fetched ${prices.length} market prices`);

        // Store in DynamoDB
        await storePricesInDynamoDB(prices);

        // Cache in Redis
        await cachePricesInRedis(prices);

        console.log('Market price fetch completed successfully', {
            pricesProcessed: prices.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in market fetch Lambda:', error);
        throw error;
    } finally {
        // Close Redis connection if it exists
        if (redisClient) {
            await redisClient.quit();
            redisClient = null;
        }
    }
}
