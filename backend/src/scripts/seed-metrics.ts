// src/scripts/seed-metrics.ts
// Generates 60 days of realistic metrics data for development/demo purposes
//
// HOW TO RUN:
//   npx ts-node src/scripts/seed-metrics.ts
//
// WHAT IT DOES:
//   Inserts revenue, orders, and new_customers metrics
//   for the last 60 days into the metrics table
//   Uses realistic patterns (weekends higher, slight growth trend)

import { pool } from '../config/database';
import dotenv from 'dotenv';
import { logError, logInfo, logWarn } from '../utils/logger';
import { getSeedConfig } from '../utils/seedConfig';
dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────
const { brandId, integrationId } = getSeedConfig(process.env);

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns a random number between min and max
const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// Rounds a number to 2 decimal places
const round2 = (n: number): number => Math.round(n * 100) / 100;

// Returns "2026-02-25" format for a date N days ago
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

// ─── Seed Function ────────────────────────────────────────────────────────────

const seedMetrics = async (): Promise<void> => {
  logInfo('Metrics seed started');

  // Delete existing metrics for this brand so we start fresh
  // WHY: Running the script twice would create duplicates otherwise
  await pool.query(
    `DELETE FROM metrics WHERE brand_id = $1`,
    [brandId]
  );
  logWarn('Metrics seed cleared existing metrics');

  // Generate data for the last 60 days
  // Day 0 = today, Day 59 = 59 days ago
  for (let daysBack = 59; daysBack >= 0; daysBack--) {
    const date = daysAgo(daysBack);
    const dayOfWeek = new Date(date).getDay(); // 0=Sunday, 6=Saturday

    // ── Realistic patterns ──────────────────────────────────────────────────
    //
    // Weekends (Sat/Sun) have higher traffic for D2C jewelry brands
    // There's a slight upward growth trend over the 60 days
    // Random variation makes it look natural, not perfectly linear
    //
    // Growth multiplier: starts at 0.95 and ends at 1.05
    // This is a 0.10 increase across the 60-day period.
    const growthMultiplier = 0.95 + (59 - daysBack) * (0.10 / 59);

    // Weekend multiplier: 40% more orders on weekends
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 1.4 : 1.0;

    // Base metrics for a mid-size D2C jewelry brand
    const baseOrders = 12;              // ~12 orders per day baseline
    const baseOrderValue = 85;          // ~$85 average order value
    const baseNewCustomerRate = 0.35;   // ~35% of orders are new customers

    // Calculate today's metrics with all multipliers + random variation
    const orders = Math.round(
      baseOrders
      * growthMultiplier
      * weekendMultiplier
      * randomBetween(0.7, 1.3)  // ±30% random variation
    );

    const avgOrderValue = baseOrderValue
      * growthMultiplier
      * randomBetween(0.85, 1.15); // ±15% variation in order value

    const revenue = round2(orders * avgOrderValue);

    const newCustomers = Math.round(
      orders * baseNewCustomerRate * randomBetween(0.6, 1.4)
    );

    // ── Save to database ──────────────────────────────────────────────────────
    // We insert 3 rows per day: revenue, orders, new_customers
    // ON CONFLICT handles re-runs gracefully

    await pool.query(
      `INSERT INTO metrics (brand_id, integration_id, date, metric_type, value, currency)
       VALUES ($1, $2, $3, 'revenue', $4, 'USD')
       ON CONFLICT (brand_id, metric_type, date)
       DO UPDATE SET value = EXCLUDED.value`,
      [brandId, integrationId, date, revenue]
    );

    await pool.query(
      `INSERT INTO metrics (brand_id, integration_id, date, metric_type, value, currency)
       VALUES ($1, $2, $3, 'orders', $4, 'USD')
       ON CONFLICT (brand_id, metric_type, date)
       DO UPDATE SET value = EXCLUDED.value`,
      [brandId, integrationId, date, orders]
    );

    await pool.query(
      `INSERT INTO metrics (brand_id, integration_id, date, metric_type, value, currency)
       VALUES ($1, $2, $3, 'new_customers', $4, 'USD')
       ON CONFLICT (brand_id, metric_type, date)
       DO UPDATE SET value = EXCLUDED.value`,
      [brandId, integrationId, date, newCustomers]
    );

  }

  logInfo('Metrics seed completed');
  await pool.end();
};

// Run the seed
seedMetrics().catch((error) => {
  logError('Metrics seed failed', {
    errorName: error instanceof Error ? error.name : 'UnknownError',
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});
