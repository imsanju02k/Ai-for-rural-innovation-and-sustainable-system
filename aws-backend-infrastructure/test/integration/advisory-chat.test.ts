/**
 * Advisory Chat Integration Tests
 * Tests AI-powered advisory chatbot functionality
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

describe('Advisory Chat Integration Tests', () => {
    let cognitoClient: CognitoIdentityProviderClient;
    let apiClient: AxiosInstance;
    let testUserEmail: string;
    let testUserPassword: string;
    let accessToken: string;
    let testFarmId: string;
    let messageIds: string[] = [];

    beforeAll(async () => {
        cognitoClient = new CognitoIdentityProviderClient({ region: testConfig.region });
        apiClient = axios.create({
            baseURL: testConfig.apiEndpoint,
            timeout: 60000,
        });

        // Create and confirm test user
        testUserEmail = `chat-test-${Date.now()}@example.com`;
        testUserPassword = 'TestPass123!';

        await cognitoClient.send(new SignUpCommand({
            ClientId: testConfig.userPoolClientId,
            Username: testUserEmail,
            Password: testUserPassword,
            UserAttributes: [
                { Name: 'email', Value: testUserEmail },
                { Name: 'name', Value: 'Chat Test User' },
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

        // Create a test farm for context
        const farmResponse = await apiClient.post('/farms', {
            name: 'Chat Test Farm',
            location: {
                latitude: 28.6139,
                longitude: 77.2090,
                address: 'Test Location',
            },
            cropTypes: ['wheat', 'rice'],
            acreage: 15,
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        testFarmId = farmResponse.data.farmId;
        console.log('Test user and farm created for advisory chat tests');
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

    describe('Send Chat Message', () => {
        it('should send a message and receive AI response', async () => {
            try {
                const response = await apiClient.post('/advisory/chat', {
                    message: 'What is the best time to plant wheat?',
                    farmId: testFarmId,
                    includeContext: true,
                }, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                expect(response.status).toBe(200);
                expect(response.data).toHaveProperty('messageId');
                expect(response.data).toHaveProperty('response');
                expect(response.data).toHaveProperty('timestamp');
                expect(typeof response.data.response).toBe('string');
                expect(response.data.response.length).toBeGreaterThan(0);

                messageIds.push(response.data.messageId);
                console.log(`Received AI response: ${response.data.response.substring(0, 100)}...`);
            } catch (error: any) {
                // AI service might not be available in test environment
                if (error.response?.status === 503) {
                    console.log('Advisory chat service unavailable (expected in test environment)');
                } else {
                    throw error;
                }
            }
        }, 60000);

        it('should handle agricultural queries with farm context', async () => {
            try {
                const response = await apiClient.post('/advisory/chat', {
                    message: 'How much water does wheat need during vegetative stage?',
                    farmId: testFarmId,
                    includeContext: true,
                }, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                expect(response.status).toBe(200);
                expect(response.data).toHaveProperty('response');

                if (response.data.recommendations) {
                    expect(Array.isArray(response.data.recommendations)).toBe(true);
                }

                if (response.data.sources) {
                    expect(Array.isArray(response.data.sources)).toBe(true);
                }

                messageIds.push(response.data.messageId);
                console.log('Received contextual AI response');
            } catch (error: any) {
                if (error.response?.status === 503) {
                    console.log('Advisory chat service unavailable (expected in test environment)');
                } else {
                    throw error;
                }
            }
        }, 60000);

        it('should reject empty messages', async () => {
            await expect(
                apiClient.post('/advisory/chat', {
                    message: '',
                    farmId: testFarmId,
                }, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);

        it('should reject messages without authentication', async () => {
            await expect(
                apiClient.post('/advisory/chat', {
                    message: 'Test message',
                })
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Chat History', () => {
        it('should retrieve chat history', async () => {
            const response = await apiClient.get('/advisory/history', {
                params: {
                    limit: 50,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('messages');
            expect(Array.isArray(response.data.messages)).toBe(true);
            expect(response.data).toHaveProperty('count');

            if (response.data.messages.length > 0) {
                const message = response.data.messages[0];
                expect(message).toHaveProperty('messageId');
                expect(message).toHaveProperty('role');
                expect(message).toHaveProperty('content');
                expect(message).toHaveProperty('timestamp');
                expect(['user', 'assistant']).toContain(message.role);
            }

            console.log(`Retrieved ${response.data.count} chat messages`);
        }, 30000);

        it('should support pagination', async () => {
            const response = await apiClient.get('/advisory/history', {
                params: {
                    limit: 10,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data.messages.length).toBeLessThanOrEqual(10);

            if (response.data.hasMore) {
                expect(response.data.messages.length).toBe(10);
            }

            console.log('Chat history pagination working');
        }, 30000);

        it('should reject history request without authentication', async () => {
            await expect(
                apiClient.get('/advisory/history')
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Rate Limiting', () => {
        it('should handle rate limiting gracefully', async () => {
            const requests = [];

            // Send multiple rapid requests
            for (let i = 0; i < 5; i++) {
                requests.push(
                    apiClient.post('/advisory/chat', {
                        message: `Test message ${i}`,
                        farmId: testFarmId,
                    }, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }).catch(error => error.response)
                );
            }

            const responses = await Promise.all(requests);

            // At least some requests should succeed
            const successfulRequests = responses.filter(r => r?.status === 200);
            expect(successfulRequests.length).toBeGreaterThan(0);

            // Check if any were rate limited
            const rateLimitedRequests = responses.filter(r => r?.status === 429);
            if (rateLimitedRequests.length > 0) {
                console.log(`${rateLimitedRequests.length} requests were rate limited`);
            }
        }, 90000);
    });
});
