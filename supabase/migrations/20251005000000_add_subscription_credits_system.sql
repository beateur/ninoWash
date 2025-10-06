-- ========================================================
-- Migration: Add Subscription Credits System
-- Date: 2025-10-05
-- Description: Système de crédits hebdomadaires pour abonnés
-- ========================================================

BEGIN;

-- ========================================================
-- 1. TABLE: subscription_credits
-- ========================================================

CREATE TABLE IF NOT EXISTS public.subscription_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  
  -- Crédits
  credits_total INTEGER NOT NULL CHECK (credits_total IN (2, 3)),
  credits_remaining INTEGER NOT NULL CHECK (credits_remaining >= 0 AND credits_remaining <= credits_total),
  credits_used INTEGER NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  
  -- Période hebdomadaire
  week_start_date DATE NOT NULL,  -- Lundi
  week_end_date DATE NOT NULL,    -- Dimanche
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(user_id, week_start_date),
  CONSTRAINT valid_week_dates CHECK (week_end_date > week_start_date),
  CONSTRAINT credits_consistency CHECK (credits_used + credits_remaining = credits_total)
);

COMMENT ON TABLE public.subscription_credits IS 'Crédits hebdomadaires pour abonnés (reset chaque lundi)';
COMMENT ON COLUMN public.subscription_credits.credits_total IS 'Crédits alloués par semaine (2 mensuel, 3 trimestriel)';
COMMENT ON COLUMN public.subscription_credits.credits_remaining IS 'Crédits non utilisés';
COMMENT ON COLUMN public.subscription_credits.credits_used IS 'Crédits consommés cette semaine';
COMMENT ON COLUMN public.subscription_credits.week_start_date IS 'Début de semaine (lundi)';
COMMENT ON COLUMN public.subscription_credits.reset_at IS 'Date/heure du prochain reset (lundi 00:00 UTC)';

-- ========================================================
-- 2. TABLE: credit_usage_log
-- ========================================================

CREATE TABLE IF NOT EXISTS public.credit_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  
  -- État crédits
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  
  -- Détails réservation
  booking_weight_kg DECIMAL(5,2) NOT NULL CHECK (booking_weight_kg > 0),
  amount_saved DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount_saved >= 0),
  
  -- Metadata
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.credit_usage_log IS 'Historique utilisation crédits (audit trail)';
COMMENT ON COLUMN public.credit_usage_log.amount_saved IS 'Montant économisé grâce au crédit';
COMMENT ON COLUMN public.credit_usage_log.booking_weight_kg IS 'Poids de la réservation en kg';

-- ========================================================
-- 3. ALTER TABLE: bookings
-- ========================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id),
  ADD COLUMN IF NOT EXISTS used_subscription_credit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_weight_kg DECIMAL(5,2) CHECK (booking_weight_kg >= 0),
  ADD COLUMN IF NOT EXISTS credit_discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (credit_discount_amount >= 0);

COMMENT ON COLUMN public.bookings.subscription_id IS 'ID abonnement si réservation liée à un abonnement';
COMMENT ON COLUMN public.bookings.used_subscription_credit IS 'true si crédit abonnement utilisé';
COMMENT ON COLUMN public.bookings.booking_weight_kg IS 'Poids total linge en kg';
COMMENT ON COLUMN public.bookings.credit_discount_amount IS 'Montant économisé via crédit';

-- ========================================================
-- 4. INDEXES for Performance
-- ========================================================

-- subscription_credits indexes
CREATE INDEX IF NOT EXISTS idx_subscription_credits_user 
  ON public.subscription_credits(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_credits_subscription 
  ON public.subscription_credits(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_credits_reset 
  ON public.subscription_credits(reset_at) 
  WHERE credits_remaining > 0;

CREATE INDEX IF NOT EXISTS idx_subscription_credits_week 
  ON public.subscription_credits(week_start_date, week_end_date);

-- credit_usage_log indexes
CREATE INDEX IF NOT EXISTS idx_credit_usage_user 
  ON public.credit_usage_log(user_id, used_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_usage_booking 
  ON public.credit_usage_log(booking_id);

CREATE INDEX IF NOT EXISTS idx_credit_usage_subscription 
  ON public.credit_usage_log(subscription_id);

-- bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_subscription 
  ON public.bookings(subscription_id) 
  WHERE subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_with_credit 
  ON public.bookings(used_subscription_credit, created_at DESC) 
  WHERE used_subscription_credit = true;

-- ========================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ========================================================

-- Enable RLS
ALTER TABLE public.subscription_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage_log ENABLE ROW LEVEL SECURITY;

-- subscription_credits policies
CREATE POLICY "users_view_own_credits" ON public.subscription_credits
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_cannot_insert_credits" ON public.subscription_credits
  FOR INSERT 
  WITH CHECK (false);  -- Only system can insert

CREATE POLICY "users_cannot_update_credits_directly" ON public.subscription_credits
  FOR UPDATE 
  USING (false);  -- Only via functions

CREATE POLICY "users_cannot_delete_credits" ON public.subscription_credits
  FOR DELETE 
  USING (false);

-- Admin policy (for system/cron)
CREATE POLICY "service_role_full_access_credits" ON public.subscription_credits
  USING (auth.jwt()->>'role' = 'service_role');

-- credit_usage_log policies
CREATE POLICY "users_view_own_usage_log" ON public.credit_usage_log
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_cannot_modify_usage_log" ON public.credit_usage_log
  FOR ALL 
  USING (false);

-- Admin policy
CREATE POLICY "service_role_full_access_usage_log" ON public.credit_usage_log
  USING (auth.jwt()->>'role' = 'service_role');

-- ========================================================
-- 6. FUNCTIONS
-- ========================================================

-- Function: Get current credits for user
CREATE OR REPLACE FUNCTION get_user_current_credits(p_user_id UUID)
RETURNS TABLE (
  credits_remaining INTEGER,
  credits_total INTEGER,
  week_start_date DATE,
  reset_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.credits_remaining,
    sc.credits_total,
    sc.week_start_date,
    sc.reset_at
  FROM subscription_credits sc
  WHERE sc.user_id = p_user_id
    AND sc.week_start_date = date_trunc('week', CURRENT_DATE)::DATE
    AND sc.reset_at > NOW()
  ORDER BY sc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Consume credit (transactional)
CREATE OR REPLACE FUNCTION consume_subscription_credit(
  p_user_id UUID,
  p_subscription_id UUID,
  p_booking_id UUID,
  p_booking_weight DECIMAL(5,2),
  p_amount_saved DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_credits_before INTEGER;
  v_credits_after INTEGER;
  v_credit_id UUID;
BEGIN
  -- Lock row for update
  SELECT id, credits_remaining INTO v_credit_id, v_credits_before
  FROM subscription_credits
  WHERE user_id = p_user_id
    AND week_start_date = date_trunc('week', CURRENT_DATE)::DATE
    AND reset_at > NOW()
  FOR UPDATE;
  
  -- Check if credit available
  IF v_credits_before IS NULL OR v_credits_before <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Decrement credit
  UPDATE subscription_credits
  SET 
    credits_remaining = credits_remaining - 1,
    credits_used = credits_used + 1,
    updated_at = NOW()
  WHERE id = v_credit_id;
  
  v_credits_after := v_credits_before - 1;
  
  -- Log usage
  INSERT INTO credit_usage_log (
    user_id,
    subscription_id,
    booking_id,
    credits_before,
    credits_after,
    booking_weight_kg,
    amount_saved
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_booking_id,
    v_credits_before,
    v_credits_after,
    p_booking_weight,
    p_amount_saved
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Initialize weekly credits for user
CREATE OR REPLACE FUNCTION initialize_weekly_credits(
  p_user_id UUID,
  p_subscription_id UUID,
  p_credits_total INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_reset_at TIMESTAMP WITH TIME ZONE;
  v_credit_id UUID;
BEGIN
  -- Calculate week dates (Monday to Sunday)
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  v_week_end := (v_week_start + INTERVAL '6 days')::DATE;
  v_reset_at := (v_week_start + INTERVAL '7 days')::TIMESTAMP WITH TIME ZONE;
  
  -- Insert or update credits
  INSERT INTO subscription_credits (
    user_id,
    subscription_id,
    credits_total,
    credits_remaining,
    credits_used,
    week_start_date,
    week_end_date,
    reset_at
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_credits_total,
    p_credits_total,
    0,
    v_week_start,
    v_week_end,
    v_reset_at
  )
  ON CONFLICT (user_id, week_start_date) 
  DO UPDATE SET
    credits_total = EXCLUDED.credits_total,
    credits_remaining = EXCLUDED.credits_total,
    credits_used = 0,
    reset_at = EXCLUDED.reset_at,
    updated_at = NOW()
  RETURNING id INTO v_credit_id;
  
  RETURN v_credit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get credits from plan metadata
CREATE OR REPLACE FUNCTION get_credits_from_plan(p_plan_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_billing_interval TEXT;
  v_credits INTEGER;
BEGIN
  SELECT billing_interval INTO v_billing_interval
  FROM subscription_plans
  WHERE id = p_plan_id;
  
  -- Mensuel = 2 crédits, Trimestriel = 3 crédits
  CASE v_billing_interval
    WHEN 'monthly' THEN v_credits := 2;
    WHEN 'quarterly' THEN v_credits := 3;
    ELSE v_credits := 0;
  END CASE;
  
  RETURN v_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- 7. TRIGGERS
-- ========================================================

-- Trigger: Update updated_at on subscription_credits
CREATE TRIGGER update_subscription_credits_updated_at 
  BEFORE UPDATE ON public.subscription_credits
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Initialize credits when subscription created
CREATE OR REPLACE FUNCTION trigger_initialize_credits_on_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  -- Only for active subscriptions
  IF NEW.status = 'active' THEN
    v_credits := get_credits_from_plan(NEW.plan_id);
    
    IF v_credits > 0 THEN
      PERFORM initialize_weekly_credits(NEW.user_id, NEW.id, v_credits);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER subscription_initialize_credits
  AFTER INSERT OR UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION trigger_initialize_credits_on_subscription();

-- ========================================================
-- 8. INITIALIZE CREDITS FOR EXISTING SUBSCRIPTIONS
-- ========================================================

-- Initialize credits for all active subscriptions
DO $$
DECLARE
  sub RECORD;
  v_credits INTEGER;
BEGIN
  FOR sub IN 
    SELECT id, user_id, plan_id
    FROM subscriptions
    WHERE status = 'active'
  LOOP
    v_credits := get_credits_from_plan(sub.plan_id);
    
    IF v_credits > 0 THEN
      PERFORM initialize_weekly_credits(sub.user_id, sub.id, v_credits);
      RAISE NOTICE 'Initialized % credits for subscription %', v_credits, sub.id;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- ========================================================
-- VERIFICATION
-- ========================================================

-- Check tables created
SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('subscription_credits', 'credit_usage_log')
ORDER BY tablename;

-- Check indexes
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('subscription_credits', 'credit_usage_log', 'bookings')
  AND indexname LIKE '%credit%'
ORDER BY tablename, indexname;

-- Check RLS enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('subscription_credits', 'credit_usage_log');

-- Check functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%credit%'
ORDER BY routine_name;

-- ========================================================
-- ROLLBACK (si nécessaire)
-- ========================================================

/*
BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS subscription_initialize_credits ON public.subscriptions;
DROP FUNCTION IF EXISTS trigger_initialize_credits_on_subscription();

-- Drop functions
DROP FUNCTION IF EXISTS get_user_current_credits(UUID);
DROP FUNCTION IF EXISTS consume_subscription_credit(UUID, UUID, UUID, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS initialize_weekly_credits(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS get_credits_from_plan(UUID);

-- Drop tables (CASCADE pour dépendances)
DROP TABLE IF EXISTS public.credit_usage_log CASCADE;
DROP TABLE IF EXISTS public.subscription_credits CASCADE;

-- Remove columns from bookings
ALTER TABLE public.bookings
  DROP COLUMN IF EXISTS subscription_id,
  DROP COLUMN IF EXISTS used_subscription_credit,
  DROP COLUMN IF EXISTS booking_weight_kg,
  DROP COLUMN IF EXISTS credit_discount_amount;

COMMIT;
*/
