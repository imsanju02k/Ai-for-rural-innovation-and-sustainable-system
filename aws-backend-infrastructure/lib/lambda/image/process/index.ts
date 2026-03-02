/**
 * Image Process Lambda Function
 * Triggered by S3 upload events to validate and process uploaded images
 */

import { S3Event } from 'aws-lambda';
import { getFileMetadata } from '../../shared/utils/s3';
import { updateItem, queryItems } from '../../shared/utils/dynamodb';

const IMAGES_TABLE = process.env.IMAGES_TABLE || '';
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const handler = async (event: S3Event): Promise<void> => {
    console.log('S3 Event received:', JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const eventName = record.eventName;

        // Only process ObjectCreated events
        if (!eventName.startsWith('ObjectCreated')) {
            console.log(`Skipping event ${eventName} for ${key}`);
            continue;
        }

        try {
            console.log(`Processing image upload: ${key}`);

            // Get file metadata from S3
            const metadata = await getFileMetadata(bucket, key);
            const fileSize = metadata.contentLength || 0;

            console.log(`File size: ${fileSize} bytes`);

            // Validate file size
            if (fileSize > MAX_FILE_SIZE_BYTES) {
                console.error(`File size ${fileSize} exceeds maximum ${MAX_FILE_SIZE_BYTES}`);
                await updateImageStatus(key, 'failed', `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
                continue;
            }

            if (fileSize === 0) {
                console.error('File size is 0 bytes');
                await updateImageStatus(key, 'failed', 'File is empty');
                continue;
            }

            // Validate content type
            const contentType = metadata.contentType || '';
            const allowedTypes = ['image/jpeg', 'image/png', 'image/heic'];

            if (!allowedTypes.includes(contentType)) {
                console.error(`Invalid content type: ${contentType}`);
                await updateImageStatus(key, 'failed', `Invalid content type: ${contentType}`);
                continue;
            }

            // Update image metadata with file size and set status to processing
            await updateImageStatus(key, 'processing', undefined, fileSize);

            console.log(`Successfully processed image: ${key}`);

            // Note: Disease detection will be triggered separately via API call
            // or can be automatically triggered here if needed

        } catch (error: any) {
            console.error(`Error processing image ${key}:`, {
                error: error.message,
                stack: error.stack,
            });

            // Update status to failed
            try {
                await updateImageStatus(key, 'failed', error.message);
            } catch (updateError: any) {
                console.error('Failed to update image status:', updateError);
            }
        }
    }
};

/**
 * Update image status in DynamoDB
 */
async function updateImageStatus(
    s3Key: string,
    status: string,
    errorMessage?: string,
    fileSize?: number
): Promise<void> {
    try {
        // Query to find the image by s3Key
        // Since s3Key is not a key attribute, we need to scan or use GSI
        // For now, we'll extract userId from the s3Key path structure
        const pathParts = s3Key.split('/');
        if (pathParts.length < 3) {
            console.error('Invalid s3Key format:', s3Key);
            return;
        }

        const userId = pathParts[0];

        // Query images by userId to find the matching s3Key
        const result = await queryItems(
            IMAGES_TABLE,
            'userId = :userId',
            { ':userId': userId }
        );

        const image = result.items.find((item: any) => item.s3Key === s3Key);

        if (!image) {
            console.error('Image not found in database:', s3Key);
            return;
        }

        // Build update expression
        const updates: Record<string, any> = {
            status,
            updatedAt: new Date().toISOString(),
        };

        if (fileSize !== undefined) {
            updates.fileSize = fileSize;
        }

        if (errorMessage) {
            updates.errorMessage = errorMessage;
        }

        // Update the image
        await updateItem(
            IMAGES_TABLE,
            { userId: image.userId, imageId: image.imageId },
            'SET #status = :status, #updatedAt = :updatedAt' +
            (fileSize !== undefined ? ', #fileSize = :fileSize' : '') +
            (errorMessage ? ', #errorMessage = :errorMessage' : ''),
            {
                ':status': status,
                ':updatedAt': updates.updatedAt,
                ...(fileSize !== undefined && { ':fileSize': fileSize }),
                ...(errorMessage && { ':errorMessage': errorMessage }),
            },
            {
                expressionAttributeNames: {
                    '#status': 'status',
                    '#updatedAt': 'updatedAt',
                    ...(fileSize !== undefined && { '#fileSize': 'fileSize' }),
                    ...(errorMessage && { '#errorMessage': 'errorMessage' }),
                },
            }
        );

        console.log(`Updated image status to ${status} for ${s3Key}`);
    } catch (error: any) {
        console.error('Error updating image status:', error);
        throw error;
    }
}
