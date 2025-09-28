import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string }
}) {
  const supabase = await createServerSupabaseClient()

  if (searchParams.error) {
    redirect("/auth/signin?error=" + encodeURIComponent(searchParams.error))
  }

  if (searchParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code)

    if (error) {
      redirect("/auth/signin?error=" + encodeURIComponent(error.message))
    }
  }

  // Successful authentication, redirect to dashboard
  redirect("/dashboard")
}
