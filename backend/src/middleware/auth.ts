// src/middleware/auth.ts
// Authentication middleware (protect routes)

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/auth';
import { AppError } from './errorHandler';
import { JWTPayload } from '../types/user.types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to protect routes - requires valid JWT token
 */
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AppError('No token provided. Please login.', 401);
    }

    // 2. Verify token
    const decoded = verifyToken(token);

    // 3. Attach user info to request
    req.user = decoded;

    // 4. Continue to next middleware
    next();
  } catch (error) {
    if (error instanceof Error) {
      next(new AppError(error.message, 401));
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work differently for logged-in users
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Silently fail - just don't attach user
    next();
  }
};