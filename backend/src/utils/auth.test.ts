import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from './auth';
import type { JWTPayload } from '../types/user.types';

const testSecret = 'test-jwt-secret';
const testPayload: JWTPayload = {
  userId: 'test-user-id',
  email: 'test@example.com',
};
const originalJwtSecret = process.env.JWT_SECRET;

describe('JWT expiration', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = testSecret;
  });

  afterEach(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
      return;
    }

    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('verifies a newly generated token', () => {
    const token = generateToken(testPayload);

    expect(verifyToken(token)).toEqual(testPayload);
  });

  it('rejects an expired token', () => {
    const expiredToken = jwt.sign(testPayload, testSecret, { expiresIn: -1 });

    expect(() => verifyToken(expiredToken)).toThrow('Invalid or expired token');
  });
});
