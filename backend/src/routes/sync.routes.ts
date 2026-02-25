// src/routes/sync.routes.ts
// Manual trigger endpoints for data sync
// Useful for testing and for users who want to sync on demand
//
// WHY a manual trigger?
//   The cron job runs at midnight — we can't wait that long to test
//   This lets us trigger a sync immediately via API call

import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { syncAllShopifyIntegrations } from '../services/shopify.sync';
import { catchAsync } from '../middleware/errorHandler';

const router = Router();

// POST /api/v1/sync/shopify
// Manually triggers a Shopify sync right now
// Protected: only logged-in users can trigger syncs
router.post(
  '/shopify',
  protect,
  catchAsync(async (_req: Request, res: Response) => {
    console.log('🔄 Manual Shopify sync triggered via API');

    // Run sync (this might take a few seconds for stores with many orders)
    await syncAllShopifyIntegrations();

    res.status(200).json({
      success: true,
      message: 'Shopify sync completed successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;