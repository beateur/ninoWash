-- =====================================================
-- Script: Update Subscription Plans
-- Description: Replace old subscription plans with new ones aligned with services page
-- Date: 2025-09-30
-- =====================================================

BEGIN;

-- =====================================================
-- Step 0: Update billing_interval constraint to include 'quarterly'
-- =====================================================

-- Adding 'quarterly' to the billing_interval CHECK constraint
ALTER TABLE subscription_plans 
DROP CONSTRAINT IF EXISTS subscription_plans_billing_interval_check;

ALTER TABLE subscription_plans 
ADD CONSTRAINT subscription_plans_billing_interval_check 
CHECK (billing_interval IN ('monthly', 'yearly', 'quarterly', 'one_time', 'usage_based'));

RAISE NOTICE 'Updated billing_interval constraint to include quarterly';

-- =====================================================
-- Step 1: Deactivate old subscription plans (soft delete)
-- =====================================================

UPDATE subscription_plans
SET 
  is_active = false,
  is_public = false,
  updated_at = NOW()
WHERE name IN ('Free', 'Starter', 'Professional', 'Enterprise');

-- Log the deactivation
DO $$
BEGIN
  RAISE NOTICE 'Deactivated % old subscription plans', 
    (SELECT COUNT(*) FROM subscription_plans WHERE is_active = false);
END $$;

-- =====================================================
-- Step 2: Create new subscription plans
-- =====================================================

-- Removed ON CONFLICT clause that was causing errors due to missing UNIQUE constraint

-- Monthly Subscription Plan (99.99 EUR)
INSERT INTO subscription_plans (
  name,
  description,
  plan_type,
  billing_interval,
  price_amount,
  currency,
  trial_days,
  features,
  is_active,
  is_public,
  sort_order,
  metadata
) VALUES (
  'Abonnement Mensuel',
  'Pour un pressing régulier et économique',
  'premium', -- Changed from 'monthly' to 'premium' to match CHECK constraint
  'monthly',
  99.99,
  'EUR',
  0,
  jsonb_build_array(
    '2 collectes par semaine',
    'Collecte et livraison illimitées',
    'Priorité sur les créneaux',
    'Tarifs préférentiels',
    'Service client dédié',
    '1 collecte gratuite après 10 commandes'
  ),
  true,
  true,
  1,
  jsonb_build_object(
    'collections_per_week', 2,
    'priority_booking', true,
    'dedicated_support', true,
    'loyalty_bonus', '1 collecte gratuite après 10 commandes'
  )
);

-- Quarterly Subscription Plan (249.99 EUR)
INSERT INTO subscription_plans (
  name,
  description,
  plan_type,
  billing_interval,
  price_amount,
  currency,
  trial_days,
  features,
  is_active,
  is_public,
  sort_order,
  metadata
) VALUES (
  'Abonnement Trimestriel',
  'La solution la plus avantageuse',
  'premium', -- Changed from 'quarterly' to 'premium' to match CHECK constraint
  'quarterly',
  249.99,
  'EUR',
  0,
  jsonb_build_array(
    '3 collectes par semaine',
    'Collecte et livraison illimitées',
    'Priorité absolue',
    'Tarifs préférentiels maximaux',
    'Service client premium',
    '1 collecte gratuite après 10 commandes',
    'Stockage gratuit 7 jours'
  ),
  true,
  true,
  2,
  jsonb_build_object(
    'collections_per_week', 3,
    'priority_booking', 'absolute',
    'premium_support', true,
    'loyalty_bonus', '1 collecte gratuite après 10 commandes',
    'free_storage_days', 7
  )
);

-- =====================================================
-- Step 3: Verify the new plans
-- =====================================================

DO $$
DECLARE
  monthly_plan_count INTEGER;
  quarterly_plan_count INTEGER;
  total_active_plans INTEGER;
BEGIN
  -- Count new plans
  SELECT COUNT(*) INTO monthly_plan_count
  FROM subscription_plans
  WHERE name = 'Abonnement Mensuel' AND is_active = true;

  SELECT COUNT(*) INTO quarterly_plan_count
  FROM subscription_plans
  WHERE name = 'Abonnement Trimestriel' AND is_active = true;

  SELECT COUNT(*) INTO total_active_plans
  FROM subscription_plans
  WHERE is_active = true AND is_public = true;

  -- Verify counts
  IF monthly_plan_count != 1 THEN
    RAISE EXCEPTION 'Expected 1 monthly plan, found %', monthly_plan_count;
  END IF;

  IF quarterly_plan_count != 1 THEN
    RAISE EXCEPTION 'Expected 1 quarterly plan, found %', quarterly_plan_count;
  END IF;

  IF total_active_plans != 2 THEN
    RAISE WARNING 'Expected 2 total active plans, found %. This may be intentional if other plans exist.', total_active_plans;
  END IF;

  RAISE NOTICE 'Successfully created/updated subscription plans:';
  RAISE NOTICE '  - Monthly Plan: % EUR', (SELECT price_amount FROM subscription_plans WHERE name = 'Abonnement Mensuel');
  RAISE NOTICE '  - Quarterly Plan: % EUR', (SELECT price_amount FROM subscription_plans WHERE name = 'Abonnement Trimestriel');
  RAISE NOTICE 'Total active public plans: %', total_active_plans;
END $$;

-- =====================================================
-- Step 4: Display final state
-- =====================================================

SELECT 
  name,
  plan_type,
  billing_interval,
  price_amount,
  currency,
  is_active,
  is_public,
  sort_order,
  features
FROM subscription_plans
WHERE is_active = true AND is_public = true
ORDER BY sort_order, price_amount;

COMMIT;

-- =====================================================
-- Rollback Instructions
-- =====================================================
-- If you need to rollback this migration:
-- 
-- BEGIN;
-- 
-- -- Reactivate old plans
-- UPDATE subscription_plans
-- SET is_active = true, is_public = true, updated_at = NOW()
-- WHERE name IN ('Free', 'Starter', 'Professional', 'Enterprise');
-- 
-- -- Deactivate new plans
-- UPDATE subscription_plans
-- SET is_active = false, is_public = false, updated_at = NOW()
-- WHERE name IN ('Abonnement Mensuel', 'Abonnement Trimestriel');
-- 
-- COMMIT;
-- =====================================================
