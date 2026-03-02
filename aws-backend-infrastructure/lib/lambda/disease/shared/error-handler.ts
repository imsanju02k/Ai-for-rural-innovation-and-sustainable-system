/**
 * Error Handling for Disease Detection
 * 
 * - Handle Rekognition API errors
 * - Handle Bedrock API errors
 * - Handle timeout errors
 * - Log errors with context
 * - Return descriptive error messages
 * 
 * Requirements: 5.7
 */

import { serviceUnavailable, internalServerError, gatewayTimeout } from '../../shared/utils/response';

export interface ErrorContext {
    operation: string;
    imageId?: string;
    farmId?: string;
    cropType?: string;
    requestId?: string;
    [key: string]: any;
}

export class DiseaseDetectionError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number,
        public context?: ErrorContext
    ) {
        super(message);
        this.name = 'DiseaseDetectionError';
    }
}

/**
 * Handle Rekognition API errors
 */
export function handleRekognitionError(error: any, context: ErrorContext): DiseaseDetectionError {
    console.error('Rekognition API error:', {
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            statusCode: error.$metadata?.httpStatusCode,
        },
        context,
    });

    // Map Rekognition errors to appropriate responses
    switch (error.name) {
        case 'InvalidImageFormatException':
            return new DiseaseDetectionError(
                'Invalid image format. Please upload a JPEG, PNG, or HEIC image.',
                'INVALID_IMAGE_FORMAT',
                400,
                context
            );

        case 'ImageTooLargeException':
            return new DiseaseDetectionError(
                'Image is too large. Maximum size is 10MB.',
                'IMAGE_TOO_LARGE',
                400,
                context
            );

        case 'InvalidS3ObjectException':
            return new DiseaseDetectionError(
                'Could not access image from storage. Please try uploading again.',
                'INVALID_S3_OBJECT',
                404,
                context
            );

        case 'ThrottlingException':
            return new DiseaseDetectionError(
                'Service is temporarily busy. Please try again in a moment.',
                'REKOGNITION_THROTTLED',
                503,
                context
            );

        case 'ProvisionedThroughputExceededException':
            return new DiseaseDetectionError(
                'Service capacity exceeded. Please try again later.',
                'REKOGNITION_CAPACITY_EXCEEDED',
                503,
                context
            );

        case 'ServiceUnavailableException':
            return new DiseaseDetectionError(
                'Image analysis service is temporarily unavailable.',
                'REKOGNITION_UNAVAILABLE',
                503,
                context
            );

        default:
            return new DiseaseDetectionError(
                'Failed to analyze image. Please try again.',
                'REKOGNITION_ERROR',
                500,
                context
            );
    }
}

/**
 * Handle Bedrock API errors
 */
export function handleBedrockError(error: any, context: ErrorContext): DiseaseDetectionError {
    console.error('Bedrock API error:', {
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            statusCode: error.$metadata?.httpStatusCode,
        },
        context,
    });

    // Map Bedrock errors to appropriate responses
    switch (error.name) {
        case 'ValidationException':
            return new DiseaseDetectionError(
                'Invalid request to AI model. Please contact support.',
                'BEDROCK_VALIDATION_ERROR',
                400,
                context
            );

        case 'ModelTimeoutException':
        case 'ModelErrorException':
            return new DiseaseDetectionError(
                'AI model processing timeout. Please try again.',
                'BEDROCK_TIMEOUT',
                504,
                context
            );

        case 'ThrottlingException':
            return new DiseaseDetectionError(
                'AI service is temporarily busy. Please try again in a moment.',
                'BEDROCK_THROTTLED',
                503,
                context
            );

        case 'ServiceQuotaExceededException':
            return new DiseaseDetectionError(
                'Service capacity exceeded. Please try again later.',
                'BEDROCK_QUOTA_EXCEEDED',
                503,
                context
            );

        case 'ServiceUnavailableException':
            return new DiseaseDetectionError(
                'AI service is temporarily unavailable.',
                'BEDROCK_UNAVAILABLE',
                503,
                context
            );

        case 'AccessDeniedException':
            return new DiseaseDetectionError(
                'AI service access denied. Please contact support.',
                'BEDROCK_ACCESS_DENIED',
                500,
                context
            );

        case 'ModelNotReadyException':
            return new DiseaseDetectionError(
                'AI model is not ready. Please try again in a moment.',
                'BEDROCK_MODEL_NOT_READY',
                503,
                context
            );

        default:
            return new DiseaseDetectionError(
                'Failed to identify diseases. Please try again.',
                'BEDROCK_ERROR',
                500,
                context
            );
    }
}

/**
 * Handle timeout errors
 */
export function handleTimeoutError(context: ErrorContext): DiseaseDetectionError {
    console.error('Operation timeout:', context);

    return new DiseaseDetectionError(
        'Disease detection took too long. Please try again with a smaller image.',
        'TIMEOUT',
        504,
        context
    );
}

/**
 * Handle S3 errors
 */
export function handleS3Error(error: any, context: ErrorContext): DiseaseDetectionError {
    console.error('S3 error:', {
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            statusCode: error.$metadata?.httpStatusCode,
        },
        context,
    });

    switch (error.name) {
        case 'NoSuchKey':
        case 'NotFound':
            return new DiseaseDetectionError(
                'Image not found in storage.',
                'IMAGE_NOT_FOUND',
                404,
                context
            );

        case 'AccessDenied':
            return new DiseaseDetectionError(
                'Cannot access image. Please contact support.',
                'S3_ACCESS_DENIED',
                403,
                context
            );

        default:
            return new DiseaseDetectionError(
                'Failed to retrieve image from storage.',
                'S3_ERROR',
                500,
                context
            );
    }
}

/**
 * Handle DynamoDB errors
 */
export function handleDynamoDBError(error: any, context: ErrorContext): DiseaseDetectionError {
    console.error('DynamoDB error:', {
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
        },
        context,
    });

    switch (error.name) {
        case 'ResourceNotFoundException':
            return new DiseaseDetectionError(
                'Database table not found. Please contact support.',
                'DYNAMODB_TABLE_NOT_FOUND',
                500,
                context
            );

        case 'ProvisionedThroughputExceededException':
            return new DiseaseDetectionError(
                'Database capacity exceeded. Please try again later.',
                'DYNAMODB_CAPACITY_EXCEEDED',
                503,
                context
            );

        case 'ConditionalCheckFailedException':
            return new DiseaseDetectionError(
                'Database operation failed. Please try again.',
                'DYNAMODB_CONDITION_FAILED',
                409,
                context
            );

        default:
            return new DiseaseDetectionError(
                'Database operation failed.',
                'DYNAMODB_ERROR',
                500,
                context
            );
    }
}

/**
 * Handle generic errors
 */
export function handleGenericError(error: any, context: ErrorContext): DiseaseDetectionError {
    console.error('Unexpected error:', {
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        context,
    });

    return new DiseaseDetectionError(
        'An unexpected error occurred during disease detection.',
        'INTERNAL_ERROR',
        500,
        context
    );
}

/**
 * Wrap error handling for async operations
 */
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        // Determine error type and handle appropriately
        if (error.name?.includes('Rekognition')) {
            throw handleRekognitionError(error, context);
        } else if (error.name?.includes('Bedrock') || error.name?.includes('Model')) {
            throw handleBedrockError(error, context);
        } else if (error.name?.includes('S3') || error.code?.includes('S3')) {
            throw handleS3Error(error, context);
        } else if (error.name?.includes('DynamoDB')) {
            throw handleDynamoDBError(error, context);
        } else if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
            throw handleTimeoutError(context);
        } else if (error instanceof DiseaseDetectionError) {
            throw error;
        } else {
            throw handleGenericError(error, context);
        }
    }
}

/**
 * Convert DiseaseDetectionError to API Gateway response
 */
export function errorToResponse(error: DiseaseDetectionError, requestId?: string) {
    const { statusCode, code, message, context } = error;

    // Log error with full context
    console.error('Disease detection error response:', {
        statusCode,
        code,
        message,
        context,
        requestId,
    });

    // Return appropriate response based on status code
    if (statusCode === 503) {
        return serviceUnavailable(message, requestId);
    } else if (statusCode === 504) {
        return gatewayTimeout(message, requestId);
    } else {
        return internalServerError(message, requestId);
    }
}
