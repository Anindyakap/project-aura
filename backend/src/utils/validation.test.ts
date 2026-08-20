import { describe, expect, it } from 'vitest';
import {
  createBrandSchema,
  insightIdParamSchema,
  metricsChartSchema,
  registerSchema,
  shopifyConnectSchema,
  uuidSchema,
} from './validation';

const parseRegistrationPassword = (password: string) => {
  return registerSchema.safeParse({
    body: {
      email: 'ada@example.com',
      password,
    },
  });
};

describe('registration validation', () => {
  it('accepts valid registration input', () => {
    const result = registerSchema.safeParse({
      body: {
        email: 'ada@example.com',
        password: 'Password123',
        name: 'Ada Lovelace',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a password without an uppercase letter', () => {
    expect(parseRegistrationPassword('password123').success).toBe(false);
  });

  it('rejects a password that is too short', () => {
    expect(parseRegistrationPassword('Pass1').success).toBe(false);
  });

  it('rejects a password that is too long', () => {
    const password = `${'A'.repeat(99)}a1`;

    expect(parseRegistrationPassword(password).success).toBe(false);
  });

  it('rejects a password without a lowercase letter', () => {
    expect(parseRegistrationPassword('PASSWORD123').success).toBe(false);
  });

  it('rejects a password without a number', () => {
    expect(parseRegistrationPassword('PasswordOnly').success).toBe(false);
  });

  it('rejects an invalid email address', () => {
    const result = registerSchema.safeParse({
      body: {
        email: 'not-an-email',
        password: 'Password123',
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('UUID validation', () => {
  it('accepts a valid UUID and rejects an invalid value', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});

describe('endpoint input validation', () => {
  const brandId = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid brand creation input', () => {
    expect(createBrandSchema.safeParse({
      body: { name: 'Aura Coffee', currency: 'USD', timezone: 'UTC' },
    }).success).toBe(true);
  });

  it('rejects an empty brand name', () => {
    expect(createBrandSchema.safeParse({
      body: { name: '   ' },
    }).success).toBe(false);
  });

  it('accepts safe metrics-chart query input', () => {
    expect(metricsChartSchema.safeParse({
      query: { brandId, metric: 'revenue', days: '30' },
    }).success).toBe(true);
  });

  it('rejects an invalid metric, day count, or brand ID', () => {
    expect(metricsChartSchema.safeParse({
      query: { brandId: 'not-a-uuid', metric: 'profit', days: '0' },
    }).success).toBe(false);
  });

  it('rejects invalid insight IDs and Shopify shop domains', () => {
    expect(insightIdParamSchema.safeParse({
      params: { id: 'not-a-uuid' },
    }).success).toBe(false);
    expect(shopifyConnectSchema.safeParse({
      query: { shop: 'not-shopify.example.com', brandId },
    }).success).toBe(false);
  });
});
