/**
 * Guest Booking Orchestration API
 * Complete flow: Verify payment → Create account → Create booking → Save addresses → Send email
 * 
 * POST /api/bookings/guest
 * 
 * This endpoint is called after successful Stripe payment confirmation.
 * It orchestrates the complete guest booking flow with retry logic and error handling.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { withRetry } from "@/lib/utils/retry"

// =====================================================
// Validation Schema
// =====================================================

const createGuestBookingSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment Intent ID requis"),
})

// =====================================================
// Types
// =====================================================

interface BookingMetadata {
  guestEmail: string
  guestName: string
  guestPhone: string
  services: string // JSON stringified array
  pickupAddress: string // JSON stringified object
  deliveryAddress: string // JSON stringified object
  pickupDate: string
  pickupTimeSlot: string
}

// =====================================================
// Main Handler
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json()
    const result = createGuestBookingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation échouée", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { paymentIntentId } = result.data

    console.log("[v0] Guest booking orchestration started:", paymentIntentId)

    // 2. Verify Stripe payment succeeded
    console.log("[v0] Step 1: Verifying Stripe payment...")
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      console.error("[v0] Payment not succeeded:", paymentIntent.status)
      return NextResponse.json(
        { error: "Le paiement n'a pas été finalisé" },
        { status: 400 }
      )
    }

    // 3. Extract metadata from Payment Intent
    const metadata = paymentIntent.metadata as unknown as BookingMetadata
    const {
      guestEmail,
      guestName,
      guestPhone,
      services: servicesJson,
      pickupAddress: pickupAddressJson,
      deliveryAddress: deliveryAddressJson,
      pickupDate,
      pickupTimeSlot,
    } = metadata

    // Parse JSON strings
    const services = JSON.parse(servicesJson)
    const pickupAddress = JSON.parse(pickupAddressJson)
    const deliveryAddress = JSON.parse(deliveryAddressJson)

    console.log("[v0] Payment verified:", {
      email: guestEmail,
      amount: paymentIntent.amount,
      servicesCount: services.length,
    })

    // 4. Create user account with retry logic (3 attempts)
    console.log("[v0] Step 2: Creating user account...")
    const supabase = createAdminClient()

    let userId: string
    try {
      const userData = await withRetry(
        async () => {
          const result = await supabase.auth.admin.createUser({
            email: guestEmail,
            email_confirm: true, // Auto-confirm email for guest bookings
            user_metadata: {
              full_name: guestName,
              phone: guestPhone,
              source: "guest_booking",
            },
          })

          if (result.error) throw result.error
          if (!result.data?.user) throw new Error("No user data returned")
          return result.data
        },
        {
          retries: 3,
          delay: 2000, // 2 seconds initial delay
          onRetry: (attempt, error) => {
            console.warn(
              `[v0] User creation retry ${attempt}/3:`,
              error.message
            )
          },
        }
      )

      if (!userData?.user) {
        throw new Error("Failed to create user after retries")
      }

      userId = userData.user.id
      console.log("[v0] User created successfully:", userId)
    } catch (error) {
      // Log failed account creation for manual recovery
      console.error("[v0] User creation failed after retries:", error)

      await logFailedAccountCreation(supabase, {
        paymentIntentId,
        guestEmail,
        guestName,
        guestPhone,
        error: error as Error,
        bookingData: {
          services,
          pickupAddress,
          deliveryAddress,
          pickupDate,
          pickupTimeSlot,
        },
      })

      return NextResponse.json(
        {
          error: "Erreur lors de la création du compte",
          message:
            "Le paiement a réussi mais nous n'avons pas pu créer votre compte. Notre équipe vous contactera sous 24h.",
        },
        { status: 500 }
      )
    }

    // 5. Create booking with retry logic (3 attempts)
    console.log("[v0] Step 3: Creating booking...")
    let bookingId: string
    try {
      const bookingData = await withRetry(
        async () => {
          const result = await supabase
            .from("bookings")
            .insert({
              user_id: userId,
              status: "pending",
              payment_intent_id: paymentIntentId,
              pickup_date: pickupDate,
              pickup_time_slot: pickupTimeSlot,
              delivery_date: calculateDeliveryDate(pickupDate),
              total_amount: paymentIntent.amount / 100, // Convert cents to euros
              special_instructions: null, // TODO: Add if needed
            })
            .select()
            .single()

          if (result.error) throw result.error
          if (!result.data) throw new Error("No booking data returned")
          return result.data
        },
        {
          retries: 3,
          delay: 2000,
          onRetry: (attempt, error) => {
            console.warn(`[v0] Booking creation retry ${attempt}/3:`, error.message)
          },
        }
      )

      if (!bookingData) {
        throw new Error("Failed to create booking after retries")
      }

      bookingId = bookingData.id
      console.log("[v0] Booking created successfully:", bookingId)
    } catch (error) {
      // Log failed booking creation for manual recovery
      console.error("[v0] Booking creation failed after retries:", error)

      await logFailedBooking(supabase, {
        paymentIntentId,
        userId,
        error: error as Error,
        bookingData: {
          services,
          pickupAddress,
          deliveryAddress,
          pickupDate,
          pickupTimeSlot,
        },
      })

      return NextResponse.json(
        {
          error: "Erreur lors de la création de la réservation",
          message:
            "Votre compte a été créé mais nous n'avons pas pu finaliser la réservation. Notre équipe vous contactera sous 24h.",
          userId, // Return userId for debugging
        },
        { status: 500 }
      )
    }

    // 6. Create booking items (services)
    console.log("[v0] Step 4: Creating booking items...")
    const bookingItemsData = services.map((service: any) => ({
      booking_id: bookingId,
      service_id: service.id,
      quantity: service.quantity,
      unit_price: service.basePrice / 100, // Convert cents to euros
    }))

    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(bookingItemsData)

    if (itemsError) {
      console.error("[v0] Failed to create booking items:", itemsError)
      // Non-critical error: booking exists, items can be added manually
    } else {
      console.log(
        "[v0] Booking items created:",
        bookingItemsData.length,
        "items"
      )
    }

    // 7. Save addresses
    console.log("[v0] Step 5: Saving addresses...")
    
    // Pickup address
    const { data: pickupAddressData, error: pickupAddressError } =
      await supabase
        .from("addresses")
        .insert({
          user_id: userId,
          type: "pickup",
          street_address: pickupAddress.street_address,
          city: pickupAddress.city,
          postal_code: pickupAddress.postal_code,
          building_info: pickupAddress.building_info || null,
          access_instructions: pickupAddress.access_instructions || null,
          is_default: true,
        })
        .select()
        .single()

    if (pickupAddressError) {
      console.error("[v0] Failed to create pickup address:", pickupAddressError)
    } else {
      console.log("[v0] Pickup address created:", pickupAddressData?.id)

      // Update booking with pickup address
      await supabase
        .from("bookings")
        .update({ pickup_address_id: pickupAddressData.id })
        .eq("id", bookingId)
    }

    // Delivery address (if different)
    const isSameAddress =
      pickupAddress.street_address === deliveryAddress.street_address &&
      pickupAddress.city === deliveryAddress.city &&
      pickupAddress.postal_code === deliveryAddress.postal_code

    let deliveryAddressId = pickupAddressData?.id

    if (!isSameAddress) {
      const { data: deliveryAddressData, error: deliveryAddressError } =
        await supabase
          .from("addresses")
          .insert({
            user_id: userId,
            type: "delivery",
            street_address: deliveryAddress.street_address,
            city: deliveryAddress.city,
            postal_code: deliveryAddress.postal_code,
            building_info: deliveryAddress.building_info || null,
            access_instructions: deliveryAddress.access_instructions || null,
            is_default: false,
          })
          .select()
          .single()

      if (deliveryAddressError) {
        console.error(
          "[v0] Failed to create delivery address:",
          deliveryAddressError
        )
      } else {
        console.log("[v0] Delivery address created:", deliveryAddressData?.id)
        deliveryAddressId = deliveryAddressData.id
      }
    } else {
      console.log("[v0] Using same address for delivery")
    }

    // Update booking with delivery address
    if (deliveryAddressId) {
      await supabase
        .from("bookings")
        .update({ delivery_address_id: deliveryAddressId })
        .eq("id", bookingId)
    }

    // 8. Send welcome email (Phase 2 Day 5 - Placeholder for now)
    console.log("[v0] Step 6: Sending welcome email...")
    // TODO: Implement email sending with Resend/SendGrid
    console.log("[v0] Email sending not implemented yet (Phase 2 Day 5)")

    // 9. Success response
    console.log("[v0] Guest booking orchestration completed successfully!")
    return NextResponse.json(
      {
        success: true,
        bookingId,
        userId,
        message: "Réservation créée avec succès",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Guest booking orchestration error:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la création de la réservation",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Calculate delivery date (pickup date + 3 days)
 */
function calculateDeliveryDate(pickupDate: string): string {
  const pickup = new Date(pickupDate)
  const delivery = new Date(pickup)
  delivery.setDate(delivery.getDate() + 3) // Add 3 days
  return delivery.toISOString().split("T")[0] // YYYY-MM-DD format
}

/**
 * Log failed account creation to database
 */
async function logFailedAccountCreation(
  supabase: any,
  data: {
    paymentIntentId: string
    guestEmail: string
    guestName: string
    guestPhone: string
    error: Error
    bookingData: any
  }
) {
  try {
    const { error } = await supabase.from("failed_account_creations").insert({
      payment_intent_id: data.paymentIntentId,
      guest_email: data.guestEmail,
      guest_name: data.guestName,
      guest_phone: data.guestPhone,
      error_message: data.error.message,
      error_code: (data.error as any).code || null,
      booking_data: data.bookingData,
    })

    if (error) {
      console.error("[v0] Failed to log failed account creation:", error)
    } else {
      console.log("[v0] Failed account creation logged successfully")
    }
  } catch (err) {
    console.error("[v0] Error logging failed account creation:", err)
  }
}

/**
 * Log failed booking creation to database
 */
async function logFailedBooking(
  supabase: any,
  data: {
    paymentIntentId: string
    userId: string
    error: Error
    bookingData: any
  }
) {
  try {
    const { error } = await supabase.from("failed_bookings").insert({
      payment_intent_id: data.paymentIntentId,
      user_id: data.userId,
      booking_data: data.bookingData,
      error_message: data.error.message,
      error_code: (data.error as any).code || null,
    })

    if (error) {
      console.error("[v0] Failed to log failed booking:", error)
    } else {
      console.log("[v0] Failed booking logged successfully")
    }
  } catch (err) {
    console.error("[v0] Error logging failed booking:", err)
  }
}
