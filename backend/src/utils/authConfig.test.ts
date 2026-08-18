import { describe, expect, it } from 'vitest';
import { getRequiredJwtSecret } from './authConfig';

describe('getRequiredJwtSecret', () => {
  it('accepts a configured JWT secret', () => {
    expect(getRequiredJwtSecret({
      JWT_SECRET: 'test-secret',
    })).toBe('test-secret');
  });

  it('rejects a missing JWT secret', () => {
    expect(() => getRequiredJwtSecret({})).toThrow(
      'JWT_SECRET must be set'
    );
  });

  it('rejects a blank JWT secret', () => {
    expect(() => getRequiredJwtSecret({
      JWT_SECRET: '   ',
    })).toThrow('JWT_SECRET must be set');
  });
});
