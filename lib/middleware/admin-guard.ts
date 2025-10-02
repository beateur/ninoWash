import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/**
 * Admin Guard Middleware
 * Verifies that the user has admin role before allowing access
 * Used for protecting admin routes and API endpoints
 */
export async function withAdminGuard(handler: (request: Request, context?: any) => Promise<NextResponse>) {
  return async (request: Request, context?: any) => {
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

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      // Check if user is authenticated
      if (authError || !user) {
        console.warn("[v0] Admin guard: Unauthenticated access attempt", {
          path: new URL(request.url).pathname,
          timestamp: new Date().toISOString(),
        })
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Check if user has admin role
      const role = user.user_metadata?.role
      if (role !== "admin") {
        console.warn("[v0] Admin guard: Non-admin access attempt", {
          userId: user.id,
          role: role || "none",
          path: new URL(request.url).pathname,
          timestamp: new Date().toISOString(),
        })
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // User is admin, proceed with handler
      return handler(request, context)
    } catch (error) {
      console.error("[v0] Admin guard error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}
