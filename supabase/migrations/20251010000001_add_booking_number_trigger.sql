-- Migration: Auto-generate booking_number for bookings table
-- Date: 2025-10-10
-- Description: Adds trigger to automatically generate booking_number in format BK-YYYYMMDD-XXXXXX
--              when NULL during INSERT. Prevents NOT NULL constraint violations.

-- ============================================================================
-- 1. CREATE SEQUENCE FOR UNIQUE NUMBERING
-- ============================================================================
-- Sequence ensures unique incremental numbers across all bookings
CREATE SEQUENCE IF NOT EXISTS booking_number_seq 
  START WITH 1 
  INCREMENT BY 1 
  NO MAXVALUE 
  CACHE 1;

COMMENT ON SEQUENCE booking_number_seq IS 
  'Sequence for generating unique booking numbers. Used by generate_booking_number() trigger function.';

-- ============================================================================
-- 2. CREATE TRIGGER FUNCTION
-- ============================================================================
-- Function generates booking_number ONLY if NULL (allows backend override)
-- Format: BK-YYYYMMDD-XXXXXX (e.g., BK-20251010-000001)
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if booking_number is NULL (preserve backend-provided values)
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 
      'BK-' || 
      TO_CHAR(NOW(), 'YYYYMMDD') || 
      '-' || 
      LPAD(NEXTVAL('booking_number_seq')::TEXT, 6, '0');
    
    -- Log generation for debugging (optional - comment out in production)
    RAISE NOTICE 'Auto-generated booking_number: %', NEW.booking_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_booking_number() IS 
  'Trigger function that auto-generates booking_number in format BK-YYYYMMDD-XXXXXX when NULL during INSERT. Acts as fallback to prevent NOT NULL constraint violations.';

-- ============================================================================
-- 3. CREATE TRIGGER
-- ============================================================================
-- Trigger fires BEFORE INSERT on bookings table
-- Ensures booking_number is populated before row is inserted
DROP TRIGGER IF EXISTS trg_bookings_booking_number ON public.bookings;

CREATE TRIGGER trg_bookings_booking_number
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_number();

COMMENT ON TRIGGER trg_bookings_booking_number ON public.bookings IS 
  'Auto-generates booking_number before INSERT if NULL. Prevents NOT NULL constraint violations and ensures every booking has a unique reference number.';

-- ============================================================================
-- 4. VERIFICATION QUERIES (for manual testing)
-- ============================================================================
-- Run these in Supabase SQL Editor to verify installation:

-- Verify sequence exists:
-- SELECT * FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'booking_number_seq';

-- Verify function exists:
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'generate_booking_number';

-- Verify trigger exists:
-- SELECT * FROM pg_trigger WHERE tgname = 'trg_bookings_booking_number';

-- Test trigger (will auto-generate booking_number):
-- INSERT INTO bookings (user_id, status, pickup_date, total_amount)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'pending', NOW(), 29.99)
-- RETURNING booking_number;
-- Expected result: BK-YYYYMMDD-XXXXXX format

-- ============================================================================
-- 5. ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- To remove this migration, run:
-- DROP TRIGGER IF EXISTS trg_bookings_booking_number ON public.bookings;
-- DROP FUNCTION IF EXISTS generate_booking_number();
-- DROP SEQUENCE IF EXISTS booking_number_seq;

-- ============================================================================
-- NOTES
-- ============================================================================
-- - Trigger only fires on INSERT (not UPDATE)
-- - Backend can override by providing booking_number explicitly
-- - Sequence ensures uniqueness even with concurrent inserts
-- - Format is date-sortable (YYYYMMDD prefix)
-- - LPAD ensures fixed width (6 digits with leading zeros)
-- - This is a FALLBACK mechanism - backend should generate booking_number when possible
