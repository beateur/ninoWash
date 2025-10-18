-- Migration: Clean up duplicate and conflicting policies
-- This migration removes duplicate RLS policies that prevent further migrations

-- Drop existing duplicate policies that will be recreated
DROP POLICY IF EXISTS "Users can view own audit logs" ON subscription_audit_log;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON subscription_audit_log;

-- All other migrations will proceed after this cleanup
