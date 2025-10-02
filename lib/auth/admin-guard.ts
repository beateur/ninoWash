import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * Server-side admin guard for protecting admin routes
 * Validates user session and checks for admin role
 * Redirects to home page if user is not authenticated or not an admin
 *
 * Usage in Server Components:
 * ```ts
 * export default async function AdminPage() {
 *   await requireAdmin()
 *   // ... rest of component
 * }
 * ```
 */
export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Redirect if no user or authentication error
  if (error || !user) {
    console.warn("[v0] Admin access denied: No authenticated user")
    redirect("/")
  }

  // Check if user has admin role
  const isAdmin = user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin"

  if (!isAdmin) {
    console.warn("[v0] Admin access denied: User", user.id, "is not an admin")
    redirect("/")
  }

  return user
}

/**
 * Check if a user is an admin without redirecting
 * Useful for conditional rendering or API routes
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return false
    }

    return user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin"
  } catch {
    return false
  }
}
