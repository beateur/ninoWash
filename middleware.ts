import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getCorsHeaders } from "@/lib/config/cors"

// Helper to extract root domain for cookie sharing across subdomains
// e.g., "app.ninowash.com" → ".ninowash.com"
function extractRootDomain(hostname: string): string {
  const parts = hostname.split(".")
  if (parts.length > 2) {
    // Return last two parts with leading dot (e.g., ".ninowash.com")
    return "." + parts.slice(-2).join(".")
  }
  return hostname // Fallback for simple domains
}

// Define protected routes and their requirements
const PROTECTED_ROUTES = {
  // Routes requiring authentication
  auth: ["/dashboard", "/profile", "/addresses", "/payment-methods", "/subscription/manage"],
  // Note: /bookings removed - obsolete page deleted, booking list now in /dashboard
  // Note: /reservation removed - now only authenticated route is /reservation (not /reservation/guest)
  // Authenticated booking flow
  authenticatedBooking: ["/reservation"],
  // Routes requiring admin role
  admin: ["/admin"],
  // Routes requiring guest (not authenticated)
  guest: ["/auth/signin", "/auth/signup"],
  // Guest booking flow (no auth required)
  guestBooking: ["/reservation/guest"],
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
              // Share cookies across subdomains in production
              domain:
                process.env.NODE_ENV === "production" &&
                process.env.NEXT_PUBLIC_APP_URL &&
                process.env.NEXT_PUBLIC_ADMIN_URL
                  ? extractRootDomain(hostname)
                  : undefined,
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

  // Subdomain-based routing (production only)
  const hostname = request.headers.get("host") || ""
  const isAdminSubdomain = hostname.startsWith("gestion.") || hostname.includes("gestion.")
  const isAppSubdomain = hostname.startsWith("app.")

  // Only enforce subdomain routing in production with configured URLs
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_APP_URL &&
    process.env.NEXT_PUBLIC_ADMIN_URL
  ) {
    if (user) {
      const isAdmin = user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin"

      // Admin user on app subdomain → redirect to admin subdomain
      if (isAdmin && isAppSubdomain && !pathname.startsWith("/auth")) {
        const adminUrl = new URL(process.env.NEXT_PUBLIC_ADMIN_URL)
        adminUrl.pathname = pathname
        adminUrl.search = request.nextUrl.search
        console.log("[v0] Redirecting admin from app to gestion subdomain:", pathname)
        return NextResponse.redirect(adminUrl)
      }

      // Regular user on admin subdomain → redirect to app subdomain
      if (!isAdmin && isAdminSubdomain && !pathname.startsWith("/auth")) {
        const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL)
        appUrl.pathname = "/dashboard"
        console.log("[v0] Redirecting regular user from gestion to app subdomain")
        return NextResponse.redirect(appUrl)
      }
    }
  }

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

  // Check guest booking routes FIRST (before authenticated booking check)
  // /reservation/guest should be accessible to everyone (no auth required)
  if (PROTECTED_ROUTES.guestBooking.some((route) => pathname.startsWith(route))) {
    // Allow access to everyone (logged in or not)
    // If user is logged in and tries to access guest flow, allow it
    // (they might want to create a booking for someone else)
    console.log("[v0] Guest booking route accessed:", pathname, "User:", user ? "logged in" : "anonymous")
  }

  // Check authenticated booking routes
  // /reservation (without /guest) requires authentication
  if (
    PROTECTED_ROUTES.authenticatedBooking.some((route) => pathname === route || pathname.startsWith(route + "/")) &&
    !PROTECTED_ROUTES.guestBooking.some((route) => pathname.startsWith(route))
  ) {
    if (!user) {
      const redirectUrl = new URL("/auth/signin", request.url)
      redirectUrl.searchParams.set("redirect", pathname)
      console.log("[v0] Authenticated booking route requires auth:", pathname)
      return NextResponse.redirect(redirectUrl)
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
