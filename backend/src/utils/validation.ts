// src/utils/validation.ts
// Zod validation schemas

import { z } from 'zod';

// Email validation
const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters');

// Password validation
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Registration validation schema
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().min(2).max(100).optional(),
  }),
});

// Login validation schema
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
});

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

export const brandIdQuerySchema = z.object({
  query: z.object({
    brandId: uuidSchema,
  }).strict(),
});

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Brand name is required').max(100),
    domain: z.string().trim().max(255).optional(),
    currency: z.string().trim().length(3, 'Currency must have 3 characters')
      .regex(/^[A-Za-z]{3}$/, 'Currency must contain only letters')
      .optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
  }).strict(),
});

export const metricsSummarySchema = brandIdQuerySchema;

export const metricsChartSchema = z.object({
  query: z.object({
    brandId: uuidSchema,
    metric: z.enum(['revenue', 'orders', 'new_customers']).optional(),
    days: z.coerce.number().int().min(1).max(365).optional(),
  }).strict(),
});

export const insightIdParamSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }).strict(),
});

export const shopifyConnectSchema = z.object({
  body: z.object({
    shop: z.string()
      .regex(
        /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/,
        'Shop must be a valid .myshopify.com domain'
      ),
    brandId: uuidSchema,
  }).strict(),
});

export const shopifyDisconnectSchema = z.object({
  body: z.object({
    brandId: uuidSchema,
  }).strict(),
});
