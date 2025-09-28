import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerClient()

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
