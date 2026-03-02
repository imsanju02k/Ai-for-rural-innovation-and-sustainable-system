#!/usr/bin/env node
/**
 * Seed Test Users Script
 * 
 * Creates test users in Cognito User Pool and DynamoDB Users table
 * 
 * Usage:
 *   npm run seed:users -- --environment dev
 *   npm run seed:users -- --environment dev --count 5
 * 
 * Requirements: 15.7
 */

import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'dev';
const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '3');

// AWS Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const cognitoClient = new CognitoIdentityProviderClient({ region });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

// Table names
const USERS_TABLE = `${environment}-dynamodb-users`;
const USER_POOL_ID = process.env.USER_POOL_ID || '';

// Test user data
const TEST_USERS = [
    {
        name: 'John Farmer',
        email: 'john.farmer@example.com',
        phone: '+1234567890',
        role: 'farmer' as const,
    },
    {
        name: 'Sarah Advisor',
        email: 'sarah.advisor@example.com',
        phone: '+1234567891',
        role: 'advisor' as const,
    },
    {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '+1234567892',
        role: 'admin' as const,
    },
    {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+919876543210',
        role: 'farmer' as const,
    },
    {
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+919876543211',
        role: 'farmer' as const,
    },
];

/**
 * Create a user in Cognito User Pool
 */
async function createCognitoUser(email: string, name: string): Promise<string> {
    try {
        // Create user
        const createCommand = new AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'true' },
                { Name: 'name', Value: name },
            ],
            MessageAction: 'SUPPRESS', // Don't send welcome email
        });

        const createResponse = await cognitoClient.send(createCommand);
        const userId = createResponse.User?.Username || uuidv4();

        // Set permanent password
        const passwordCommand = new AdminSetUserPasswordCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            Password: 'TestPass123!',
            Permanent: true,
        });

        await cognitoClient.send(passwordCommand);

        console.log(`✓ Created Cognito user: ${email}`);
        return userId;
    } catch (error: any) {
        if (error.name === 'UsernameExistsException') {
            console.log(`⚠ Cognito user already exists: ${email}`);
            return email; // Use email as userId if user exists
        }
        throw error;
    }
}

/**
 * Create a user in DynamoDB Users table
 */
async function createDynamoDBUser(userId: string, userData: typeof TEST_USERS[0]): Promise<void> {
    const now = new Date().toISOString();

    const user = {
        userId,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        preferences: {
            language: 'en',
            notifications: {
                email: true,
                sms: false,
                push: true,
            },
        },
        createdAt: now,
        updatedAt: now,
    };

    try {
        await dynamoClient.send(new PutCommand({
            TableName: USERS_TABLE,
            Item: user,
        }));

        console.log(`✓ Created DynamoDB user: ${userData.email}`);
    } catch (error: any) {
        console.error(`✗ Failed to create DynamoDB user ${userData.email}:`, error.message);
        throw error;
    }
}

/**
 * Main seeding function
 */
async function seedUsers() {
    console.log('\n=== Seeding Test Users ===\n');
    console.log(`Environment: ${environment}`);
    console.log(`Region: ${region}`);
    console.log(`Users Table: ${USERS_TABLE}`);
    console.log(`User Pool ID: ${USER_POOL_ID || 'NOT SET'}`);
    console.log(`Number of users to create: ${Math.min(count, TEST_USERS.length)}\n`);

    if (!USER_POOL_ID) {
        console.error('✗ Error: USER_POOL_ID environment variable is not set');
        console.error('  Set it using: export USER_POOL_ID=<your-user-pool-id>');
        process.exit(1);
    }

    const usersToCreate = TEST_USERS.slice(0, count);
    const createdUsers: Array<{ userId: string; email: string; password: string }> = [];

    for (const userData of usersToCreate) {
        try {
            console.log(`\nCreating user: ${userData.name} (${userData.email})`);

            // Create in Cognito
            const userId = await createCognitoUser(userData.email, userData.name);

            // Create in DynamoDB
            await createDynamoDBUser(userId, userData);

            createdUsers.push({
                userId,
                email: userData.email,
                password: 'TestPass123!',
            });

            console.log(`✓ Successfully created user: ${userData.email}`);
        } catch (error: any) {
            console.error(`✗ Failed to create user ${userData.email}:`, error.message);
        }
    }

    // Print summary
    console.log('\n=== Seeding Complete ===\n');
    console.log(`Successfully created ${createdUsers.length} users\n`);

    if (createdUsers.length > 0) {
        console.log('Test User Credentials:');
        console.log('─────────────────────────────────────────────────────');
        createdUsers.forEach(user => {
            console.log(`Email:    ${user.email}`);
            console.log(`Password: ${user.password}`);
            console.log(`User ID:  ${user.userId}`);
            console.log('─────────────────────────────────────────────────────');
        });
        console.log('\nNote: All test users have the same password: TestPass123!');
    }
}

// Run the script
seedUsers().catch(error => {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
});
