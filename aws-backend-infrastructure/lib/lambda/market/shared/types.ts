/**
 * Shared types for market price Lambda functions
 */

export interface MarketLocation {
    name: string;
    latitude: number;
    longitude: number;
}

export interface MarketPrice {
    priceId: string;
    commodity: string;
    timestamp: string;
    price: number;
    unit: string;
    marketLocation: MarketLocation;
    source: string;
    ttl: number;
}

export interface PricePrediction {
    commodity: string;
    currentPrice: number;
    predictions: {
        horizon: number; // days
        predictedPrice: number;
        confidenceInterval: {
            lower: number;
            upper: number;
        };
    }[];
    generatedAt: string;
}

export interface CachedPrice {
    commodity: string;
    price: number;
    unit: string;
    marketLocation: MarketLocation;
    timestamp: string;
    isStale: boolean;
}

// Common commodities supported
export const SUPPORTED_COMMODITIES = [
    'wheat',
    'rice',
    'corn',
    'tomato',
    'potato',
    'onion',
    'sugarcane',
    'cotton',
    'soybean',
    'chickpea',
    'lentil',
    'mustard',
    'groundnut',
    'sunflower',
    'barley',
    'millet',
    'sorghum',
    'tea',
    'coffee',
    'rubber',
] as const;

export type Commodity = typeof SUPPORTED_COMMODITIES[number];
