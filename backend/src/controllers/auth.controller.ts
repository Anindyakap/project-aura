// src/controllers/auth.controller.ts
// Authentication controller (register, login, me)

import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { AppError } from '../middleware/errorHandler';
import { User, excludePassword, AuthResponse } from '../types/user.types';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // 1. Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email already exists', 409);
    }

    // 2. Hash password
    const password_hash = await hashPassword(password);

    // 3. Create user in database
    const result = await pool.query<User>(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [email.toLowerCase(), password_hash, name || null]
    );

    const user = result.rows[0];

    // 4. Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // 5. Send response (exclude password)
    const response: AuthResponse = {
      user: excludePassword(user),
      token,
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];

    // 2. Check if user is active
    if (!user.is_active) {
      throw new AppError('Account is deactivated. Please contact support.', 403);
    }

    // 3. Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // 4. Update last login (optional - you can add this column later)
    // await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // 5. Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // 6. Send response
    const response: AuthResponse = {
      user: excludePassword(user),
      token,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 * Protected route - requires authentication
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User is attached by protect middleware
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Fetch user from database
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: excludePassword(user),
    });
  } catch (error) {
    next(error);
  }
};