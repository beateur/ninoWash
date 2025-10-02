import { NextResponse } from "next/server"

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  process.env.PRODUCTION_URL,
  process.env.STAGING_URL,
].filter(Boolean) as string[]

export function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {}

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
    headers["Access-Control-Allow-Credentials"] = "true"
    headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    headers["Access-Control-Max-Age"] = "86400"
  }

  return headers
}

export function withCors(handler: (req: Request) => Promise<NextResponse>) {
  return async (req: Request) => {
    const origin = req.headers.get("origin")

    // Handle preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin),
      })
    }

    // Block unauthorized origins
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      console.warn("[v0] Blocked request from unauthorized origin:", origin)
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Execute handler
    const response = await handler(req)

    // Add CORS headers to response
    const headers = corsHeaders(origin)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}
