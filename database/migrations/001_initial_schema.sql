-- ============================================
-- Project Aura - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Created: 2025-02-09
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE INDEX idx_users_email ON users(email);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: brands
-- ============================================
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  domain VARCHAR(255),
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_brands_user_id ON brands(user_id);

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: integrations
-- ============================================
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('shopify', 'meta', 'google_ads')),
  status VARCHAR(20) DEFAULT 'disconnected' NOT NULL CHECK (status IN ('connected', 'disconnected', 'error')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  platform_account_id VARCHAR(255),
  platform_account_name VARCHAR(255),
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_brand_platform UNIQUE (brand_id, platform)
);

CREATE INDEX idx_integrations_brand_id ON integrations(brand_id);
CREATE INDEX idx_integrations_platform ON integrations(platform);
CREATE INDEX idx_integrations_status ON integrations(status);

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: metrics
-- ============================================
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
    'revenue', 'orders', 'ad_spend', 'impressions',
    'clicks', 'conversions', 'new_customers'
  )),
  value NUMERIC(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_metrics_brand_date ON metrics(brand_id, date DESC);
CREATE INDEX idx_metrics_type_date ON metrics(metric_type, date DESC);
CREATE INDEX idx_metrics_created ON metrics(created_at DESC);
CREATE INDEX idx_metrics_brand_type_date ON metrics(brand_id, metric_type, date DESC);

-- ============================================
-- TABLE: insights
-- ============================================
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
    'high_cpa', 'low_roas', 'budget_recommendation',
    'conversion_drop', 'high_performer'
  )),
  priority VARCHAR(20) DEFAULT 'medium' NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  action_items JSONB DEFAULT '[]' NOT NULL,
  related_data JSONB DEFAULT '{}' NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_insights_brand_created ON insights(brand_id, created_at DESC);
CREATE INDEX idx_insights_priority ON insights(priority);
CREATE INDEX idx_insights_is_read ON insights(is_read);
CREATE INDEX idx_insights_brand_unread ON insights(brand_id, is_read, created_at DESC)
  WHERE is_read = FALSE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created separately in Supabase dashboard
-- as they require auth.uid() which is Supabase-specific