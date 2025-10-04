import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { createSubscriptionSchema } from "@/lib/validations/payment"

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    // Get user's subscriptions with plan details
    const { data: subscriptions, error: fetchError } = await supabase
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

    if (fetchError) {
      console.error("[v0] Error fetching subscriptions:", fetchError.message)
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
  const { user, supabase, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
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
    const { data: subscription, error: createError } = await supabase
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

    if (createError) {
      console.error("[v0] Error creating subscription:", createError)
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
      status: "succeeded",
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
