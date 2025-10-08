-- FIX: Duplicate Stripe Customer Issue
-- Context: User 4253ed6b-0e53-4187-ac30-7731744189e4 changed from monthly → quarterly
-- This created a NEW Stripe customer instead of reusing the existing one
-- 
-- Old Customer: cus_T9JS9ijxFYidt2 (subscription: sub_1SD0qERlgtyeCF3BY44417HH - monthly)
-- New Customer: cus_TBgMH9MKtLLTij (subscription: sub_1SFbag4Zvo5TTGdYmYREu9Ni - quarterly)
--
-- Goal: Update DB to reflect correct current state with new quarterly subscription
-- NOTE: Using "cancelled" column for soft delete (keeps history)

BEGIN;

-- 1. Mark old monthly subscription as cancelled (soft delete)
UPDATE subscriptions
SET 
  cancelled = true,
  status = 'canceled',
  cancel_at_period_end = false,
  canceled_at = NOW(),
  updated_at = NOW()
WHERE stripe_subscription_id = 'sub_1SD0qERlgtyeCF3BY44417HH'
  AND user_id = '4253ed6b-0e53-4187-ac30-7731744189e4';

-- 2. Insert new quarterly subscription (or update if exists)
INSERT INTO subscriptions (
  id,
  user_id,
  plan_id,
  stripe_subscription_id,
  stripe_customer_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  quantity,
  discount_amount,
  tax_amount,
  total_amount,
  metadata,
  cancelled,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '4253ed6b-0e53-4187-ac30-7731744189e4',
  'bec281a0-b575-4e8b-89a4-97aaca824ccf', -- Quarterly plan ID
  'sub_1SFbag4Zvo5TTGdYmYREu9Ni',
  'cus_TBgMH9MKtLLTij', -- NEW customer ID
  'active',
  NOW(),
  NOW() + INTERVAL '3 months',
  false,
  1,
  0.00,
  0.00,
  299.99, -- Quarterly price (adjust if different)
  '{}',
  false, -- Active subscription (not cancelled)
  NOW(),
  NOW()
)
ON CONFLICT (stripe_subscription_id) 
DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  status = EXCLUDED.status,
  total_amount = EXCLUDED.total_amount,
  current_period_end = EXCLUDED.current_period_end,
  cancelled = EXCLUDED.cancelled,
  updated_at = NOW();

COMMIT;

-- Verification queries (run after commit)
-- SELECT stripe_subscription_id, stripe_customer_id, status, cancelled, plan_id, total_amount 
-- FROM subscriptions 
-- WHERE user_id = '4253ed6b-0e53-4187-ac30-7731744189e4'
-- ORDER BY created_at DESC;
