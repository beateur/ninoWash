import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string }
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

  if (searchParams.error) {
    redirect("/auth/signin?error=" + encodeURIComponent(searchParams.error))
  }

  if (searchParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code)

    if (error) {
      redirect("/auth/signin?error=" + encodeURIComponent(error.message))
    }

    // Get user to check role for subdomain routing
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const isAdmin = user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin"

      // Redirect based on role and environment
      if (isAdmin && process.env.NEXT_PUBLIC_ADMIN_URL) {
        // Admin user → redirect to admin subdomain
        const adminUrl = new URL(process.env.NEXT_PUBLIC_ADMIN_URL)
        adminUrl.pathname = "/admin"
        redirect(adminUrl.toString())
      } else if (!isAdmin && process.env.NEXT_PUBLIC_APP_URL) {
        // Regular user → redirect to app subdomain
        const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL)
        appUrl.pathname = "/dashboard"
        redirect(appUrl.toString())
      }
    }
  }

  // Fallback to dashboard if env vars not set (local dev)
  redirect("/dashboard")
}
