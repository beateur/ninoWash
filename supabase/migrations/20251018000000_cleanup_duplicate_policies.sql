-- Migration: Clean up duplicate and conflicting policies
-- This migration removes duplicate RLS policies that prevent further migrations

-- Drop existing duplicate policies that will be recreated (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_audit_log') THEN
        DROP POLICY IF EXISTS "Users can view own audit logs" ON subscription_audit_log;
        DROP POLICY IF EXISTS "Users can insert own audit logs" ON subscription_audit_log;
    END IF;
END $$;

-- All other migrations will proceed after this cleanup
