"use server"

import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createCheckoutSession(planId: string) {
  try {
    // Get authenticated user
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
      throw new Error("Non autorisé")
    }

    // Get plan details from database
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      throw new Error("Plan introuvable")
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined

    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .limit(1)
      .maybeSingle()

    if (existingSubscription?.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      stripeCustomerId = customer.id
    }

    // Get the origin for redirect URLs
    const headersList = await headers()
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      ui_mode: "embedded",
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
            unit_amount: Math.round(plan.price_amount * 100), // Convert to cents
            recurring:
              plan.billing_interval !== "one_time"
                ? {
                    interval:
                      plan.billing_interval === "quarterly"
                        ? "month"
                        : plan.billing_interval === "monthly"
                          ? "month"
                          : plan.billing_interval === "yearly"
                            ? "year"
                            : "month", // fallback
                    interval_count: plan.billing_interval === "quarterly" ? 3 : 1,
                  }
                : undefined,
          },
          quantity: 1,
        },
      ],
      mode: plan.billing_interval === "one_time" ? "payment" : "subscription",
      return_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        plan_id: planId,
        user_id: user.id,
      },
      subscription_data:
        plan.billing_interval !== "one_time"
          ? {
              metadata: {
                plan_id: planId,
                user_id: user.id,
              },
              trial_period_days: plan.trial_days || undefined,
            }
          : undefined,
    })

    return session.client_secret
  } catch (error) {
    console.error("[v0] Error creating checkout session:", error)
    throw error
  }
}

export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return session
  } catch (error) {
    console.error("[v0] Error retrieving checkout session:", error)
    throw error
  }
}
