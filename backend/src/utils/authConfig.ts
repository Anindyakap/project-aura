export const getRequiredJwtSecret = (
  environment: NodeJS.ProcessEnv
): string => {
  const jwtSecret = environment.JWT_SECRET;

  if (!jwtSecret || jwtSecret.trim().length === 0) {
    throw new Error('JWT_SECRET must be set before starting the Aura backend');
  }

  return jwtSecret;
};
