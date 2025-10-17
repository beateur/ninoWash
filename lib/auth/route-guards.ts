import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

/**
 * Route Guards for protecting pages and API routes
 * Provides reusable authentication and authorization checks
 */

export interface RouteGuardOptions {
  redirectTo?: string
  requireRole?: string | string[]
  requireSubscription?: boolean
}

/**
 * Creates a Supabase server client for route guards
 */
async function getServerClient() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })
}

/**
 * Require authentication - redirects to sign in if not authenticated
 */
export async function requireAuth(options: RouteGuardOptions = {}) {
  const { redirectTo = "/auth/signin" } = options
  const supabase = await getServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(redirectTo)
  }

  return { user, supabase }
}

/**
 * Require active subscription - redirects if user doesn't have active subscription
 */
export async function requireSubscription(options: RouteGuardOptions = {}) {
  const { redirectTo = "/subscription" } = options
  const { user, supabase } = await requireAuth({ redirectTo: "/auth/signin" })

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle()

  if (!subscription) {
    redirect(redirectTo)
  }

  return { user, supabase, subscription }
}

/**
 * Require guest (not authenticated) - redirects to dashboard if authenticated
 */
export async function requireGuest(options: RouteGuardOptions = {}) {
  const { redirectTo = "/dashboard" } = options
  const supabase = await getServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(redirectTo)
  }

  return { supabase }
}

/**
 * Optional auth - returns user if authenticated, null otherwise
 * Does not redirect
 */
export async function optionalAuth() {
  const supabase = await getServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { user, supabase }
}

/**
 * Check if user has permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const { user, supabase } = await requireAuth()

    // Check user permissions from database
    const { data: userPermissions } = await supabase
      .from("user_permissions")
      .select("permission")
      .eq("user_id", user.id)

    if (!userPermissions) return false

    return userPermissions.some((p) => p.permission === permission)
  } catch {
    return false
  }
}

/**
 * Require specific permission
 */
export async function requirePermission(permission: string, options: RouteGuardOptions = {}) {
  const { redirectTo = "/" } = options
  const { user, supabase } = await requireAuth({ redirectTo: "/auth/signin" })

  const { data: userPermissions } = await supabase.from("user_permissions").select("permission").eq("user_id", user.id)

  const hasRequiredPermission = userPermissions?.some((p) => p.permission === permission)

  if (!hasRequiredPermission) {
    redirect(redirectTo)
  }

  return { user, supabase }
}
