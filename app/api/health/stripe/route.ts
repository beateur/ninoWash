import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function GET() {
  try {
    // Test Stripe API connectivity
    await stripe.accounts.retrieve()

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      stripe_service: "available",
      api_version: "2024-06-20",
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        stripe_service: "unavailable",
        error: error instanceof Error ? error.message : "Stripe service check failed",
      },
      { status: 500 },
    )
  }
}
