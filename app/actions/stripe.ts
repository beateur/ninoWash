"use server"

import { headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  getOrCreateStripeCustomer,
  createStripeCheckoutSession,
  cancelStripeSubscription,
  reactivateStripeSubscription,
  createBillingPortalSession,
  amountToCents,
} from "@/lib/stripe"

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

    const stripeCustomerId = await getOrCreateStripeCustomer({
      userId: user.id,
      email: user.email!,
      name: `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim(),
    })

    // Get the origin for redirect URLs
    const headersList = await headers()
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await createStripeCheckoutSession({
      customerId: stripeCustomerId,
      priceData: {
        currency: plan.currency.toLowerCase(),
        product_data: {
          name: plan.name,
          description: plan.description || undefined,
        },
        unit_amount: amountToCents(plan.price_amount),
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
                        : "month",
                interval_count: plan.billing_interval === "quarterly" ? 3 : 1,
              }
            : undefined,
      },
      mode: plan.billing_interval === "one_time" ? "payment" : "subscription",
      successUrl: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/subscription`,
      metadata: {
        plan_id: planId,
        user_id: user.id,
      },
      trialDays: plan.trial_days || undefined,
    })

    return session.client_secret
  } catch (error) {
    console.error("[v0] Error creating checkout session:", error)
    throw error
  }
}

export async function cancelSubscription(subscriptionId: string, immediate = false) {
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
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Non autorisé")
    }

    // Get subscription from database
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single()

    if (!subscription?.stripe_subscription_id) {
      throw new Error("Abonnement introuvable")
    }

    await cancelStripeSubscription(subscription.stripe_subscription_id, !immediate)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error canceling subscription:", error)
    throw error
  }
}

export async function reactivateSubscription(subscriptionId: string) {
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
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Non autorisé")
    }

    // Get subscription from database
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single()

    if (!subscription?.stripe_subscription_id) {
      throw new Error("Abonnement introuvable")
    }

    await reactivateStripeSubscription(subscription.stripe_subscription_id)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error reactivating subscription:", error)
    throw error
  }
}

export async function createPortalSession() {
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
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Non autorisé")
    }

    // Get customer ID from subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .limit(1)
      .single()

    if (!subscription?.stripe_customer_id) {
      throw new Error("Aucun abonnement trouvé")
    }

    const headersList = await headers()
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await createBillingPortalSession(subscription.stripe_customer_id, `${origin}/subscription/manage`)

    return session.url
  } catch (error) {
    console.error("[v0] Error creating portal session:", error)
    throw error
  }
}
