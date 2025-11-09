import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string; type?: string; redirect?: string }
}) {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            console.log('Cookies will be set after redirect')
          }
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

  // Gérer les erreurs
  if (searchParams.error) {
    if (searchParams.type === "recovery") {
      redirect("/auth/reset-password?error=" + encodeURIComponent(searchParams.error))
    }
    redirect("/auth/signin?error=" + encodeURIComponent(searchParams.error))
  }

  if (searchParams.code) {
    // ✅ FIX: Vérifier si session existe déjà (auto-détection PKCE)
    const { data: existingSessionData } = await supabase.auth.getSession()
    
    let sessionUser = existingSessionData?.session?.user

    if (!sessionUser) {
      // Pas de session auto-détectée, faire échange manuel
      const { data, error } = await supabase.auth.exchangeCodeForSession(searchParams.code)

      if (error) {
        if (searchParams.type === "recovery") {
          redirect("/auth/reset-password?error=" + encodeURIComponent(error.message))
        }
        redirect("/auth/signin?error=" + encodeURIComponent(error.message))
      }

      sessionUser = data?.user
    }

    // Détecter type de recovery
    const isPasswordRecovery = sessionUser?.user_metadata?.iss?.includes('recovery') || 
                               searchParams.type === "recovery"

    if (isPasswordRecovery) {
      redirect("/auth/reset-password")
    }

    // ✅ FIX: Gérer redirect custom (post-booking)
    const redirectTo = searchParams.redirect || "/dashboard"
    redirect(redirectTo)
  }

  redirect("/dashboard")
}
