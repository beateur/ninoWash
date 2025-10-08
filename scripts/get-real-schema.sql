-- ============================================================================
-- SCRIPT: Get Real Database Schema (SOURCE OF TRUTH)
-- ============================================================================
-- Purpose: Extract complete database schema from live Supabase instance
-- Usage: Copy to Supabase SQL Editor and execute to get current schema
-- ⚠️  This is the ONLY reliable source of truth for database structure
-- ============================================================================

-- 1. Get all tables in public schema
SELECT 
  'TABLE' AS object_type,
  table_name,
  NULL AS column_name,
  NULL AS data_type,
  NULL AS is_nullable,
  NULL AS column_default
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'

UNION ALL

-- 2. Get all columns for public schema tables
SELECT 
  'COLUMN' AS object_type,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY object_type DESC, table_name, column_name;

-- ============================================================================
-- 3. Get foreign key relationships
-- ============================================================================
SELECT
  tc.table_name AS "From Table", 
  kcu.column_name AS "From Column",
  ccu.table_name AS "To Table (References)",
  ccu.column_name AS "To Column (References)"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 4. Get indexes
-- ============================================================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- QUICK REFERENCE QUERIES (Copy individually as needed)
-- ============================================================================

-- Check specific table structure:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'subscriptions'
-- ORDER BY ordinal_position;

-- Check if column exists:
-- SELECT EXISTS (
--   SELECT 1 FROM information_schema.columns
--   WHERE table_schema = 'public' 
--     AND table_name = 'subscriptions'
--     AND column_name = 'plan_id'
-- );

-- List all tables:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;
