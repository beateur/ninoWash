"use server"

import { headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  stripe,
  getOrCreateStripeCustomer,
  createStripeCheckoutSession,
  cancelStripeSubscription,
  reactivateStripeSubscription,
  createBillingPortalSession,
  amountToCents,
} from "@/lib/stripe/index"

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

    // Check if user has an existing active subscription (cancelled = false)
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, plan_id, total_amount, current_period_end")
      .eq("user_id", user.id)
      .eq("cancelled", false)
      .maybeSingle()

    // If changing subscription (not first subscription), handle upgrade/downgrade intelligently
    if (existingSubscription && existingSubscription.plan_id !== planId) {
      console.log("[v0] User is changing subscription from plan", existingSubscription.plan_id, "to", planId)
      
      const oldPlanPrice = existingSubscription.total_amount || 0
      const newPlanPrice = plan.price_amount
      const isUpgrade = newPlanPrice > oldPlanPrice
      
      console.log("[v0] Change type:", isUpgrade ? "UPGRADE" : "DOWNGRADE", {
        oldPrice: oldPlanPrice,
        newPrice: newPlanPrice,
      })
      
      try {
        if (isUpgrade) {
          // UPGRADE: Cancel old subscription and create new one
          // Stripe will automatically apply proration credit when using the same customer
          console.log("[v0] Processing upgrade: canceling old subscription immediately")
          
          // Get subscription details from Stripe for proration calculation
          const stripeSubscription = await stripe.subscriptions.retrieve(
            existingSubscription.stripe_subscription_id
          )
          
          const now = Math.floor(Date.now() / 1000)
          // @ts-expect-error - Stripe types don't include current_period_end but it exists at runtime
          const periodEnd = stripeSubscription.current_period_end
          const daysRemaining = Math.ceil((periodEnd - now) / 86400)
          
          console.log("[v0] Upgrade proration info:", {
            daysRemaining,
            periodEnd: new Date(periodEnd * 1000).toISOString(),
            note: "Proration credit will be applied automatically by Stripe in new checkout",
          })
          
          // Cancel old subscription immediately
          await stripe.subscriptions.cancel(existingSubscription.stripe_subscription_id)
          
          // Mark as cancelled in DB (soft delete - keeps history)
          await supabase
            .from("subscriptions")
            .update({ 
              cancelled: true,
              status: "canceled",
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("id", existingSubscription.id)
          
          console.log("[v0] Old subscription cancelled for upgrade")
          
        } else {
          // DOWNGRADE: Schedule change at period end to avoid losing paid time
          console.log("[v0] Processing downgrade: scheduling change at period end")
          
          const stripeSubscription = await stripe.subscriptions.retrieve(
            existingSubscription.stripe_subscription_id
          )
          
          // Update subscription to cancel at period end with metadata about the planned change
          await stripe.subscriptions.update(existingSubscription.stripe_subscription_id, {
            cancel_at_period_end: true,
            metadata: {
              ...stripeSubscription.metadata,
              scheduled_plan_change: planId,
              scheduled_plan_name: plan.name,
              scheduled_at: new Date().toISOString(),
            }
          })
          
          // Update database to reflect scheduled cancellation
          await supabase
            .from("subscriptions")
            .update({ 
              cancel_at_period_end: true,
              updated_at: new Date().toISOString()
            })
            .eq("id", existingSubscription.id)
          
          // @ts-expect-error - Stripe types don't include current_period_end but it exists at runtime
          const periodEndDate = new Date(stripeSubscription.current_period_end * 1000)
          
          console.log("[v0] Downgrade scheduled for:", periodEndDate.toISOString())
          
          // Return special response indicating scheduled change
          return JSON.stringify({
            type: 'scheduled_downgrade',
            message: `Votre changement d'abonnement sera effectif le ${periodEndDate.toLocaleDateString('fr-FR')}. Vous continuerez à profiter de votre abonnement actuel jusqu'à cette date.`,
            effectiveDate: periodEndDate.toISOString(),
            currentPeriodEnd: periodEndDate.toISOString(),
            newPlanName: plan.name,
          })
        }
        
      } catch (error) {
        console.error("[v0] Error handling subscription change:", error)
        // Continue anyway - webhook will handle it
      }
    }

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

    console.log("[v0] Checkout session created:", {
      sessionId: session.id,
      clientSecret: session.client_secret ? "present" : "missing",
      customerId: stripeCustomerId,
      planId: planId,
    })

    // CRITICAL: client_secret must always exist for embedded checkout
    if (!session.client_secret) {
      throw new Error("Stripe session created but client_secret is missing")
    }

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
