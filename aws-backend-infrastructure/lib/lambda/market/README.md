# Market Price Lambda Functions

This directory contains Lambda functions for market price data management.

## Functions

### market-fetch
Scheduled Lambda function that runs daily at 00:00 UTC to fetch market price data from external APIs or generate mock data. Stores prices in DynamoDB and caches them in ElastiCache Redis.

**Trigger**: EventBridge scheduled rule (cron: 0 0 * * ? *)
**Memory**: 512 MB
**Timeout**: 300 seconds

### market-get
API Lambda function to retrieve market prices by commodity with optional location-based filtering. Checks ElastiCache for cached prices before querying DynamoDB.

**Trigger**: API Gateway GET /market-prices
**Memory**: 256 MB
**Timeout**: 10 seconds

### market-predict
AI-powered Lambda function that uses Amazon Bedrock to generate price predictions for 7, 14, and 30-day horizons based on historical data.

**Trigger**: API Gateway POST /market-prices/predict
**Memory**: 1024 MB
**Timeout**: 60 seconds

## Environment Variables

- `ENVIRONMENT`: Deployment environment (dev/staging/prod)
- `DYNAMODB_TABLE_PREFIX`: Prefix for DynamoDB table names
- `MARKET_PRICES_TABLE`: MarketPrices table name
- `REDIS_ENDPOINT`: ElastiCache Redis endpoint
- `REDIS_PORT`: ElastiCache Redis port (default: 6379)
- `BEDROCK_MODEL_ID`: Amazon Bedrock model ID for predictions
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

## Data Models

### MarketPrice
```typescript
{
  priceId: string;        // UUID
  commodity: string;      // Partition key
  timestamp: string;      // Sort key (ISO 8601)
  price: number;
  unit: string;
  marketLocation: {
    name: string;
    latitude: number;
    longitude: number;
  };
  source: string;
  ttl: number;           // Unix timestamp for DynamoDB TTL
}
```

## Cache Strategy

Market prices are cached in Redis with the following key pattern:
- Key: `market:price:{commodity}:{location}`
- TTL: 300 seconds (5 minutes)
- Value: JSON string of price data
