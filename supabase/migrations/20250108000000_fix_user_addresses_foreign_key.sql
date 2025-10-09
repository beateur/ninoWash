-- Migration: Fix user_addresses foreign key constraint
-- Problem: user_addresses.user_id references public.users instead of auth.users
-- Solution: Drop old constraint and create new one pointing to auth.users

-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE public.user_addresses 
DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;

-- Step 2: Add the correct foreign key constraint pointing to auth.users
ALTER TABLE public.user_addresses
ADD CONSTRAINT user_addresses_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Step 3: Verify the constraint exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_addresses_user_id_fkey'
      AND table_name = 'user_addresses'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE NOTICE '✅ Foreign key constraint user_addresses_user_id_fkey created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create foreign key constraint';
  END IF;
END $$;

-- Log the fix
COMMENT ON CONSTRAINT user_addresses_user_id_fkey ON public.user_addresses IS 
  'Fixed on 2025-01-08: Changed from public.users to auth.users to match Supabase auth system';
