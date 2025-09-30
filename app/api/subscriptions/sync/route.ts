import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { stripe } from "@/lib/stripe"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Syncing subscriptions for user:", user.id, "email:", user.email)

    let stripeCustomerId: string | null = null

    // First, try to get customer ID from existing subscriptions
    const { data: existingSubscriptions } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .limit(1)
      .maybeSingle()

    if (existingSubscriptions?.stripe_customer_id) {
      stripeCustomerId = existingSubscriptions.stripe_customer_id
      console.log("[v0] Found existing customer ID:", stripeCustomerId)
    } else {
      // Search for customer by email in Stripe
      console.log("[v0] No existing customer ID, searching Stripe by email...")
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
        console.log("[v0] Found customer in Stripe:", stripeCustomerId)
      }
    }

    if (!stripeCustomerId) {
      console.log("[v0] No Stripe customer found for email:", user.email)
      return NextResponse.json({ error: "No Stripe customer found for your email" }, { status: 404 })
    }

    // Get all active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 10,
    })

    console.log("[v0] Found subscriptions in Stripe:", subscriptions.data.length)

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: "No subscriptions found in Stripe" }, { status: 404 })
    }

    // Use service role key for database operations
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    let syncedCount = 0

    // Sync each subscription
    for (const subscription of subscriptions.data) {
      console.log("[v0] Processing subscription:", subscription.id, "status:", subscription.status)

      // Check if subscription already exists
      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("stripe_subscription_id", subscription.id)
        .maybeSingle()

      let planId = subscription.metadata?.planId

      if (!planId && subscription.items.data.length > 0) {
        // Try to find plan by price amount
        const priceId = subscription.items.data[0].price.id
        console.log("[v0] No planId in metadata, trying to match by Stripe price:", priceId)

        // Get the price details
        const price = await stripe.prices.retrieve(priceId)
        const amount = price.unit_amount ? price.unit_amount / 100 : 0
        const interval = price.recurring?.interval

        console.log("[v0] Price details - amount:", amount, "interval:", interval)

        // Try to find matching plan in database
        const { data: matchingPlan } = await supabaseAdmin
          .from("subscription_plans")
          .select("id")
          .eq("price_amount", amount)
          .eq("billing_interval", interval === "month" ? "monthly" : interval === "year" ? "yearly" : "monthly")
          .maybeSingle()

        if (matchingPlan) {
          planId = matchingPlan.id
          console.log("[v0] Found matching plan:", planId)
        }
      }

      if (!planId) {
        console.log("[v0] Skipping subscription without planId:", subscription.id)
        continue
      }

      const subscriptionData = {
        user_id: user.id,
        plan_id: planId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      }

      if (existing) {
        // Update existing subscription
        const { error } = await supabaseAdmin.from("subscriptions").update(subscriptionData).eq("id", existing.id)

        if (error) {
          console.error("[v0] Error updating subscription:", error)
        } else {
          console.log("[v0] Updated subscription:", subscription.id)
          syncedCount++
        }
      } else {
        // Insert new subscription
        const { error } = await supabaseAdmin.from("subscriptions").insert(subscriptionData)

        if (error) {
          console.error("[v0] Error inserting subscription:", error)
        } else {
          console.log("[v0] Inserted subscription:", subscription.id)
          syncedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      total: subscriptions.data.length,
    })
  } catch (error) {
    console.error("[v0] Error syncing subscriptions:", error)
    return NextResponse.json({ error: "Failed to sync subscriptions" }, { status: 500 })
  }
}
