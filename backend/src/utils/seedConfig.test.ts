import { describe, expect, it } from 'vitest';
import { getSeedConfig } from './seedConfig';

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'development',
  ALLOW_METRICS_SEED: 'true',
  SEED_BRAND_ID: '550e8400-e29b-41d4-a716-446655440000',
  SEED_INTEGRATION_ID: '660e8400-e29b-41d4-a716-446655440000',
};

describe('getSeedConfig', () => {
  it('accepts confirmed development configuration with UUIDs', () => {
    expect(getSeedConfig(validEnvironment)).toEqual({
      brandId: validEnvironment.SEED_BRAND_ID,
      integrationId: validEnvironment.SEED_INTEGRATION_ID,
    });
  });

  it('rejects a missing seed ID', () => {
    expect(() => getSeedConfig({
      ...validEnvironment,
      SEED_BRAND_ID: undefined,
    })).toThrow('SEED_BRAND_ID is required');
  });

  it('rejects an invalid seed UUID', () => {
    expect(() => getSeedConfig({
      ...validEnvironment,
      SEED_INTEGRATION_ID: 'not-a-uuid',
    })).toThrow('SEED_INTEGRATION_ID must be a valid UUID');
  });

  it('requires explicit confirmation', () => {
    expect(() => getSeedConfig({
      ...validEnvironment,
      ALLOW_METRICS_SEED: 'false',
    })).toThrow('Set ALLOW_METRICS_SEED=true');
  });

  it('rejects production mode', () => {
    expect(() => getSeedConfig({
      ...validEnvironment,
      NODE_ENV: 'production',
    })).toThrow('Metrics seed must not run in production');
  });
});
