// src/controllers/metrics.controller.ts
// Fetches and calculates metrics for the dashboard
//
// WHAT THIS FILE DOES:
//   Reads raw metrics from DB → calculates summaries → sends to frontend
//
// ENDPOINTS:
//   GET /api/v1/metrics/summary?brandId=xxx        → KPI cards (revenue, orders, etc.)
//   GET /api/v1/metrics/chart?brandId=xxx&days=30  → Chart data (daily revenue)

import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AppError, catchAsync } from '../middleware/errorHandler';

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
// GET /api/v1/metrics/summary?brandId=xxx
//
// Returns KPI cards for the dashboard:
//   - Total revenue (last 30 days)
//   - Total orders (last 30 days)
//   - Average order value
//   - New customers
//   - % change vs previous 30 days (for the trend arrows)
//
// FLOW:
//   Fetch last 30 days metrics → calculate totals
//   Fetch previous 30 days metrics → calculate totals
//   Compare → get % change
//   Return both periods so frontend can show "↑ 12.5%"

export const getMetricsSummary = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const brandId = req.query.brandId as string;

    if (!brandId) throw new AppError('brandId is required', 400);

    // Verify brand belongs to this user
    const brandCheck = await pool.query(
      'SELECT id FROM brands WHERE id = $1 AND user_id = $2',
      [brandId, req.user!.userId]
    );
    if (brandCheck.rows.length === 0) {
      throw new AppError('Brand not found or access denied', 403);
    }

    // ── Fetch current period (last 30 days) ──────────────────────────────────
    // We use SUM grouped by metric_type to get totals efficiently
    // One query returns all metric totals at once
    const currentResult = await pool.query(
      `SELECT metric_type, SUM(value) as total
       FROM metrics
       WHERE brand_id = $1
         AND date >= CURRENT_DATE - INTERVAL '29 days'
         AND date <= CURRENT_DATE
       GROUP BY metric_type`,
      [brandId]
    );

    // ── Fetch previous period (30-60 days ago) ───────────────────────────────
    // Used to calculate % change (trend arrows on KPI cards)
    const previousResult = await pool.query(
      `SELECT metric_type, SUM(value) as total
       FROM metrics
       WHERE brand_id = $1
         AND date >= CURRENT_DATE - INTERVAL '59 days'
         AND date < CURRENT_DATE - INTERVAL '29 days'
       GROUP BY metric_type`,
      [brandId]
    );

    // ── Transform DB rows into a lookup object ───────────────────────────────
    // Converts: [{ metric_type: 'revenue', total: '34521.00' }, ...]
    // Into:     { revenue: 34521, orders: 412, new_customers: 145 }
    const current = rowsToMetricMap(currentResult.rows);
    const previous = rowsToMetricMap(previousResult.rows);

    // ── Calculate derived metrics ────────────────────────────────────────────
    const revenue      = current.revenue      || 0;
    const orders       = current.orders       || 0;
    const newCustomers = current.new_customers || 0;

    // Average Order Value = Revenue / Orders
    // WHY: Shows how much each customer spends on average
    const aov = orders > 0 ? round2(revenue / orders) : 0;

    const prevRevenue      = previous.revenue      || 0;
    const prevOrders       = previous.orders       || 0;
    const prevNewCustomers = previous.new_customers || 0;
    const prevAov = prevOrders > 0 ? round2(prevRevenue / prevOrders) : 0;

    res.status(200).json({
      success: true,
      data: {
        period: 'last_30_days',
        metrics: {
          revenue: {
            value: revenue,
            change: percentChange(prevRevenue, revenue),    // e.g. 12.5 means +12.5%
            formatted: `$${revenue.toLocaleString()}`,
          },
          orders: {
            value: orders,
            change: percentChange(prevOrders, orders),
            formatted: orders.toLocaleString(),
          },
          aov: {
            value: aov,
            change: percentChange(prevAov, aov),
            formatted: `$${aov}`,
          },
          new_customers: {
            value: newCustomers,
            change: percentChange(prevNewCustomers, newCustomers),
            formatted: newCustomers.toLocaleString(),
          },
        },
      },
    });
  }
);

// ─── CHART DATA ───────────────────────────────────────────────────────────────
// GET /api/v1/metrics/chart?brandId=xxx&days=30&metric=revenue
//
// Returns daily data points for charts
// Frontend uses this to draw the revenue/orders line charts
//
// Example response:
// [
//   { date: "2026-01-27", value: 556.90 },
//   { date: "2026-01-28", value: 789.95 },
//   ...
// ]

export const getMetricsChart = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const brandId  = req.query.brandId  as string;
    const days     = parseInt(req.query.days as string) || 30;
    const metric   = req.query.metric   as string || 'revenue';

    if (!brandId) throw new AppError('brandId is required', 400);

    // Validate metric type to prevent SQL injection
    // Only allow known metric types
    const allowedMetrics = ['revenue', 'orders', 'new_customers'];
    if (!allowedMetrics.includes(metric)) {
      throw new AppError(`Invalid metric. Must be one of: ${allowedMetrics.join(', ')}`, 400);
    }

    // Verify brand ownership
    const brandCheck = await pool.query(
      'SELECT id FROM brands WHERE id = $1 AND user_id = $2',
      [brandId, req.user!.userId]
    );
    if (brandCheck.rows.length === 0) {
      throw new AppError('Brand not found or access denied', 403);
    }

    // Fetch daily data points ordered by date ascending
    // (oldest first so charts draw left to right correctly)
    const result = await pool.query(
      `SELECT date, value
       FROM metrics
       WHERE brand_id = $1
         AND metric_type = $2
         AND date >= CURRENT_DATE - INTERVAL '${days - 1} days'
         AND date <= CURRENT_DATE
       ORDER BY date ASC`,
      [brandId, metric]
    );

    // Format dates as strings for JSON response
    const chartData = result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],  // "2026-02-25"
      value: parseFloat(row.value),                 // number, not string
    }));

    res.status(200).json({
      success: true,
      data: {
        metric,
        days,
        points: chartData,
      },
    });
  }
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Converts DB rows array into a simple key-value object
// Input:  [{ metric_type: 'revenue', total: '34521.00' }, ...]
// Output: { revenue: 34521, orders: 412 }
const rowsToMetricMap = (
  rows: Array<{ metric_type: string; total: string }>
): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.metric_type] = parseFloat(row.total) || 0;
  }
  return map;
};

// Calculates % change between two values
// percentChange(100, 112) → 12 (meaning +12%)
// percentChange(100, 88)  → -12 (meaning -12%)
// Returns 0 if previous value was 0 (can't divide by zero)
const percentChange = (previous: number, current: number): number => {
  if (previous === 0) return 0;
  return round2(((current - previous) / previous) * 100);
};

// Rounds to 2 decimal places
const round2 = (n: number): number => Math.round(n * 100) / 100;