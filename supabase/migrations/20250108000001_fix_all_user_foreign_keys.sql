-- Migration: Fix ALL foreign key constraints pointing to wrong users table
-- Problem: Multiple tables reference public.users instead of auth.users
-- Solution: Drop old constraints and create new ones pointing to auth.users
-- Date: 2025-01-08
-- Version: 2 (with table existence checks)

-- =====================================================
-- IMPORTANT: This migration fixes ALL user_id foreign keys
-- Only processes tables that actually exist
-- =====================================================

DO $$
DECLARE
  tables_fixed INTEGER := 0;
  tables_skipped INTEGER := 0;
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '🔧 Starting foreign key constraint fixes...';
  RAISE NOTICE '';

  -- ============================================
  -- 1. FIX: user_addresses table
  -- ============================================
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_addresses'
  ) INTO table_exists;

  IF table_exists THEN
    BEGIN
      ALTER TABLE public.user_addresses 
      DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;

      ALTER TABLE public.user_addresses
      ADD CONSTRAINT user_addresses_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;

      tables_fixed := tables_fixed + 1;
      RAISE NOTICE '✅ Fixed: user_addresses.user_id → auth.users(id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️  user_addresses: %', SQLERRM;
    END;
  ELSE
    tables_skipped := tables_skipped + 1;
    RAISE NOTICE '⏭️  Skipped: user_addresses (table does not exist)';
  END IF;

  -- ============================================
  -- 2. FIX: bookings table
  -- ============================================
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'bookings'
  ) INTO table_exists;

  IF table_exists THEN
    BEGIN
      ALTER TABLE public.bookings 
      DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

      ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;

      tables_fixed := tables_fixed + 1;
      RAISE NOTICE '✅ Fixed: bookings.user_id → auth.users(id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️  bookings: %', SQLERRM;
    END;
  ELSE
    tables_skipped := tables_skipped + 1;
    RAISE NOTICE '⏭️  Skipped: bookings (table does not exist)';
  END IF;

  -- ============================================
  -- 3. FIX: subscriptions table
  -- ============================================
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions'
  ) INTO table_exists;

  IF table_exists THEN
    BEGIN
      ALTER TABLE public.subscriptions 
      DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

      ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;

      tables_fixed := tables_fixed + 1;
      RAISE NOTICE '✅ Fixed: subscriptions.user_id → auth.users(id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️  subscriptions: %', SQLERRM;
    END;
  ELSE
    tables_skipped := tables_skipped + 1;
    RAISE NOTICE '⏭️  Skipped: subscriptions (table does not exist)';
  END IF;

  -- ============================================
  -- 4. FIX: payments table
  -- ============================================
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
  ) INTO table_exists;

  IF table_exists THEN
    BEGIN
      ALTER TABLE public.payments 
      DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

      ALTER TABLE public.payments
      ADD CONSTRAINT payments_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;

      tables_fixed := tables_fixed + 1;
      RAISE NOTICE '✅ Fixed: payments.user_id → auth.users(id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️  payments: %', SQLERRM;
    END;
  ELSE
    tables_skipped := tables_skipped + 1;
    RAISE NOTICE '⏭️  Skipped: payments (table does not exist)';
  END IF;

  -- ============================================
  -- 5. FIX: payment_methods table
  -- ============================================
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payment_methods'
  ) INTO table_exists;

  IF table_exists THEN
    BEGIN
      ALTER TABLE public.payment_methods 
      DROP CONSTRAINT IF EXISTS payment_methods_user_id_fkey;

      ALTER TABLE public.payment_methods
      ADD CONSTRAINT payment_methods_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;

      tables_fixed := tables_fixed + 1;
      RAISE NOTICE '✅ Fixed: payment_methods.user_id → auth.users(id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️  payment_methods: %', SQLERRM;
    END;
  ELSE
    tables_skipped := tables_skipped + 1;
    RAISE NOTICE '⏭️  Skipped: payment_methods (table does not exist)';
  END IF;

  -- ============================================
  -- 6. FIX: subscription_credits table
  -- ============================================
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscription_credits'
  ) INTO table_exists;

  IF table_exists THEN
    BEGIN
      ALTER TABLE public.subscription_credits 
      DROP CONSTRAINT IF EXISTS subscription_credits_user_id_fkey;

      ALTER TABLE public.subscription_credits
      ADD CONSTRAINT subscription_credits_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;

      tables_fixed := tables_fixed + 1;
      RAISE NOTICE '✅ Fixed: subscription_credits.user_id → auth.users(id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️  subscription_credits: %', SQLERRM;
    END;
  ELSE
    tables_skipped := tables_skipped + 1;
    RAISE NOTICE '⏭️  Skipped: subscription_credits (table does not exist)';
  END IF;

  -- ============================================
  -- 7. FIX: credit_transactions table
  -- ============================================
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'credit_transactions'
  ) INTO table_exists;

  IF table_exists THEN
    BEGIN
      ALTER TABLE public.credit_transactions 
      DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;

      ALTER TABLE public.credit_transactions
      ADD CONSTRAINT credit_transactions_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;

      tables_fixed := tables_fixed + 1;
      RAISE NOTICE '✅ Fixed: credit_transactions.user_id → auth.users(id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️  credit_transactions: %', SQLERRM;
    END;
  ELSE
    tables_skipped := tables_skipped + 1;
    RAISE NOTICE '⏭️  Skipped: credit_transactions (table does not exist)';
  END IF;

  -- ============================================
  -- 8. FIX: subscription_audit_log table
  -- ============================================
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscription_audit_log'
  ) INTO table_exists;

  IF table_exists THEN
    BEGIN
      ALTER TABLE public.subscription_audit_log 
      DROP CONSTRAINT IF EXISTS subscription_audit_log_user_id_fkey;

      ALTER TABLE public.subscription_audit_log
      ADD CONSTRAINT subscription_audit_log_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;

      tables_fixed := tables_fixed + 1;
      RAISE NOTICE '✅ Fixed: subscription_audit_log.user_id → auth.users(id)';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️  subscription_audit_log: %', SQLERRM;
    END;
  ELSE
    tables_skipped := tables_skipped + 1;
    RAISE NOTICE '⏭️  Skipped: subscription_audit_log (table does not exist)';
  END IF;

  -- ============================================
  -- Summary
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 Migration completed!';
  RAISE NOTICE '📊 Tables fixed: %', tables_fixed;
  RAISE NOTICE '⏭️  Tables skipped: %', tables_skipped;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

END $$;

-- =====================================================
-- VERIFICATION: Check all constraints now point to auth.users
-- =====================================================
DO $$
DECLARE
  rec RECORD;
  wrong_refs INTEGER := 0;
BEGIN
  RAISE NOTICE '🔍 Verifying foreign key constraints...';
  RAISE NOTICE '';

  FOR rec IN
    SELECT 
      tc.table_name,
      kcu.column_name,
      ccu.table_schema AS foreign_schema,
      ccu.table_name AS foreign_table
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND kcu.column_name = 'user_id'
    ORDER BY tc.table_name
  LOOP
    IF rec.foreign_schema = 'auth' AND rec.foreign_table = 'users' THEN
      RAISE NOTICE '✅ %.% → %.%', rec.table_name, rec.column_name, rec.foreign_schema, rec.foreign_table;
    ELSE
      RAISE WARNING '❌ %.% → %.% (INCORRECT!)', rec.table_name, rec.column_name, rec.foreign_schema, rec.foreign_table;
      wrong_refs := wrong_refs + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  IF wrong_refs = 0 THEN
    RAISE NOTICE '🎉 All foreign keys correctly point to auth.users!';
  ELSE
    RAISE WARNING '⚠️  % foreign keys still point to wrong table!', wrong_refs;
  END IF;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- Add comments for documentation (only for existing tables)
-- =====================================================
DO $$
BEGIN
  -- user_addresses
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_addresses') THEN
    EXECUTE 'COMMENT ON CONSTRAINT user_addresses_user_id_fkey ON public.user_addresses IS ''Fixed on 2025-01-08: Changed from public.users to auth.users''';
  END IF;

  -- bookings
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    EXECUTE 'COMMENT ON CONSTRAINT bookings_user_id_fkey ON public.bookings IS ''Fixed on 2025-01-08: Changed from public.users to auth.users''';
  END IF;

  -- subscriptions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    EXECUTE 'COMMENT ON CONSTRAINT subscriptions_user_id_fkey ON public.subscriptions IS ''Fixed on 2025-01-08: Changed from public.users to auth.users''';
  END IF;

  -- payments
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    EXECUTE 'COMMENT ON CONSTRAINT payments_user_id_fkey ON public.payments IS ''Fixed on 2025-01-08: Changed from public.users to auth.users''';
  END IF;

  -- payment_methods
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    EXECUTE 'COMMENT ON CONSTRAINT payment_methods_user_id_fkey ON public.payment_methods IS ''Fixed on 2025-01-08: Changed from public.users to auth.users''';
  END IF;

  -- subscription_credits
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_credits') THEN
    EXECUTE 'COMMENT ON CONSTRAINT subscription_credits_user_id_fkey ON public.subscription_credits IS ''Fixed on 2025-01-08: Changed from public.users to auth.users''';
  END IF;

  -- credit_transactions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credit_transactions') THEN
    EXECUTE 'COMMENT ON CONSTRAINT credit_transactions_user_id_fkey ON public.credit_transactions IS ''Fixed on 2025-01-08: Changed from public.users to auth.users''';
  END IF;

  -- subscription_audit_log
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_audit_log') THEN
    EXECUTE 'COMMENT ON CONSTRAINT subscription_audit_log_user_id_fkey ON public.subscription_audit_log IS ''Fixed on 2025-01-08: Changed from public.users to auth.users''';
  END IF;
END $$;
