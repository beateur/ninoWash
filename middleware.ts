import { createServerClient } from "@supabase/ssr"
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

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  // Protected routes
  const protectedPaths = ["/dashboard", "/profile", "/bookings", "/addresses", "/admin"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const redirectUrl = new URL("/auth/signin", request.url)
      redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Admin route protection
    if (request.nextUrl.pathname.startsWith("/admin")) {
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (profile?.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
  }

  // Apply security headers to supabase response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value)
  })

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
