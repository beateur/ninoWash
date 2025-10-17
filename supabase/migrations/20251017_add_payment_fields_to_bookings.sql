-- Add payment tracking fields to bookings table
ALTER TABLE bookings
  ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN payment_intent_id TEXT,
  ADD COLUMN stripe_session_id TEXT,
  ADD COLUMN paid_at TIMESTAMPTZ,
  ADD COLUMN total_amount_cents INTEGER;

-- Populate total_amount_cents for existing bookings (if they have total_amount)
UPDATE bookings 
SET total_amount_cents = CAST(COALESCE(total_amount, 0) * 100 AS INTEGER)
WHERE total_amount_cents IS NULL AND total_amount > 0;

-- Create indexes for performance
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_stripe_session_id ON bookings(stripe_session_id);
CREATE INDEX idx_bookings_payment_intent_id ON bookings(payment_intent_id);

-- Add comments for documentation
COMMENT ON COLUMN bookings.payment_status IS 'pending | succeeded | failed';
COMMENT ON COLUMN bookings.stripe_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN bookings.payment_intent_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN bookings.paid_at IS 'Timestamp when payment was confirmed';
COMMENT ON COLUMN bookings.total_amount_cents IS 'Total amount in cents for Stripe';
