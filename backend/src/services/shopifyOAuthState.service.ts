import crypto from 'crypto';
import { pool } from '../config/database';

export interface ConsumedShopifyOAuthState {
  brandId: string;
  shopDomain: string;
}

const hashState = (state: string): string => {
  return crypto.createHash('sha256').update(state).digest('hex');
};

export const createShopifyOAuthState = async (
  userId: string,
  brandId: string,
  shopDomain: string
): Promise<string> => {
  const state = crypto.randomBytes(32).toString('base64url');
  const stateHash = hashState(state);

  await pool.query(
    `INSERT INTO shopify_oauth_states (
      state_hash,
      user_id,
      brand_id,
      shop_domain,
      expires_at
    ) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes')`,
    [stateHash, userId, brandId, shopDomain]
  );

  return state;
};

export const consumeShopifyOAuthState = async (
  state: string
): Promise<ConsumedShopifyOAuthState | null> => {
  const stateHash = hashState(state);
  const result = await pool.query<{
    brand_id: string;
    shop_domain: string;
  }>(
    `DELETE FROM shopify_oauth_states
     WHERE state_hash = $1
       AND expires_at > NOW()
     RETURNING brand_id, shop_domain`,
    [stateHash]
  );

  const storedState = result.rows[0];

  if (!storedState) {
    return null;
  }

  return {
    brandId: storedState.brand_id,
    shopDomain: storedState.shop_domain,
  };
};
