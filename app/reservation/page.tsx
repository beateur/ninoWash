import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/route-guards"
import { createClient } from "@/lib/supabase/server"
import ReservationClient from "./reservation-client"

interface PageProps {
  searchParams: Promise<{
    modify?: string
    service?: string
  }>
}

export default async function ReservationPage({ searchParams }: PageProps) {
  const params = await searchParams
  const modifyBookingId = params.modify
  const serviceType = params.service || "classic"

  // Mode modification
  if (modifyBookingId) {
    console.log("[v0] Reservation page - modification mode:", modifyBookingId)
    const { user } = await requireAuth()
    const supabase = await createClient()

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        pickup_address:user_addresses!pickup_address_id (
          id,
          street_address,
          building_info,
          city,
          postal_code,
          access_instructions,
          label,
          country,
          is_default
        ),
        delivery_address:user_addresses!delivery_address_id (
          id,
          street_address,
          building_info,
          city,
          postal_code,
          access_instructions,
          label,
          country,
          is_default
        ),
        booking_items (
          id,
          service_id,
          quantity,
          unit_price,
          services (
            id,
            name,
            description,
            base_price
          )
        )
      `)
      .eq("id", modifyBookingId)
      .eq("user_id", user.id)
      .single()

    if (error || !booking) {
      console.error("[v0] Booking fetch error:", error)
      console.log("[v0] Booking data:", booking)
      redirect("/dashboard?error=booking_not_found")
    }

    // Vérifier si la réservation peut être modifiée
    const canModify =
      (booking.status === "pending" || booking.status === "confirmed") &&
      new Date(booking.pickup_date) > new Date()

    if (!canModify) {
      redirect("/dashboard?error=cannot_modify_booking")
    }

    return (
      <ReservationClient
        existingBooking={booking}
        isModification={true}
        serviceType={booking.service_type || "classic"}
      />
    )
  }

  // Mode nouvelle réservation
  return <ReservationClient serviceType={serviceType} />
}
