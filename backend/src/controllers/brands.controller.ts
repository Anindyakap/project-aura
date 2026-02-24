// Handles everything related to brands (a user can have multiple brands)

import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AppError, catchAsync } from '../middleware/errorHandler';

// ─── GET ALL BRANDS FOR LOGGED-IN USER ───────────────────────────────────────
// GET /api/v1/brands
// Python equivalent: db.query("SELECT * FROM brands WHERE user_id = current_user.id")
export const getBrands = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const result = await pool.query(
      `SELECT id, name, domain, currency, timezone, created_at
       FROM brands
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [req.user!.userId]  // req.user is set by the protect middleware
    );

    res.status(200).json({
      success: true,
      data: result.rows,  // returns array of brands
    });
  }
);

// ─── CREATE A NEW BRAND ───────────────────────────────────────────────────────
// POST /api/v1/brands
// Body: { name, domain, currency, timezone }
export const createBrand = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { name, domain, currency = 'USD', timezone = 'UTC' } = req.body;

    if (!name) {
      throw new AppError('Brand name is required', 400);
    }

    const result = await pool.query(
      `INSERT INTO brands (user_id, name, domain, currency, timezone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, domain, currency, timezone, created_at`,
      [req.user!.userId, name, domain || null, currency, timezone]
    );

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: result.rows[0],
    });
  }
);
