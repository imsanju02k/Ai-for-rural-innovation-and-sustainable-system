/**
 * Disease Detection Lambda Function
 * 
 * Triggered by S3 image upload or API request
 * - Loads image from S3
 * - Calls Amazon Rekognition for initial image analysis
 * - Calls Amazon Bedrock (Claude 3) for disease identification
 * - Parses AI response for diseases, confidence scores, and recommendations
 * - Ranks diseases by confidence score
 * - Stores analysis results in DiseaseAnalyses table
 * - Returns analysis results with treatment recommendations
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9
 */

import { S3Event, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { v4 as uuidv4 } from 'uuid';
import { getItem, putItem } from '../../shared/utils/dynamodb';
import { downloadFile } from '../../shared/utils/s3';
import { ok, badRequest, notFound, internalServerError, serviceUnavailable, getRequestId } from '../../shared/utils/response';
import {
    withErrorHandling,
    errorToResponse,
    DiseaseDetectionError,
    handleRekognitionError,
    handleBedrockError,
    handleS3Error,
    handleDynamoDBError,
} from '../shared/error-handler';

// Initialize AWS clients
const rekognitionClient = new RekognitionClient({});
const bedrockClient = new BedrockRuntimeClient({});

// Environment variables
const IMAGES_TABLE = process.env.IMAGES_TABLE || '';
const DISEASE_ANALYSES_TABLE = process.env.DISEASE_ANALYSES_TABLE || '';
const S3_BUCKET = process.env.S3_BUCKET || '';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';
const MODEL_VERSION = '1.0.0';

interface DiseaseResult {
    diseaseName: string;
    confidence: number;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    affectedArea: string;
    recommendations: string[];
}

interface AnalysisResult {
    analysisId: string;
    imageId: string;
    userId: string;
    farmId: string;
    cropType: string;
    results: DiseaseResult[];
    isUncertain: boolean;
    modelVersion: string;
    processingTimeMs: number;
    analyzedAt: string;
}

/**
 * Main handler - supports both S3 trigger and API Gateway
 */
export const handler = async (
    event: S3Event | APIGatewayProxyEvent
): Promise<void | APIGatewayProxyResult> => {
    const startTime = Date.now();

    try {
        // Determine if this is an S3 event or API Gateway event
        if ('Records' in event && event.Records[0]?.eventSource === 'aws:s3') {
            // S3 trigger
            await handleS3Event(event as S3Event, startTime);
            return;
        } else {
            // API Gateway request
            return await handleApiRequest(event as APIGatewayProxyEvent, startTime);
        }
    } catch (error) {
        console.error('Error in disease detection handler:', error);

        if ('Records' in event) {
            // S3 event - just log and throw
            throw error;
        } else {
            // API Gateway - return error response
            const requestId = getRequestId(event);
            
            if (error instanceof DiseaseDetectionError) {
                return errorToResponse(error, requestId);
            }
            
            return internalServerError('Failed to process disease detection', requestId);
        }
    }
};

/**
 * Handle S3 event trigger
 */
async function handleS3Event(event: S3Event, startTime: number): Promise<void> {
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing S3 event for: ${bucket}/${key}`);

    // Extract imageId from S3 key (format: userId/farmId/timestamp_imageId.ext)
    const keyParts = key.split('/');
    const fileName = keyParts[keyParts.length - 1];
    const imageId = fileName.split('_')[1]?.split('.')[0];

    if (!imageId) {
        console.error('Could not extract imageId from S3 key:', key);
        throw new Error('Invalid S3 key format');
    }

    // Get image metadata from DynamoDB
    const imageRecord = await getItem(IMAGES_TABLE, { imageId });

    if (!imageRecord) {
        console.error('Image record not found:', imageId);
        throw new Error('Image record not found');
    }

    // Perform disease detection
    await performDiseaseDetection({
        imageId,
        userId: imageRecord.userId,
        farmId: imageRecord.farmId,
        cropType: imageRecord.cropType || 'unknown',
        s3Bucket: bucket,
        s3Key: key,
        startTime,
    });
}

/**
 * Handle API Gateway request
 */
async function handleApiRequest(
    event: APIGatewayProxyEvent,
    startTime: number
): Promise<APIGatewayProxyResult> {
    const requestId = getRequestId(event);

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { imageId, farmId, cropType } = body;

    // Validate required fields
    if (!imageId || !farmId || !cropType) {
        return badRequest(
            'Missing required fields: imageId, farmId, cropType',
            requestId
        );
    }

    // Get user ID from authorizer context
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
        return badRequest('User ID not found in request context', requestId);
    }

    // Get image record from DynamoDB
    const imageRecord = await getItem(IMAGES_TABLE, { imageId });

    if (!imageRecord) {
        return notFound('Image not found', requestId);
    }

    // Verify user owns the image
    if (imageRecord.userId !== userId) {
        return badRequest('Image does not belong to user', requestId);
    }

    try {
        // Perform disease detection
        const result = await performDiseaseDetection({
            imageId,
            userId,
            farmId,
            cropType,
            s3Bucket: imageRecord.s3Bucket || S3_BUCKET,
            s3Key: imageRecord.s3Key,
            startTime,
        });

        return ok(result);
    } catch (error: any) {
        console.error('Disease detection error:', error);

        if (error.name === 'ServiceUnavailableException' || error.name === 'ThrottlingException') {
            return serviceUnavailable('AI service temporarily unavailable', requestId);
        }

        return internalServerError('Failed to analyze image', requestId);
    }
}

/**
 * Perform disease detection analysis
 */
async function performDiseaseDetection(params: {
    imageId: string;
    userId: string;
    farmId: string;
    cropType: string;
    s3Bucket: string;
    s3Key: string;
    startTime: number;
}): Promise<AnalysisResult> {
    const { imageId, userId, farmId, cropType, s3Bucket, s3Key, startTime } = params;

    console.log('Starting disease detection:', { imageId, cropType });

    // Step 1: Use Rekognition for initial image analysis
    const rekognitionLabels = await analyzeImageWithRekognition(s3Bucket, s3Key);
    console.log('Rekognition labels:', rekognitionLabels);

    // Step 2: Download image for Bedrock analysis
    const imageBuffer = await downloadFile(s3Bucket, s3Key);
    const imageBase64 = imageBuffer.toString('base64');

    // Step 3: Use Bedrock (Claude 3) for disease identification
    const diseases = await identifyDiseasesWithBedrock(imageBase64, cropType, rekognitionLabels);
    console.log('Identified diseases:', diseases);

    // Step 4: Rank diseases by confidence score
    const rankedDiseases = rankDiseasesByConfidence(diseases);

    // Step 5: Create analysis result
    const analysisId = uuidv4();
    const processingTimeMs = Date.now() - startTime;
    const analyzedAt = new Date().toISOString();

    const analysisResult: AnalysisResult = {
        analysisId,
        imageId,
        userId,
        farmId,
        cropType,
        results: rankedDiseases,
        isUncertain: rankedDiseases.length === 0 || rankedDiseases[0].confidence < 0.5,
        modelVersion: MODEL_VERSION,
        processingTimeMs,
        analyzedAt,
    };

    // Step 6: Store analysis results in DynamoDB
    await putItem(DISEASE_ANALYSES_TABLE, {
        analysisId,
        imageId,
        userId,
        farmId,
        cropType,
        results: rankedDiseases,
        isUncertain: analysisResult.isUncertain,
        modelVersion: MODEL_VERSION,
        processingTimeMs,
        analyzedAt,
    });

    console.log('Disease detection completed:', { analysisId, processingTimeMs });

    return analysisResult;
}

/**
 * Analyze image with Amazon Rekognition
 */
async function analyzeImageWithRekognition(
    bucket: string,
    key: string
): Promise<string[]> {
    try {
        const command = new DetectLabelsCommand({
            Image: {
                S3Object: {
                    Bucket: bucket,
                    Name: key,
                },
            },
            MaxLabels: 20,
            MinConfidence: 70,
        });

        const response = await rekognitionClient.send(command);

        return (response.Labels || [])
            .filter(label => label.Confidence && label.Confidence >= 70)
            .map(label => label.Name || '')
            .filter(name => name.length > 0);
    } catch (error) {
        console.error('Rekognition error:', error);
        throw new Error('Failed to analyze image with Rekognition');
    }
}

/**
 * Identify diseases using Amazon Bedrock (Claude 3)
 */
async function identifyDiseasesWithBedrock(
    imageBase64: string,
    cropType: string,
    rekognitionLabels: string[]
): Promise<DiseaseResult[]> {
    const prompt = `You are an expert agricultural pathologist. Analyze this image of a ${cropType} plant for diseases.

Context from image analysis: ${rekognitionLabels.join(', ')}

Please identify any diseases present and provide:
1. Disease name
2. Confidence level (0.0 to 1.0)
3. Severity (low, moderate, high, or critical)
4. Affected area (leaves, stem, roots, fruit, etc.)
5. Treatment recommendations (3-5 specific actions)

If no diseases are detected, return an empty array.

Respond ONLY with a valid JSON array in this exact format:
[
  {
    "diseaseName": "Disease Name",
    "confidence": 0.85,
    "severity": "moderate",
    "affectedArea": "leaves",
    "recommendations": [
      "Recommendation 1",
      "Recommendation 2",
      "Recommendation 3"
    ]
  }
]`;

    try {
        const command = new InvokeModelCommand({
            modelId: BEDROCK_MODEL_ID,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 2000,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                    data: imageBase64,
                                },
                            },
                            {
                                type: 'text',
                                text: prompt,
                            },
                        ],
                    },
                ],
            }),
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        // Extract the text content from Claude's response
        const textContent = responseBody.content[0].text;

        // Parse the JSON array from the response
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn('No JSON array found in Bedrock response');
            return [];
        }

        const diseases = JSON.parse(jsonMatch[0]) as DiseaseResult[];

        // Validate and sanitize the response
        return diseases.map(disease => ({
            diseaseName: disease.diseaseName || 'Unknown Disease',
            confidence: Math.max(0, Math.min(1, disease.confidence || 0)),
            severity: ['low', 'moderate', 'high', 'critical'].includes(disease.severity)
                ? disease.severity
                : 'moderate',
            affectedArea: disease.affectedArea || 'unknown',
            recommendations: Array.isArray(disease.recommendations)
                ? disease.recommendations.slice(0, 5)
                : [],
        }));
    } catch (error) {
        console.error('Bedrock error:', error);
        throw new Error('Failed to identify diseases with Bedrock');
    }
}

/**
 * Rank diseases by confidence score (descending)
 * Requirement 5.9: Multiple diseases SHALL be ranked by confidence score
 */
function rankDiseasesByConfidence(diseases: DiseaseResult[]): DiseaseResult[] {
    return diseases.sort((a, b) => b.confidence - a.confidence);
}
