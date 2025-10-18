-- Fix: Update bookings status CHECK constraint to include 'pending_payment'
-- This allows bookings created with payment system to have pending_payment status

-- Step 1: Drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Step 2: Add updated constraint with all valid statuses
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN (
    'pending',           -- Legacy status
    'pending_payment',   -- New payment system status
    'confirmed',
    'collecting',
    'in_progress',
    'in_transit',
    'ready_for_delivery',
    'delivered',
    'completed',
    'cancelled',
    'on_hold',
    'processing'
  ));

-- Verification
COMMENT ON CONSTRAINT bookings_status_check ON bookings 
  IS 'Valid booking statuses: pending, pending_payment, confirmed, collecting, in_progress, in_transit, ready_for_delivery, delivered, completed, cancelled, on_hold, processing';
