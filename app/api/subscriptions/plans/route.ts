import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get all active subscription plans
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching subscription plans:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des plans" }, { status: 500 })
    }

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("[v0] Subscription plans API error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
