/**
 * Farm CRUD Operations Integration Tests
 * Tests complete farm management operations
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
import { testConfig } from './config';

describe('Farm CRUD Integration Tests', () => {
    let cognitoClient: CognitoIdentityProviderClient;
    let apiClient: AxiosInstance;
    let testUserEmail: string;
    let testUserPassword: string;
    let accessToken: string;
    let createdFarmId: string;

    beforeAll(async () => {
        cognitoClient = new CognitoIdentityProviderClient({ region: testConfig.region });
        apiClient = axios.create({
            baseURL: testConfig.apiEndpoint,
            timeout: 30000,
        });

        // Create and confirm test user
        testUserEmail = `farm-test-${Date.now()}@example.com`;
        testUserPassword = 'TestPass123!';

        const signUpResponse = await cognitoClient.send(new SignUpCommand({
            ClientId: testConfig.userPoolClientId,
            Username: testUserEmail,
            Password: testUserPassword,
            UserAttributes: [
                { Name: 'email', Value: testUserEmail },
                { Name: 'name', Value: 'Farm Test User' },
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
        console.log('Test user created and authenticated for farm CRUD tests');
    }, 60000);

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

    describe('Create Farm', () => {
        it('should create a new farm successfully', async () => {
            const farmData = {
                name: 'Integration Test Farm',
                location: {
                    latitude: 28.6139,
                    longitude: 77.2090,
                    address: 'Test Village, Test District, Test State',
                },
                cropTypes: ['wheat', 'rice'],
                acreage: 15.5,
                soilType: 'loamy',
            };

            const response = await apiClient.post('/farms', farmData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('farmId');
            expect(response.data.name).toBe(farmData.name);
            expect(response.data.location.latitude).toBe(farmData.location.latitude);
            expect(response.data.cropTypes).toEqual(farmData.cropTypes);

            createdFarmId = response.data.farmId;
            console.log(`Created test farm: ${createdFarmId}`);
        }, 30000);

        it('should reject farm creation with invalid coordinates', async () => {
            const invalidFarmData = {
                name: 'Invalid Farm',
                location: {
                    latitude: 95.0, // Invalid latitude
                    longitude: 77.2090,
                },
                cropTypes: ['wheat'],
                acreage: 10,
            };

            await expect(
                apiClient.post('/farms', invalidFarmData, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);

        it('should reject farm creation without authentication', async () => {
            const farmData = {
                name: 'Unauthorized Farm',
                location: {
                    latitude: 28.6139,
                    longitude: 77.2090,
                },
                cropTypes: ['wheat'],
                acreage: 10,
            };

            await expect(
                apiClient.post('/farms', farmData)
            ).rejects.toThrow();
        }, 30000);
    });

    describe('List Farms', () => {
        it('should list all farms for authenticated user', async () => {
            const response = await apiClient.get('/farms', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('farms');
            expect(Array.isArray(response.data.farms)).toBe(true);
            expect(response.data.farms.length).toBeGreaterThan(0);
            expect(response.data).toHaveProperty('count');

            console.log(`Listed ${response.data.count} farms`);
        }, 30000);

        it('should reject listing farms without authentication', async () => {
            await expect(
                apiClient.get('/farms')
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Get Farm', () => {
        it('should retrieve specific farm by ID', async () => {
            const response = await apiClient.get(`/farms/${createdFarmId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data.farmId).toBe(createdFarmId);
            expect(response.data.name).toBe('Integration Test Farm');
            expect(response.data).toHaveProperty('createdAt');
            expect(response.data).toHaveProperty('updatedAt');

            console.log(`Retrieved farm: ${createdFarmId}`);
        }, 30000);

        it('should return 404 for non-existent farm', async () => {
            await expect(
                apiClient.get('/farms/non-existent-farm-id', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Update Farm', () => {
        it('should update farm successfully', async () => {
            const updateData = {
                name: 'Updated Integration Test Farm',
                cropTypes: ['wheat', 'rice', 'corn'],
                acreage: 20.0,
            };

            const response = await apiClient.put(`/farms/${createdFarmId}`, updateData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data.farmId).toBe(createdFarmId);
            expect(response.data.name).toBe(updateData.name);
            expect(response.data.cropTypes).toEqual(updateData.cropTypes);
            expect(response.data.acreage).toBe(updateData.acreage);

            console.log(`Updated farm: ${createdFarmId}`);
        }, 30000);

        it('should reject update with invalid data', async () => {
            const invalidUpdateData = {
                acreage: -10, // Invalid negative acreage
            };

            await expect(
                apiClient.put(`/farms/${createdFarmId}`, invalidUpdateData, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Delete Farm', () => {
        it('should delete farm successfully', async () => {
            const response = await apiClient.delete(`/farms/${createdFarmId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('message');
            expect(response.data.farmId).toBe(createdFarmId);

            console.log(`Deleted farm: ${createdFarmId}`);
        }, 30000);

        it('should return 404 when deleting non-existent farm', async () => {
            await expect(
                apiClient.delete('/farms/non-existent-farm-id', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);

        it('should return 404 when getting deleted farm', async () => {
            await expect(
                apiClient.get(`/farms/${createdFarmId}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);
    });
});
