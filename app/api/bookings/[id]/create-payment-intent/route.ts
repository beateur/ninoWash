/**
 * POST /api/bookings/[id]/create-payment-intent
 * 
 * Called from the checkout page (/booking/[id]/pay)
 * Creates a Stripe Checkout Session for a pending_payment booking
 * 
 * Returns: { checkoutUrl, sessionId }
 */

import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookingId = params.id

    console.log("[v0] Creating payment intent for booking:", bookingId)

    // 1. Fetch booking from database
    const supabase = await createClient()
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, booking_items(quantity, unit_price, service:services(name))")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      console.error("[v0] Booking not found:", bookingError)
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
    }

    // 2. Verify booking is pending_payment
    if (booking.status !== "pending_payment") {
      console.error("[v0] Booking not pending payment:", booking.status)
      return NextResponse.json(
        { error: "Cette réservation n'est pas en attente de paiement" },
        { status: 400 }
      )
    }

    // 3. Verify payment_status is still pending
    if (booking.payment_status !== "pending") {
      console.error("[v0] Payment already processed:", booking.payment_status)
      return NextResponse.json(
        { error: "Cette réservation a déjà été payée" },
        { status: 400 }
      )
    }

    // 4. Get guest/user email
    let customerEmail = ""
    if (booking.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(booking.user_id)
      if (userData?.user?.email) {
        customerEmail = userData.user.email
      }
    } else if (booking.metadata?.guest_contact?.email) {
      customerEmail = booking.metadata.guest_contact.email
    }

    if (!customerEmail) {
      console.error("[v0] No email found for booking")
      return NextResponse.json({ error: "Email introuvable pour cette réservation" }, { status: 400 })
    }

    // 5. Build line items for Stripe
    const lineItems = booking.booking_items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.service?.name || "Service Nino Wash",
          description: `Quantité: ${item.quantity}`,
        },
        unit_amount: Math.round(item.unit_price * 100), // cents
      },
      quantity: item.quantity,
    }))

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}/pay`,
      metadata: {
        booking_id: bookingId,
        guest: booking.user_id ? "false" : "true",
      },
    })

    console.log("[v0] Checkout session created:", session.id)

    // 7. Update booking with stripe_session_id
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", bookingId)

    if (updateError) {
      console.error("[v0] Error updating booking with session ID:", updateError)
      // Continue anyway - session is already created
    }

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error("[v0] Create payment intent error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    )
  }
}
