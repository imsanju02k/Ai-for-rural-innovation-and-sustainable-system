import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Secrets Manager Utility
 * 
 * Provides helper functions for Lambda functions to load secrets from AWS Secrets Manager.
 * Implements caching to reduce API calls and improve performance.
 * 
 * Requirements: 13.2
 */

const client = new SecretsManagerClient({});

// In-memory cache for secrets (Lambda container reuse)
const secretsCache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get a secret value from AWS Secrets Manager with caching
 * 
 * @param secretName - The name or ARN of the secret
 * @param forceRefresh - Force refresh from Secrets Manager, bypassing cache
 * @returns The secret value as an object
 */
export async function getSecret(secretName: string, forceRefresh = false): Promise<any> {
  const now = Date.now();
  
  // Check cache first
  if (!forceRefresh && secretsCache.has(secretName)) {
    const cached = secretsCache.get(secretName)!;
    if (now - cached.timestamp < CACHE_TTL_MS) {
      console.log(`Using cached secret: ${secretName}`);
      return cached.value;
    }
  }

  try {
    console.log(`Fetching secret from Secrets Manager: ${secretName}`);
    
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await client.send(command);
    
    let secretValue: any;
    if (response.SecretString) {
      secretValue = JSON.parse(response.SecretString);
    } else if (response.SecretBinary) {
      // Handle binary secrets if needed
      const buff = Buffer.from(response.SecretBinary);
      secretValue = buff.toString('utf-8');
    } else {
      throw new Error(`Secret ${secretName} has no value`);
    }

    // Cache the secret
    secretsCache.set(secretName, {
      value: secretValue,
      timestamp: now,
    });

    return secretValue;
  } catch (error) {
    console.error(`Error fetching secret ${secretName}:`, error);
    throw new Error(`Failed to load secret: ${secretName}`);
  }
}

/**
 * Get database credentials from Secrets Manager
 * 
 * @returns Database credentials object
 */
export async function getDatabaseCredentials(): Promise<{
  username: string;
  password: string;
  engine: string;
}> {
  const environment = process.env.ENVIRONMENT || 'dev';
  const secretName = `${environment}/database/credentials`;
  return getSecret(secretName);
}

/**
 * Get API keys from Secrets Manager
 * 
 * @returns API keys object
 */
export async function getAPIKeys(): Promise<{
  weatherApiKey: string;
  marketApiKey: string;
  smsApiKey: string;
}> {
  const environment = process.env.ENVIRONMENT || 'dev';
  const secretName = `${environment}/api/keys`;
  return getSecret(secretName);
}

/**
 * Get encryption keys from Secrets Manager
 * 
 * @returns Encryption keys object
 */
export async function getEncryptionKeys(): Promise<{
  masterKey: string;
  algorithm: string;
}> {
  const environment = process.env.ENVIRONMENT || 'dev';
  const secretName = `${environment}/encryption/keys`;
  return getSecret(secretName);
}

/**
 * Clear the secrets cache
 * Useful for testing or when secrets are rotated
 */
export function clearSecretsCache(): void {
  secretsCache.clear();
  console.log('Secrets cache cleared');
}

/**
 * Get a specific key from an API keys secret
 * 
 * @param keyName - The name of the API key to retrieve
 * @returns The API key value
 */
export async function getAPIKey(keyName: 'weatherApiKey' | 'marketApiKey' | 'smsApiKey'): Promise<string> {
  const apiKeys = await getAPIKeys();
  return apiKeys[keyName];
}
