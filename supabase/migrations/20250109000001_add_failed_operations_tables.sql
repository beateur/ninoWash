-- Migration: Add tables for tracking failed guest booking operations
-- Date: 2025-01-09
-- Purpose: Log payment successes with account/booking creation failures

-- Table 1: Track failed account creations (payment OK, account creation failed)
CREATE TABLE IF NOT EXISTS failed_account_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT
);

-- Index pour recherches par email et statut
CREATE INDEX idx_failed_account_creations_email ON failed_account_creations(email);
CREATE INDEX idx_failed_account_creations_unresolved ON failed_account_creations(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_failed_account_creations_payment_intent ON failed_account_creations(payment_intent_id);

-- Table 2: Track failed booking creations (payment + account OK, booking creation failed)
CREATE TABLE IF NOT EXISTS failed_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_contact JSONB NOT NULL,
  guest_pickup_address JSONB NOT NULL,
  guest_delivery_address JSONB NOT NULL,
  items JSONB NOT NULL,
  pickup_date TIMESTAMPTZ NOT NULL,
  pickup_time_slot TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT
);

-- Index pour recherches par user_id et statut
CREATE INDEX idx_failed_bookings_user_id ON failed_bookings(user_id);
CREATE INDEX idx_failed_bookings_unresolved ON failed_bookings(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_failed_bookings_payment_intent ON failed_bookings(payment_intent_id);

-- RLS Policies: Admin-only access
ALTER TABLE failed_account_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admin users can read/write
CREATE POLICY admin_only_failed_account_creations ON failed_account_creations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.user_metadata->>'role' = 'admin'
        OR auth.users.app_metadata->>'role' = 'admin'
      )
    )
  );

CREATE POLICY admin_only_failed_bookings ON failed_bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.user_metadata->>'role' = 'admin'
        OR auth.users.app_metadata->>'role' = 'admin'
      )
    )
  );

-- Comments for documentation
COMMENT ON TABLE failed_account_creations IS 'Logs guest booking payments that succeeded but account creation failed after 3 retries';
COMMENT ON TABLE failed_bookings IS 'Logs guest bookings where payment + account creation succeeded but booking creation failed after 3 retries';
COMMENT ON COLUMN failed_account_creations.payment_intent_id IS 'Stripe Payment Intent ID for customer support reference';
COMMENT ON COLUMN failed_bookings.payment_intent_id IS 'Stripe Payment Intent ID for customer support reference';
