# Project Aura - Database Schema Design

## Overview
PostgreSQL database hosted on Supabase with optimized time-series data storage.

---

## Tables

### 1. users
**Purpose:** Store user authentication and profile information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| name | VARCHAR(100) | NULL | User's full name |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |

**Indexes:**
- `idx_users_email` on `email`

---

### 2. brands
**Purpose:** Store information about user's connected D2C brands

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique brand identifier |
| user_id | UUID | FOREIGN KEY → users(id) ON DELETE CASCADE | Owner of this brand |
| name | VARCHAR(100) | NOT NULL | Brand name |
| domain | VARCHAR(255) | NULL | Brand website domain |
| currency | VARCHAR(3) | DEFAULT 'USD' | Currency code (USD, EUR, etc.) |
| timezone | VARCHAR(50) | DEFAULT 'UTC' | Brand timezone |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Brand added timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_brands_user_id` on `user_id`

---

### 3. integrations
**Purpose:** Store OAuth credentials and connection status for third-party platforms

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique integration identifier |
| brand_id | UUID | FOREIGN KEY → brands(id) ON DELETE CASCADE | Associated brand |
| platform | VARCHAR(50) | NOT NULL | 'shopify', 'meta', 'google_ads' |
| status | VARCHAR(20) | DEFAULT 'disconnected' | 'connected', 'disconnected', 'error' |
| access_token | TEXT | NULL | Encrypted OAuth access token |
| refresh_token | TEXT | NULL | Encrypted OAuth refresh token |
| token_expires_at | TIMESTAMPTZ | NULL | Token expiration timestamp |
| platform_account_id | VARCHAR(255) | NULL | External account ID |
| platform_account_name | VARCHAR(255) | NULL | External account name |
| last_sync_at | TIMESTAMPTZ | NULL | Last successful data sync |
| metadata | JSONB | DEFAULT '{}' | Additional platform-specific data |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Integration created |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_integrations_brand_id` on `brand_id`
- `idx_integrations_platform` on `platform`
- `idx_integrations_status` on `status`

**Unique Constraint:**
- `unique_brand_platform` on `(brand_id, platform)`

---

### 4. metrics
**Purpose:** Store time-series performance metrics from all platforms

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique metric identifier |
| brand_id | UUID | FOREIGN KEY → brands(id) ON DELETE CASCADE | Associated brand |
| integration_id | UUID | FOREIGN KEY → integrations(id) ON DELETE SET NULL | Source integration |
| date | DATE | NOT NULL | Metric date (for daily aggregation) |
| metric_type | VARCHAR(50) | NOT NULL | Type of metric |
| value | NUMERIC(15,2) | NOT NULL | Metric value |
| currency | VARCHAR(3) | DEFAULT 'USD' | Currency for monetary values |
| metadata | JSONB | DEFAULT '{}' | Additional context |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record created |

**Metric Types:**
- `revenue` - Total revenue
- `orders` - Number of orders
- `ad_spend` - Total ad spend
- `impressions` - Ad impressions
- `clicks` - Ad clicks
- `conversions` - Conversion events
- `new_customers` - New customer count

**Indexes:**
- `idx_metrics_brand_date` on `(brand_id, date DESC)`
- `idx_metrics_type_date` on `(metric_type, date DESC)`
- `idx_metrics_created` on `created_at DESC`

---

### 5. insights
**Purpose:** Store auto-generated insights and alerts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique insight identifier |
| brand_id | UUID | FOREIGN KEY → brands(id) ON DELETE CASCADE | Associated brand |
| insight_type | VARCHAR(50) | NOT NULL | Type of insight |
| priority | VARCHAR(20) | DEFAULT 'medium' | 'high', 'medium', 'low' |
| title | VARCHAR(255) | NOT NULL | Short insight title |
| description | TEXT | NOT NULL | Detailed insight description |
| action_items | JSONB | DEFAULT '[]' | Recommended actions |
| related_data | JSONB | DEFAULT '{}' | Supporting data/metrics |
| is_read | BOOLEAN | DEFAULT FALSE | User has viewed |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Insight generated |
| expires_at | TIMESTAMPTZ | NULL | Insight expiration |

**Insight Types:**
- `high_cpa` - Cost per acquisition spike
- `low_roas` - Low return on ad spend
- `budget_recommendation` - Budget reallocation
- `conversion_drop` - Conversion rate decrease
- `high_performer` - Campaign performing well

**Indexes:**
- `idx_insights_brand_created` on `(brand_id, created_at DESC)`
- `idx_insights_priority` on `priority`
- `idx_insights_is_read` on `is_read`

---

## Relationships
```
users (1) ──< brands (many)
brands (1) ──< integrations (many)
brands (1) ──< metrics (many)
brands (1) ──< insights (many)
integrations (1) ──< metrics (many)
```

---

## Security

1. **Encryption:** Supabase automatic encryption at rest
2. **Token Encryption:** Using pgcrypto for OAuth tokens
3. **Row Level Security (RLS):** Users can only access their own data
4. **Password Hashing:** Bcrypt (handled in backend)

---

**Schema Version:** 1.0  
**Last Updated:** 2025-02-09
