import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { modifyBookingSchema } from "@/lib/validations/booking"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, error: authError } = await apiRequireAuth(request)

  if (authError) {
    return authError
  }

  try {
    const bookingId = params.id
    const body = await request.json()

    // Validate request body
    const result = modifyBookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation échouée", issues: result.error.issues },
        { status: 400 },
      )
    }

    const { pickupAddressId, pickupDate, pickupTimeSlot, deliveryAddressId, deliveryDate, deliveryTimeSlot } =
      result.data

    // 1. Fetch booking to verify ownership and status
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
    }

    // 2. Check ownership
    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à modifier cette réservation" }, { status: 403 })
    }

    // 3. Check if booking can be modified (pending or confirmed)
    if (!["pending", "confirmed"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Cette réservation ne peut pas être modifiée (statut: " + booking.status + ")" },
        { status: 400 },
      )
    }

    // 4. Check if pickup date is in the future
    const newPickupDate = new Date(pickupDate)
    const now = new Date()
    if (newPickupDate <= now) {
      return NextResponse.json({ error: "La date de collecte doit être dans le futur" }, { status: 400 })
    }

    // 5. Verify that addresses exist and belong to user
    const { data: pickupAddress, error: pickupAddressError } = await supabase
      .from("user_addresses")
      .select("id")
      .eq("id", pickupAddressId)
      .eq("user_id", user.id)
      .single()

    if (pickupAddressError || !pickupAddress) {
      return NextResponse.json({ error: "Adresse de collecte invalide ou non autorisée" }, { status: 400 })
    }

    if (deliveryAddressId) {
      const { data: deliveryAddress, error: deliveryAddressError } = await supabase
        .from("user_addresses")
        .select("id")
        .eq("id", deliveryAddressId)
        .eq("user_id", user.id)
        .single()

      if (deliveryAddressError || !deliveryAddress) {
        return NextResponse.json({ error: "Adresse de livraison invalide ou non autorisée" }, { status: 400 })
      }
    }

    // 6. Track all changes for audit log
    const modifications = []
    if (booking.pickup_address_id !== pickupAddressId) {
      modifications.push({
        field_changed: "pickup_address_id",
        old_value: booking.pickup_address_id,
        new_value: pickupAddressId,
      })
    }
    if (booking.pickup_date !== pickupDate) {
      modifications.push({
        field_changed: "pickup_date",
        old_value: booking.pickup_date,
        new_value: pickupDate,
      })
    }
    if (booking.pickup_time_slot !== pickupTimeSlot) {
      modifications.push({
        field_changed: "pickup_time_slot",
        old_value: booking.pickup_time_slot,
        new_value: pickupTimeSlot,
      })
    }
    if (deliveryAddressId && booking.delivery_address_id !== deliveryAddressId) {
      modifications.push({
        field_changed: "delivery_address_id",
        old_value: booking.delivery_address_id,
        new_value: deliveryAddressId,
      })
    }
    if (deliveryDate && booking.delivery_date !== deliveryDate) {
      modifications.push({
        field_changed: "delivery_date",
        old_value: booking.delivery_date,
        new_value: deliveryDate,
      })
    }
    if (deliveryTimeSlot && booking.delivery_time_slot !== deliveryTimeSlot) {
      modifications.push({
        field_changed: "delivery_time_slot",
        old_value: booking.delivery_time_slot,
        new_value: deliveryTimeSlot,
      })
    }

    // 7. Update booking
    const updateData: any = {
      pickup_address_id: pickupAddressId,
      pickup_date: pickupDate,
      pickup_time_slot: pickupTimeSlot,
    }

    if (deliveryAddressId) updateData.delivery_address_id = deliveryAddressId
    if (deliveryDate) updateData.delivery_date = deliveryDate
    if (deliveryTimeSlot) updateData.delivery_time_slot = deliveryTimeSlot

    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select(`
        *,
        pickup_address:user_addresses!pickup_address_id(street_address, city, postal_code),
        delivery_address:user_addresses!delivery_address_id(street_address, city, postal_code)
      `)
      .single()

    if (updateError) {
      console.error("[API] Booking modification error:", updateError)
      return NextResponse.json({ error: "Erreur lors de la modification de la réservation" }, { status: 500 })
    }

    // 8. Log all modifications in audit table
    if (modifications.length > 0) {
      const auditLogs = modifications.map((mod) => ({
        booking_id: bookingId,
        user_id: user.id,
        ...mod,
        reason: "User modification",
      }))

      await supabase.from("booking_modifications").insert(auditLogs)
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Réservation modifiée avec succès",
      modificationsCount: modifications.length,
    })
  } catch (error) {
    console.error("[API] Booking modification error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
