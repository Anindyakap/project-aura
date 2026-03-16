// backend/src/controllers/insights.controller.ts
// API endpoints for fetching and managing insights

import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AppError, catchAsync } from '../middleware/errorHandler';
import { runInsightsEngine } from '../services/insights.engine';

// ─── GET /api/v1/insights?brandId=xxx ─────────────────────────────────────────
// Returns all insights for a brand, newest first
export const getInsights = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const brandId = req.query.brandId as string;
    if (!brandId) throw new AppError('brandId is required', 400);

    // Verify brand belongs to user
    const brandCheck = await pool.query(
      'SELECT id FROM brands WHERE id = $1 AND user_id = $2',
      [brandId, req.user!.userId]
    );
    if (brandCheck.rows.length === 0) throw new AppError('Brand not found', 403);

    const result = await pool.query(
      `SELECT id, insight_type, priority, title, description,
              action_items, related_data, is_read, created_at
       FROM insights
       WHERE brand_id = $1
       ORDER BY
         CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         created_at DESC`,
      [brandId]
    );

    // Count unread
    const unreadCount = result.rows.filter(r => !r.is_read).length;

    res.status(200).json({
      success: true,
      data: {
        insights: result.rows,
        unreadCount,
        total: result.rows.length,
      },
    });
  }
);

// ─── PATCH /api/v1/insights/:id/read ─────────────────────────────────────────
// Marks a single insight as read
export const markAsRead = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params;

    await pool.query(
      `UPDATE insights SET is_read = true
       WHERE id = $1`,
      [id]
    );

    res.status(200).json({ success: true, message: 'Insight marked as read' });
  }
);

// ─── PATCH /api/v1/insights/read-all ─────────────────────────────────────────
// Marks ALL insights as read for a brand
export const markAllAsRead = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const brandId = req.query.brandId as string;
    if (!brandId) throw new AppError('brandId is required', 400);

    await pool.query(
      `UPDATE insights SET is_read = true WHERE brand_id = $1`,
      [brandId]
    );

    res.status(200).json({ success: true, message: 'All insights marked as read' });
  }
);

// ─── POST /api/v1/insights/generate ──────────────────────────────────────────
// Manually triggers the insights engine (for testing)
export const generateInsights = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    console.log('🧠 Manual insights generation triggered');
    await runInsightsEngine();

    res.status(200).json({
      success: true,
      message: 'Insights generated successfully',
      timestamp: new Date().toISOString(),
    });
  }
);