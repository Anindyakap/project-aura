// src/controllers/shopify.controller.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { pool } from '../config/database';
import { AppError, catchAsync } from '../middleware/errorHandler';

// ─── Config ──────────────────────────────────────────────────────────────────
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

// Permissions we need from the merchant's Shopify store
const SCOPES = 'read_orders,read_products,read_analytics,read_all_orders';

// ─── CONNECT ─────────────────────────────────────────────────────────────────
// GET /api/v1/integrations/shopify/connect?shop=xxx.myshopify.com&brandId=xxx
// Protected: requires JWT. Redirects user to Shopify OAuth screen.
export const connectShopify = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const shop = req.query.shop as string;
    const brandId = req.query.brandId as string;

    // Validate shop format
    if (!shop || !shop.endsWith('.myshopify.com')) {
      throw new AppError('Invalid shop. Must be: yourstore.myshopify.com', 400);
    }

    // Validate brandId provided
    if (!brandId) {
      throw new AppError('brandId is required', 400);
    }

    // Verify this brand belongs to the logged-in user
    const brandCheck = await pool.query(
      'SELECT id FROM brands WHERE id = $1 AND user_id = $2',
      [brandId, req.user!.userId]
    );

    if (brandCheck.rows.length === 0) {
      throw new AppError('Brand not found or access denied', 403);
    }

    // Encode brandId inside state so we can retrieve it on callback
    // state = randomNonce:brandId  (colon-separated)
    const nonce = crypto.randomBytes(16).toString('hex');
    const state = `${nonce}:${brandId}`;

    // Store state in a short-lived cookie for CSRF protection
    res.cookie('shopify_oauth_state', state, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Build Shopify's OAuth approval URL
    const authUrl =
      `https://${shop}/admin/oauth/authorize` +
      `?client_id=${CLIENT_ID}` +
      `&scope=${SCOPES}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&state=${encodeURIComponent(state)}`;

    res.redirect(authUrl);
  }
);

// ─── CALLBACK ────────────────────────────────────────────────────────────────
// GET /api/v1/integrations/shopify/callback
// Public: Shopify redirects here after merchant approves. No JWT available.
export const shopifyCallback = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const { shop, code, state, hmac } = req.query as Record<string, string>;

  // 1. Verify state matches cookie (CSRF protection)
  const savedState = req.cookies?.shopify_oauth_state;
  if (!state || !savedState || state !== savedState) {
    return res.redirect(`${FRONTEND_URL}/dashboard?shopify=error&reason=state_mismatch`);
  }

  // 2. Extract brandId from state (format: "nonce:brandId")
  const brandId = state.split(':')[1];
  if (!brandId) {
    return res.redirect(`${FRONTEND_URL}/dashboard?shopify=error&reason=missing_brand`);
  }

  // 3. Verify HMAC signature — proves this request genuinely came from Shopify
  const params = Object.entries(req.query)
    .filter(([key]) => key !== 'hmac')      // exclude hmac itself
    .sort(([a], [b]) => a.localeCompare(b)) // sort alphabetically
    .map(([key, val]) => `${key}=${val}`)
    .join('&');

  const expectedHmac = crypto
    .createHmac('sha256', CLIENT_SECRET)
    .update(params)
    .digest('hex');

  if (expectedHmac !== hmac) {
    return res.redirect(`${FRONTEND_URL}/dashboard?shopify=error&reason=invalid_hmac`);
  }

  try {
    // 4. Exchange temporary code for a permanent access token
    const tokenRes = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }
    );
    const accessToken: string = tokenRes.data.access_token;

    // 5. Fetch basic shop info to confirm token works
    const shopRes = await axios.get(
      `https://${shop}/admin/api/2026-01/shop.json`,
      { headers: { 'X-Shopify-Access-Token': accessToken } }
    );
    const shopData = shopRes.data.shop;

    // 6. Upsert integration into database
    // ON CONFLICT handles reconnections (user connects same store again)
    await pool.query(
      `INSERT INTO integrations (
        brand_id, platform, status,
        access_token, platform_account_id,
        platform_account_name, metadata
      ) VALUES ($1, 'shopify', 'connected', $2, $3, $4, $5)
      ON CONFLICT (brand_id, platform)
      DO UPDATE SET
        status = 'connected',
        access_token = EXCLUDED.access_token,
        platform_account_id = EXCLUDED.platform_account_id,
        platform_account_name = EXCLUDED.platform_account_name,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()`,
      [
        brandId,
        accessToken,
        shop,                          // platform_account_id = shop domain
        shopData.name,                 // platform_account_name = store name
        JSON.stringify({               // metadata = extra shop details
          email: shopData.email,
          currency: shopData.currency,
          timezone: shopData.iana_timezone,
          country: shopData.country_name,
        }),
      ]
    );

    console.log(`✅ Shopify connected: ${shopData.name} (${shop}) → brand ${brandId}`);

    // 7. Redirect back to frontend with success
    res.redirect(
      `${FRONTEND_URL}/dashboard/integrations?shopify=connected&shop=${encodeURIComponent(shop)}`
    );
  } catch (error: any) {
    console.error('❌ Shopify OAuth error:', error.message);
    res.redirect(`${FRONTEND_URL}/dashboard?shopify=error&reason=token_exchange_failed`);
  }
};

// ─── STATUS ──────────────────────────────────────────────────────────────────
// GET /api/v1/integrations/shopify/status?brandId=xxx
// Protected: returns Shopify connection status for a brand
export const getShopifyStatus = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const brandId = req.query.brandId as string;

    if (!brandId) {
      throw new AppError('brandId is required', 400);
    }

    // Verify brand belongs to logged-in user
    const brandCheck = await pool.query(
      'SELECT id FROM brands WHERE id = $1 AND user_id = $2',
      [brandId, req.user!.userId]
    );

    if (brandCheck.rows.length === 0) {
      throw new AppError('Brand not found or access denied', 403);
    }

    // Fetch integration record (never expose access_token to frontend)
    const result = await pool.query(
      `SELECT 
        id, platform, status,
        platform_account_id, platform_account_name,
        last_sync_at, metadata, created_at, updated_at
       FROM integrations
       WHERE brand_id = $1 AND platform = 'shopify'`,
      [brandId]
    );

    if (result.rows.length === 0) {
      res.status(200).json({ success: true, data: { connected: false } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        connected: result.rows[0].status === 'connected',
        integration: result.rows[0],
      },
    });
  }
);

// ─── DISCONNECT ──────────────────────────────────────────────────────────────
// DELETE /api/v1/integrations/shopify/disconnect
// Protected: marks integration as disconnected
export const disconnectShopify = catchAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { brandId } = req.body;

    if (!brandId) {
      throw new AppError('brandId is required', 400);
    }

    // Verify brand belongs to logged-in user
    const brandCheck = await pool.query(
      'SELECT id FROM brands WHERE id = $1 AND user_id = $2',
      [brandId, req.user!.userId]
    );

    if (brandCheck.rows.length === 0) {
      throw new AppError('Brand not found or access denied', 403);
    }

    await pool.query(
      `UPDATE integrations 
       SET status = 'disconnected', updated_at = NOW()
       WHERE brand_id = $1 AND platform = 'shopify'`,
      [brandId]
    );

    res.status(200).json({
      success: true,
      message: 'Shopify disconnected successfully',
    });
  }
);