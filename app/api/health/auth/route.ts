import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
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

    // Test auth service availability
    const { data, error } = await supabase.auth.getSession()

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      auth_service: "available",
      session_check: error ? "failed" : "passed",
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        auth_service: "unavailable",
        error: error instanceof Error ? error.message : "Auth service check failed",
      },
      { status: 500 },
    )
  }
}
