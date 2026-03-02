/**
 * Farm Data Model
 */

import { z } from 'zod';

/**
 * Location schema
 */
export const LocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
});

/**
 * Farm schema
 */
export const FarmSchema = z.object({
    farmId: z.string().uuid(),
    userId: z.string().uuid(),
    name: z.string().min(1).max(200),
    location: LocationSchema,
    cropTypes: z.array(z.string()).min(1),
    acreage: z.number().positive(),
    soilType: z.string().optional(),
    deletedAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

/**
 * Farm creation input schema
 */
export const CreateFarmInputSchema = z.object({
    name: z.string().min(1).max(200),
    location: LocationSchema,
    cropTypes: z.array(z.string()).min(1),
    acreage: z.number().positive(),
    soilType: z.string().optional(),
});

/**
 * Farm update input schema
 */
export const UpdateFarmInputSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    location: LocationSchema.optional(),
    cropTypes: z.array(z.string()).min(1).optional(),
    acreage: z.number().positive().optional(),
    soilType: z.string().optional(),
});

/**
 * TypeScript types derived from schemas
 */
export type Farm = z.infer<typeof FarmSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type CreateFarmInput = z.infer<typeof CreateFarmInputSchema>;
export type UpdateFarmInput = z.infer<typeof UpdateFarmInputSchema>;
