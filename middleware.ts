import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getCorsHeaders } from "@/lib/config/cors"

// Define protected routes and their requirements
const PROTECTED_ROUTES = {
  // Routes requiring authentication
  auth: ["/dashboard", "/profile", "/addresses", "/payment-methods", "/subscription/manage"],
  // Note: /bookings removed - obsolete page deleted, booking list now in /dashboard
  // Note: /reservation removed - now only authenticated route is /reservation (not /reservation/guest)
  // Authenticated booking flow
  authenticatedBooking: ["/reservation"],
  // Routes requiring guest (not authenticated)
  guest: ["/auth/signin", "/auth/signup"],
  // Guest booking flow (no auth required)
  guestBooking: ["/reservation/guest"],
  // Booking success page (requires authentication to view booking details)
  bookingSuccess: ["/booking/"],
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
      cookieOptions: {
        name: 'sb-auth-token',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_DOMAIN 
          : undefined,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  )

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Subdomain-based routing removed - admin app is now separate project

  // Check guest booking routes FIRST (before authenticated booking check)
  // /reservation/guest should be accessible to everyone (no auth required)
  if (PROTECTED_ROUTES.guestBooking.some((route) => pathname.startsWith(route))) {
    // Allow access to everyone (logged in or not)
    // If user is logged in and tries to access guest flow, allow it
    // (they might want to create a booking for someone else)
    console.log("[v0] Guest booking route accessed:", pathname, "User:", user ? "logged in" : "anonymous")
  }

  // Check booking success pages - REQUIRE AUTHENTICATION
  // User must be logged in to view booking details and payment confirmation
  if (PROTECTED_ROUTES.bookingSuccess.some((route) => pathname.startsWith(route))) {
    const sessionId = request.nextUrl.searchParams.get("session_id")
    
    // EXCEPTION: Si session_id présent (retour de Stripe), permettre l'accès temporaire
    // La page elle-même gérera l'authentification/création de compte
    if (sessionId) {
      console.log("[v0] Stripe redirect detected (session_id present), allowing access:", pathname)
      // Continue - allow access even without auth
    } else if (!user) {
      // Pas de session Stripe ET pas d'utilisateur authentifié → forcer login
      const redirectUrl = new URL("/auth/signin", request.url)
      redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search)
      console.log("[v0] Booking success page requires auth, redirecting to login:", pathname)
      return NextResponse.redirect(redirectUrl)
    } else {
      console.log("[v0] Booking success page accessed by authenticated user:", pathname)
    }
  }

  // FEATURE FLAG GUARD: Block subscription access if flag OFF
  // Check for /reservation?service=monthly or /reservation?service=quarterly
  if (
    pathname.startsWith("/reservation") &&
    !PROTECTED_ROUTES.guestBooking.some((route) => pathname.startsWith(route))
  ) {
    const searchParams = request.nextUrl.searchParams
    const serviceType = searchParams.get("service")
    const isSubscription = serviceType && serviceType !== "classic"
    const subscriptionsEnabled = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED === "true"

    if (isSubscription && !subscriptionsEnabled) {
      const redirectUrl = new URL("/pricing", request.url)
      redirectUrl.searchParams.set("locked", "1")
      console.log("[v0] Middleware - subscription access blocked (flag OFF):", serviceType)
      return NextResponse.redirect(redirectUrl)
    }
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
    console.log("[v0] Middleware - Guest route detected:", pathname, "User:", user ? "authenticated" : "anonymous")
    if (user) {
      console.log("[v0] Middleware - Redirecting authenticated user to dashboard")
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
