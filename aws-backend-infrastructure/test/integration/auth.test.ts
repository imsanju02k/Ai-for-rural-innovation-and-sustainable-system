/**
 * Authentication Integration Tests
 * Tests complete authentication flow including registration, login, and token refresh
 * 
 * Requirements: 12.3
 */

import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    InitiateAuthCommand,
    AdminConfirmSignUpCommand,
    AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { testConfig } from './config';

describe('Authentication Integration Tests', () => {
    let cognitoClient: CognitoIdentityProviderClient;
    let testUserEmail: string;
    let testUserPassword: string;
    let testUserId: string;
    let accessToken: string;
    let refreshToken: string;

    beforeAll(() => {
        cognitoClient = new CognitoIdentityProviderClient({ region: testConfig.region });
        testUserEmail = `test-${Date.now()}@example.com`;
        testUserPassword = 'TestPass123!';
    });

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

    describe('User Registration', () => {
        it('should register a new user successfully', async () => {
            const response = await cognitoClient.send(new SignUpCommand({
                ClientId: testConfig.userPoolClientId,
                Username: testUserEmail,
                Password: testUserPassword,
                UserAttributes: [
                    { Name: 'email', Value: testUserEmail },
                    { Name: 'name', Value: 'Test User' },
                ],
            }));

            expect(response.UserSub).toBeDefined();
            testUserId = response.UserSub!;
            console.log(`Registered test user: ${testUserEmail} with ID: ${testUserId}`);
        }, 30000);

        it('should reject registration with weak password', async () => {
            await expect(
                cognitoClient.send(new SignUpCommand({
                    ClientId: testConfig.userPoolClientId,
                    Username: `weak-${Date.now()}@example.com`,
                    Password: 'weak',
                    UserAttributes: [
                        { Name: 'email', Value: `weak-${Date.now()}@example.com` },
                    ],
                }))
            ).rejects.toThrow();
        }, 30000);

        it('should reject duplicate email registration', async () => {
            await expect(
                cognitoClient.send(new SignUpCommand({
                    ClientId: testConfig.userPoolClientId,
                    Username: testUserEmail,
                    Password: testUserPassword,
                    UserAttributes: [
                        { Name: 'email', Value: testUserEmail },
                    ],
                }))
            ).rejects.toThrow();
        }, 30000);
    });

    describe('User Login', () => {
        beforeAll(async () => {
            // Confirm the user for login tests
            await cognitoClient.send(new AdminConfirmSignUpCommand({
                UserPoolId: testConfig.userPoolId,
                Username: testUserEmail,
            }));
            console.log(`Confirmed test user: ${testUserEmail}`);
        });

        it('should login with valid credentials', async () => {
            const response = await cognitoClient.send(new InitiateAuthCommand({
                ClientId: testConfig.userPoolClientId,
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    USERNAME: testUserEmail,
                    PASSWORD: testUserPassword,
                },
            }));

            expect(response.AuthenticationResult).toBeDefined();
            expect(response.AuthenticationResult!.AccessToken).toBeDefined();
            expect(response.AuthenticationResult!.RefreshToken).toBeDefined();
            expect(response.AuthenticationResult!.IdToken).toBeDefined();

            accessToken = response.AuthenticationResult!.AccessToken!;
            refreshToken = response.AuthenticationResult!.RefreshToken!;

            console.log('Successfully logged in test user');
        }, 30000);

        it('should reject login with invalid password', async () => {
            await expect(
                cognitoClient.send(new InitiateAuthCommand({
                    ClientId: testConfig.userPoolClientId,
                    AuthFlow: 'USER_PASSWORD_AUTH',
                    AuthParameters: {
                        USERNAME: testUserEmail,
                        PASSWORD: 'WrongPassword123!',
                    },
                }))
            ).rejects.toThrow();
        }, 30000);

        it('should reject login with non-existent user', async () => {
            await expect(
                cognitoClient.send(new InitiateAuthCommand({
                    ClientId: testConfig.userPoolClientId,
                    AuthFlow: 'USER_PASSWORD_AUTH',
                    AuthParameters: {
                        USERNAME: 'nonexistent@example.com',
                        PASSWORD: testUserPassword,
                    },
                }))
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Token Refresh', () => {
        it('should refresh access token with valid refresh token', async () => {
            const response = await cognitoClient.send(new InitiateAuthCommand({
                ClientId: testConfig.userPoolClientId,
                AuthFlow: 'REFRESH_TOKEN_AUTH',
                AuthParameters: {
                    REFRESH_TOKEN: refreshToken,
                },
            }));

            expect(response.AuthenticationResult).toBeDefined();
            expect(response.AuthenticationResult!.AccessToken).toBeDefined();
            expect(response.AuthenticationResult!.IdToken).toBeDefined();

            console.log('Successfully refreshed access token');
        }, 30000);

        it('should reject refresh with invalid token', async () => {
            await expect(
                cognitoClient.send(new InitiateAuthCommand({
                    ClientId: testConfig.userPoolClientId,
                    AuthFlow: 'REFRESH_TOKEN_AUTH',
                    AuthParameters: {
                        REFRESH_TOKEN: 'invalid-refresh-token',
                    },
                }))
            ).rejects.toThrow();
        }, 30000);
    });
});
