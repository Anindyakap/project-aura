# Database Backup and Restoration Procedure

## Purpose

This guide explains how to create a safe logical backup of Aura's Supabase
database and how to practice a restore without overwriting the live database.

A backup may contain user data, password hashes, OAuth tokens, and business
metrics. Treat every backup file as confidential.

## Which backup method Aura uses

Aura currently uses the Supabase Free plan. Free-plan projects do not include
downloadable automatic dashboard backups, so Aura uses logical exports created
with the Supabase CLI.

This procedure creates two required files:

| File | Purpose |
|---|---|
| `schema.sql` | Tables, columns, indexes, constraints, functions, and policies. |
| `data.sql` | The rows stored in the database. |

The optional `--role-only` export is not part of Aura's routine backup. Aura
has no tracked custom database roles, and the managed Supabase role used by the
CLI may not have permission to create the temporary login role that export
requires.

## Before starting

1. Ensure Docker Desktop is running.
2. Use the Supabase connection string from Dashboard **Connect** and choose the
   Session pooler connection when it is available.
3. If the database password contains special URL characters, percent-encode it
   in the connection string before using the CLI.
4. Create a dated backup folder outside the Aura repository:

   ```powershell
   $backupFolder = 'C:\Users\Angela\coding-projects\AuraBackups\2026-08-04'
   New-Item -ItemType Directory -Force -Path $backupFolder
   ```

Never place a backup inside `project-aura`, commit one to Git, or share one in
chat, email, or a screenshot.

## Create a logical backup

From the Aura repository root, run these commands with your private,
percent-encoded Session pooler connection string. Replace the placeholder only
in your terminal; never place the real value in this document.

```powershell
npx.cmd supabase db dump `
  --db-url '<PERCENT_ENCODED_SESSION_POOLER_CONNECTION_STRING>' `
  -f "$backupFolder\schema.sql"

npx.cmd supabase db dump `
  --db-url '<PERCENT_ENCODED_SESSION_POOLER_CONNECTION_STRING>' `
  -f "$backupFolder\data.sql" `
  --use-copy `
  --data-only `
  -x storage.buckets_vectors `
  -x storage.vector_indexes
```

Supabase Storage objects are separate from database rows. These database files
do not back up files uploaded through the Storage API.

## Verify the backup

Check that both files exist and have a size greater than zero:

```powershell
Get-ChildItem "$backupFolder\schema.sql", "$backupFolder\data.sql" |
  Select-Object Name, Length, LastWriteTime
```

Create a SHA-256 fingerprint for each file:

```powershell
Get-FileHash "$backupFolder\schema.sql", "$backupFolder\data.sql"
```

Store the backup folder and its fingerprints in encrypted storage outside the
repository. Matching fingerprints confirm that a copied backup file is
identical; they do not prove that the backup can be restored.

## Practice restoration locally first

Never run a restore against the live Supabase database as a first attempt.

Install PostgreSQL's `psql` command-line tool before restoring. With local
Supabase running in Docker, create a disposable local database:

```powershell
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" `
  --command "CREATE DATABASE aura_restore_test;"
```

Restore the schema first, then the data:

```powershell
psql --single-transaction --set ON_ERROR_STOP=1 `
  --file "$backupFolder\schema.sql" `
  --dbname "postgresql://postgres:postgres@127.0.0.1:54322/aura_restore_test"

psql --single-transaction --set ON_ERROR_STOP=1 `
  --file "$backupFolder\data.sql" `
  --dbname "postgresql://postgres:postgres@127.0.0.1:54322/aura_restore_test"
```

Only delete `aura_restore_test` after confirming it is the disposable local
database and after the restore verification is complete.

## Verify the restored database

Connect to `aura_restore_test` and run:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'brands', 'integrations', 'metrics', 'insights')
ORDER BY table_name;

SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'brands', COUNT(*) FROM brands
UNION ALL
SELECT 'integrations', COUNT(*) FROM integrations
UNION ALL
SELECT 'metrics', COUNT(*) FROM metrics
UNION ALL
SELECT 'insights', COUNT(*) FROM insights;
```

The first query should return Aura's five main tables. The second shows counts
only and does not display confidential row contents.

## If production data must be restored

Stop and create a separate, written restoration plan first. A production
restore can cause downtime and replace newer data with older data.

For paid Supabase plans, use the Supabase Dashboard backup and restore tools.
For a manual logical restore, restore into a new test project first and verify
the result before making any production decision.

## Regular schedule

- Before every production schema change: create and verify a new backup.
- While Aura is actively developed: create a backup at least weekly.
- After a successful restore practice: record the date and result outside Git.
