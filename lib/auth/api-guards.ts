import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * API Route Guards for protecting API endpoints
 * Returns NextResponse with appropriate error status codes
 */

export interface ApiGuardResult {
  user: any
  supabase: any
  error?: NextResponse
}

/**
 * Require authentication for API routes
 */
export async function apiRequireAuth(request: NextRequest): Promise<ApiGuardResult> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll() {
          // Not needed for API routes
        },
      },
    },
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      user: null,
      supabase,
      error: NextResponse.json({ error: "Unauthorized - Authentication required" }, { status: 401 }),
    }
  }

  return { user, supabase }
}

/**
 * Require API key authentication
 */
export async function apiRequireApiKey(request: NextRequest): Promise<{ apiKey: any; error?: NextResponse }> {
  const apiKeyHeader = request.headers.get("x-api-key")

  if (!apiKeyHeader) {
    return {
      apiKey: null,
      error: NextResponse.json({ error: "Unauthorized - API key required" }, { status: 401 }),
    }
  }

  // Validate API key against database
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll() {},
      },
    },
  )

  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", apiKeyHeader)
    .eq("is_active", true)
    .maybeSingle()

  if (!apiKey) {
    return {
      apiKey: null,
      error: NextResponse.json({ error: "Unauthorized - Invalid API key" }, { status: 401 }),
    }
  }

  // Check if API key is expired
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return {
      apiKey: null,
      error: NextResponse.json({ error: "Unauthorized - API key expired" }, { status: 401 }),
    }
  }

  // Update last_used_at
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id)

  return { apiKey }
}

/**
 * Rate limiting check for API routes
 */
export async function apiCheckRateLimit(
  request: NextRequest,
  identifier: string,
  limit = 100,
  windowMs = 60000,
): Promise<{ allowed: boolean; error?: NextResponse }> {
  // This is a simple in-memory rate limiter
  // In production, use Redis or a dedicated rate limiting service

  // For now, always allow (implement proper rate limiting with Redis/Upstash)
  return { allowed: true }
}
