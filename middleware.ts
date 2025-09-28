import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"
import { rateLimiter, securityHeaders } from "@/lib/security"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const identifier = request.ip || "anonymous"
    const isAllowed = rateLimiter.isAllowed(identifier, {
      windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
      maxRequests: Number.parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || "60"),
    })

    if (!isAllowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
          ...securityHeaders,
        },
      })
    }
  }

  const supabaseResponse = await updateSession(request)

  // Apply security headers to supabase response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value)
  })

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
