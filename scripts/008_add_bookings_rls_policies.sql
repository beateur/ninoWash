-- Sprint P2: Add RLS policies for bookings table
-- Aligns database-level security with SSR guards

-- Enable Row Level Security on bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own bookings
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own bookings
CREATE POLICY "bookings_insert_own" ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own bookings
CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own bookings (soft delete via status)
CREATE POLICY "bookings_delete_own" ON public.bookings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies: Admins can view, insert, update, and delete all bookings
CREATE POLICY "bookings_admin_all" ON public.bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Enable RLS on user_addresses table (if not already enabled)
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own addresses
CREATE POLICY "user_addresses_select_own" ON public.user_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own addresses
CREATE POLICY "user_addresses_insert_own" ON public.user_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own addresses
CREATE POLICY "user_addresses_update_own" ON public.user_addresses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own addresses
CREATE POLICY "user_addresses_delete_own" ON public.user_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies for addresses
CREATE POLICY "user_addresses_admin_all" ON public.user_addresses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create index for admin role lookups (performance optimization)
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users ((raw_user_meta_data->>'role'));

-- Log the RLS policy creation
DO $$
BEGIN
  RAISE NOTICE 'Sprint P2: RLS policies for bookings and user_addresses created successfully';
  RAISE NOTICE 'Users can only access their own data';
  RAISE NOTICE 'Admins have full access to all data';
END $$;
