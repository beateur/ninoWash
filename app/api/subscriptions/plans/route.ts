import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Force dynamic rendering (uses cookies)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    // This allows users to see plans before signing up
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .eq("is_public", true)
      .order("sort_order", { ascending: true })
      .order("price_amount", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching subscription plans:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des plans" }, { status: 500 })
    }

    if (!Array.isArray(plans)) {
      console.error("[v0] Invalid plans data type:", typeof plans)
      return NextResponse.json({ plans: [] })
    }

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("[v0] Subscription plans API error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
