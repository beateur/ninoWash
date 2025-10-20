/**
 * Stripe Client Configuration
 * Centralized Stripe.js initialization for frontend
 */

import { loadStripe } from "@stripe/stripe-js"

// Validate and clean the publishable key
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables")
}

// Trim the key to remove any whitespace/newlines and create Stripe promise
export const stripePromise = loadStripe(publishableKey.trim())
