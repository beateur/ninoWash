import { createClient } from "@supabase/supabase-js"

/**
 * Admin Supabase client with service role key
 * 
 * CRITICAL: Only use for operations that REQUIRE bypassing RLS:
 * - Guest bookings (anonymous users creating bookings)
 * - Webhook handlers (Stripe, etc)
 * 
 * NEVER use for regular user-facing operations - always use the regular client
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
