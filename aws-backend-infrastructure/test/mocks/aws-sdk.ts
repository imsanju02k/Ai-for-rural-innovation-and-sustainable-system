/**
 * Mock AWS SDK clients for testing
 */

import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { RekognitionClient } from '@aws-sdk/client-rekognition';
import { SNSClient } from '@aws-sdk/client-sns';
import { SESClient } from '@aws-sdk/client-ses';

// Create mock clients
export const mockDynamoDBClient = mockClient(DynamoDBDocumentClient);
export const mockS3Client = mockClient(S3Client);
export const mockCognitoClient = mockClient(CognitoIdentityProviderClient);
export const mockBedrockClient = mockClient(BedrockRuntimeClient);
export const mockRekognitionClient = mockClient(RekognitionClient);
export const mockSNSClient = mockClient(SNSClient);
export const mockSESClient = mockClient(SESClient);

/**
 * Reset all mocks to their initial state
 */
export function resetAllMocks() {
  mockDynamoDBClient.reset();
  mockS3Client.reset();
  mockCognitoClient.reset();
  mockBedrockClient.reset();
  mockRekognitionClient.reset();
  mockSNSClient.reset();
  mockSESClient.reset();
}

/**
 * Clear all mock call history
 */
export function clearAllMocks() {
  mockDynamoDBClient.resetHistory();
  mockS3Client.resetHistory();
  mockCognitoClient.resetHistory();
  mockBedrockClient.resetHistory();
  mockRekognitionClient.resetHistory();
  mockSNSClient.resetHistory();
  mockSESClient.resetHistory();
}
