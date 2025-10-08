-- ============================================================================
-- DIAGNOSTIC: Subscription Credits Issue
-- ============================================================================
-- Date: 2025-10-06
-- Issue: User with active monthly subscription has "Aucun crédit disponible"
-- Method: Query LIVE database to verify actual schema and data
-- ============================================================================

-- STEP 1: Verify 'subscriptions' table structure (CRITICAL - Check schema first!)
-- ============================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Expected columns to look for:
-- - plan_id (UUID, FK to subscription_plans)
-- - user_id (UUID)
-- - status (TEXT)
-- - stripe_subscription_id (TEXT)
-- - current_period_start, current_period_end (TIMESTAMPTZ)

-- ============================================================================
-- STEP 2: Verify 'subscription_plans' table structure
-- ============================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- Expected columns:
-- - id (UUID, PRIMARY KEY)
-- - name (TEXT)
-- - credits_per_period (INTEGER)
-- - billing_period (TEXT: 'monthly', 'quarterly', etc.)
-- - is_active (BOOLEAN)

-- ============================================================================
-- STEP 3: Verify 'subscription_credits' table structure
-- ============================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscription_credits'
ORDER BY ordinal_position;

-- Expected columns:
-- - user_id (UUID)
-- - credits_remaining (INTEGER)
-- - credits_allocated (INTEGER)
-- - last_reset_at (TIMESTAMPTZ)

-- ============================================================================
-- STEP 4: Check user's active subscription (using VERIFIED columns)
-- ============================================================================
-- ⚠️ REPLACE 'USER_EMAIL_HERE' with actual user email
SELECT 
  s.id AS subscription_id,
  s.user_id,
  s.status,
  s.stripe_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.created_at,
  -- Get plan details via JOIN (verify FK relationship exists)
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.credits_per_period,
  sp.billing_period
FROM subscriptions s
LEFT JOIN subscription_plans sp 
  ON s.plan_id = sp.id  -- ⚠️ Verify this FK exists in STEP 1!
WHERE s.user_id IN (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
)
ORDER BY s.created_at DESC
LIMIT 1;

-- ============================================================================
-- STEP 5: Check user's credit state
-- ============================================================================
SELECT 
  sc.user_id,
  sc.credits_remaining,
  sc.credits_allocated,
  sc.last_reset_at,
  sc.created_at,
  sc.updated_at
FROM subscription_credits sc
WHERE sc.user_id IN (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
);

-- Possible outcomes:
-- - No rows = Credit record never created (BUG!)
-- - credits_remaining = 0 = Credits exhausted or never allocated
-- - last_reset_at = NULL = Never reset (cron job never ran)

-- ============================================================================
-- STEP 6: Check cron job configuration
-- ============================================================================
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname LIKE '%credit%' OR jobname LIKE '%reset%';

-- Look for:
-- - jobname = 'reset-weekly-credits' or similar
-- - schedule = '0 0 * * 1' (Mondays at 00:00 UTC)
-- - active = true
-- - command should contain HTTP POST to Edge Function

-- ============================================================================
-- STEP 7: Check cron job execution history
-- ============================================================================
SELECT 
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job 
  WHERE jobname LIKE '%credit%' OR jobname LIKE '%reset%'
)
ORDER BY start_time DESC
LIMIT 10;

-- Check for:
-- - status = 'failed' (cron job errors)
-- - return_message (error details)
-- - Recent runs (should have run Monday 00:00 UTC)

-- ============================================================================
-- STEP 8: Check credit reset logs (if table exists)
-- ============================================================================
-- First verify table exists:
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_name = 'credit_reset_logs'
) AS table_exists;

-- If exists, query logs:
SELECT 
  id,
  user_id,
  credits_before,
  credits_after,
  status,
  error_message,
  created_at
FROM credit_reset_logs
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- STEP 9: Check if credits were consumed by bookings
-- ============================================================================
SELECT 
  b.id AS booking_id,
  b.booking_number,
  b.user_id,
  b.service_id,
  b.status,
  b.used_subscription_credit,
  b.total_weight_kg,
  b.created_at,
  b.pickup_date
FROM bookings b
WHERE b.user_id IN (
  SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE'
)
  AND b.used_subscription_credit = true
ORDER BY b.created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 10: Check all active subscription plans
-- ============================================================================
SELECT 
  id,
  name,
  description,
  credits_per_period,
  billing_period,
  price_amount,
  price_currency,
  stripe_price_id,
  is_active,
  is_public
FROM subscription_plans
WHERE is_active = true
ORDER BY name;

-- ============================================================================
-- ANALYSIS CHECKLIST
-- ============================================================================
-- After running all queries, check:
--
-- [ ] subscriptions table has 'plan_id' column (NOT 'plan_type')
-- [ ] User has active subscription with status='active'
-- [ ] Foreign key s.plan_id -> sp.id works correctly
-- [ ] subscription_credits record exists for user
-- [ ] credits_remaining = 0 or NULL (problem!)
-- [ ] credits_allocated matches plan's credits_per_period
-- [ ] last_reset_at is NULL or too old (problem!)
-- [ ] Cron job exists and is active=true
-- [ ] Cron job has recent execution (Monday 00:00 UTC)
-- [ ] No failed executions in cron.job_run_details
-- [ ] credit_reset_logs shows successful resets
--
-- Common Root Causes:
-- 1. Missing subscription_credits record (never created on subscription start)
-- 2. Cron job not configured (placeholders not replaced)
-- 3. Cron job failing silently (check return_message)
-- 4. Edge Function not deployed or failing
-- 5. Incorrect plan_id FK relationship
-- ============================================================================
