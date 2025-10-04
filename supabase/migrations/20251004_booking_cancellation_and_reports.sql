-- Migration: Add booking cancellation, modifications tracking, and problem reports
-- Date: 2025-10-04
-- Description: Enables users to cancel bookings, track modifications, and report problems

-- 1. Add cancellation fields to bookings table
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);

-- 2. Create booking_modifications table (audit log)
CREATE TABLE IF NOT EXISTS booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create booking_reports table
CREATE TABLE IF NOT EXISTS booking_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('damaged_items', 'missing_items', 'late_delivery', 'quality_issue', 'other')),
  description TEXT NOT NULL,
  photos TEXT[], -- Array of URLs
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at) WHERE cancelled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_booking_modifications_booking_id ON booking_modifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_created_at ON booking_modifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_reports_booking_id ON booking_reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reports_status ON booking_reports(status);
CREATE INDEX IF NOT EXISTS idx_booking_reports_user_id ON booking_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_reports_created_at ON booking_reports(created_at DESC);

-- 5. Row Level Security Policies

-- RLS for booking_modifications
ALTER TABLE booking_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own modifications"
  ON booking_modifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create modifications for their bookings"
  ON booking_modifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
  );

-- Admins can view all modifications
CREATE POLICY "Admins can view all modifications"
  ON booking_modifications FOR SELECT
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- RLS for booking_reports
ALTER TABLE booking_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports for their bookings"
  ON booking_reports FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view their own reports"
  ON booking_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON booking_reports FOR SELECT
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update all reports
CREATE POLICY "Admins can update all reports"
  ON booking_reports FOR UPDATE
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- 6. Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_reports_updated_at
  BEFORE UPDATE ON booking_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_reports_updated_at();

-- 7. Comments for documentation
COMMENT ON COLUMN bookings.cancellation_reason IS 'Reason provided by user when cancelling the booking';
COMMENT ON COLUMN bookings.cancelled_at IS 'Timestamp when the booking was cancelled';
COMMENT ON COLUMN bookings.cancelled_by IS 'User who cancelled the booking (for audit trail)';
COMMENT ON TABLE booking_modifications IS 'Audit log for all booking modifications (address changes, date changes, etc.)';
COMMENT ON TABLE booking_reports IS 'User-reported problems with bookings (damaged items, late delivery, etc.)';
