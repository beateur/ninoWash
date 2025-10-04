import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { cancelBookingSchema } from "@/lib/validations/booking"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, error: authError } = await apiRequireAuth(request)

  if (authError) {
    return authError
  }

  try {
    const bookingId = params.id
    const body = await request.json()

    // Validate request body
    const result = cancelBookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation échouée", issues: result.error.issues },
        { status: 400 },
      )
    }

    const { reason } = result.data

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
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à annuler cette réservation" }, { status: 403 })
    }

    // 3. Check if already cancelled
    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Cette réservation est déjà annulée" }, { status: 400 })
    }

    // 4. Check if booking can be cancelled (pending or confirmed)
    if (!["pending", "confirmed"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Cette réservation ne peut pas être annulée (statut: " + booking.status + ")" },
        { status: 400 },
      )
    }

    // 5. Check if pickup date is in the future (at least 24h before)
    const pickupDate = new Date(booking.pickup_date)
    const now = new Date()
    const hoursDiff = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursDiff < 24) {
      return NextResponse.json(
        { error: "Impossible d'annuler une réservation moins de 24h avant la collecte" },
        { status: 400 },
      )
    }

    // 6. Update booking status to cancelled
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason,
      })
      .eq("id", bookingId)
      .select(`
        *,
        pickup_address:user_addresses!pickup_address_id(street_address, city, postal_code),
        delivery_address:user_addresses!delivery_address_id(street_address, city, postal_code)
      `)
      .single()

    if (updateError) {
      console.error("[API] Booking cancellation error:", updateError)
      return NextResponse.json({ error: "Erreur lors de l'annulation de la réservation" }, { status: 500 })
    }

    // 7. Log modification in audit table
    await supabase.from("booking_modifications").insert({
      booking_id: bookingId,
      user_id: user.id,
      field_changed: "status",
      old_value: booking.status,
      new_value: "cancelled",
      reason,
    })

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Réservation annulée avec succès",
    })
  } catch (error) {
    console.error("[API] Booking cancellation error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
