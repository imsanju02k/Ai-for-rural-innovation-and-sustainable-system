#!/usr/bin/env node
/**
 * Seed Test Farms Script
 * 
 * Creates test farms in DynamoDB Farms table
 * 
 * Usage:
 *   npm run seed:farms -- --environment dev
 *   npm run seed:farms -- --environment dev --userId <user-id>
 *   npm run seed:farms -- --environment dev --count 5
 * 
 * Requirements: 15.7
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'dev';
const userId = args.find(arg => arg.startsWith('--userId='))?.split('=')[1];
const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '3');

// AWS Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

// Table names
const USERS_TABLE = `${environment}-dynamodb-users`;
const FARMS_TABLE = `${environment}-dynamodb-farms`;

// Test farm data templates
const FARM_TEMPLATES = [
    {
        name: 'Green Valley Farm',
        location: {
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Village Rampur, District Meerut, Uttar Pradesh',
        },
        cropTypes: ['wheat', 'rice', 'sugarcane'],
        acreage: 15.5,
        soilType: 'loamy',
    },
    {
        name: 'Sunrise Organic Farm',
        location: {
            latitude: 30.7333,
            longitude: 76.7794,
            address: 'Village Kharar, District Mohali, Punjab',
        },
        cropTypes: ['rice', 'corn', 'cotton'],
        acreage: 22.3,
        soilType: 'clay',
    },
    {
        name: 'Golden Harvest Farm',
        location: {
            latitude: 26.8467,
            longitude: 80.9462,
            address: 'Village Unnao, District Lucknow, Uttar Pradesh',
        },
        cropTypes: ['wheat', 'mustard', 'chickpea'],
        acreage: 18.7,
        soilType: 'sandy loam',
    },
    {
        name: 'Riverside Farm',
        location: {
            latitude: 23.0225,
            longitude: 72.5714,
            address: 'Village Sanand, District Ahmedabad, Gujarat',
        },
        cropTypes: ['cotton', 'groundnut', 'millet'],
        acreage: 25.0,
        soilType: 'black soil',
    },
    {
        name: 'Highland Farm',
        location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'Village Devanahalli, District Bangalore Rural, Karnataka',
        },
        cropTypes: ['tomato', 'potato', 'onion'],
        acreage: 10.5,
        soilType: 'red soil',
    },
    {
        name: 'Coastal Farm',
        location: {
            latitude: 19.0760,
            longitude: 72.8777,
            address: 'Village Vasai, District Palghar, Maharashtra',
        },
        cropTypes: ['rice', 'coconut', 'mango'],
        acreage: 12.8,
        soilType: 'laterite',
    },
];

/**
 * Get a random user from the Users table
 */
async function getRandomUser(): Promise<string | null> {
    try {
        const response = await dynamoClient.send(new ScanCommand({
            TableName: USERS_TABLE,
            Limit: 10,
        }));

        if (response.Items && response.Items.length > 0) {
            const randomIndex = Math.floor(Math.random() * response.Items.length);
            return response.Items[randomIndex].userId;
        }

        return null;
    } catch (error: any) {
        console.error('✗ Failed to fetch users:', error.message);
        return null;
    }
}

/**
 * Create a farm in DynamoDB
 */
async function createFarm(userId: string, farmData: typeof FARM_TEMPLATES[0]): Promise<void> {
    const now = new Date().toISOString();
    const farmId = uuidv4();

    const farm = {
        userId,
        farmId,
        name: farmData.name,
        location: farmData.location,
        cropTypes: farmData.cropTypes,
        acreage: farmData.acreage,
        soilType: farmData.soilType,
        createdAt: now,
        updatedAt: now,
    };

    try {
        await dynamoClient.send(new PutCommand({
            TableName: FARMS_TABLE,
            Item: farm,
        }));

        console.log(`✓ Created farm: ${farmData.name} (${farmId})`);
    } catch (error: any) {
        console.error(`✗ Failed to create farm ${farmData.name}:`, error.message);
        throw error;
    }
}

/**
 * Main seeding function
 */
async function seedFarms() {
    console.log('\n=== Seeding Test Farms ===\n');
    console.log(`Environment: ${environment}`);
    console.log(`Region: ${region}`);
    console.log(`Farms Table: ${FARMS_TABLE}`);
    console.log(`Number of farms to create: ${Math.min(count, FARM_TEMPLATES.length)}\n`);

    // Determine user ID
    let targetUserId: string | null = userId || null;

    if (!targetUserId) {
        console.log('No userId specified, fetching a random user...');
        targetUserId = await getRandomUser();

        if (!targetUserId) {
            console.error('✗ Error: No users found in the database');
            console.error('  Please run seed-users.ts first or specify --userId');
            process.exit(1);
        }

        console.log(`Using user ID: ${targetUserId}\n`);
    }

    const farmsToCreate = FARM_TEMPLATES.slice(0, count);
    let successCount = 0;

    for (const farmData of farmsToCreate) {
        try {
            console.log(`Creating farm: ${farmData.name}`);
            await createFarm(targetUserId, farmData);
            successCount++;
        } catch (error: any) {
            console.error(`✗ Failed to create farm ${farmData.name}:`, error.message);
        }
    }

    // Print summary
    console.log('\n=== Seeding Complete ===\n');
    console.log(`Successfully created ${successCount} farms for user ${targetUserId}\n`);

    if (successCount > 0) {
        console.log('Farm Details:');
        console.log('─────────────────────────────────────────────────────');
        farmsToCreate.slice(0, successCount).forEach(farm => {
            console.log(`Name:      ${farm.name}`);
            console.log(`Location:  ${farm.location.address}`);
            console.log(`Crops:     ${farm.cropTypes.join(', ')}`);
            console.log(`Acreage:   ${farm.acreage} acres`);
            console.log(`Soil Type: ${farm.soilType}`);
            console.log('─────────────────────────────────────────────────────');
        });
    }
}

// Run the script
seedFarms().catch(error => {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
});
