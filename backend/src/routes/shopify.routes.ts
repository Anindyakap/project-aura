// src/routes/shopify.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/auth';
import {
  connectShopify,
  shopifyCallback,
  getShopifyStatus,
  disconnectShopify,
} from '../controllers/shopify.controller';
import { verifyToken, extractTokenFromHeader } from '../utils/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Special middleware: accepts token from query param OR Authorization header
// This is needed because the connect route is a browser redirect (can't send headers)
const flexibleAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Try query param first (browser redirect flow)
    const queryToken = req.query.token as string;
    // Then try Authorization header (normal API call flow)  
    const headerToken = extractTokenFromHeader(req.headers.authorization);

    const token = queryToken || headerToken;

    if (!token) {
      throw new AppError('No token provided. Please login.', 401);
    }

    // Verify and attach user to request (same as protect middleware)
    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(new AppError('Authentication failed', 401));
  }
};

// Connect: uses flexibleAuth (browser redirect needs token in query param)
router.get('/connect', flexibleAuth, connectShopify);

// Callback: public, Shopify calls this
router.get('/callback', shopifyCallback);

// Status & disconnect: normal protected routes
router.get('/status', protect, getShopifyStatus);
router.delete('/disconnect', protect, disconnectShopify);

export default router;