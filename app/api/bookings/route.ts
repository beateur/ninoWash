import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createBookingSchema } from "@/lib/validations/booking"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: bookings, error } = await supabase
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

    if (error) {
      console.error("[v0] Bookings fetch error:", error)
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

    // Calculate total
    for (const item of validatedData.items) {
      const service = services.find((s) => s.id === item.serviceId)
      if (service) {
        totalAmount += service.base_price * item.quantity
      }
    }

    let pickupAddressId = validatedData.pickupAddressId
    let deliveryAddressId = validatedData.deliveryAddressId
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
        service_id: primaryServiceId, // Add required service_id
        pickup_address_id: pickupAddressId,
        delivery_address_id: deliveryAddressId,
        pickup_date: validatedData.pickupDate,
        pickup_time_slot: validatedData.pickupTimeSlot,
        special_instructions: validatedData.specialInstructions,
        total_amount: totalAmount,
        status: "pending",
        metadata: Object.keys(bookingMetadata).length > 0 ? bookingMetadata : null,
      })
      .select()
      .single()

    if (bookingError) {
      console.error("[v0] Booking creation error:", bookingError)
      return NextResponse.json({ error: "Erreur lors de la création de la réservation" }, { status: 500 })
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
