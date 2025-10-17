import { createClient } from "@supabase/supabase-js"

/**
 * Admin Supabase client with service role key
 * 
 * CRITICAL: Only use for:
 * - Webhook handlers (Stripe, etc) that need to bypass RLS
 * - Guest bookings (anonymous users)
 * - Background jobs/cron tasks
 * 
 * NEVER use for user-facing operations - always use the regular client with RLS
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
