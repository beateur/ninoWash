/**
 * Supabase Edge Function: send-booking-payment-email
 * 
 * Triggered by: Database INSERT trigger on `bookings` table
 * When: New booking created with status='pending_payment'
 * Action: Send email with payment link to guest/user
 * 
 * Payload (from database trigger):
 * {
 *   "type": "INSERT",
 *   "record": {
 *     "id": "booking-uuid",
 *     "booking_number": "BK-20251017-XXXXXX",
 *     "user_id": null (for guests),
 *     "status": "pending_payment",
 *     "total_amount_cents": 5000,
 *     "metadata": {
 *       "guest_contact": {...},
 *       "guest_pickup_address": {...},
 *       "guest_delivery_address": {...}
 *     },
 *     "created_at": "2025-10-17T10:00:00Z"
 *   }
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4"

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

export async function handler(req: Request): Promise<Response> {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log("[send-booking-payment-email] Received payload:", JSON.stringify(payload))

    // Validate payload structure
    if (!payload.record) {
      console.error("[send-booking-payment-email] Invalid payload - missing record")
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 })
    }

    const booking = payload.record
    const bookingId = booking.id
    const bookingNumber = booking.booking_number
    const bookingStatus = booking.status

    // ✅ FILTER: Only process bookings with status 'pending_payment'
    if (bookingStatus !== 'pending_payment') {
      console.log(
        `[send-booking-payment-email] ⏭️  Ignored - Status is '${bookingStatus}' (expected 'pending_payment')`,
        { bookingId, bookingNumber, status: bookingStatus }
      )
      return new Response(
        JSON.stringify({ 
          success: true, 
          ignored: true,
          reason: `Status is '${bookingStatus}', expected 'pending_payment'`,
          bookingId 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      )
    }

    console.log(
      `[send-booking-payment-email] ✅ Processing booking with status 'pending_payment'`,
      { bookingId, bookingNumber }
    )

    const totalAmountEuros = (booking.total_amount_cents || 0) / 100

    // Extract contact email
    let contactEmail = ""
    let contactName = ""

    if (booking.metadata?.guest_contact) {
      contactEmail = booking.metadata.guest_contact.email
      contactName =
        `${booking.metadata.guest_contact.first_name} ${booking.metadata.guest_contact.last_name}`
    } else if (booking.user_id) {
      // For authenticated users, fetch email from auth
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      )

      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        booking.user_id
      )

      if (userError || !userData.user?.email) {
        console.error("[send-booking-payment-email] Failed to get user email:", userError)
        return new Response(
          JSON.stringify({ error: "Failed to get user email" }),
          { status: 500 }
        )
      }

      contactEmail = userData.user.email
      contactName = userData.user.user_metadata?.full_name || userData.user.email
    } else {
      console.error("[send-booking-payment-email] No email found for booking")
      return new Response(JSON.stringify({ error: "No email found" }), { status: 400 })
    }

    if (!contactEmail) {
      console.error("[send-booking-payment-email] Empty contact email")
      return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 })
    }

    // Build payment link
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://www.ninowash.fr"
    const paymentLink = `${appUrl}/booking/${bookingId}/pay`

    // Prepare email content
    const emailSubject = `Finalisez votre paiement - Réservation ${bookingNumber}`

    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: 600; color: #667eea; }
    .detail-value { text-align: right; }
    .total { font-size: 24px; font-weight: bold; color: #667eea; text-align: right; margin-top: 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #764ba2; }
    .button-container { text-align: center; }
    .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none; }
    .info-box { background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0288d1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Finalisez votre paiement</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Réservation ${bookingNumber}</p>
    </div>

    <div class="content">
      <p>Bonjour <strong>${contactName}</strong>,</p>
      
      <p>Votre réservation a été créée avec succès ! Pour finaliser votre commande, veuillez procéder au paiement.</p>

      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Numéro de réservation</span>
          <span class="detail-value">${bookingNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Montant à payer</span>
          <span class="detail-value"><strong>${totalAmountEuros.toFixed(2)}€</strong></span>
        </div>
        <div class="total">Total: ${totalAmountEuros.toFixed(2)}€</div>
      </div>

      <div class="info-box">
        <strong>🔒 Paiement sécurisé</strong><br>
        Nous acceptons tous les modes de paiement par Stripe (cartes bancaires, Apple Pay, Google Pay, etc.)
      </div>

      <div class="button-container">
        <a href="${paymentLink}" class="button">Procéder au paiement</a>
      </div>

      <p style="margin: 20px 0;">
        <strong>Informations supplémentaires :</strong><br>
        • Votre paiement est sécurisé par Stripe<br>
        • Vous recevrez une confirmation une fois le paiement effectué<br>
        • Lien valide pendant 48 heures
      </p>

      <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
        Si vous avez des questions, <a href="mailto:support@ninowash.fr">contactez notre support</a>.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">Nino Wash - Service de nettoyage à domicile</p>
      <p style="margin: 5px 0 0 0; font-size: 11px;">
        <a href="https://ninowash.fr">ninowash.fr</a> • 
        <a href="mailto:support@ninowash.fr">support@ninowash.fr</a>
      </p>
    </div>
  </div>
</body>
</html>
    `

    const emailPlainText = `
Finalisez votre paiement - Réservation ${bookingNumber}

Bonjour ${contactName},

Votre réservation a été créée avec succès ! Pour finaliser votre commande, veuillez procéder au paiement.

Détails de la réservation:
- Numéro: ${bookingNumber}
- Montant: ${totalAmountEuros.toFixed(2)}€

Cliquez sur le lien ci-dessous pour payer:
${paymentLink}

Paiement sécurisé par Stripe ✓

Si vous avez des questions, contactez notre support: support@ninowash.fr

Nino Wash - Service de nettoyage à domicile
https://ninowash.fr
    `

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY")

    if (!resendApiKey) {
      console.error("[send-booking-payment-email] ❌ RESEND_API_KEY not configured")
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500 }
      )
    }

    const emailPayload = {
      from: "Nino Wash <paiement@ninowash.fr>",
      to: contactEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailPlainText,
      reply_to: "support@ninowash.fr",
    }

    console.log("[send-booking-payment-email] 📧 Sending email to:", contactEmail)
    console.log("[send-booking-payment-email] 📋 Email payload:", {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      reply_to: emailPayload.reply_to,
      hasHtml: !!emailPayload.html,
      hasText: !!emailPayload.text,
    })

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    })

    console.log("[send-booking-payment-email] 📬 Resend API response status:", emailResponse.status)

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error("[send-booking-payment-email] ❌ Resend API error - Status:", emailResponse.status)
      console.error("[send-booking-payment-email] ❌ Resend API error - Response:", errorData)
      console.error("[send-booking-payment-email] ❌ Request details:", {
        bookingId,
        bookingNumber,
        contactEmail,
        paymentLink,
        emailPayloadSize: JSON.stringify(emailPayload).length,
      })
      return new Response(
        JSON.stringify({ 
          error: "Failed to send email", 
          details: errorData,
          status: emailResponse.status,
          bookingId,
        }),
        { status: 500 }
      )
    }

    const emailResult = await emailResponse.json()
    console.log("[send-booking-payment-email] ✅ Email sent successfully!")
    console.log("[send-booking-payment-email] 📬 Email details:", {
      messageId: emailResult.id,
      to: contactEmail,
      bookingId: bookingId,
      bookingNumber: bookingNumber,
    })

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResult.id,
        email: contactEmail,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error("[send-booking-payment-email] ❌ Unexpected error:", errorMessage)
    if (errorStack) {
      console.error("[send-booking-payment-email] ❌ Stack trace:", errorStack)
    }
    console.error("[send-booking-payment-email] ❌ Error details:", {
      type: error?.constructor?.name,
      error: error,
    })
    return new Response(JSON.stringify({ 
      error: errorMessage,
      type: error?.constructor?.name,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
}

// Lance le serveur
serve(handler)
