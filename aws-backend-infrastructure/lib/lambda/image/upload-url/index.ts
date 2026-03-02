/**
 * Image Upload URL Lambda Function
 * Generates pre-signed S3 upload URLs for image uploads
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { generatePresignedUploadUrl } from '../../shared/utils/s3';
import { putItem } from '../../shared/utils/dynamodb';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { ImageUploadRequestSchema } from '../../shared/models/image';

const IMAGES_TABLE = process.env.IMAGES_TABLE || '';
const S3_BUCKET = process.env.S3_BUCKET || '';
const UPLOAD_URL_EXPIRY = 900; // 15 minutes

// Allowed image content types
const ALLOWED_CONTENT_TYPES = [
    'image/jpeg',
    'image/png',
    'image/heic',
];

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const requestId = event.requestContext.requestId;

    try {
        // Extract userId from authorizer context
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (!userId) {
            return errorResponse(401, 'UNAUTHORIZED', 'User not authenticated', requestId);
        }

        // Parse and validate request body
        const body = JSON.parse(event.body || '{}');
        const validationResult = ImageUploadRequestSchema.safeParse(body);

        if (!validationResult.success) {
            return errorResponse(
                400,
                'VALIDATION_ERROR',
                'Invalid request parameters',
                requestId,
                { errors: validationResult.error.errors }
            );
        }

        const { farmId, fileName, contentType } = validationResult.data;

        // Verify content type
        if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
            return errorResponse(
                400,
                'INVALID_FILE_TYPE',
                `File type ${contentType} not allowed. Allowed types: JPEG, PNG, HEIC`,
                requestId
            );
        }

        // Generate unique imageId
        const imageId = uuidv4();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileExtension = fileName.split('.').pop() || 'jpg';

        // S3 key structure: /{userId}/{farmId}/{timestamp}_{imageId}.{extension}
        const s3Key = `${userId}/${farmId}/${timestamp}_${imageId}.${fileExtension}`;

        // Generate pre-signed upload URL
        const uploadUrl = await generatePresignedUploadUrl(
            S3_BUCKET,
            s3Key,
            UPLOAD_URL_EXPIRY,
            contentType
        );

        // Store image metadata in DynamoDB
        const imageMetadata = {
            userId,
            imageId,
            farmId,
            s3Key,
            s3Bucket: S3_BUCKET,
            fileName,
            contentType,
            fileSize: 0, // Will be updated after upload
            uploadedAt: new Date().toISOString(),
            status: 'uploaded',
        };

        await putItem(IMAGES_TABLE, imageMetadata);

        // Return upload URL and imageId
        return successResponse(200, {
            uploadUrl,
            imageId,
            expiresIn: UPLOAD_URL_EXPIRY,
        });
    } catch (error: any) {
        console.error('Error generating upload URL:', {
            requestId,
            error: error.message,
            stack: error.stack,
        });

        return errorResponse(
            500,
            'INTERNAL_ERROR',
            'Failed to generate upload URL',
            requestId
        );
    }
};
