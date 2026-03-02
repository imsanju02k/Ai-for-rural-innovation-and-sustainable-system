#!/usr/bin/env node
/**
 * Seed Test Images Script
 * 
 * Creates test image metadata in DynamoDB Images table
 * Note: This creates metadata entries only. Actual image files would need to be uploaded separately.
 * 
 * Usage:
 *   npm run seed:images -- --environment dev
 *   npm run seed:images -- --environment dev --count 10
 * 
 * Requirements: 15.7
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'dev';
const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '5');

// Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const IMAGES_TABLE = `${environment}-dynamodb-images`;
const S3_BUCKET = `${environment}-farm-images`;

// Initialize DynamoDB client
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

// Test image templates
const IMAGE_TEMPLATES = [
    { fileName: 'wheat_rust_sample.jpg', cropType: 'wheat', description: 'Wheat rust disease sample' },
    { fileName: 'rice_blast_sample.jpg', cropType: 'rice', description: 'Rice blast disease sample' },
    { fileName: 'corn_blight_sample.jpg', cropType: 'corn', description: 'Corn blight disease sample' },
    { fileName: 'tomato_blight_sample.jpg', cropType: 'tomato', description: 'Tomato blight sample' },
    { fileName: 'potato_late_blight.jpg', cropType: 'potato', description: 'Potato late blight' },
    { fileName: 'healthy_wheat_crop.jpg', cropType: 'wheat', description: 'Healthy wheat crop' },
    { fileName: 'healthy_rice_field.jpg', cropType: 'rice', description: 'Healthy rice field' },
    { fileName: 'sugarcane_red_rot.jpg', cropType: 'sugarcane', description: 'Sugarcane red rot' },
    { fileName: 'cotton_leaf_curl.jpg', cropType: 'cotton', description: 'Cotton leaf curl virus' },
    { fileName: 'chickpea_wilt.jpg', cropType: 'chickpea', description: 'Chickpea wilt disease' },
];

/**
 * Get farms from the database
 */
async function getFarms(): Promise<Array<{ farmId: string; userId: string }>> {
    try {
        const response = await dynamoClient.send(new ScanCommand({
            TableName: `${environment}-dynamodb-farms`,
            ProjectionExpression: 'farmId, userId',
        }));

        if (response.Items && response.Items.length > 0) {
            return response.Items as Array<{ farmId: string; userId: string }>;
        }

        return [];
    } catch (error: any) {
        console.error('✗ Failed to fetch farms:', error.message);
        return [];
    }
}

/**
 * Create image metadata entry
 */
async function createImageMetadata(
    userId: string,
    farmId: string,
    template: typeof IMAGE_TEMPLATES[0]
): Promise<void> {
    const now = new Date().toISOString();
    const imageId = uuidv4();
    const s3Key = `${userId}/${farmId}/${Date.now()}_${template.fileName}`;

    const image = {
        userId,
        imageId,
        farmId,
        s3Key,
        s3Bucket: S3_BUCKET,
        fileName: template.fileName,
        contentType: 'image/jpeg',
        fileSize: Math.floor(Math.random() * 5000000) + 500000, // 0.5-5.5 MB
        cropType: template.cropType,
        description: template.description,
        uploadedAt: now,
        status: 'uploaded',
    };

    try {
        await dynamoClient.send(new PutCommand({
            TableName: IMAGES_TABLE,
            Item: image,
        }));

        console.log(`✓ Created image metadata: ${template.fileName} (${imageId})`);
    } catch (error: any) {
        console.error(`✗ Failed to create image metadata:`, error.message);
        throw error;
    }
}

/**
 * Main seeding function
 */
async function seedImages() {
    console.log('\n=== Seeding Test Image Metadata ===\n');
    console.log(`Environment: ${environment}`);
    console.log(`Region: ${region}`);
    console.log(`Images Table: ${IMAGES_TABLE}`);
    console.log(`S3 Bucket: ${S3_BUCKET}`);
    console.log(`Number of images to create: ${Math.min(count, IMAGE_TEMPLATES.length)}\n`);

    // Get farms
    console.log('Fetching farms...');
    const farms = await getFarms();

    if (farms.length === 0) {
        console.error('✗ Error: No farms found in the database');
        console.error('  Please run seed-farms.ts first');
        process.exit(1);
    }

    console.log(`Found ${farms.length} farms\n`);

    let totalImages = 0;
    const startTime = Date.now();

    // Create images for each farm
    for (const farm of farms) {
        console.log(`Creating images for farm: ${farm.farmId}`);

        // Create a subset of images for this farm
        const imagesToCreate = Math.min(count, IMAGE_TEMPLATES.length);

        for (let i = 0; i < imagesToCreate; i++) {
            const template = IMAGE_TEMPLATES[i];
            await createImageMetadata(farm.userId, farm.farmId, template);
            totalImages++;
        }

        console.log('');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n=== Seeding Complete ===\n');
    console.log(`Successfully created ${totalImages} image metadata entries`);
    console.log(`Time taken: ${duration} seconds\n`);

    console.log('Summary:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Farms:              ${farms.length}`);
    console.log(`Images per farm:    ${Math.min(count, IMAGE_TEMPLATES.length)}`);
    console.log(`Total images:       ${totalImages}`);
    console.log('─────────────────────────────────────────────────────\n');

    console.log('Note: This script creates image metadata only.');
    console.log('Actual image files would need to be uploaded to S3 separately.');
    console.log('For testing disease detection, you can use the API to upload real images.\n');
}

// Run the script
seedImages().catch((error) => {
    console.error('\n✗ Seeding failed:', error.message);
    process.exit(1);
});
