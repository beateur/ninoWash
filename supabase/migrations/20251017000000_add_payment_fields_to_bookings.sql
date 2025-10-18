-- Add payment tracking fields to bookings table (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_status') THEN
    ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_intent_id') THEN
    ALTER TABLE bookings ADD COLUMN payment_intent_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'stripe_session_id') THEN
    ALTER TABLE bookings ADD COLUMN stripe_session_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'paid_at') THEN
    ALTER TABLE bookings ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_amount_cents') THEN
    ALTER TABLE bookings ADD COLUMN total_amount_cents INTEGER;
  END IF;
END $$;

-- Populate total_amount_cents for existing bookings (if they have total_amount)
UPDATE bookings 
SET total_amount_cents = CAST(COALESCE(total_amount, 0) * 100 AS INTEGER)
WHERE total_amount_cents IS NULL AND total_amount > 0;

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session_id ON bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent_id ON bookings(payment_intent_id);

-- Add comments for documentation
COMMENT ON COLUMN bookings.payment_status IS 'pending | succeeded | failed';
COMMENT ON COLUMN bookings.stripe_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN bookings.payment_intent_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN bookings.paid_at IS 'Timestamp when payment was confirmed';
COMMENT ON COLUMN bookings.total_amount_cents IS 'Total amount in cents for Stripe';
