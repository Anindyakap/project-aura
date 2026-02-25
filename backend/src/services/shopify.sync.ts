// src/services/shopify.sync.ts
// Fetches orders from Shopify API and stores them as metrics in our database
//
// FLOW:
//   1. Find all connected Shopify integrations in DB
//   2. For each integration, fetch today's orders from Shopify
//   3. Calculate metrics (revenue, order count, new customers)
//   4. Save metrics to DB
//   5. Update last_sync_at timestamp

import axios from 'axios';
import { pool } from '../config/database';

// ─── Types ────────────────────────────────────────────────────────────────────

// What a Shopify order looks like (simplified — Shopify returns much more)
interface ShopifyOrder {
  id: number;
  total_price: string;           // e.g. "125.00" (string, not number!)
  created_at: string;            // e.g. "2026-02-25T10:30:00Z"
  customer: {
    id: number;
    orders_count: number;        // how many total orders this customer has made
  } | null;
  financial_status: string;      // "paid", "pending", "refunded" etc.
}

// What we store in our integrations table for Shopify
interface ShopifyIntegration {
  id: string;                    // integration UUID
  brand_id: string;              // which brand this belongs to
  access_token: string;          // Shopify permanent access token
  platform_account_id: string;   // the shop domain e.g. aura-testing.myshopify.com
}

// ─── Main Sync Function ───────────────────────────────────────────────────────

/**
 * Syncs today's Shopify orders for ALL connected integrations
 * Called by the cron job daily, or manually via API endpoint
 */
export const syncAllShopifyIntegrations = async (): Promise<void> => {
  console.log('🔄 Starting Shopify sync for all integrations...');

  try {
    // STEP 1: Get all connected Shopify integrations from DB
    // We only sync integrations with status = 'connected'
    // (disconnected ones have no valid access token)
    const result = await pool.query<ShopifyIntegration>(
      `SELECT id, brand_id, access_token, platform_account_id
       FROM integrations
       WHERE platform = 'shopify'
       AND status = 'connected'`
    );

    const integrations = result.rows;

    if (integrations.length === 0) {
      console.log('ℹ️  No connected Shopify integrations found, skipping sync');
      return;
    }

    console.log(`📦 Found ${integrations.length} connected Shopify integration(s)`);

    // STEP 2: Sync each integration one by one
    // We use a for loop (not Promise.all) to avoid hitting Shopify rate limits
    // Rate limit = Shopify only allows ~40 requests per second per store
    for (const integration of integrations) {
      try {
        await syncSingleIntegration(integration);
      } catch (error: any) {
        console.error(
            `❌ Failed to sync integration ${integration.id}:`,
        error.message,
        error.response?.status,
        error.response?.data  // ← this shows Shopify's actual error message
        );

        // Mark integration as error so user knows something is wrong
        await pool.query(
          `UPDATE integrations SET status = 'error', updated_at = NOW()
           WHERE id = $1`,
          [integration.id]
        );
      }
    }

    console.log('✅ Shopify sync completed for all integrations');
  } catch (error: any) {
    console.error('❌ Fatal error during Shopify sync:', error.message);
    throw error;
  }
};

// ─── Single Integration Sync ──────────────────────────────────────────────────

/**
 * Syncs one Shopify store's orders for today
 */
const syncSingleIntegration = async (
  integration: ShopifyIntegration
): Promise<void> => {
  const { id, brand_id, access_token, platform_account_id } = integration;
  const shop = platform_account_id; // e.g. "aura-testing.myshopify.com"

  console.log(`  🛍️  Syncing ${shop}...`);

  // STEP 3: Calculate date range
  // We fetch "today" in UTC
  // Format: "2026-02-25" → Shopify needs ISO format with time
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // "2026-02-25"

  const startOfDay = `${dateStr}T00:00:00Z`;  // midnight UTC
  const endOfDay   = `${dateStr}T23:59:59Z`;  // end of day UTC

  // STEP 4: Fetch orders from Shopify API
  // Shopify REST API: GET /admin/api/2026-01/orders.json
  // Parameters:
  //   status=any           → include all order statuses
  //   created_at_min/max  → filter by date range
  //   limit=250            → max orders per request (Shopify's max)
  const orders = await fetchShopifyOrders(
    shop,
    access_token,
    startOfDay,
    endOfDay
  );

  console.log(`     📊 Found ${orders.length} orders for ${dateStr}`);

  // STEP 5: Calculate metrics from orders
  const metrics = calculateMetrics(orders, dateStr);

  // STEP 6: Save metrics to database
  await saveMetrics(brand_id, id, metrics);

  // STEP 7: Update last_sync_at so we know when it was last synced
  await pool.query(
    `UPDATE integrations SET last_sync_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [id]
  );

  console.log(`  ✅ ${shop} synced: revenue=$${metrics.revenue}, orders=${metrics.orders}`);
};

// ─── Shopify API Fetcher ──────────────────────────────────────────────────────

/**
 * Fetches orders from Shopify REST API with pagination
 * Shopify returns max 250 orders per request
 * If store has more, we follow "next page" links
 */
const fetchShopifyOrders = async (
  shop: string,
  accessToken: string,
  createdAtMin: string,
  createdAtMax: string
): Promise<ShopifyOrder[]> => {
  const allOrders: ShopifyOrder[] = [];

  // Build the API URL
  // We only want PAID orders (not pending, not refunded)
  // financial_status=paid ensures we only count real revenue
  let url = `https://${shop}/admin/api/2026-01/orders.json` +
    `?status=any` +
    `&financial_status=paid` +
    `&created_at_min=${createdAtMin}` +
    `&created_at_max=${createdAtMax}` +
    `&limit=250` +
    `&fields=id,total_price,created_at,financial_status`;

  // Pagination loop — keep fetching until no more pages
  // WHY: A busy store might have 1000+ orders in a day
  //      Shopify only gives 250 at a time
  //      We follow "rel=next" links to get all pages
  while (url) {
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const pageOrders: ShopifyOrder[] = response.data.orders || [];
    allOrders.push(...pageOrders);  // add this page's orders to our list

    // Check if there's a next page
    // Shopify puts pagination info in the Link header
    // Example: <https://...?page_info=abc123>; rel="next"
    const linkHeader = response.headers['link'] as string | undefined;
    url = extractNextPageUrl(linkHeader);
  }

  return allOrders;
};

/**
 * Extracts the "next page" URL from Shopify's Link header
 * Returns empty string if no next page (loop stops)
 */
const extractNextPageUrl = (linkHeader: string | undefined): string => {
  if (!linkHeader) return '';

  // Link header looks like:
  // <https://store.myshopify.com/admin/api/orders.json?page_info=abc>; rel="next"
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : '';
};

// ─── Metrics Calculator ───────────────────────────────────────────────────────

interface DayMetrics {
  date: string;          // "2026-02-25"
  revenue: number;       // total revenue in dollars
  orders: number;        // number of orders
  newCustomers: number;  // first-time buyers
}

/**
 * Calculates metrics from an array of Shopify orders
 *
 * LOGIC:
 *   revenue      = sum of total_price for all orders
 *   orders       = count of all orders
 *   newCustomers = orders where customer.orders_count === 1
 *                  (this is their first ever order)
 */
const calculateMetrics = (
  orders: ShopifyOrder[],
  date: string
): DayMetrics => {
  let revenue = 0;

  for (const order of orders) {
    // Only sum revenue — no customer data needed
    revenue += parseFloat(order.total_price || '0');
  }

  return {
    date,
    revenue: Math.round(revenue * 100) / 100,
    orders: orders.length,
    newCustomers: 0,  // will add back when protected data is approved
  };
};
// ─── Database Saver ───────────────────────────────────────────────────────────

/**
 * Saves calculated metrics to the metrics table
 * Uses UPSERT (insert or update) to handle re-runs
 *
 * WHY UPSERT:
 *   If cron runs twice in one day (e.g. after a crash + restart)
 *   we don't want duplicate rows for the same date
 *   ON CONFLICT → just update the existing row with fresh data
 */
const saveMetrics = async (
  brandId: string,
  integrationId: string,
  metrics: DayMetrics
): Promise<void> => {
  const { date, revenue, orders, newCustomers } = metrics;

  // Save revenue metric
  await pool.query(
    `INSERT INTO metrics (brand_id, integration_id, date, metric_type, value, currency)
     VALUES ($1, $2, $3, 'revenue', $4, 'USD')
     ON CONFLICT (brand_id, metric_type, date)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [brandId, integrationId, date, revenue]
  );

  // Save orders metric
  await pool.query(
    `INSERT INTO metrics (brand_id, integration_id, date, metric_type, value, currency)
     VALUES ($1, $2, $3, 'orders', $4, 'USD')
     ON CONFLICT (brand_id, metric_type, date)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [brandId, integrationId, date, orders]
  );

  // Save new customers metric
  await pool.query(
    `INSERT INTO metrics (brand_id, integration_id, date, metric_type, value, currency)
     VALUES ($1, $2, $3, 'new_customers', $4, 'USD')
     ON CONFLICT (brand_id, metric_type, date)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [brandId, integrationId, date, newCustomers]
  );
};