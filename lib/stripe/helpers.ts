import type Stripe from "stripe"
import { stripe } from "./config"

/**
 * Stripe helper functions for common operations
 */

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string
  email: string
  name?: string
  metadata?: Record<string, string>
}): Promise<string> {
  try {
    // Try to find existing customer
    const customers = await stripe.customers.list({
      email: params.email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      return customers.data[0].id
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        supabase_user_id: params.userId,
        ...params.metadata,
      },
    })

    return customer.id
  } catch (error) {
    console.error("[v0] Error getting/creating Stripe customer:", error)
    throw new Error("Failed to create Stripe customer")
  }
}

/**
 * Create a checkout session with proper error handling
 */
export async function createStripeCheckoutSession(params: {
  customerId: string
  priceId?: string
  priceData?: Stripe.Checkout.SessionCreateParams.LineItem.PriceData
  mode: "payment" | "subscription"
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
  trialDays?: number
}): Promise<Stripe.Checkout.Session> {
  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    if (params.priceId) {
      lineItems.push({
        price: params.priceId,
        quantity: 1,
      })
    } else if (params.priceData) {
      lineItems.push({
        price_data: params.priceData,
        quantity: 1,
      })
    } else {
      throw new Error("Either priceId or priceData must be provided")
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: params.customerId,
      ui_mode: "embedded",
      line_items: lineItems,
      mode: params.mode,
      return_url: params.successUrl,
      metadata: params.metadata,
    }

    // Add subscription-specific parameters
    if (params.mode === "subscription" && params.trialDays) {
      sessionParams.subscription_data = {
        trial_period_days: params.trialDays,
        metadata: params.metadata,
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return session
  } catch (error) {
    console.error("[v0] Error creating checkout session:", error)
    throw new Error("Failed to create checkout session")
  }
}

/**
 * Cancel a subscription with proper error handling
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd = true,
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    })

    return subscription
  } catch (error) {
    console.error("[v0] Error canceling subscription:", error)
    throw new Error("Failed to cancel subscription")
  }
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    return subscription
  } catch (error) {
    console.error("[v0] Error reactivating subscription:", error)
    throw new Error("Failed to reactivate subscription")
  }
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return session
  } catch (error) {
    console.error("[v0] Error creating billing portal session:", error)
    throw new Error("Failed to create billing portal session")
  }
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(payload: string, signature: string, secret: string): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret)
  } catch (error) {
    console.error("[v0] Webhook signature validation failed:", error)
    throw new Error("Invalid webhook signature")
  }
}

/**
 * Format amount from cents to currency
 */
export function formatStripeAmount(amountInCents: number, currency = "eur"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100)
}

/**
 * Convert amount to cents
 */
export function amountToCents(amount: number): number {
  return Math.round(amount * 100)
}
