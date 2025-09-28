-- Fix booking_items table to reference services instead of service_options
-- This aligns the database schema with the application logic

-- Drop the existing foreign key constraint
ALTER TABLE booking_items DROP CONSTRAINT IF EXISTS booking_items_service_option_id_fkey;

-- Add service_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_items' AND column_name = 'service_id') THEN
        ALTER TABLE booking_items ADD COLUMN service_id UUID;
    END IF;
END $$;

-- Update existing records to use service_id instead of service_option_id
-- (This assumes service_option_id currently contains service IDs, which is the bug we're fixing)
UPDATE booking_items 
SET service_id = service_option_id 
WHERE service_option_id IS NOT NULL AND service_id IS NULL;

-- Add foreign key constraint for service_id
ALTER TABLE booking_items 
ADD CONSTRAINT booking_items_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

-- Make service_id NOT NULL since every booking item must have a service
ALTER TABLE booking_items ALTER COLUMN service_id SET NOT NULL;

-- Drop the service_option_id column since we're not using service options
ALTER TABLE booking_items DROP COLUMN IF EXISTS service_option_id;

-- Add comment to document the change
COMMENT ON COLUMN booking_items.service_id IS 'References the main service from services table';
