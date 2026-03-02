import {
    RekognitionClient,
    DetectLabelsCommand,
    DetectModerationLabelsCommand,
    DetectLabelsCommandInput,
    DetectModerationLabelsCommandInput,
    Label,
    ModerationLabel,
} from '@aws-sdk/client-rekognition';
import { rekognitionCircuitBreaker } from './circuit-breaker';

/**
 * Amazon Rekognition Integration Utilities
 * 
 * Helper functions for image analysis using Amazon Rekognition
 */

// Initialize Rekognition client
const rekognitionClient = new RekognitionClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

export interface ImageLocation {
    bucket: string;
    key: string;
}

export interface RekognitionLabels {
    labels: Array<{
        name: string;
        confidence: number;
        categories?: string[];
    }>;
    moderationLabels: Array<{
        name: string;
        confidence: number;
        parentName?: string;
    }>;
}

/**
 * Detect labels in an image stored in S3 (with circuit breaker protection)
 */
export async function detectImageLabels(
    imageLocation: ImageLocation,
    maxLabels: number = 50,
    minConfidence: number = 70
): Promise<Label[]> {
    return rekognitionCircuitBreaker.execute(async () => {
        const input: DetectLabelsCommandInput = {
            Image: {
                S3Object: {
                    Bucket: imageLocation.bucket,
                    Name: imageLocation.key,
                },
            },
            MaxLabels: maxLabels,
            MinConfidence: minConfidence,
        };

        try {
            const command = new DetectLabelsCommand(input);
            const response = await rekognitionClient.send(command);

            return response.Labels || [];
        } catch (error) {
            console.error('Error detecting labels with Rekognition:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Rekognition label detection failed: ${errorMessage}`);
        }
    });
}

/**
 * Detect moderation labels (inappropriate content) in an image (with circuit breaker protection)
 */
export async function detectModerationLabels(
    imageLocation: ImageLocation,
    minConfidence: number = 60
): Promise<ModerationLabel[]> {
    return rekognitionCircuitBreaker.execute(async () => {
        const input: DetectModerationLabelsCommandInput = {
            Image: {
                S3Object: {
                    Bucket: imageLocation.bucket,
                    Name: imageLocation.key,
                },
            },
            MinConfidence: minConfidence,
        };

        try {
            const command = new DetectModerationLabelsCommand(input);
            const response = await rekognitionClient.send(command);

            return response.ModerationLabels || [];
        } catch (error) {
            console.error('Error detecting moderation labels with Rekognition:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Rekognition moderation detection failed: ${errorMessage}`);
        }
    });
}

/**
 * Analyze image for crop disease detection
 * Combines label detection and moderation checks
 */
export async function analyzeImageForDiseaseDetection(
    imageLocation: ImageLocation
): Promise<RekognitionLabels> {
    try {
        // Run both detections in parallel
        const [labels, moderationLabels] = await Promise.all([
            detectImageLabels(imageLocation, 50, 60),
            detectModerationLabels(imageLocation, 60),
        ]);

        // Check for inappropriate content
        if (moderationLabels.length > 0) {
            console.warn('Image contains moderation labels:', moderationLabels);
            throw new Error('Image contains inappropriate content and cannot be analyzed');
        }

        // Transform labels to simplified format
        const simplifiedLabels = labels.map((label) => ({
            name: label.Name || '',
            confidence: label.Confidence || 0,
            categories: label.Categories?.map((cat) => cat.Name || '') || [],
        }));

        const simplifiedModerationLabels = moderationLabels.map((label) => ({
            name: label.Name || '',
            confidence: label.Confidence || 0,
            parentName: label.ParentName,
        }));

        return {
            labels: simplifiedLabels,
            moderationLabels: simplifiedModerationLabels,
        };
    } catch (error) {
        console.error('Error analyzing image:', error);
        throw error;
    }
}

/**
 * Filter labels relevant to plant/crop analysis
 */
export function filterPlantRelevantLabels(labels: Label[]): Label[] {
    const plantKeywords = [
        'plant',
        'leaf',
        'leaves',
        'crop',
        'vegetation',
        'agriculture',
        'farm',
        'field',
        'stem',
        'root',
        'flower',
        'fruit',
        'grain',
        'seed',
        'soil',
        'disease',
        'pest',
        'insect',
        'fungus',
        'mold',
        'blight',
        'rust',
        'spot',
        'wilt',
        'rot',
    ];

    return labels.filter((label) => {
        const labelName = (label.Name || '').toLowerCase();
        return plantKeywords.some((keyword) => labelName.includes(keyword));
    });
}

/**
 * Generate a text description from Rekognition labels
 */
export function generateImageDescription(labels: Label[]): string {
    if (labels.length === 0) {
        return 'No significant features detected in the image.';
    }

    // Sort by confidence
    const sortedLabels = [...labels].sort((a, b) => (b.Confidence || 0) - (a.Confidence || 0));

    // Take top 5 labels
    const topLabels = sortedLabels.slice(0, 5);

    const labelNames = topLabels.map((label) => label.Name).join(', ');

    return `The image shows: ${labelNames}`;
}

/**
 * Error handling wrapper for Rekognition operations
 */
export async function analyzeImageWithRetry(
    imageLocation: ImageLocation,
    maxRetries: number = 3
): Promise<RekognitionLabels> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await analyzeImageForDiseaseDetection(imageLocation);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            const errorMessage = lastError.message;
            console.warn(`Rekognition analysis attempt ${attempt} failed:`, errorMessage);

            // Don't retry if it's a moderation issue
            if (errorMessage.includes('inappropriate content')) {
                throw lastError;
            }

            if (attempt < maxRetries) {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    const errorMessage = lastError?.message || 'Unknown error';
    throw new Error(`Rekognition analysis failed after ${maxRetries} attempts: ${errorMessage}`);
}
