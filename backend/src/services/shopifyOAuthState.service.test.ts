import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/database', () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from '../config/database';
import {
  consumeShopifyOAuthState,
  createShopifyOAuthState,
} from './shopifyOAuthState.service';

const queryMock = vi.mocked(pool.query);

describe('Shopify OAuth state storage', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('stores a hash instead of the browser-visible state value', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] } as never);

    const state = await createShopifyOAuthState(
      'user-id',
      'brand-id',
      'example.myshopify.com'
    );

    expect(state).not.toHaveLength(64);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO shopify_oauth_states'),
      [expect.stringMatching(/^[a-f0-9]{64}$/), 'user-id', 'brand-id', 'example.myshopify.com']
    );
  });

  it('consumes an unexpired state only once', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ brand_id: 'brand-id', shop_domain: 'example.myshopify.com' }],
      } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    await expect(consumeShopifyOAuthState('state-value')).resolves.toEqual({
      brandId: 'brand-id',
      shopDomain: 'example.myshopify.com',
    });
    await expect(consumeShopifyOAuthState('state-value')).resolves.toBeNull();

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('expires_at > NOW()'),
      [expect.stringMatching(/^[a-f0-9]{64}$/)]
    );
  });
});
