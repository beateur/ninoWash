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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Get user's subscriptions with plan details
    const { data: subscriptions, error } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        subscription_plans (
          code,
          name,
          description,
          type,
          price,
          included_services,
          extra_service_price,
          features
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching subscriptions:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des abonnements" }, { status: 500 })
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSubscriptionSchema.parse(body)

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", validatedData.planId)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan d'abonnement introuvable" }, { status: 404 })
    }

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date()

    switch (plan.type) {
      case "monthly":
        endDate.setMonth(endDate.getMonth() + 1)
        break
      case "quarterly":
        endDate.setMonth(endDate.getMonth() + 3)
        break
      case "annual":
        endDate.setFullYear(endDate.getFullYear() + 1)
        break
    }

    // Create subscription
    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: validatedData.planId,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        auto_renew: validatedData.autoRenew,
        services_remaining: plan.included_services,
        payment_method_id: validatedData.paymentMethodId,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating subscription:", error)
      return NextResponse.json({ error: "Erreur lors de la création de l'abonnement" }, { status: 500 })
    }

    // Create initial payment
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: user.id,
      subscription_id: subscription.id,
      payment_method_id: validatedData.paymentMethodId,
      type: "subscription",
      amount: plan.price,
      currency: "EUR",
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
