/**
 * Image Data Model
 */

import { z } from 'zod';

/**
 * Image status enum
 */
export const ImageStatus = z.enum(['uploaded', 'processing', 'analyzed', 'failed']);

/**
 * Image schema
 */
export const ImageSchema = z.object({
  imageId: z.string().uuid(),
  userId: z.string().uuid(),
  farmId: z.string().uuid(),
  s3Key: z.string(),
  s3Bucket: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  fileSize: z.number().positive(),
  uploadedAt: z.string().datetime(),
  status: ImageStatus,
});

/**
 * Image upload request schema
 */
export const ImageUploadRequestSchema = z.object({
  farmId: z.string().uuid(),
  fileName: z.string().min(1),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/heic', 'image/webp']),
});

/**
 * TypeScript types derived from schemas
 */
export type Image = z.infer<typeof ImageSchema>;
export type ImageStatusType = z.infer<typeof ImageStatus>;
export type ImageUploadRequest = z.infer<typeof ImageUploadRequestSchema>;
