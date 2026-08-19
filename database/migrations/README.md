# Project Aura Database Migrations

Migrations are ordered SQL files. Run them by number so a new database reaches the same schema as Aura's backend expects.

## Migration order

1. `001_initial_schema.sql` creates a new Aura schema.
2. `002_align_schema_with_backend.sql` adds the metric upsert support and current insight-type constraint.
3. `003_add_shopify_oauth_states.sql` adds one-time, short-lived state storage for Shopify OAuth.

Do not edit a migration after it has been applied to any shared environment. Create the next numbered file for a future schema change.

## Apply with the Supabase SQL Editor

### Existing Aura database

1. In Supabase, open the Aura project.
2. Open **SQL Editor** and create a new query.
3. Run this read-only preflight query first:

   ```sql
   SELECT brand_id, metric_type, date, COUNT(*) AS row_count
   FROM metrics
   GROUP BY brand_id, metric_type, date
   HAVING COUNT(*) > 1;
   ```

4. If it returns rows, stop. Do not delete or merge data until a duplicate-resolution plan is reviewed.
5. If it returns no rows, copy the complete contents of `002_align_schema_with_backend.sql` into a new SQL Editor query and run it once.
6. Copy the complete contents of `003_add_shopify_oauth_states.sql` into a new SQL Editor query and run it once.
7. Run the verification queries below.

### New empty database

1. In Supabase, open **SQL Editor**.
2. Run `001_initial_schema.sql` once.
3. Run `002_align_schema_with_backend.sql` once.
4. Run `003_add_shopify_oauth_states.sql` once.
5. Run the verification queries below.

## Verification queries

```sql
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'metrics'
  AND column_name = 'updated_at';

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'metrics'::regclass
  AND contype = 'u';

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'insights'::regclass
  AND conname = 'insights_insight_type_check';

SELECT relrowsecurity
FROM pg_class
WHERE oid = 'shopify_oauth_states'::regclass;
```

The first query should show a non-null `updated_at` column with a `now()` default. The second should show the unique metric rule. The third should show the updated insight-type check. The final query should return `true` for RLS on the OAuth-state table.

## Security rules

- Back up or use Supabase's database backup tools before production schema work.
- For Aura's logical backup, verification, and local restore procedure, read `docs/12_DATABASE_BACKUP_AND_RESTORE.md` before production schema work.
- Never paste a database connection string, password, token, or other secret into Git, documentation, chat, or a screenshot.
- Apply schema changes in a preview or disposable database before production whenever possible.
- These files do not encrypt existing OAuth tokens or create Supabase RLS policies. Those are separate security tasks.
