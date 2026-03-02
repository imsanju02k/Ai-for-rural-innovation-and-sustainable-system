#!/usr/bin/env node
/**
 * Seed Market Price Data Script
 * 
 * Creates test market price data in DynamoDB MarketPrices table
 * 
 * Usage:
 *   npm run seed:market-prices -- --environment dev
 *   npm run seed:market-prices -- --environment dev --days 30
 * 
 * Requirements: 15.7
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'dev';
const days = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1] || '30');

// AWS Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

// Table name
const MARKET_PRICES_TABLE = `${environment}-dynamodb-market-prices`;

// Commodities and their base prices (INR per quintal)
const COMMODITIES = [
    { name: 'wheat', basePrice: 2500, volatility: 0.05 },
    { name: 'rice', basePrice: 3200, volatility: 0.06 },
    { name: 'corn', basePrice: 1800, volatility: 0.07 },
    { name: 'tomato', basePrice: 1500, volatility: 0.15 },
    { name: 'potato', basePrice: 1200, volatility: 0.12 },
    { name: 'onion', basePrice: 2000, volatility: 0.18 },
    { name: 'sugarcane', basePrice: 3000, volatility: 0.04 },
    { name: 'cotton', basePrice: 5500, volatility: 0.08 },
    { name: 'soybean', basePrice: 4200, volatility: 0.06 },
    { name: 'chickpea', basePrice: 5000, volatility: 0.07 },
];

// Market locations in India
const MARKET_LOCATIONS = [
    { name: 'Meerut Mandi', latitude: 28.9845, longitude: 77.7064 },
    { name: 'Ludhiana Mandi', latitude: 30.9010, longitude: 75.8573 },
    { name: 'Ahmedabad APMC', latitude: 23.0225, longitude: 72.5714 },
    { name: 'Bangalore Market', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Mumbai APMC', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Delhi Azadpur Mandi', latitude: 28.7041, longitude: 77.1025 },
];

/**
 * Generate a price with random walk
 */
function generatePrice(basePrice: number, volatility: number, dayOffset: number): number {
    // Random walk with trend
    const trend = 1 + (Math.random() - 0.48) * 0.001 * dayOffset; // Slight upward trend
    const randomWalk = 1 + (Math.random() - 0.5) * volatility;
    const price = basePrice * trend * randomWalk;

    return Math.round(price * 100) / 100; // Round to 2 decimal places
}

/**
 * Create a market price entry
 */
async function createMarketPrice(
    commodity: string,
    price: number,
    marketLocation: typeof MARKET_LOCATIONS[0],
    timestamp: Date
): Promise<void> {
    const priceId = uuidv4();
    const ttl = Math.floor(timestamp.getTime() / 1000) + (90 * 24 * 60 * 60); // 90 days from timestamp

    const priceEntry = {
        priceId,
        commodity,
        timestamp: timestamp.toISOString(),
        price,
        unit: 'INR/quintal',
        marketLocation: marketLocation.name,
        marketLocationLat: marketLocation.latitude,
        marketLocationLon: marketLocation.longitude,
        source: 'test-seed-data',
        ttl,
    };

    try {
        await dynamoClient.send(new PutCommand({
            TableName: MARKET_PRICES_TABLE,
            Item: priceEntry,
        }));
    } catch (error: any) {
        console.error(`✗ Failed to create price entry:`, error.message);
        throw error;
    }
}

/**
 * Main seeding function
 */
async function seedMarketPrices() {
    console.log('\n=== Seeding Market Price Data ===\n');
    console.log(`Environment: ${environment}`);
    console.log(`Region: ${region}`);
    console.log(`Market Prices Table: ${MARKET_PRICES_TABLE}`);
    console.log(`Days of historical data: ${days}`);
    console.log(`Commodities: ${COMMODITIES.length}`);
    console.log(`Market locations: ${MARKET_LOCATIONS.length}\n`);

    let totalEntries = 0;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('Generating price data...\n');

    // For each commodity
    for (const commodity of COMMODITIES) {
        console.log(`Processing ${commodity.name}...`);

        // For each day
        for (let dayOffset = 0; dayOffset < days; dayOffset++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + dayOffset);

            // Generate price for this day
            const price = generatePrice(commodity.basePrice, commodity.volatility, dayOffset);

            // Create entry for each market location
            for (const location of MARKET_LOCATIONS) {
                // Add some location-based price variation (±5%)
                const locationVariation = 1 + (Math.random() - 0.5) * 0.1;
                const locationPrice = Math.round(price * locationVariation * 100) / 100;

                try {
                    await createMarketPrice(commodity.name, locationPrice, location, date);
                    totalEntries++;

                    // Progress indicator
                    if (totalEntries % 100 === 0) {
                        process.stdout.write('.');
                    }
                } catch (error) {
                    console.error(`\n✗ Failed to create entry for ${commodity.name} at ${location.name}`);
                }
            }
        }

        console.log(` ✓ Completed ${commodity.name}`);
    }

    // Print summary
    console.log('\n\n=== Seeding Complete ===\n');
    console.log(`Successfully created ${totalEntries} market price entries\n`);

    console.log('Summary:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Commodities:       ${COMMODITIES.length}`);
    console.log(`Market Locations:  ${MARKET_LOCATIONS.length}`);
    console.log(`Days of Data:      ${days}`);
    console.log(`Total Entries:     ${totalEntries}`);
    console.log(`Expected Entries:  ${COMMODITIES.length * MARKET_LOCATIONS.length * days}`);
    console.log('─────────────────────────────────────────────────────');

    console.log('\nCommodity Price Ranges (INR/quintal):');
    console.log('─────────────────────────────────────────────────────');
    COMMODITIES.forEach(commodity => {
        const minPrice = Math.round(commodity.basePrice * (1 - commodity.volatility * 2));
        const maxPrice = Math.round(commodity.basePrice * (1 + commodity.volatility * 2));
        console.log(`${commodity.name.padEnd(15)} ${minPrice} - ${maxPrice}`);
    });
    console.log('─────────────────────────────────────────────────────\n');
}

// Run the script
seedMarketPrices().catch(error => {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
});
