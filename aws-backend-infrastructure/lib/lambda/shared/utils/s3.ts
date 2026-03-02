/**
 * S3 Helper Functions
 * Provides simplified interfaces for common S3 operations
 */

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 Client
const s3Client = new S3Client({});

/**
 * Generate a pre-signed URL for uploading to S3
 */
export async function generatePresignedUploadUrl(
    bucket: string,
    key: string,
    expiresIn: number = 900, // 15 minutes default
    contentType?: string
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ...(contentType && { ContentType: contentType }),
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('S3 generatePresignedUploadUrl error:', error);
        throw error;
    }
}

/**
 * Generate a pre-signed URL for downloading from S3
 */
export async function generatePresignedDownloadUrl(
    bucket: string,
    key: string,
    expiresIn: number = 300 // 5 minutes default
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('S3 generatePresignedDownloadUrl error:', error);
        throw error;
    }
}

/**
 * Upload a file to S3
 */
export async function uploadFile(
    bucket: string,
    key: string,
    body: Buffer | Uint8Array | string,
    options?: {
        contentType?: string;
        metadata?: Record<string, string>;
    }
): Promise<void> {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: options?.contentType,
        Metadata: options?.metadata,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error('S3 uploadFile error:', error);
        throw error;
    }
}

/**
 * Download a file from S3
 */
export async function downloadFile(
    bucket: string,
    key: string
): Promise<Buffer> {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    try {
        const response = await s3Client.send(command);

        if (!response.Body) {
            throw new Error('No body in S3 response');
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as any) {
            chunks.push(chunk);
        }

        return Buffer.concat(chunks);
    } catch (error) {
        console.error('S3 downloadFile error:', error);
        throw error;
    }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(
    bucket: string,
    key: string
): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error('S3 deleteFile error:', error);
        throw error;
    }
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(
    bucket: string,
    key: string
): Promise<boolean> {
    const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    try {
        await s3Client.send(command);
        return true;
    } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        console.error('S3 fileExists error:', error);
        throw error;
    }
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(
    bucket: string,
    key: string
): Promise<{
    contentType?: string;
    contentLength?: number;
    lastModified?: Date;
    metadata?: Record<string, string>;
}> {
    const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    try {
        const response = await s3Client.send(command);
        return {
            contentType: response.ContentType,
            contentLength: response.ContentLength,
            lastModified: response.LastModified,
            metadata: response.Metadata,
        };
    } catch (error) {
        console.error('S3 getFileMetadata error:', error);
        throw error;
    }
}
