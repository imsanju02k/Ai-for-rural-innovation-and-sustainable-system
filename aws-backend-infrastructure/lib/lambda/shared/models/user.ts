/**
 * User Data Model
 */

import { z } from 'zod';

/**
 * User preferences schema
 */
export const UserPreferencesSchema = z.object({
    language: z.string().default('en'),
    notifications: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        push: z.boolean().default(true),
    }).default({
        email: true,
        sms: false,
        push: true,
    }),
});

/**
 * User schema
 */
export const UserSchema = z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1).max(100),
    phone: z.string().optional(),
    role: z.enum(['farmer', 'advisor', 'admin']).default('farmer'),
    preferences: UserPreferencesSchema.optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

/**
 * User creation input schema
 */
export const CreateUserInputSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
    phone: z.string().optional(),
    role: z.enum(['farmer', 'advisor', 'admin']).optional(),
});

/**
 * User update input schema
 */
export const UpdateUserInputSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().optional(),
    preferences: UserPreferencesSchema.optional(),
});

/**
 * TypeScript types derived from schemas
 */
export type User = z.infer<typeof UserSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
