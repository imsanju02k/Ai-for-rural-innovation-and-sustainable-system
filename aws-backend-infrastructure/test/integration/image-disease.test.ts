/**
 * Image Upload and Disease Detection Integration Tests
 * Tests complete image upload and AI-powered disease detection flow
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
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { testConfig } from './config';
import * as fs from 'fs';
import * as path from 'path';

describe('Image Upload and Disease Detection Integration Tests', () => {
    let cognitoClient: CognitoIdentityProviderClient;
    let s3Client: S3Client;
    let apiClient: AxiosInstance;
    let testUserEmail: string;
    let testUserPassword: string;
    let accessToken: string;
    let testFarmId: string;
    let uploadedImageId: string;
    let s3Key: string;

    beforeAll(async () => {
        cognitoClient = new CognitoIdentityProviderClient({ region: testConfig.region });
        s3Client = new S3Client({ region: testConfig.region });
        apiClient = axios.create({
            baseURL: testConfig.apiEndpoint,
            timeout: 60000,
        });

        // Create and confirm test user
        testUserEmail = `image-test-${Date.now()}@example.com`;
        testUserPassword = 'TestPass123!';

        const signUpResponse = await cognitoClient.send(new SignUpCommand({
            ClientId: testConfig.userPoolClientId,
            Username: testUserEmail,
            Password: testUserPassword,
            UserAttributes: [
                { Name: 'email', Value: testUserEmail },
                { Name: 'name', Value: 'Image Test User' },
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
            name: 'Image Test Farm',
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
        console.log('Test user and farm created for image/disease tests');
    }, 90000);

    afterAll(async () => {
        // Clean up S3 object
        if (s3Key) {
            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: testConfig.imagesBucket,
                    Key: s3Key,
                }));
                console.log(`Cleaned up S3 object: ${s3Key}`);
            } catch (error) {
                console.error('Failed to clean up S3 object:', error);
            }
        }

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

    describe('Image Upload URL Generation', () => {
        it('should generate pre-signed upload URL', async () => {
            const response = await apiClient.post('/images/upload-url', {
                farmId: testFarmId,
                fileName: 'test-crop-image.jpg',
                contentType: 'image/jpeg',
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('uploadUrl');
            expect(response.data).toHaveProperty('imageId');
            expect(response.data).toHaveProperty('expiresIn');
            expect(response.data.uploadUrl).toContain('s3.amazonaws.com');

            uploadedImageId = response.data.imageId;
            console.log(`Generated upload URL for image: ${uploadedImageId}`);
        }, 30000);

        it('should reject upload URL request without authentication', async () => {
            await expect(
                apiClient.post('/images/upload-url', {
                    farmId: testFarmId,
                    fileName: 'test.jpg',
                    contentType: 'image/jpeg',
                })
            ).rejects.toThrow();
        }, 30000);

        it('should reject invalid file types', async () => {
            await expect(
                apiClient.post('/images/upload-url', {
                    farmId: testFarmId,
                    fileName: 'test.exe',
                    contentType: 'application/x-msdownload',
                }, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Image Upload to S3', () => {
        it('should upload image to S3 using pre-signed URL', async () => {
            // Get upload URL
            const urlResponse = await apiClient.post('/images/upload-url', {
                farmId: testFarmId,
                fileName: 'wheat-leaf.jpg',
                contentType: 'image/jpeg',
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            uploadedImageId = urlResponse.data.imageId;

            // Create a test image buffer (1x1 pixel JPEG)
            const testImageBuffer = Buffer.from([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
                0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
                0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
                0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
                0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
                0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
                0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
                0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
                0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
                0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
                0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
                0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
                0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
                0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x03, 0xFF, 0xDA, 0x00, 0x08,
                0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF,
                0xD9
            ]);

            // Upload directly to S3 using pre-signed URL
            const uploadResponse = await axios.put(urlResponse.data.uploadUrl, testImageBuffer, {
                headers: {
                    'Content-Type': 'image/jpeg',
                },
            });

            expect(uploadResponse.status).toBe(200);
            console.log(`Uploaded test image: ${uploadedImageId}`);

            // Extract S3 key from URL for cleanup
            const url = new URL(urlResponse.data.uploadUrl);
            s3Key = url.pathname.substring(1); // Remove leading slash
        }, 30000);
    });

    describe('Disease Detection Analysis', () => {
        it('should trigger disease detection analysis', async () => {
            // Wait a bit for S3 trigger to process
            await new Promise(resolve => setTimeout(resolve, 5000));

            const response = await apiClient.post('/disease-detection/analyze', {
                imageId: uploadedImageId,
                farmId: testFarmId,
                cropType: 'wheat',
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('analysisId');
            expect(response.data).toHaveProperty('imageId');
            expect(response.data).toHaveProperty('results');
            expect(response.data).toHaveProperty('analyzedAt');

            if (response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                expect(result).toHaveProperty('diseaseName');
                expect(result).toHaveProperty('confidence');
                expect(result).toHaveProperty('recommendations');
            }

            console.log(`Disease analysis completed: ${response.data.analysisId}`);
        }, 60000);

        it('should reject analysis for non-existent image', async () => {
            await expect(
                apiClient.post('/disease-detection/analyze', {
                    imageId: 'non-existent-image-id',
                    farmId: testFarmId,
                    cropType: 'wheat',
                }, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
            ).rejects.toThrow();
        }, 30000);
    });

    describe('Disease Detection History', () => {
        it('should retrieve disease detection history', async () => {
            const response = await apiClient.get('/disease-detection/history', {
                params: {
                    farmId: testFarmId,
                    limit: 10,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('analyses');
            expect(Array.isArray(response.data.analyses)).toBe(true);
            expect(response.data).toHaveProperty('count');

            console.log(`Retrieved ${response.data.count} disease analyses`);
        }, 30000);

        it('should reject history request without authentication', async () => {
            await expect(
                apiClient.get('/disease-detection/history')
            ).rejects.toThrow();
        }, 30000);
    });
});
