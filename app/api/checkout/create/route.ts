import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { rateLimit } from "@/lib/api/rate-limit"

const checkoutRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 checkout sessions per 15 minutes
})

export async function POST(req: Request) {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateLimitResult = await checkoutRateLimit(req, user.id)
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult
    }

    const { planId } = await req.json()

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 })
    }

    // Get plan details from database
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
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

    console.log("[v0] Checkout session created:", {
      sessionId: session.id,
      userId: user.id,
      planId,
    })

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (error) {
    console.error("[v0] Error creating checkout session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
