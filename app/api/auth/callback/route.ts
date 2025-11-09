import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Route Handler officiel PKCE pour authentification Supabase
 * Gère : signup confirmation, password recovery, custom redirects
 * Docs: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const type = searchParams.get("type") // 'recovery' | 'signup'
  const redirectTo = searchParams.get("redirect") || "/dashboard"

  console.log("[Auth Callback API] Request received:", {
    code: code ? "present" : "missing",
    error,
    type,
    redirectTo,
  })

  // Gérer les erreurs Supabase
  if (error) {
    console.error("[Auth Callback API] Error from Supabase:", error, errorDescription)
    
    if (type === "recovery") {
      return NextResponse.redirect(
        new URL(
          `/auth/reset-password?error=${encodeURIComponent(errorDescription || error)}`,
          origin
        )
      )
    }
    
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=${encodeURIComponent(errorDescription || error)}`,
        origin
      )
    )
  }

  // Code PKCE manquant
  if (!code) {
    console.error("[Auth Callback API] No code provided")
    return NextResponse.redirect(
      new URL("/auth/signin?error=missing_code", origin)
    )
  }

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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
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
      }
    )

    // Vérifier si session existe déjà (PKCE auto-detection)
    const { data: existingSession } = await supabase.auth.getSession()
    
    if (existingSession?.session) {
      console.log("[Auth Callback API] Session already exists (auto-detection), skipping exchange")
    } else {
      // Échanger le code PKCE contre une session
      console.log("[Auth Callback API] Exchanging code for session...")
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("[Auth Callback API] Exchange error:", exchangeError)
        
        if (type === "recovery") {
          return NextResponse.redirect(
            new URL(
              `/auth/reset-password?error=${encodeURIComponent(exchangeError.message)}`,
              origin
            )
          )
        }
        
        return NextResponse.redirect(
          new URL(
            `/auth/signin?error=${encodeURIComponent(exchangeError.message)}`,
            origin
          )
        )
      }

      console.log("[Auth Callback API] Session created successfully for user:", data.user?.id)
    }

    // Redirection selon le type
    if (type === "recovery") {
      console.log("[Auth Callback API] Password recovery flow, redirecting to reset password page")
      return NextResponse.redirect(new URL("/auth/reset-password", origin))
    }

    // Signup ou autre flux → redirect custom ou dashboard
    console.log("[Auth Callback API] Redirecting to:", redirectTo)
    return NextResponse.redirect(new URL(redirectTo, origin))

  } catch (error) {
    console.error("[Auth Callback API] Unexpected error:", error)
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=${encodeURIComponent("Authentication failed")}`,
        origin
      )
    )
  }
}
