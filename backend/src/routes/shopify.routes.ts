// src/routes/shopify.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  connectShopify,
  shopifyCallback,
  getShopifyStatus,
  disconnectShopify,
} from '../controllers/shopify.controller';

const router = Router();

// Protected routes (require JWT)
router.get('/connect', protect, connectShopify);
router.get('/status', protect, getShopifyStatus);
router.delete('/disconnect', protect, disconnectShopify);

// Public route — Shopify calls this, no JWT available
router.get('/callback', shopifyCallback);

export default router;