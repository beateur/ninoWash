// This file is kept for backward compatibility but should not be used in new code
// Use /api/checkout/create and /api/checkout/session instead

"use server"

export async function createCheckoutSession(planId: string) {
  // Redirect to use the new API route pattern
  console.warn("[v0] createCheckoutSession Server Action is deprecated. Use /api/checkout/create instead.")
  throw new Error("This Server Action is deprecated. Please use the /api/checkout/create API route instead.")
}

export async function getCheckoutSession(sessionId: string) {
  console.warn("[v0] getCheckoutSession Server Action is deprecated. Use /api/checkout/session instead.")
  throw new Error("This Server Action is deprecated. Please use the /api/checkout/session API route instead.")
}
