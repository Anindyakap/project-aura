import { uuidSchema } from './validation';

export interface SeedConfig {
  brandId: string;
  integrationId: string;
}

const getRequiredUuid = (
  environment: NodeJS.ProcessEnv,
  variableName: string
): string => {
  const value = environment[variableName];

  if (!value) {
    throw new Error(`${variableName} is required to run the metrics seed`);
  }

  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new Error(`${variableName} must be a valid UUID`);
  }

  return result.data;
};

export const getSeedConfig = (
  environment: NodeJS.ProcessEnv
): SeedConfig => {
  if (environment.NODE_ENV === 'production') {
    throw new Error('Metrics seed must not run in production');
  }

  if (environment.ALLOW_METRICS_SEED !== 'true') {
    throw new Error('Set ALLOW_METRICS_SEED=true to run the metrics seed');
  }

  return {
    brandId: getRequiredUuid(environment, 'SEED_BRAND_ID'),
    integrationId: getRequiredUuid(environment, 'SEED_INTEGRATION_ID'),
  };
};
