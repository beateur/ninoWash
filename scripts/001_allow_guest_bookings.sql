-- Allow guest bookings by making user_id nullable in bookings table
-- This enables users to create bookings without authentication

-- Remove NOT NULL constraint from user_id column
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;

-- Add a check constraint to ensure either user_id is provided OR guest metadata exists
-- This ensures data integrity while allowing guest bookings
ALTER TABLE bookings ADD CONSTRAINT check_user_or_guest 
CHECK (
  user_id IS NOT NULL OR 
  (metadata IS NOT NULL AND metadata ? 'is_guest_booking')
);

-- Add comment to document the change
COMMENT ON COLUMN bookings.user_id IS 'User ID for authenticated bookings, NULL for guest bookings';
COMMENT ON CONSTRAINT check_user_or_guest ON bookings IS 'Ensures either user_id is provided or booking is marked as guest booking in metadata';
