/**
 * Mock market price data generator
 * Used for development and testing when external APIs are not available
 */

import { MarketPrice, MarketLocation, SUPPORTED_COMMODITIES } from './types';
import { randomUUID } from 'crypto';

// Sample market locations in India
const MARKET_LOCATIONS: MarketLocation[] = [
    { name: 'Meerut Mandi', latitude: 28.9845, longitude: 77.7064 },
    { name: 'Delhi APMC', latitude: 28.6139, longitude: 77.2090 },
    { name: 'Mumbai Market', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Bangalore Mandi', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Hyderabad Market', latitude: 17.3850, longitude: 78.4867 },
    { name: 'Chennai Koyambedu', latitude: 13.0827, longitude: 80.2707 },
    { name: 'Kolkata Market', latitude: 22.5726, longitude: 88.3639 },
    { name: 'Pune APMC', latitude: 18.5204, longitude: 73.8567 },
    { name: 'Ahmedabad Mandi', latitude: 23.0225, longitude: 72.5714 },
    { name: 'Jaipur Market', latitude: 26.9124, longitude: 75.7873 },
];

// Base prices for commodities (INR per quintal)
const BASE_PRICES: Record<string, number> = {
    wheat: 2500,
    rice: 3200,
    corn: 1800,
    tomato: 1500,
    potato: 1200,
    onion: 2000,
    sugarcane: 3500,
    cotton: 6500,
    soybean: 4200,
    chickpea: 5500,
    lentil: 6000,
    mustard: 5200,
    groundnut: 5800,
    sunflower: 6200,
    barley: 2200,
    millet: 2800,
    sorghum: 2600,
    tea: 8000,
    coffee: 12000,
    rubber: 15000,
};

/**
 * Generate mock market prices for all commodities
 */
export function generateMockPrices(timestamp: string = new Date().toISOString()): MarketPrice[] {
    const prices: MarketPrice[] = [];
    const ttl = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days TTL

    for (const commodity of SUPPORTED_COMMODITIES) {
        // Generate prices for 3-5 random markets
        const numMarkets = Math.floor(Math.random() * 3) + 3;
        const selectedMarkets = shuffleArray([...MARKET_LOCATIONS]).slice(0, numMarkets);

        for (const location of selectedMarkets) {
            const basePrice = BASE_PRICES[commodity] || 2000;
            // Add random variation (-10% to +15%)
            const variation = 0.9 + Math.random() * 0.25;
            const price = Math.round(basePrice * variation);

            prices.push({
                priceId: randomUUID(),
                commodity,
                timestamp,
                price,
                unit: 'INR/quintal',
                marketLocation: location,
                source: 'mock-data',
                ttl,
            });
        }
    }

    return prices;
}

/**
 * Generate historical mock prices for a commodity
 * Used for prediction model training
 */
export function generateHistoricalPrices(
    commodity: string,
    daysBack: number = 90
): MarketPrice[] {
    const prices: MarketPrice[] = [];
    const basePrice = BASE_PRICES[commodity] || 2000;
    const location = MARKET_LOCATIONS[0]; // Use first location for historical data
    const ttl = Math.floor(Date.now() / 1000) + 86400 * 30;

    for (let i = daysBack; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(8, 0, 0, 0); // Set to 8 AM

        // Simulate price trends with some randomness
        const trendFactor = 1 + (Math.sin(i / 10) * 0.1); // Seasonal trend
        const randomFactor = 0.95 + Math.random() * 0.1; // Daily variation
        const price = Math.round(basePrice * trendFactor * randomFactor);

        prices.push({
            priceId: randomUUID(),
            commodity,
            timestamp: date.toISOString(),
            price,
            unit: 'INR/quintal',
            marketLocation: location,
            source: 'mock-historical',
            ttl,
        });
    }

    return prices;
}

/**
 * Shuffle array helper
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get price trend (increasing/decreasing/stable)
 */
export function getPriceTrend(prices: MarketPrice[]): 'increasing' | 'decreasing' | 'stable' {
    if (prices.length < 2) return 'stable';

    const sortedPrices = [...prices].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const recentPrices = sortedPrices.slice(-7); // Last 7 prices
    const avgRecent = recentPrices.reduce((sum, p) => sum + p.price, 0) / recentPrices.length;

    const olderPrices = sortedPrices.slice(-14, -7); // Previous 7 prices
    if (olderPrices.length === 0) return 'stable';

    const avgOlder = olderPrices.reduce((sum, p) => sum + p.price, 0) / olderPrices.length;

    const changePercent = ((avgRecent - avgOlder) / avgOlder) * 100;

    if (changePercent > 2) return 'increasing';
    if (changePercent < -2) return 'decreasing';
    return 'stable';
}
