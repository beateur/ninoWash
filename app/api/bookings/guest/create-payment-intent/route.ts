/**
 * Create Stripe Payment Intent for Guest Booking
 * POST /api/bookings/guest/create-payment-intent
 * 
 * Flow:
 * 1. Validate booking data (Zod)
 * 2. Calculate total amount from services
 * 3. Create Stripe Payment Intent
 * 4. Return clientSecret for frontend
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import Stripe from "stripe"

// Initialize Stripe with secret key (server-side only)
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
})

// Validation schema for payment intent creation
const createPaymentIntentSchema = z.object({
  // Contact info
  guestEmail: z.string().email(),
  guestName: z.string().min(2),
  guestPhone: z.string().min(10),

  // Services
  services: z.array(
    z.object({
      serviceId: z.string().uuid(),
      serviceName: z.string(),
      quantity: z.number().min(1).max(50),
      unitPrice: z.number().positive(),
    })
  ).min(1, "Au moins un service requis"),

  // Addresses
  pickupAddress: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    postalCode: z.string().regex(/^75[0-9]{3}$/),
  }),

  deliveryAddress: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    postalCode: z.string().regex(/^75[0-9]{3}$/),
  }),

  // DateTime
  pickupDate: z.string().datetime(),
  pickupTimeSlot: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    console.log("[v0] Create Payment Intent - Request:", JSON.stringify(body, null, 2))

    const validatedData = createPaymentIntentSchema.safeParse(body)

    if (!validatedData.success) {
      console.error("[v0] Validation failed:", validatedData.error.issues)
      return NextResponse.json(
        {
          error: "Données de réservation invalides",
          issues: validatedData.error.issues,
        },
        { status: 400 }
      )
    }

    const data = validatedData.data

    // Calculate total amount (in cents for Stripe)
    const totalAmount = data.services.reduce(
      (sum, service) => sum + service.quantity * service.unitPrice,
      0
    )

    const amountInCents = Math.round(totalAmount * 100)

    console.log("[v0] Total amount:", totalAmount, "€ →", amountInCents, "cents")

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        // Store booking metadata for webhook processing
        guestEmail: data.guestEmail,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        pickupDate: data.pickupDate,
        pickupTimeSlot: data.pickupTimeSlot,
        pickupAddress: JSON.stringify(data.pickupAddress),
        deliveryAddress: JSON.stringify(data.deliveryAddress),
        services: JSON.stringify(
          data.services.map((s) => ({
            id: s.serviceId,
            name: s.serviceName,
            quantity: s.quantity,
            price: s.unitPrice,
          }))
        ),
        bookingType: "guest",
        createdAt: new Date().toISOString(),
      },
      description: `Réservation Nino Wash - ${data.guestName}`,
      receipt_email: data.guestEmail,
    })

    console.log("[v0] Payment Intent created:", paymentIntent.id)

    // Return clientSecret to frontend
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
    })
  } catch (error: any) {
    console.error("[v0] Failed to create Payment Intent:", error)

    // Stripe-specific errors
    if (error.type === "StripeCardError") {
      return NextResponse.json(
        { error: "Erreur de carte bancaire", details: error.message },
        { status: 400 }
      )
    }

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { error: "Requête invalide", details: error.message },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    )
  }
}
