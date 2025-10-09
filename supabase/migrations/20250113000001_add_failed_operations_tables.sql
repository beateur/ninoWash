-- Migration: Add Failed Operations Tables for Guest Booking
-- Description: Create tables to log failed account creations and booking operations
-- Date: 2025-01-13
-- Author: GitHub Copilot

-- =====================================================
-- Table: failed_account_creations
-- Purpose: Log failed Supabase Auth signUp attempts during guest booking
-- =====================================================

CREATE TABLE IF NOT EXISTS failed_account_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Payment Intent reference (to link back to Stripe payment)
  payment_intent_id TEXT NOT NULL,
  
  -- User details from booking
  guest_email TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  
  -- Error details
  error_message TEXT NOT NULL,
  error_code TEXT,
  error_details JSONB,
  
  -- Retry tracking
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Full booking data (for manual recovery)
  booking_data JSONB NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'abandoned')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups by payment_intent_id
CREATE INDEX idx_failed_account_creations_payment_intent 
ON failed_account_creations(payment_intent_id);

-- Index for pending failures (admin dashboard)
CREATE INDEX idx_failed_account_creations_status 
ON failed_account_creations(status) 
WHERE status = 'pending';

-- Index for guest email (manual recovery)
CREATE INDEX idx_failed_account_creations_email 
ON failed_account_creations(guest_email);

-- Updated_at trigger
CREATE TRIGGER update_failed_account_creations_updated_at
  BEFORE UPDATE ON failed_account_creations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: failed_bookings
-- Purpose: Log failed booking creations after successful account creation
-- =====================================================

CREATE TABLE IF NOT EXISTS failed_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Payment Intent reference
  payment_intent_id TEXT NOT NULL,
  
  -- User reference (account was created successfully)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Booking details
  booking_data JSONB NOT NULL,
  
  -- Error details
  error_message TEXT NOT NULL,
  error_code TEXT,
  error_details JSONB,
  
  -- Retry tracking
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'abandoned')),
  resolved_at TIMESTAMPTZ,
  resolved_booking_id UUID REFERENCES bookings(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups by payment_intent_id
CREATE INDEX idx_failed_bookings_payment_intent 
ON failed_bookings(payment_intent_id);

-- Index for pending failures
CREATE INDEX idx_failed_bookings_status 
ON failed_bookings(status) 
WHERE status = 'pending';

-- Index for user_id (find all failed bookings for a user)
CREATE INDEX idx_failed_bookings_user_id 
ON failed_bookings(user_id);

-- Updated_at trigger
CREATE TRIGGER update_failed_bookings_updated_at
  BEFORE UPDATE ON failed_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE failed_account_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_bookings ENABLE ROW LEVEL SECURITY;

-- Admin-only access (no public access)
-- failed_account_creations policies
CREATE POLICY "Admin full access to failed_account_creations"
ON failed_account_creations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
);

-- failed_bookings policies
CREATE POLICY "Admin full access to failed_bookings"
ON failed_bookings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Log failed account creation
CREATE OR REPLACE FUNCTION log_failed_account_creation(
  p_payment_intent_id TEXT,
  p_guest_email TEXT,
  p_guest_name TEXT,
  p_guest_phone TEXT,
  p_error_message TEXT,
  p_error_code TEXT,
  p_booking_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_record_id UUID;
BEGIN
  INSERT INTO failed_account_creations (
    payment_intent_id,
    guest_email,
    guest_name,
    guest_phone,
    error_message,
    error_code,
    booking_data
  )
  VALUES (
    p_payment_intent_id,
    p_guest_email,
    p_guest_name,
    p_guest_phone,
    p_error_message,
    p_error_code,
    p_booking_data
  )
  RETURNING id INTO v_record_id;
  
  RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log failed booking creation
CREATE OR REPLACE FUNCTION log_failed_booking(
  p_payment_intent_id TEXT,
  p_user_id UUID,
  p_booking_data JSONB,
  p_error_message TEXT,
  p_error_code TEXT
) RETURNS UUID AS $$
DECLARE
  v_record_id UUID;
BEGIN
  INSERT INTO failed_bookings (
    payment_intent_id,
    user_id,
    booking_data,
    error_message,
    error_code
  )
  VALUES (
    p_payment_intent_id,
    p_user_id,
    p_booking_data,
    p_error_message,
    p_error_code
  )
  RETURNING id INTO v_record_id;
  
  RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE failed_account_creations IS 
'Logs failed Supabase Auth signUp attempts during guest booking flow. Used for manual recovery and monitoring.';

COMMENT ON TABLE failed_bookings IS 
'Logs failed booking creation attempts after successful account creation. User account exists but booking failed.';

COMMENT ON COLUMN failed_account_creations.payment_intent_id IS 
'Stripe Payment Intent ID - payment was successful but account creation failed';

COMMENT ON COLUMN failed_account_creations.booking_data IS 
'Full booking data (services, addresses, dates) for manual recovery';

COMMENT ON COLUMN failed_bookings.user_id IS 
'User account was created successfully but booking creation failed';

COMMENT ON COLUMN failed_bookings.resolved_booking_id IS 
'Reference to booking if manually resolved';
