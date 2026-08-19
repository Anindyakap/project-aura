-- ============================================
-- Project Aura - Shopify OAuth state storage
-- Migration: 003_add_shopify_oauth_states.sql
-- ============================================

BEGIN;

-- Store only a SHA-256 hash of the browser-visible OAuth state value.
-- Each record can be consumed once by Shopify's callback and expires after 10 minutes.
CREATE TABLE IF NOT EXISTS shopify_oauth_states (
  state_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  shop_domain VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_expires_at
  ON shopify_oauth_states (expires_at);

ALTER TABLE shopify_oauth_states ENABLE ROW LEVEL SECURITY;

COMMIT;
