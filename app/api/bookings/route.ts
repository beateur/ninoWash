import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { createClient } from "@/lib/supabase/server"
import { createBookingSchema } from "@/lib/validations/booking"
import { z } from "zod"
import { canUseCredit, consumeCredit } from "@/lib/services/subscription-credits"
import {
  getSlotById,
  validateSlotDelay,
  generateLegacyDatesFromSlots,
  createSlotRequest,
} from "@/lib/services/logistic-slots"
import type { ServiceType } from "@/lib/types/logistic-slots"

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    const { data: bookings, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        *,
        pickup_address:user_addresses!pickup_address_id(street_address, city, postal_code),
        delivery_address:user_addresses!delivery_address_id(street_address, city, postal_code),
        booking_items(
          id,
          quantity,
          unit_price,
          special_instructions,
          service:services(name, type)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("[v0] Bookings fetch error:", fetchError)
      return NextResponse.json({ error: "Erreur lors de la récupération des réservations" }, { status: 500 })
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("[v0] Bookings API error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Booking payload:", JSON.stringify(body).substring(0, 200) + "...")

    const validatedData = createBookingSchema.parse(body)

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isGuestBooking = !user

    // ========================================================================
    // SLOT-BASED SCHEDULING LOGIC (NEW)
    // ========================================================================
    const usingSlotsScheduling =
      !!validatedData.pickupSlotId && !!validatedData.deliverySlotId

    let pickupDate = validatedData.pickupDate
    let pickupTimeSlot = validatedData.pickupTimeSlot
    let deliveryDate: string | undefined
    let deliveryTimeSlot: string | undefined
    let pickupSlotId: string | null = null
    let deliverySlotId: string | null = null

    if (usingSlotsScheduling) {
      console.log(
        "[v0] Using slot-based scheduling:",
        validatedData.pickupSlotId,
        validatedData.deliverySlotId
      )

      // Fetch slots from database
      const pickupSlot = await getSlotById(validatedData.pickupSlotId!)
      const deliverySlot = await getSlotById(validatedData.deliverySlotId!)

      if (!pickupSlot || !deliverySlot) {
        return NextResponse.json(
          { error: "Un ou plusieurs créneaux sélectionnés sont introuvables" },
          { status: 400 }
        )
      }

      // Validate slot availability (is_open + future date)
      const today = new Date().toISOString().split("T")[0]
      if (!pickupSlot.is_open || pickupSlot.slot_date < today) {
        return NextResponse.json(
          { error: "Le créneau de collecte sélectionné n'est plus disponible" },
          { status: 400 }
        )
      }
      if (!deliverySlot.is_open || deliverySlot.slot_date < today) {
        return NextResponse.json(
          { error: "Le créneau de livraison sélectionné n'est plus disponible" },
          { status: 400 }
        )
      }

      // Determine service type from items (default to 'classic' if unknown)
      let serviceType: ServiceType = validatedData.serviceType === "express" ? "express" : "classic"

      // If no explicit serviceType in payload, try to determine from selected services
      if (!validatedData.serviceType && validatedData.items.length > 0) {
        // Fetch service details to check type
        const serviceIds = validatedData.items.map((item) => item.serviceId)
        const { data: selectedServices, error: servicesCheckError } = await supabase
          .from("services")
          .select("id, type")
          .in("id", serviceIds)

        if (!servicesCheckError && selectedServices && selectedServices.length > 0) {
          // If ANY service is express, use express (24h requirement)
          // Otherwise use classic (72h requirement)
          serviceType = selectedServices.some((s) => s.type === "express") ? "express" : "classic"
        }
      }

      // Validate delay between pickup and delivery
      const delayValidation = validateSlotDelay(
        pickupSlot,
        deliverySlot,
        serviceType
      )

      if (!delayValidation.valid) {
        console.error("[v0] Slot delay validation failed:", delayValidation.error)
        return NextResponse.json(
          { error: delayValidation.error },
          { status: 400 }
        )
      }

      console.log(
        `[v0] Slot delay validated: ${delayValidation.actualHours}h (required: ${delayValidation.requiredHours}h)`
      )

      // Generate legacy dates/times for fallback
      const legacyDates = generateLegacyDatesFromSlots(pickupSlot, deliverySlot)
      pickupDate = legacyDates.pickup_date
      pickupTimeSlot = legacyDates.pickup_time_slot as typeof pickupTimeSlot
      deliveryDate = legacyDates.delivery_date
      deliveryTimeSlot = legacyDates.delivery_time_slot

      // Store slot IDs for FK persistence
      pickupSlotId = pickupSlot.id
      deliverySlotId = deliverySlot.id

      console.log("[v0] Legacy dates generated from slots:", legacyDates)
    } else {
      console.log("[v0] Using legacy date/time scheduling")
    }

    // ========================================================================
    // REST OF BOOKING LOGIC (UNCHANGED)
    // ========================================================================

    const generateBookingNumber = () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
      const random = Math.random().toString(36).substring(2, 8).toUpperCase()
      return `BK-${date}-${random}`
    }

    // Calculate total amount
    let totalAmount = 0
    const serviceIds = validatedData.items.map((item) => item.serviceId)

    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, base_price")
      .in("id", serviceIds)

    if (servicesError) {
      console.error("[v0] Services fetch error:", servicesError)
      return NextResponse.json({ error: "Erreur lors de la récupération des services" }, { status: 500 })
    }

    // Calculate standard total (before credit discount)
    for (const item of validatedData.items) {
      const service = services.find((s) => s.id === item.serviceId)
      if (service) {
        totalAmount += service.base_price * item.quantity
      }
    }

    // Check for active subscription and available credits
    let subscriptionId: string | null = null
    let usedCredit = false
    let creditDiscountAmount = 0
    let bookingWeightKg = 0 // TODO: Get from form or calculate from items

    if (user) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("id, plan_id")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle()

      if (subscription) {
        subscriptionId = subscription.id

        // For now, use default weight of 10kg (TODO: get from form)
        bookingWeightKg = 10

        // Check if user can use a credit
        const creditCheck = await canUseCredit(user.id, bookingWeightKg)

        if (creditCheck.canUse) {
          // Apply credit discount
          totalAmount = creditCheck.totalAmount
          creditDiscountAmount = creditCheck.discountAmount
          usedCredit = true

          console.log(`[v0] Credit applied: ${creditDiscountAmount}€ saved, new total: ${totalAmount}€`)
        }
      }
    }

    let pickupAddressId: string | null = validatedData.pickupAddressId ?? null
    let deliveryAddressId: string | null = validatedData.deliveryAddressId ?? null
    let bookingMetadata: any = {}

    if (isGuestBooking) {
      bookingMetadata = {
        is_guest_booking: true,
        guest_contact: validatedData.guestContact,
        guest_pickup_address: validatedData.guestPickupAddress,
        guest_delivery_address: validatedData.guestDeliveryAddress,
      }

      // For guest bookings, we don't use address IDs
      pickupAddressId = null
      deliveryAddressId = null
    }

    const primaryServiceId = validatedData.items[0]?.serviceId

    if (!primaryServiceId) {
      return NextResponse.json({ error: "Au moins un service doit être sélectionné" }, { status: 400 })
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        booking_number: generateBookingNumber(),
        user_id: user?.id || null,
        service_id: primaryServiceId,
        subscription_id: subscriptionId,
        pickup_address_id: pickupAddressId,
        delivery_address_id: deliveryAddressId,
        pickup_date: pickupDate!,
        pickup_time_slot: pickupTimeSlot!,
        delivery_date: deliveryDate,
        delivery_time_slot: deliveryTimeSlot,
        pickup_slot_id: pickupSlotId,
        delivery_slot_id: deliverySlotId,
        special_instructions: validatedData.specialInstructions,
        total_amount: totalAmount,
        total_amount_cents: Math.round(totalAmount * 100), // ✨ NEW: For Stripe
        booking_weight_kg: bookingWeightKg > 0 ? bookingWeightKg : null,
        used_subscription_credit: usedCredit,
        credit_discount_amount: creditDiscountAmount,
        status: "pending_payment", // ✨ CHANGED: All bookings start as pending_payment
        payment_status: "pending", // ✨ NEW: Track payment status separately
        metadata: Object.keys(bookingMetadata).length > 0 ? bookingMetadata : null,
      })
      .select()
      .single()

    if (bookingError) {
      console.error("[v0] Booking creation error:", bookingError)
      return NextResponse.json({ error: "Erreur lors de la création de la réservation" }, { status: 500 })
    }

    if (!booking || !booking.id) {
      console.error("[v0] Booking created but ID is missing:", booking)
      return NextResponse.json({ error: "Erreur: ID de réservation manquant" }, { status: 500 })
    }

    console.log(`[v0] Booking created successfully: ${booking.id}`)

    // ========================================================================
    // CREATE SLOT REQUESTS (NEW - Tracking Analytics)
    // ========================================================================
    if (usingSlotsScheduling && pickupSlotId && deliverySlotId) {
      console.log("[v0] Creating slot requests for tracking...")

      await createSlotRequest(pickupSlotId, "pickup", booking.id, user?.id)
      await createSlotRequest(deliverySlotId, "delivery", booking.id, user?.id)

      console.log("[v0] Slot requests created successfully")
    }

    // Consume credit if used
    if (usedCredit && user && subscriptionId) {
      const consumeResult = await consumeCredit(user.id, subscriptionId, booking.id, bookingWeightKg)
      if (!consumeResult.success) {
        console.error("[v0] Credit consumption failed:", consumeResult.message)
        // Note: Booking is already created, log error but continue
      } else {
        console.log(`[v0] Credit consumed successfully for booking ${booking.id}`)
      }
    }

    // Create booking items
    const bookingItems = validatedData.items.map((item) => {
      const service = services.find((s) => s.id === item.serviceId)
      return {
        booking_id: booking.id,
        quantity: item.quantity,
        unit_price: service?.base_price || 0,
        special_instructions: item.specialInstructions,
        service_id: item.serviceId,
      }
    })

    const { error: itemsError } = await supabase.from("booking_items").insert(bookingItems)

    if (itemsError) {
      console.error("[v0] Booking items creation error:", itemsError)
      // Rollback booking creation
      await supabase.from("bookings").delete().eq("id", booking.id)
      return NextResponse.json({ error: "Erreur lors de la création des articles" }, { status: 500 })
    }

    return NextResponse.json({
      booking,
      message: "Réservation créée avec succès",
    })
  } catch (error) {
    console.error("[v0] Booking creation error:", error)

    if (error instanceof z.ZodError) {
      console.log("[v0] Validation errors:", error.errors)
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
