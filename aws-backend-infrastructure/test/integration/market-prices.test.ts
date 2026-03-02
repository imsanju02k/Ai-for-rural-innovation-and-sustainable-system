/**
 * Market Price Retrieval Integration Tests
 * Tests market price data retrieval and prediction functionality
 * 
 * Requirements: 12.3
 */

import axios, { AxiosInstance } from 'axios';
import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    InitiateAuthCommand,
    AdminConfirmSignUpCommand,
    AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { testConfig } from './config';

describe('Market Price Integration Tests', () => {
    let cognitoClient: CognitoIdentityProviderClient;
    let dynamoDBClient: DynamoDBDocumentClient;
    let apiClient: AxiosInstance;
    let testUserEmail: string;
    let testUserPassword: string;
    let accessToken: string;

    beforeAll(async () => {
        cognitoClient = new CognitoIdentityProviderClient({ region: testConfig.region });
        const ddbClient = new DynamoDBClient({ region: testConfig.region });
        dynamoDBClient = DynamoDBDocumentClient.from(ddbClient);
        apiClient = axios.create({
            baseURL: testConfig.apiEndpoint,
            timeout: 30000,
        });

        // Create and confirm test user
        testUserEmail = `market-test-${Date.now()}@example.com`;
        testUserPassword = 'TestPass123!';

        await cognitoClient.send(new SignUpCommand({
            ClientId: testConfig.userPoolClientId,
            Username: testUserEmail,
            Password: testUserPassword,
            UserAttributes: [
                { Name: 'email', Value: testUserEmail },
                { Name: 'name', Value: 'Market Test User' },
            ],
        }));

        await cognitoClient.send(new AdminConfirmSignUpCommand({
            UserPoolId: testConfig.userPoolId,
            Username: testUserEmail,
        }));

        // Login to get access token
        const loginResponse = await cognitoClient.send(new InitiateAuthCommand({
            ClientId: testConfig.userPoolClientId,
            AuthFlow: 'USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: testUserEmail,
                PASSWORD: testUserPassword,
            },
        }));

        accessToken = loginResponse.AuthenticationResult!.AccessToken!;

        // Seed some test market price data
        await seedMarketPriceData();

        console.log('Test user created and market data seeded');
    }, 90000);

    afterAll(async () => {
        // Clean up test user
        if (testUserEmail) {
            try {
                await cognitoClient.send(new AdminDeleteUserCommand({
                    UserPoolId: testConfig.userPoolId,
                    Username: testUserEmail,
                }));
                console.log(`Cleaned up test user: ${testUserEmail}`);
            } catch (error) {
                console.error('Failed to clean up test user:', error);
            }
        }
    });

    async function seedMarketPriceData() {
        const commodities = ['wheat', 'rice', 'corn'];
        const now = new Date();

        for (const commodity of commodities) {
            for (let i = 0; i < 5; i++) {
                const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                await dynamoDBClient.send(new PutCommand({
                    TableName: testConfig.tables.marketPrices,
                    Item: {
                        commodity,
                        timestamp: timestamp.toISOString(),
                        priceId: `test-price-${commodity}-${i}`,
                        price: 2000 + Math.random() * 500,
                        unit: 'INR/quintal',
                        marketLocation: {
                            name: 'Test Mandi',
                            latitude: 28.6139,
                            longitude: 77.2090,
                            distance: 10.5,
                        },
                        source: 'test',
                        ttl: Math.floor(Date.now() / 1000) + 86400 * 30,
                    },
                }));
            }
        }
        console.log('Seeded test market price data');
    }

    describe('Get Market Prices', () => {
        it('should retrieve market prices for all commodities', async () => {
            const response = await apiClient.get('/market-prices', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('prices');
            expect(Array.isArray(response.data.prices)).toBe(true);
            expect(response.data).toHaveProperty('count');
            expect(response.data).toHaveProperty('lastUpdated');

            if (response.data.prices.length > 0) {
                const price = response.data.prices[0];
                expect(price).toHaveProperty('priceId');
                expect(price).toHaveProperty('commodity');
                expect(price).toHaveProperty('price');
                expect(price).toHaveProperty('unit');
                expect(price).toHaveProperty('marketLocation');
                expect(price).toHaveProperty('timestamp');
            }

            console.log(`Retrieved ${response.data.count} market prices`);
        }, 30000);

        it('should filter market prices by commodity', async () => {
            const response = await apiClient.get('/market-prices', {
                params: {
                    commodity: 'wheat',
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data.prices.every((p: any) => p.commodity === 'wheat')).toBe(true);

            console.log(`Retrieved ${response.data.count} wheat prices`);
        }, 30000);

        it('should filter market prices by location', async () => {
            const response = await apiClient.get('/market-prices', {
                params: {
                    location: '28.6139,77.2090',
                    radius: 50,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('prices');

            console.log(`Retrieved ${response.data.count} prices within 50km`);
        }, 30000);

        it('should reject request without authentication', async () => {
            await expect(
                apiClient.get('/market-prices')
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Get Commodity Price Details', () => {
        it('should retrieve detailed price information for specific commodity', async () => {
            const response = await apiClient.get('/market-prices/wheat', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('commodity');
            expect(response.data.commodity).toBe('wheat');
            expect(response.data).toHaveProperty('currentPrice');
            expect(response.data).toHaveProperty('unit');
            expect(response.data).toHaveProperty('priceHistory');
            expect(Array.isArray(response.data.priceHistory)).toBe(true);

            if (response.data.priceHistory.length > 0) {
                expect(response.data).toHaveProperty('trend');
                expect(response.data).toHaveProperty('changePercent');
            }

            console.log(`Retrieved wheat price details: ${response.data.currentPrice} ${response.data.unit}`);
        }, 30000);

        it('should return 404 for non-existent commodity', async () => {
            await expect(
                apiClient.get('/market-prices/nonexistent-crop', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Market Price Predictions', () => {
        it('should retrieve price predictions', async () => {
            try {
                const response = await apiClient.get('/market-prices/wheat/predict', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                expect(response.status).toBe(200);
                expect(response.data).toHaveProperty('commodity');
                expect(response.data).toHaveProperty('predictions');

                if (response.data.predictions) {
                    expect(response.data.predictions).toHaveProperty('7day');
                    expect(response.data.predictions).toHaveProperty('14day');
                    expect(response.data.predictions).toHaveProperty('30day');
                }

                console.log('Retrieved price predictions');
            } catch (error: any) {
                // Predictions might not be available if AI service is not configured
                if (error.response?.status === 503) {
                    console.log('Price prediction service unavailable (expected in test environment)');
                } else {
                    throw error;
                }
            }
        }, 30000);
    });
});
