/**
 * Alert Data Model
 */

import { z } from 'zod';

/**
 * Alert severity enum
 */
export const AlertSeverity = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Alert status enum
 */
export const AlertStatus = z.enum(['active', 'acknowledged', 'resolved']);

/**
 * Alert schema
 */
export const AlertSchema = z.object({
    alertId: z.string().uuid(),
    userId: z.string().uuid(),
    farmId: z.string().uuid(),
    type: z.string(),
    severity: AlertSeverity,
    message: z.string(),
    status: AlertStatus,
    metadata: z.record(z.any()).optional(),
    createdAt: z.string().datetime(),
    acknowledgedAt: z.string().datetime().nullable().optional(),
    acknowledgedBy: z.string().uuid().nullable().optional(),
    note: z.string().nullable().optional(),
    resolvedAt: z.string().datetime().nullable().optional(),
});

/**
 * Alert creation input schema
 */
export const CreateAlertInputSchema = z.object({
    userId: z.string().uuid(),
    farmId: z.string().uuid(),
    type: z.string().min(1),
    severity: AlertSeverity,
    message: z.string().min(1),
    metadata: z.record(z.any()).optional(),
});

/**
 * Alert acknowledgment input schema
 */
export const AcknowledgeAlertInputSchema = z.object({
    note: z.string().optional(),
});

/**
 * TypeScript types derived from schemas
 */
export type Alert = z.infer<typeof AlertSchema>;
export type AlertSeverityType = z.infer<typeof AlertSeverity>;
export type AlertStatusType = z.infer<typeof AlertStatus>;
export type CreateAlertInput = z.infer<typeof CreateAlertInputSchema>;
export type AcknowledgeAlertInput = z.infer<typeof AcknowledgeAlertInputSchema>;
