import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getCorsHeaders } from "@/lib/config/cors"

// Define protected routes and their requirements
const PROTECTED_ROUTES = {
  // Routes requiring authentication
  auth: ["/dashboard", "/profile", "/reservation", "/subscription/manage"],
  // Note: /bookings removed - obsolete page deleted, booking list now in /dashboard
  // Routes requiring admin role
  admin: ["/admin"],
  // Routes requiring guest (not authenticated)
  guest: ["/auth/signin", "/auth/signup"],
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname
  const origin = request.headers.get("origin")

  if (request.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(origin)
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Create Supabase client
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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: options?.httpOnly ?? true,
              secure: process.env.NODE_ENV === "production",
              sameSite: (options?.sameSite as "lax" | "strict" | "none") ?? "lax",
            })
          })
        },
      },
    },
  )

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if route requires admin access
  if (PROTECTED_ROUTES.admin.some((route) => pathname.startsWith(route))) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const isAdmin = user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin"

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // Check if route requires authentication
  if (PROTECTED_ROUTES.auth.some((route) => pathname.startsWith(route))) {
    if (!user) {
      const redirectUrl = new URL("/auth/signin", request.url)
      redirectUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check if route requires guest (redirect authenticated users)
  if (PROTECTED_ROUTES.guest.some((route) => pathname.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Only add HSTS in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }

  response.headers.set("X-XSS-Protection", "1; mode=block")

  if (pathname.startsWith("/api/")) {
    const corsHeaders = getCorsHeaders(origin)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  return response
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
