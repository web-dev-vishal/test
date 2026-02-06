/**
 * Global-Fi Ultra - User Validation Schemas
 * 
 * Zod schemas for user-related requests.
 */

import { z } from 'zod';

/**
 * Create user schema
 */
export const createUserSchema = z.object({
    body: z.object({
        email: z.string()
            .email('Invalid email address')
            .toLowerCase()
            .trim(),
        firstName: z.string()
            .min(1, 'First name is required')
            .max(50, 'First name must be 50 characters or less')
            .trim(),
        lastName: z.string()
            .min(1, 'Last name is required')
            .max(50, 'Last name must be 50 characters or less')
            .trim(),
        passwordHash: z.string()
            .optional(),
        preferences: z.object({
            defaultCurrency: z.string().length(3).toUpperCase().optional(),
            defaultStockSymbol: z.string().toUpperCase().optional(),
            defaultCryptoIds: z.string().optional(),
            notifications: z.object({
                email: z.boolean().optional(),
                websocket: z.boolean().optional(),
            }).optional(),
        }).optional(),
    }),
});

/**
 * Update user schema (full update)
 */
export const updateUserSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
    }),
    body: z.object({
        email: z.string()
            .email('Invalid email address')
            .toLowerCase()
            .trim()
            .optional(),
        firstName: z.string()
            .min(1, 'First name is required')
            .max(50, 'First name must be 50 characters or less')
            .trim()
            .optional(),
        lastName: z.string()
            .min(1, 'Last name is required')
            .max(50, 'Last name must be 50 characters or less')
            .trim()
            .optional(),
        isActive: z.boolean().optional(),
        preferences: z.object({
            defaultCurrency: z.string().length(3).toUpperCase().optional(),
            defaultStockSymbol: z.string().toUpperCase().optional(),
            defaultCryptoIds: z.string().optional(),
            notifications: z.object({
                email: z.boolean().optional(),
                websocket: z.boolean().optional(),
            }).optional(),
        }).optional(),
    }),
});

/**
 * Partial update user schema (PATCH)
 */
export const patchUserSchema = updateUserSchema;

/**
 * Get user by ID schema
 */
export const getUserSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
    }),
});

/**
 * Delete user schema
 */
export const deleteUserSchema = getUserSchema;

/**
 * List users schema
 */
export const listUsersSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
        sort: z.string().optional(),
    }),
});

export default {
    createUserSchema,
    updateUserSchema,
    patchUserSchema,
    getUserSchema,
    deleteUserSchema,
    listUsersSchema,
};
