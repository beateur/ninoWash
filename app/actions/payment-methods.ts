"use server"

import { stripe } from "@/lib/stripe"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Crée un Setup Intent pour collecter une carte bancaire sans paiement immédiat
 * Utilisé pour ajouter une carte à enregistrer pour usage futur
 */
export async function createSetupIntent() {
  try {
    console.log("[v0] createSetupIntent called")
    
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
      console.error("[v0] Auth error:", authError)
      throw new Error("Non autorisé")
    }

    console.log("[v0] User authenticated:", user.id)

    // Get or create Stripe customer
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    let customerId = userData?.stripe_customer_id

    console.log("[v0] Existing customer ID:", customerId)

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log("[v0] Creating new Stripe customer...")
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          user_id: user.id,
        },
      })

      customerId = customer.id
      console.log("[v0] New customer created:", customerId)

      // Save customer ID to database
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    // Create Setup Intent
    console.log("[v0] Creating setup intent for customer:", customerId)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      metadata: {
        user_id: user.id,
      },
    })

    console.log("[v0] Setup intent created:", setupIntent.id, "status:", setupIntent.status)

    return {
      clientSecret: setupIntent.client_secret!,
      customerId,
    }
  } catch (error) {
    console.error("[v0] Error creating setup intent:", error)
    throw error
  }
}
