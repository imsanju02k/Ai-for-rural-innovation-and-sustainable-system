/**
 * Integration test configuration
 * Loads environment-specific configuration for integration tests
 */

export interface IntegrationTestConfig {
    apiEndpoint: string;
    region: string;
    userPoolId: string;
    userPoolClientId: string;
    identityPoolId: string;
    imagesBucket: string;
    environment: string;
    tables: {
        users: string;
        farms: string;
        images: string;
        diseaseAnalyses: string;
        marketPrices: string;
        sensorData: string;
        chatMessages: string;
        alerts: string;
        optimizations: string;
    };
}

/**
 * Load integration test configuration from environment or AWS outputs
 */
export function loadTestConfig(): IntegrationTestConfig {
    const environment = process.env.ENVIRONMENT || 'dev';
    const region = process.env.AWS_REGION || 'us-east-1';

    return {
        apiEndpoint: process.env.API_ENDPOINT || 'https://hkwp4iwhu6.execute-api.us-east-1.amazonaws.com/dev/',
        region,
        userPoolId: process.env.USER_POOL_ID || 'us-east-1_wBAvFZ0SK',
        userPoolClientId: process.env.USER_POOL_CLIENT_ID || 'bcav3ls91uen7iiplno5rd03n',
        identityPoolId: process.env.IDENTITY_POOL_ID || 'us-east-1:c9686f9b-cab7-46e4-a5b2-a905c133b486',
        imagesBucket: process.env.IMAGES_BUCKET || 'dev-farm-images-339712928283',
        environment,
        tables: {
            users: process.env.USERS_TABLE || 'dev-dynamodb-users',
            farms: process.env.FARMS_TABLE || 'dev-dynamodb-farms',
            images: process.env.IMAGES_TABLE || 'dev-dynamodb-images',
            diseaseAnalyses: process.env.DISEASE_ANALYSES_TABLE || 'dev-dynamodb-disease-analyses',
            marketPrices: process.env.MARKET_PRICES_TABLE || 'dev-dynamodb-market-prices',
            sensorData: process.env.SENSOR_DATA_TABLE || 'dev-dynamodb-sensor-data',
            chatMessages: process.env.CHAT_MESSAGES_TABLE || 'dev-dynamodb-chat-messages',
            alerts: process.env.ALERTS_TABLE || 'dev-dynamodb-alerts',
            optimizations: process.env.OPTIMIZATIONS_TABLE || 'dev-dynamodb-optimizations',
        },
    };
}

export const testConfig = loadTestConfig();
