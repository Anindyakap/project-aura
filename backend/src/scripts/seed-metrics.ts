// src/scripts/seed-metrics.ts
// Generates 30 days of realistic metrics data for development/demo purposes
//
// HOW TO RUN:
//   npx ts-node src/scripts/seed-metrics.ts
//
// WHAT IT DOES:
//   Inserts revenue, orders, and new_customers metrics
//   for the last 30 days into the metrics table
//   Uses realistic patterns (weekends higher, slight growth trend)

import { pool } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────
// Change these to match your actual IDs from Supabase
const BRAND_ID = '1c8b2004-e667-48a6-b717-cb93de9f1708';
const INTEGRATION_ID = '0c67dbca-c3dc-4792-81bc-b3b4434a6a13';

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
  console.log('🌱 Starting metrics seed...');
  console.log(`   Brand ID:       ${BRAND_ID}`);
  console.log(`   Integration ID: ${INTEGRATION_ID}`);
  console.log('');

  // Delete existing metrics for this brand so we start fresh
  // WHY: Running the script twice would create duplicates otherwise
  await pool.query(
    `DELETE FROM metrics WHERE brand_id = $1`,
    [BRAND_ID]
  );
  console.log('🗑️  Cleared existing metrics');

  // Generate data for last 30 days
  // Day 0 = today, Day 29 = 29 days ago
  for (let daysBack = 29; daysBack >= 0; daysBack--) {
    const date = daysAgo(daysBack);
    const dayOfWeek = new Date(date).getDay(); // 0=Sunday, 6=Saturday

    // ── Realistic patterns ──────────────────────────────────────────────────
    //
    // Weekends (Sat/Sun) have higher traffic for D2C jewelry brands
    // There's a slight upward growth trend over the 30 days
    // Random variation makes it look natural, not perfectly linear
    //
    // Growth multiplier: starts at 0.85, ends at 1.15 (30% growth over month)
    const growthMultiplier = 0.85 + (29 - daysBack) * (0.30 / 29);

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
      [BRAND_ID, INTEGRATION_ID, date, revenue]
    );

    await pool.query(
      `INSERT INTO metrics (brand_id, integration_id, date, metric_type, value, currency)
       VALUES ($1, $2, $3, 'orders', $4, 'USD')
       ON CONFLICT (brand_id, metric_type, date)
       DO UPDATE SET value = EXCLUDED.value`,
      [BRAND_ID, INTEGRATION_ID, date, orders]
    );

    await pool.query(
      `INSERT INTO metrics (brand_id, integration_id, date, metric_type, value, currency)
       VALUES ($1, $2, $3, 'new_customers', $4, 'USD')
       ON CONFLICT (brand_id, metric_type, date)
       DO UPDATE SET value = EXCLUDED.value`,
      [BRAND_ID, INTEGRATION_ID, date, newCustomers]
    );

    console.log(`   📅 ${date} | revenue: $${revenue} | orders: ${orders} | new customers: ${newCustomers}`);
  }

  console.log('');
  console.log('✅ Seed complete! 30 days of metrics inserted.');
  await pool.end();
};

// Run the seed
seedMetrics().catch((error) => {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
});