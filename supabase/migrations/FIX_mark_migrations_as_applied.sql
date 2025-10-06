-- Fix: Mark existing migration as applied to unblock new migrations
-- This resolves the conflict where 20251004 migration is partially applied

-- 1. Check current migration status
SELECT version, name 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 10;

-- 2. Mark the cancellation migration as applied (if not already)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20251004', 'booking_cancellation_and_reports')
ON CONFLICT (version) DO NOTHING;

-- 3. Verify it was inserted
SELECT version, name 
FROM supabase_migrations.schema_migrations 
WHERE version >= '20251004'
ORDER BY version;

-- Now you can run: supabase db push --linked
-- And it will skip 20251004 and apply only the credit migrations
