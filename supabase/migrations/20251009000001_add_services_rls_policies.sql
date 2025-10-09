-- Migration: Add Row Level Security Policies for services table
-- Date: 2025-10-09
-- Purpose: Allow anonymous users to view active services (guest booking flow)
-- Related: Phase 2 Guest Booking Flow, Step 2 (ServicesStep)

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

-- Enable RLS on services table (if not already enabled)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (if any)
-- ============================================================================

-- Clean up any existing policies to ensure idempotency
DROP POLICY IF EXISTS "services_select_active_for_anon" ON services;
DROP POLICY IF EXISTS "services_select_active_for_authenticated" ON services;
DROP POLICY IF EXISTS "services_all_for_service_role" ON services;

-- ============================================================================
-- CREATE POLICIES
-- ============================================================================

-- Policy 1: Allow anonymous users to SELECT active services
-- Required for: Guest booking flow (/reservation/guest)
-- Users: Anonymous (no authentication)
-- Permissions: SELECT only
-- Condition: is_active = true
CREATE POLICY "services_select_active_for_anon"
ON services
FOR SELECT
TO anon
USING (is_active = true);

-- Policy 2: Allow authenticated users to SELECT active services
-- Required for: Authenticated booking flow (/reservation)
-- Users: Logged-in users
-- Permissions: SELECT only
-- Condition: is_active = true
CREATE POLICY "services_select_active_for_authenticated"
ON services
FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy 3: Allow service role (admin) full CRUD access
-- Required for: Admin dashboard (future), backend operations
-- Users: Service role (backend, webhooks, admin API)
-- Permissions: ALL (SELECT, INSERT, UPDATE, DELETE)
-- Condition: None (full access)
CREATE POLICY "services_all_for_service_role"
ON services
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- POLICY DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "services_select_active_for_anon" ON services IS
'Allow anonymous users to view active services for guest booking flow. Only SELECT permission, restricted to is_active=true. Used by /reservation/guest (Step 2).';

COMMENT ON POLICY "services_select_active_for_authenticated" ON services IS
'Allow authenticated users to view active services. Only SELECT permission, restricted to is_active=true. Used by /reservation (authenticated booking flow).';

COMMENT ON POLICY "services_all_for_service_role" ON services IS
'Allow admins (service role) full CRUD access to services. Required for admin dashboard and backend operations. No restrictions.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled
DO $$
BEGIN
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services') THEN
        RAISE EXCEPTION 'RLS is not enabled on services table';
    END IF;
END $$;

-- Verify policies exist
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'services') < 3 THEN
        RAISE EXCEPTION 'Expected 3 policies on services table, found %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'services');
    END IF;
END $$;

-- ============================================================================
-- TEST QUERIES
-- ============================================================================

-- Test 1: Verify anon can see active services (run as anon role)
-- Expected: Returns all active services
-- SELECT * FROM services WHERE is_active = true;

-- Test 2: Verify anon cannot see inactive services (run as anon role)
-- Expected: Returns empty array (silently filtered)
-- SELECT * FROM services WHERE is_active = false;

-- Test 3: Verify anon cannot insert services (run as anon role)
-- Expected: ERROR: permission denied
-- INSERT INTO services (name, base_price, is_active) VALUES ('Test', 10.00, true);

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration:
-- DROP POLICY IF EXISTS "services_select_active_for_anon" ON services;
-- DROP POLICY IF EXISTS "services_select_active_for_authenticated" ON services;
-- DROP POLICY IF EXISTS "services_all_for_service_role" ON services;
-- ALTER TABLE services DISABLE ROW LEVEL SECURITY; -- CAUTION: Not recommended

-- ============================================================================
-- SUCCESS
-- ============================================================================

-- Log success message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies successfully created for services table';
    RAISE NOTICE 'Total policies: %', (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'services');
END $$;
