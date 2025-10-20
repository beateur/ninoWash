import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables")
}

// Trim the secret key to remove any whitespace/newlines
const stripeSecretKey = process.env.STRIPE_SECRET_KEY.trim()

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
})
