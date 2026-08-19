// src/routes/shopify.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  connectShopify,
  shopifyCallback,
  getShopifyStatus,
  disconnectShopify,
} from '../controllers/shopify.controller';
import { validate } from '../middleware/validate';
import {
  brandIdQuerySchema,
  shopifyConnectSchema,
  shopifyDisconnectSchema,
} from '../utils/validation';

const router = Router();

// The same-origin frontend proxy adds the Authorization header server-side.
router.post('/connect', protect, validate(shopifyConnectSchema), connectShopify);

// Callback: public, Shopify calls this
router.get('/callback', shopifyCallback);

// Status & disconnect: normal protected routes
router.get('/status', protect, validate(brandIdQuerySchema), getShopifyStatus);
router.delete('/disconnect', protect, validate(shopifyDisconnectSchema), disconnectShopify);

export default router;
