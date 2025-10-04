import { serverAuth } from "@/lib/services/auth.service.server"
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
  try {
    await serverAuth.requireAdmin()
  } catch (error) {
    console.warn("[v0] Admin access denied:", error)
    redirect("/")
  }
}

/**
 * Check if a user is an admin without redirecting
 * Useful for conditional rendering or API routes
 */
export async function isAdmin(): Promise<boolean> {
  return await serverAuth.isAdmin()
}
