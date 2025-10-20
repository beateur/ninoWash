import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables")
}

// Trim the secret key to remove any whitespace/newlines
const stripeSecretKey = process.env.STRIPE_SECRET_KEY.trim()

// Stripe configuration with retry and timeout settings
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 30000, // 30 seconds
  telemetry: false, // Disable telemetry for privacy
})

// Stripe webhook configuration
export const STRIPE_WEBHOOK_CONFIG = {
  secret: process.env.STRIPE_WEBHOOK_SECRET!,
  tolerance: 300, // 5 minutes tolerance for timestamp validation
}

// Stripe price configuration
export const STRIPE_CURRENCY = "eur"
export const STRIPE_MIN_AMOUNT = 50 // 0.50 EUR in cents
export const STRIPE_MAX_AMOUNT = 999999 // 9999.99 EUR in cents
