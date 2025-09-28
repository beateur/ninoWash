import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createBookingSchema } from "@/lib/validations/booking"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

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
          service:services(name, category)
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
    const validatedData = createBookingSchema.parse(body)

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
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

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        pickup_address_id: validatedData.pickupAddressId,
        delivery_address_id: validatedData.deliveryAddressId,
        pickup_date: validatedData.pickupDate,
        pickup_time_slot: validatedData.pickupTimeSlot,
        special_instructions: validatedData.specialInstructions,
        subscription_id: validatedData.subscriptionId,
        total_amount: totalAmount,
        status: "pending",
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
        service_id: item.serviceId,
        quantity: item.quantity,
        unit_price: service?.base_price || 0,
        special_instructions: item.specialInstructions,
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
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
