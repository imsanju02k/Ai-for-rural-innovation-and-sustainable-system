/**
 * IoT Data Ingestion Integration Tests
 * Tests IoT sensor data ingestion and retrieval
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
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { testConfig } from './config';

describe('IoT Data Ingestion Integration Tests', () => {
    let cognitoClient: CognitoIdentityProviderClient;
    let dynamoDBClient: DynamoDBDocumentClient;
    let apiClient: AxiosInstance;
    let testUserEmail: string;
    let testUserPassword: string;
    let accessToken: string;
    let testFarmId: string;
    let testDeviceId: string;

    beforeAll(async () => {
        cognitoClient = new CognitoIdentityProviderClient({ region: testConfig.region });
        const ddbClient = new DynamoDBClient({ region: testConfig.region });
        dynamoDBClient = DynamoDBDocumentClient.from(ddbClient);
        apiClient = axios.create({
            baseURL: testConfig.apiEndpoint,
            timeout: 30000,
        });

        // Create and confirm test user
        testUserEmail = `iot-test-${Date.now()}@example.com`;
        testUserPassword = 'TestPass123!';

        await cognitoClient.send(new SignUpCommand({
            ClientId: testConfig.userPoolClientId,
            Username: testUserEmail,
            Password: testUserPassword,
            UserAttributes: [
                { Name: 'email', Value: testUserEmail },
                { Name: 'name', Value: 'IoT Test User' },
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

        // Create a test farm
        const farmResponse = await apiClient.post('/farms', {
            name: 'IoT Test Farm',
            location: {
                latitude: 28.6139,
                longitude: 77.2090,
                address: 'Test Location',
            },
            cropTypes: ['wheat'],
            acreage: 10,
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        testFarmId = farmResponse.data.farmId;
        testDeviceId = `test-sensor-${Date.now()}`;

        // Seed some test sensor data
        await seedSensorData();

        console.log('Test user, farm, and sensor data created');
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

    async function seedSensorData() {
        const sensorTypes = ['soil_moisture', 'temperature', 'humidity'];
        const now = new Date();

        for (const sensorType of sensorTypes) {
            for (let i = 0; i < 10; i++) {
                const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Hourly data
                let value: number;

                switch (sensorType) {
                    case 'soil_moisture':
                        value = 30 + Math.random() * 40; // 30-70%
                        break;
                    case 'temperature':
                        value = 20 + Math.random() * 15; // 20-35°C
                        break;
                    case 'humidity':
                        value = 40 + Math.random() * 40; // 40-80%
                        break;
                    default:
                        value = 0;
                }

                await dynamoDBClient.send(new PutCommand({
                    TableName: testConfig.tables.sensorData,
                    Item: {
                        deviceId: testDeviceId,
                        timestamp: timestamp.toISOString(),
                        farmId: testFarmId,
                        userId: 'test-user-id',
                        sensorType,
                        value: Math.round(value * 10) / 10,
                        unit: sensorType === 'soil_moisture' || sensorType === 'humidity' ? 'percent' : 'celsius',
                        ttl: Math.floor(Date.now() / 1000) + 86400 * 90,
                    },
                }));
            }
        }
        console.log('Seeded test sensor data');
    }

    describe('Query Sensor Data', () => {
        it('should retrieve sensor data for a farm', async () => {
            const response = await apiClient.get('/sensors/data', {
                params: {
                    farmId: testFarmId,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('data');
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data).toHaveProperty('count');

            if (response.data.data.length > 0) {
                const reading = response.data.data[0];
                expect(reading).toHaveProperty('deviceId');
                expect(reading).toHaveProperty('sensorType');
                expect(reading).toHaveProperty('value');
                expect(reading).toHaveProperty('unit');
                expect(reading).toHaveProperty('timestamp');
            }

            console.log(`Retrieved ${response.data.count} sensor readings`);
        }, 30000);

        it('should filter sensor data by type', async () => {
            const response = await apiClient.get('/sensors/data', {
                params: {
                    farmId: testFarmId,
                    sensorType: 'soil_moisture',
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data.data.every((r: any) => r.sensorType === 'soil_moisture')).toBe(true);

            console.log(`Retrieved ${response.data.count} soil moisture readings`);
        }, 30000);

        it('should filter sensor data by time range', async () => {
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - 6 * 60 * 60 * 1000); // Last 6 hours

            const response = await apiClient.get('/sensors/data', {
                params: {
                    farmId: testFarmId,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('data');

            console.log(`Retrieved ${response.data.count} readings in time range`);
        }, 30000);

        it('should support data aggregation', async () => {
            const response = await apiClient.get('/sensors/data', {
                params: {
                    farmId: testFarmId,
                    sensorType: 'temperature',
                    aggregation: 'hourly',
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('aggregation');
            expect(response.data.aggregation).toBe('hourly');

            console.log(`Retrieved aggregated sensor data`);
        }, 30000);

        it('should reject query without farmId', async () => {
            await expect(
                apiClient.get('/sensors/data', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);

        it('should reject query without authentication', async () => {
            await expect(
                apiClient.get('/sensors/data', {
                    params: {
                        farmId: testFarmId,
                    },
                })
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Get Device Details', () => {
        it('should retrieve device information and statistics', async () => {
            const response = await apiClient.get(`/sensors/data/${testDeviceId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('deviceId');
            expect(response.data.deviceId).toBe(testDeviceId);
            expect(response.data).toHaveProperty('farmId');
            expect(response.data).toHaveProperty('sensorType');
            expect(response.data).toHaveProperty('status');

            if (response.data.lastReading) {
                expect(response.data.lastReading).toHaveProperty('value');
                expect(response.data.lastReading).toHaveProperty('timestamp');
            }

            if (response.data.statistics) {
                expect(response.data.statistics).toHaveProperty('min');
                expect(response.data.statistics).toHaveProperty('max');
                expect(response.data.statistics).toHaveProperty('avg');
            }

            console.log(`Retrieved device details for ${testDeviceId}`);
        }, 30000);

        it('should return 404 for non-existent device', async () => {
            await expect(
                apiClient.get('/sensors/data/non-existent-device', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Sensor Data Validation', () => {
        it('should verify data integrity', async () => {
            // Query the data directly from DynamoDB
            const result = await dynamoDBClient.send(new QueryCommand({
                TableName: testConfig.tables.sensorData,
                KeyConditionExpression: 'deviceId = :deviceId',
                ExpressionAttributeValues: {
                    ':deviceId': testDeviceId,
                },
                Limit: 10,
            }));

            expect(result.Items).toBeDefined();
            expect(result.Items!.length).toBeGreaterThan(0);

            // Verify data structure
            const item = result.Items![0];
            expect(item).toHaveProperty('deviceId');
            expect(item).toHaveProperty('timestamp');
            expect(item).toHaveProperty('sensorType');
            expect(item).toHaveProperty('value');
            expect(item).toHaveProperty('farmId');

            console.log('Sensor data integrity verified');
        }, 30000);

        it('should have proper TTL set', async () => {
            const result = await dynamoDBClient.send(new QueryCommand({
                TableName: testConfig.tables.sensorData,
                KeyConditionExpression: 'deviceId = :deviceId',
                ExpressionAttributeValues: {
                    ':deviceId': testDeviceId,
                },
                Limit: 1,
            }));

            expect(result.Items).toBeDefined();
            expect(result.Items!.length).toBeGreaterThan(0);

            const item = result.Items![0];
            expect(item).toHaveProperty('ttl');
            expect(typeof item.ttl).toBe('number');
            expect(item.ttl).toBeGreaterThan(Math.floor(Date.now() / 1000));

            console.log('TTL properly configured');
        }, 30000);
    });

    describe('Real-time Data Ingestion', () => {
        it('should handle new sensor data ingestion', async () => {
            // Simulate IoT data ingestion by directly writing to DynamoDB
            const newReading = {
                deviceId: testDeviceId,
                timestamp: new Date().toISOString(),
                farmId: testFarmId,
                userId: 'test-user-id',
                sensorType: 'soil_moisture',
                value: 45.5,
                unit: 'percent',
                ttl: Math.floor(Date.now() / 1000) + 86400 * 90,
            };

            await dynamoDBClient.send(new PutCommand({
                TableName: testConfig.tables.sensorData,
                Item: newReading,
            }));

            // Wait a moment for data to be available
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Query the data via API
            const response = await apiClient.get('/sensors/data', {
                params: {
                    farmId: testFarmId,
                    sensorType: 'soil_moisture',
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data.data.length).toBeGreaterThan(0);

            console.log('New sensor data successfully ingested and retrieved');
        }, 30000);
    });
});
