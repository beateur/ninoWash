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
import { createAdminClient } from "@/lib/supabase/admin"

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
    
    console.log("[v0] Booking user_id:", booking.user_id)
    console.log("[v0] Booking metadata:", JSON.stringify(booking.metadata, null, 2))
    
    // PRIORITY 1: Check metadata.guest_contact.email (works for both guest and user bookings)
    if (booking.metadata?.guest_contact?.email) {
      customerEmail = booking.metadata.guest_contact.email
      console.log("[v0] Found email from metadata.guest_contact:", customerEmail)
    } 
    // PRIORITY 2: If no metadata email and user_id exists, fetch from auth.admin API
    else if (booking.user_id) {
      console.log("[v0] No metadata email, fetching from auth.admin for user_id:", booking.user_id)
      
      // Use auth.admin.getUserById() API (official method)
      const adminClient = createAdminClient()
      const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(
        booking.user_id
      )
      
      if (authError) {
        console.error("[v0] Error fetching user by ID:", authError)
      }
      
      if (authUser?.user?.email) {
        customerEmail = authUser.user.email
        console.log("[v0] Found email from auth.admin.getUserById:", customerEmail)
      } else {
        console.error("[v0] User exists but no email found")
      }
    } else {
      // No user_id and no guest_contact email
      console.log("[v0] No user_id and no metadata email")
    }


    if (!customerEmail) {
      console.error("[v0] ❌ No email found for booking")
      console.error("[v0] Debug info:", {
        bookingId,
        hasUserId: !!booking.user_id,
        hasMetadata: !!booking.metadata,
        hasGuestContact: !!booking.metadata?.guest_contact,
        hasGuestEmail: !!booking.metadata?.guest_contact?.email,
        metadataKeys: booking.metadata ? Object.keys(booking.metadata) : [],
      })
      
      return NextResponse.json({ 
        error: "Email introuvable pour cette réservation",
        debug: process.env.NODE_ENV === "development" ? {
          bookingId,
          hasUserId: !!booking.user_id,
          hasMetadata: !!booking.metadata,
          hasGuestContact: !!booking.metadata?.guest_contact,
        } : undefined
      }, { status: 400 })
    }
    
    console.log("[v0] ✅ Customer email found:", customerEmail)

    // 5. Calculer le montant total correct (depuis booking.total_amount_cents)
    // ⚠️ NE PAS utiliser booking_items.unit_price car il ne contient que le prix de base
    // sans les options de kg supplémentaires
    const totalAmountCents = booking.total_amount_cents || Math.round((booking.total_amount || 0) * 100)
    
    if (totalAmountCents <= 0) {
      console.error("[v0] ❌ Invalid total amount:", totalAmountCents)
      return NextResponse.json({ 
        error: "Montant de réservation invalide" 
      }, { status: 400 })
    }
    
    console.log("[v0] Total amount for Stripe:", {
      totalAmountCents,
      totalAmountEuros: totalAmountCents / 100,
      bookingNumber: booking.booking_number
    })

    // Build line items for Stripe - utiliser le montant total validé
    const lineItems = [{
      price_data: {
        currency: "eur",
        product_data: {
          name: `Réservation Nino Wash - ${booking.booking_number}`,
          description: booking.booking_items
            .map((item: any) => `${item.service?.name || 'Service'} (x${item.quantity})`)
            .join(', '),
        },
        unit_amount: totalAmountCents, // ✅ Utiliser le total validé incluant options
      },
      quantity: 1,
    }]

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
