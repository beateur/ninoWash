import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createSubscriptionSchema } from "@/lib/validations/payment"
import { cookies } from "next/headers"

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn("[v0] Unauthorized access attempt to /api/subscriptions")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!user.id || typeof user.id !== "string") {
      console.error("[v0] Invalid user ID:", user.id)
      return NextResponse.json({ error: "ID utilisateur invalide" }, { status: 400 })
    }

    // Get user's subscriptions with plan details
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_plans (
          id,
          name,
          description,
          plan_type,
          price_amount,
          billing_interval,
          currency,
          features,
          trial_days,
          is_active
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching subscriptions:", error.message)
      return NextResponse.json({ error: "Erreur lors de la récupération des abonnements" }, { status: 500 })
    }

    if (!Array.isArray(subscriptions)) {
      console.error("[v0] Invalid subscriptions data type:", typeof subscriptions)
      return NextResponse.json({ subscriptions: [] })
    }

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("[v0] Subscriptions API error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn("[v0] Unauthorized subscription creation attempt")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] Invalid JSON in request body:", parseError)
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    const validatedData = createSubscriptionSchema.parse(body)

    if (!validatedData.planId || typeof validatedData.planId !== "string") {
      return NextResponse.json({ error: "ID de plan invalide" }, { status: 400 })
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", validatedData.planId)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      console.error("[v0] Plan not found:", validatedData.planId, planError)
      return NextResponse.json({ error: "Plan d'abonnement introuvable" }, { status: 404 })
    }

    if (!plan.billing_interval || !plan.price_amount) {
      console.error("[v0] Invalid plan data:", plan)
      return NextResponse.json({ error: "Données de plan invalides" }, { status: 500 })
    }

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date()

    switch (plan.billing_interval) {
      case "monthly":
        endDate.setMonth(endDate.getMonth() + 1)
        break
      case "quarterly":
        endDate.setMonth(endDate.getMonth() + 3)
        break
      case "annual":
        endDate.setFullYear(endDate.getFullYear() + 1)
        break
      default:
        console.error("[v0] Unknown billing interval:", plan.billing_interval)
        return NextResponse.json({ error: "Intervalle de facturation invalide" }, { status: 400 })
    }

    // Create subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_id: validatedData.planId,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        auto_renew: validatedData.autoRenew,
        services_remaining: plan.features,
        payment_method_id: validatedData.paymentMethodId,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating subscription:", error)
      return NextResponse.json({ error: "Erreur lors de la création de l'abonnement" }, { status: 500 })
    }

    if (!subscription || !subscription.id) {
      console.error("[v0] Subscription created but no data returned")
      return NextResponse.json({ error: "Erreur lors de la création de l'abonnement" }, { status: 500 })
    }

    // Create initial payment
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: user.id,
      subscription_id: subscription.id,
      payment_method_id: validatedData.paymentMethodId,
      type: "subscription",
      amount: plan.price_amount,
      currency: plan.currency,
      status: "succeeded", // In real app, this would be handled by payment processor
      description: `Abonnement ${plan.name}`,
      processed_at: new Date().toISOString(),
    })

    if (paymentError) {
      console.error("[v0] Error creating subscription payment:", paymentError)
      // In a real app, you'd rollback the subscription creation
    }

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error) {
    console.error("[v0] Subscription creation error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
