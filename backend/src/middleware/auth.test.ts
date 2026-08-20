import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { protect } from './auth';
import type { JWTPayload } from '../types/user.types';

const testSecret = 'test-jwt-secret';
const testPayload: JWTPayload = {
  userId: 'test-user-id',
  email: 'test@example.com',
};
const originalJwtSecret = process.env.JWT_SECRET;

describe('protect', () => {
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

  it('passes a 401 error to next when the token is expired', async () => {
    const expiredToken = jwt.sign(testPayload, testSecret, { expiresIn: -1 });
    const request = {
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
    } as Request;
    const next = vi.fn<NextFunction>();

    await protect(request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: expect.stringContaining('Invalid or expired token'),
      })
    );
  });
});
