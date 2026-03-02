/**
 * Image Download URL Lambda Function
 * Generates pre-signed S3 download URLs for images
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { generatePresignedDownloadUrl } from '../../shared/utils/s3';
import { getItem } from '../../shared/utils/dynamodb';
import { successResponse, errorResponse } from '../../shared/utils/response';
import { isValidUUID } from '../../shared/utils/validation';

const IMAGES_TABLE = process.env.IMAGES_TABLE || '';
const DOWNLOAD_URL_EXPIRY = 300; // 5 minutes

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

    // Extract imageId from path parameters
    const imageId = event.pathParameters?.imageId;
    if (!imageId) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'imageId parameter is required',
        requestId
      );
    }

    // Validate imageId format
    if (!isValidUUID(imageId)) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid imageId format',
        requestId
      );
    }

    // Retrieve image metadata from DynamoDB
    const image = await getItem(IMAGES_TABLE, { userId, imageId });

    if (!image) {
      return errorResponse(
        404,
        'NOT_FOUND',
        'Image not found',
        requestId
      );
    }

    // Verify user ownership (already verified by the key lookup, but double-check)
    if (image.userId !== userId) {
      return errorResponse(
        403,
        'FORBIDDEN',
        'You do not have permission to access this image',
        requestId
      );
    }

    // Check if image is in a valid state for download
    if (image.status === 'failed') {
      return errorResponse(
        400,
        'INVALID_STATE',
        'Image processing failed and cannot be downloaded',
        requestId,
        { errorMessage: image.errorMessage }
      );
    }

    // Generate pre-signed download URL
    const downloadUrl = await generatePresignedDownloadUrl(
      image.s3Bucket,
      image.s3Key,
      DOWNLOAD_URL_EXPIRY
    );

    // Return download URL
    return successResponse(200, {
      downloadUrl,
      imageId,
      fileName: image.fileName,
      contentType: image.contentType,
      fileSize: image.fileSize,
      expiresIn: DOWNLOAD_URL_EXPIRY,
    });
  } catch (error: any) {
    console.error('Error generating download URL:', {
      requestId,
      error: error.message,
      stack: error.stack,
    });

    return errorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to generate download URL',
      requestId
    );
  }
};
