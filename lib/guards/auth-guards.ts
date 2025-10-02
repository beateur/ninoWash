import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

/**
 * Server-side authentication guard
 * Verifies user is authenticated before allowing access to protected pages
 * @returns Authenticated user object
 * @throws Redirects to /auth/signin if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.warn("[v0] Auth guard: Unauthenticated access attempt", {
      timestamp: new Date().toISOString(),
    })
    redirect("/auth/signin")
  }

  return user
}

/**
 * Server-side admin guard
 * Verifies user is authenticated AND has admin role
 * @returns Authenticated admin user object
 * @throws Redirects to / if not authenticated or not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()

  const role = user.user_metadata?.role
  if (role !== "admin") {
    console.warn("[v0] Admin guard: Non-admin access attempt", {
      userId: user.id,
      role: role || "none",
      timestamp: new Date().toISOString(),
    })
    redirect("/")
  }

  return user
}

/**
 * Get current user without redirecting
 * Useful for optional authentication scenarios
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return null
  }
}
