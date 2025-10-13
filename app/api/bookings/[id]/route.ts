import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { modifyBookingSchema } from "@/lib/validations/booking"

// GET - Fetch single booking details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, error: authError } = await apiRequireAuth(request)

  if (authError) {
    return authError
  }

  try {
    const bookingId = params.id

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        *,
        pickup_address:user_addresses!pickup_address_id(*),
        delivery_address:user_addresses!delivery_address_id(*),
        booking_items(
          *,
          service:services(*)
        )
      `)
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("[API /bookings/[id] GET] Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PATCH - Modify booking (addresses, dates, time slots only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, error: authError } = await apiRequireAuth(request)

  if (authError) {
    return authError
  }

  try {
    const bookingId = params.id
    const body = await request.json()

    console.log("[v0] PATCH /api/bookings/[id] - Received payload:", JSON.stringify(body, null, 2))

    // 1. Validate input
    const validation = modifyBookingSchema.safeParse(body)
    if (!validation.success) {
      console.error("[v0] PATCH /api/bookings/[id] - Validation failed:", validation.error.issues)
      return NextResponse.json(
        {
          error: "Données invalides",
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { pickupDate, pickupTimeSlot, pickupAddressId, deliveryAddressId, specialInstructions } = validation.data

    if (!pickupDate) {
      return NextResponse.json(
        { error: "La date de collecte est requise" },
        { status: 400 }
      )
    }

    const newPickupDate = new Date(pickupDate)
    if (Number.isNaN(newPickupDate.getTime())) {
      return NextResponse.json(
        { error: "La date de collecte doit être une date ISO valide" },
        { status: 400 }
      )
    }

    newPickupDate.setHours(0, 0, 0, 0)

    // 2. Fetch existing booking
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    // 3. Check ownership
    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // 4. Check if booking can be modified (status + future date)
    const canModify =
      (booking.status === "pending" || booking.status === "confirmed") &&
      new Date(booking.pickup_date) > new Date()

    console.log("[v0] Can modify check:", {
      status: booking.status,
      isPendingOrConfirmed: booking.status === "pending" || booking.status === "confirmed",
      pickupDate: booking.pickup_date,
      isFutureDate: new Date(booking.pickup_date) > new Date(),
      canModify,
    })

    if (!canModify) {
      console.error("[v0] Cannot modify - Booking state:", {
        status: booking.status,
        pickupDate: booking.pickup_date,
      })
      return NextResponse.json(
        {
          error: "Cette réservation ne peut pas être modifiée",
          reason:
            booking.status !== "pending" && booking.status !== "confirmed"
              ? "Statut invalide"
              : "Date passée",
        },
        { status: 400 }
      )
    }

    // 5. Validate new pickup date is in the future (tomorrow minimum)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    console.log("[v0] Date validation:", {
      tomorrow: tomorrow.toISOString(),
      newPickupDate: newPickupDate.toISOString(),
      isValid: newPickupDate >= tomorrow,
    })

    if (newPickupDate < tomorrow) {
      console.error("[v0] Date validation failed - pickup date is too soon")
      return NextResponse.json(
        {
          error: "La date de collecte doit être au minimum demain",
        },
        { status: 400 }
      )
    }

    // 6. Verify addresses belong to user
    const addressIds = [pickupAddressId]
    if (deliveryAddressId && deliveryAddressId !== pickupAddressId) {
      addressIds.push(deliveryAddressId)
    }

    const { data: userAddresses, error: addressError } = await supabase
      .from("user_addresses")
      .select("id")
      .eq("user_id", user.id)
      .in("id", addressIds)

    console.log("[v0] Address verification:", {
      pickupAddressId,
      deliveryAddressId,
      addressIds,
      foundAddresses: userAddresses?.length,
      expected: addressIds.length,
    })

    if (addressError || userAddresses.length !== addressIds.length) {
      console.error("[v0] Address verification failed:", { addressError, userAddresses })
      return NextResponse.json({ error: "Adresses invalides" }, { status: 400 })
    }

    // 7. Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        pickup_date: newPickupDate.toISOString(),
        pickup_time_slot: pickupTimeSlot,
        pickup_address_id: pickupAddressId,
        delivery_address_id: deliveryAddressId,
        special_instructions: specialInstructions || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single()

    if (updateError) {
      console.error("[API /bookings/[id] PATCH] Update error:", updateError)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Réservation modifiée avec succès",
    })
  } catch (error) {
    console.error("[API /bookings/[id] PATCH] Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
