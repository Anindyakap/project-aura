-- ============================================
-- Project Aura - Align schema with backend SQL
-- Migration: 002_align_schema_with_backend.sql
-- ============================================

BEGIN;

-- Stop safely instead of deleting data if duplicate daily metrics already exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM metrics
    GROUP BY brand_id, metric_type, date
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add the metrics uniqueness rule because duplicate daily metrics exist.';
  END IF;
END
$$;

-- The backend updates this timestamp during metric upserts.
ALTER TABLE metrics
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE metrics
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE metrics
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

-- Add the automatic timestamp trigger if this database does not already have it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_metrics_updated_at'
      AND tgrelid = 'metrics'::regclass
  ) THEN
    EXECUTE '
      CREATE TRIGGER update_metrics_updated_at
      BEFORE UPDATE ON metrics
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    ';
  END IF;
END
$$;

-- This rule makes ON CONFLICT (brand_id, metric_type, date) valid.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'metrics'::regclass
      AND contype = 'u'
      AND conkey::smallint[] = ARRAY[
        (SELECT attnum FROM pg_attribute
         WHERE attrelid = 'metrics'::regclass AND attname = 'brand_id'),
        (SELECT attnum FROM pg_attribute
         WHERE attrelid = 'metrics'::regclass AND attname = 'metric_type'),
        (SELECT attnum FROM pg_attribute
         WHERE attrelid = 'metrics'::regclass AND attname = 'date')
      ]::smallint[]
  ) THEN
    EXECUTE '
      ALTER TABLE metrics
      ADD CONSTRAINT unique_brand_metric_type_date
      UNIQUE (brand_id, metric_type, date)
    ';
  END IF;
END
$$;

-- Support current engine types while retaining types accepted by the initial schema.
ALTER TABLE insights
  DROP CONSTRAINT IF EXISTS insights_insight_type_check;

ALTER TABLE insights
  ADD CONSTRAINT insights_insight_type_check
  CHECK (
    insight_type IN (
      'high_cpa',
      'low_roas',
      'budget_recommendation',
      'conversion_drop',
      'high_performer',
      'revenue_drop',
      'order_drop',
      'aov_opportunity',
      'acquisition_drop',
      'weekly_summary'
    )
  );

COMMIT;
