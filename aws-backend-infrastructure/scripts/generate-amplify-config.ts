#!/usr/bin/env node
/**
 * Generate AWS Amplify Configuration
 * 
 * This script generates an AWS Amplify configuration file for the React frontend
 * with Auth, API, and Storage settings.
 * 
 * Usage:
 *   npm run generate:amplify-config -- --environment dev
 *   npm run generate:amplify-config -- --environment prod --output ../frontend/src
 */

import * as fs from 'fs';
import * as path from 'path';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

interface AmplifyConfig {
    Auth: {
        Cognito: {
            userPoolId: string;
            userPoolClientId: string;
            identityPoolId?: string;
            loginWith?: {
                email: boolean;
                phone?: boolean;
                username?: boolean;
            };
            signUpVerificationMethod?: string;
            userAttributes?: {
                email: {
                    required: boolean;
                };
                name?: {
                    required: boolean;
                };
                phone_number?: {
                    required: boolean;
                };
            };
            passwordFormat?: {
                minLength: number;
                requireLowercase: boolean;
                requireUppercase: boolean;
                requireNumbers: boolean;
                requireSpecialCharacters: boolean;
            };
        };
    };
    API: {
        REST: {
            [key: string]: {
                endpoint: string;
                region: string;
            };
        };
    };
    Storage: {
        S3: {
            bucket: string;
            region: string;
        };
    };
}

interface CliArgs {
    environment: string;
    output?: string;
    region?: string;
}

function parseArgs(): CliArgs {
    const args = process.argv.slice(2);
    const parsed: CliArgs = {
        environment: 'dev',
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--environment' || args[i] === '-e') {
            parsed.environment = args[++i];
        } else if (args[i] === '--output' || args[i] === '-o') {
            parsed.output = args[++i];
        } else if (args[i] === '--region' || args[i] === '-r') {
            parsed.region = args[++i];
        }
    }

    return parsed;
}

async function getStackOutputs(
    stackName: string,
    region: string
): Promise<Record<string, string>> {
    const client = new CloudFormationClient({ region });
    const command = new DescribeStacksCommand({ StackName: stackName });

    try {
        const response = await client.send(command);
        const stack = response.Stacks?.[0];

        if (!stack || !stack.Outputs) {
            throw new Error(`Stack ${stackName} not found or has no outputs`);
        }

        const outputs: Record<string, string> = {};
        for (const output of stack.Outputs) {
            if (output.OutputKey && output.OutputValue) {
                outputs[output.OutputKey] = output.OutputValue;
            }
        }

        return outputs;
    } catch (error) {
        console.error(`Error fetching stack outputs for ${stackName}:`, error);
        throw error;
    }
}

async function generateAmplifyConfig(args: CliArgs): Promise<void> {
    const { environment, output, region = process.env.AWS_REGION || 'us-east-1' } = args;

    console.log(`Generating AWS Amplify configuration for environment: ${environment}`);
    console.log(`Region: ${region}`);

    try {
        // Fetch outputs from relevant stacks
        const [apiOutputs, authOutputs, storageOutputs] = await Promise.all([
            getStackOutputs(`${environment}-APIStack`, region),
            getStackOutputs(`${environment}-AuthStack`, region),
            getStackOutputs(`${environment}-StorageStack`, region),
        ]);

        // Build Amplify configuration object
        const amplifyConfig: AmplifyConfig = {
            Auth: {
                Cognito: {
                    userPoolId: authOutputs.UserPoolId || '',
                    userPoolClientId: authOutputs.UserPoolClientId || '',
                    identityPoolId: authOutputs.IdentityPoolId,
                    loginWith: {
                        email: true,
                        phone: false,
                        username: false,
                    },
                    signUpVerificationMethod: 'code',
                    userAttributes: {
                        email: {
                            required: true,
                        },
                        name: {
                            required: true,
                        },
                        phone_number: {
                            required: false,
                        },
                    },
                    passwordFormat: {
                        minLength: 8,
                        requireLowercase: true,
                        requireUppercase: true,
                        requireNumbers: true,
                        requireSpecialCharacters: true,
                    },
                },
            },
            API: {
                REST: {
                    FarmAPI: {
                        endpoint: apiOutputs.ApiEndpoint || apiOutputs.RestApiEndpoint || '',
                        region,
                    },
                },
            },
            Storage: {
                S3: {
                    bucket: storageOutputs.ImagesBucketName || '',
                    region,
                },
            },
        };

        // Validate required fields
        if (!amplifyConfig.Auth.Cognito.userPoolId) {
            throw new Error('Missing User Pool ID');
        }
        if (!amplifyConfig.Auth.Cognito.userPoolClientId) {
            throw new Error('Missing User Pool Client ID');
        }
        if (!amplifyConfig.API.REST.FarmAPI.endpoint) {
            throw new Error('Missing API Endpoint');
        }
        if (!amplifyConfig.Storage.S3.bucket) {
            throw new Error('Missing S3 Bucket Name');
        }

        // Determine output path
        const outputDir = output || path.join(__dirname, '..', 'frontend-config');
        const outputPath = path.join(outputDir, `amplify-config.${environment}.json`);

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write configuration file
        fs.writeFileSync(outputPath, JSON.stringify(amplifyConfig, null, 2));

        console.log('\n✅ AWS Amplify configuration generated successfully!');
        console.log(`📁 Output: ${outputPath}`);
        console.log('\nConfiguration:');
        console.log(JSON.stringify(amplifyConfig, null, 2));

        // Also create a TypeScript version with usage example
        const tsOutputPath = path.join(outputDir, `amplify-config.${environment}.ts`);
        const tsContent = `// Auto-generated AWS Amplify configuration
// Generated at: ${new Date().toISOString()}
// Environment: ${environment}

import { Amplify } from 'aws-amplify';

export const amplifyConfig = ${JSON.stringify(amplifyConfig, null, 2)};

// Configure Amplify with this config
export function configureAmplify() {
  Amplify.configure(amplifyConfig);
}

export default amplifyConfig;

/**
 * Usage in your React app:
 * 
 * import { configureAmplify } from './amplify-config.${environment}';
 * 
 * // Call this once at app initialization (e.g., in index.tsx or App.tsx)
 * configureAmplify();
 * 
 * // Then use Amplify Auth, API, and Storage throughout your app:
 * 
 * // Authentication
 * import { signIn, signUp, signOut, getCurrentUser } from 'aws-amplify/auth';
 * 
 * // API calls
 * import { get, post, put, del } from 'aws-amplify/api';
 * 
 * // Storage (S3)
 * import { uploadData, getUrl, remove } from 'aws-amplify/storage';
 */
`;

        fs.writeFileSync(tsOutputPath, tsContent);
        console.log(`📁 TypeScript config: ${tsOutputPath}`);

        // Create a usage example file
        const examplePath = path.join(outputDir, `amplify-usage-example.tsx`);
        const exampleContent = `// AWS Amplify Usage Examples
// This file demonstrates how to use AWS Amplify with the generated configuration

import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { get, post, put, del } from 'aws-amplify/api';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

// ============================================================================
// Authentication Examples
// ============================================================================

/**
 * Sign up a new user
 */
export async function signUpUser(email: string, password: string, name: string) {
  try {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });

    console.log('Sign up result:', { isSignUpComplete, userId, nextStep });
    return { success: true, userId, nextStep };
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

/**
 * Sign in an existing user
 */
export async function signInUser(email: string, password: string) {
  try {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password,
    });

    console.log('Sign in result:', { isSignedIn, nextStep });
    return { success: true, isSignedIn, nextStep };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser() {
  try {
    await signOut();
    console.log('User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get the current authenticated user
 */
export async function getUser() {
  try {
    const user = await getCurrentUser();
    console.log('Current user:', user);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get the current user's JWT token
 */
export async function getAuthToken() {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// ============================================================================
// API Examples
// ============================================================================

/**
 * Create a new farm
 */
export async function createFarm(farmData: {
  name: string;
  location: { latitude: number; longitude: number; address: string };
  cropTypes: string[];
  acreage: number;
}) {
  try {
    const response = await post({
      apiName: 'FarmAPI',
      path: '/farms',
      options: {
        body: farmData,
      },
    }).response;

    const data = await response.body.json();
    console.log('Farm created:', data);
    return data;
  } catch (error) {
    console.error('Error creating farm:', error);
    throw error;
  }
}

/**
 * Get all farms for the current user
 */
export async function getFarms() {
  try {
    const response = await get({
      apiName: 'FarmAPI',
      path: '/farms',
    }).response;

    const data = await response.body.json();
    console.log('Farms:', data);
    return data;
  } catch (error) {
    console.error('Error getting farms:', error);
    throw error;
  }
}

/**
 * Get market prices
 */
export async function getMarketPrices(commodity?: string) {
  try {
    const path = commodity ? \`/market-prices?commodity=\${commodity}\` : '/market-prices';
    const response = await get({
      apiName: 'FarmAPI',
      path,
    }).response;

    const data = await response.body.json();
    console.log('Market prices:', data);
    return data;
  } catch (error) {
    console.error('Error getting market prices:', error);
    throw error;
  }
}

/**
 * Send a message to the advisory chatbot
 */
export async function sendChatMessage(message: string, farmId?: string) {
  try {
    const response = await post({
      apiName: 'FarmAPI',
      path: '/advisory/chat',
      options: {
        body: {
          message,
          farmId,
          includeContext: true,
        },
      },
    }).response;

    const data = await response.body.json();
    console.log('Chat response:', data);
    return data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

// ============================================================================
// Storage (S3) Examples
// ============================================================================

/**
 * Upload an image for disease detection
 */
export async function uploadDiseaseImage(file: File, farmId: string) {
  try {
    // Upload to S3
    const result = await uploadData({
      key: \`disease-images/\${farmId}/\${Date.now()}_\${file.name}\`,
      data: file,
      options: {
        contentType: file.type,
      },
    }).result;

    console.log('Image uploaded:', result);
    return result;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Get a download URL for an image
 */
export async function getImageUrl(key: string) {
  try {
    const url = await getUrl({
      key,
      options: {
        expiresIn: 300, // 5 minutes
      },
    });

    console.log('Image URL:', url);
    return url.url.toString();
  } catch (error) {
    console.error('Error getting image URL:', error);
    throw error;
  }
}

/**
 * Delete an image from S3
 */
export async function deleteImage(key: string) {
  try {
    await remove({
      key,
    });

    console.log('Image deleted:', key);
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}
`;

        fs.writeFileSync(examplePath, exampleContent);
        console.log(`📁 Usage examples: ${examplePath}`);

    } catch (error) {
        console.error('\n❌ Error generating Amplify configuration:', error);
        process.exit(1);
    }
}

// Main execution
const args = parseArgs();
generateAmplifyConfig(args).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
