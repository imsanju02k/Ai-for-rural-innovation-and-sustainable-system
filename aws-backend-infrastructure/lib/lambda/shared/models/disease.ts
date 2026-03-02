/**
 * Disease Analysis Data Model
 */

import { z } from 'zod';

/**
 * Disease result schema
 */
export const DiseaseResultSchema = z.object({
    diseaseName: z.string(),
    confidence: z.number().min(0).max(1),
    severity: z.enum(['low', 'moderate', 'high', 'critical']),
    affectedArea: z.string(),
    recommendations: z.array(z.string()),
});

/**
 * Disease analysis schema
 */
export const DiseaseAnalysisSchema = z.object({
    analysisId: z.string().uuid(),
    imageId: z.string().uuid(),
    userId: z.string().uuid(),
    farmId: z.string().uuid(),
    cropType: z.string(),
    results: z.array(DiseaseResultSchema),
    isUncertain: z.boolean().default(false),
    modelVersion: z.string(),
    processingTimeMs: z.number().positive(),
    analyzedAt: z.string().datetime(),
});

/**
 * Disease analysis request schema
 */
export const DiseaseAnalysisRequestSchema = z.object({
    imageId: z.string().uuid(),
    farmId: z.string().uuid(),
    cropType: z.string().min(1),
});

/**
 * TypeScript types derived from schemas
 */
export type DiseaseAnalysis = z.infer<typeof DiseaseAnalysisSchema>;
export type DiseaseResult = z.infer<typeof DiseaseResultSchema>;
export type DiseaseAnalysisRequest = z.infer<typeof DiseaseAnalysisRequestSchema>;
