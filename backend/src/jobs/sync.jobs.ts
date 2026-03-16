// src/jobs/sync.jobs.ts
// Schedules automated data sync jobs using node-cron
//
// CRON SYNTAX EXPLAINED:
//   '0 0 * * *'  = "at 00:00 (midnight) every day"
//    │ │ │ │ │
//    │ │ │ │ └── day of week (0-7, * = every day)
//    │ │ │ └──── month (* = every month)
//    │ │ └────── day of month (* = every day)
//    │ └──────── hour (0 = midnight)
//    └────────── minute (0 = on the hour)

import cron from 'node-cron';
import { syncAllShopifyIntegrations } from '../services/shopify.sync';
import { runInsightsEngine } from '../services/insights.engine';

/**
 * Registers all scheduled jobs
 * Called once from server.ts when the server starts
 */
export const registerSyncJobs = (): void => {
  console.log('⏰ Registering sync jobs...');

  // ── Daily Shopify Sync ──────────────────────────────────────────────────────
  // Runs every day at midnight UTC
  // Fetches today's orders from all connected Shopify stores
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ [CRON] Daily sync triggered at', new Date().toISOString());
    try {
      await syncAllShopifyIntegrations();
      // Run insights engine after data is fresh
      await runInsightsEngine();
    } catch (error: any) {
      console.error('❌ [CRON] Daily job failed:', error.message);
    }
  }, { timezone: 'UTC' });

  console.log('✅ Sync jobs registered: Shopify daily sync at 00:00 UTC');
};  