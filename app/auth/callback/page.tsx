import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string; type?: string }
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
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  // Gérer les erreurs selon le type
  if (searchParams.error) {
    // Si c'est un reset password, rediriger vers la page de reset avec l'erreur
    if (searchParams.type === "recovery") {
      redirect("/auth/reset-password?error=" + encodeURIComponent(searchParams.error))
    }
    redirect("/auth/signin?error=" + encodeURIComponent(searchParams.error))
  }

  if (searchParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code)

    if (error) {
      // Si c'est un reset password, rediriger vers la page de reset avec l'erreur
      if (searchParams.type === "recovery") {
        redirect("/auth/reset-password?error=" + encodeURIComponent(error.message))
      }
      redirect("/auth/signin?error=" + encodeURIComponent(error.message))
    }

    // Si reset password, rediriger vers /auth/reset-password avec session active
    if (searchParams.type === "recovery") {
      redirect("/auth/reset-password")
    }

    // Sinon, redirection normale vers dashboard
    redirect("/dashboard")
  }

  // Fallback to dashboard if env vars not set (local dev)
  redirect("/dashboard")
}
