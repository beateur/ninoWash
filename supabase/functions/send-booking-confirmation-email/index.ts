/**
 * Supabase Edge Function: send-booking-confirmation-email
 * 
 * Triggered by: Webhook from /api/webhooks/stripe (payment_intent.succeeded)
 * When: Stripe payment has been successfully confirmed
 * Action: Send final confirmation email to customer
 * 
 * Payload (from webhook):
 * {
 *   "bookingId": "booking-uuid",
 *   "bookingNumber": "BK-20251017-XXXXXX",
 *   "email": "customer@example.com",
 *   "totalAmount": "50.00",
 *   "paymentIntentId": "pi_xxxxx"
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log("[send-booking-confirmation-email] Received payload:", JSON.stringify(payload))

    const { bookingId, bookingNumber, email, totalAmount, paymentIntentId } = payload

    // Validate required fields
    if (!bookingId || !bookingNumber || !email) {
      console.error("[send-booking-confirmation-email] Invalid payload - missing required fields")
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 })
    }

    const formattedAmount = (totalAmount || 0).toString()

    // Prepare email content
    const emailSubject = `Paiement confirmé - Réservation ${bookingNumber}`

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
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
    .confirmation-box { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #059669; }
    .detail-value { text-align: right; }
    .total { font-size: 24px; font-weight: bold; color: #10b981; text-align: right; margin-top: 10px; }
    .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">✓ Paiement confirmé !</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Réservation ${bookingNumber}</p>
    </div>

    <div class="content">
      <p>Bonjour,</p>
      
      <div class="confirmation-box">
        <p style="margin: 0; font-size: 16px; color: #059669;">
          <strong>✓ Votre paiement a été reçu avec succès</strong>
        </p>
      </div>

      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Numéro de réservation</span>
          <span class="detail-value"><strong>${bookingNumber}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Montant payé</span>
          <span class="detail-value"><strong>${formattedAmount}€</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">État</span>
          <span class="detail-value"><span style="color: #10b981; font-weight: bold;">Confirmé ✓</span></span>
        </div>
      </div>

      <p style="margin: 20px 0; padding: 15px; background: #e0e7ff; border-radius: 6px; border-left: 4px solid #6366f1;">
        <strong>📋 Prochaines étapes :</strong><br>
        Nous viendrons chercher vos vêtements à la date et heure prévues. Vous recevrez une confirmation par email 24h avant la collecte.
      </p>

      <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
        Si vous avez des questions, <a href="mailto:support@ninowash.com">contactez notre support</a>.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">Merci d'avoir choisi Nino Wash !</p>
      <p style="margin: 5px 0 0 0; font-size: 11px;">
        <a href="https://ninowash.com">ninowash.com</a> • 
        <a href="mailto:support@ninowash.com">support@ninowash.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `

    const emailPlainText = `
Paiement confirmé - Réservation ${bookingNumber}

Votre paiement a été reçu avec succès ! ✓

Détails:
- Numéro: ${bookingNumber}
- Montant: ${formattedAmount}€
- État: Confirmé ✓

Prochaines étapes:
Nous viendrons chercher vos vêtements à la date et heure prévues.
Vous recevrez une confirmation par email 24h avant la collecte.

Merci d'avoir choisi Nino Wash !
https://ninowash.com
    `

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY")

    if (!resendApiKey) {
      console.error("[send-booking-confirmation-email] RESEND_API_KEY not configured")
      // Don't fail - confirmation is already in DB
      console.warn("[send-booking-confirmation-email] Email service not configured, skipping email")
      return new Response(
        JSON.stringify({
          success: true,
          bookingId: bookingId,
          email: email,
          warning: "Email not sent - service not configured",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nino Wash <confirmation@ninowash.com>",
        to: email,
        subject: emailSubject,
        html: emailHtml,
        text: emailPlainText,
        reply_to: "support@ninowash.com",
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error("[send-booking-confirmation-email] Resend API error:", errorData)
      // Log but don't fail - confirmation already in DB
      console.warn("[send-booking-confirmation-email] Email sending failed, but booking is confirmed")
      return new Response(
        JSON.stringify({
          success: true,
          bookingId: bookingId,
          email: email,
          warning: "Booking confirmed but email sending failed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    const emailResult = await emailResponse.json()
    console.log("[send-booking-confirmation-email] Confirmation email sent successfully:", {
      messageId: emailResult.id,
      to: email,
      bookingId: bookingId,
    })

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResult.id,
        bookingId: bookingId,
        email: email,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[send-booking-confirmation-email] Error:", errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
}

// Lance le serveur uniquement si ce fichier est exécuté directement
// deno-lint-ignore no-explicit-any
if ((import.meta as any).main) {
  serve(handler)
}
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log("[send-booking-confirmation-email] Received payload:", JSON.stringify(payload))

    const { bookingId, bookingNumber, email, totalAmount, paymentIntentId } = payload

    // Validate required fields
    if (!bookingId || !bookingNumber || !email) {
      console.error("[send-booking-confirmation-email] Invalid payload - missing required fields")
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 })
    }

    // Fetch booking details
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    )

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      console.error("[send-booking-confirmation-email] Failed to fetch booking:", bookingError)
      return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 })
    }

    // Extract contact name
    let contactName = email
    if (booking.metadata?.guest_contact) {
      contactName = `${booking.metadata.guest_contact.first_name} ${booking.metadata.guest_contact.last_name}`
    } else if (booking.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(booking.user_id)
      if (userData.user?.user_metadata?.full_name) {
        contactName = userData.user.user_metadata.full_name
      }
    }

    // Prepare email content
    const emailSubject = `Réservation confirmée - Nino Wash`
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://ninowash.com"
    const dashboardLink = `${appUrl}/dashboard`

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
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
    .confirmation-badge { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; text-align: center; }
    .confirmation-badge .checkmark { font-size: 48px; margin-bottom: 10px; }
    .confirmation-badge h2 { color: #10b981; margin: 10px 0; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: 600; color: #059669; }
    .detail-value { text-align: right; }
    .timeline { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .timeline-item { display: flex; gap: 15px; padding: 15px 0; border-left: 3px solid #e0e0e0; padding-left: 20px; position: relative; }
    .timeline-item:first-child { border-left-color: #10b981; }
    .timeline-item:first-child::before { content: "✓"; position: absolute; left: -8px; top: 13px; background: #10b981; color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
    .timeline-item.pending { opacity: 0.7; }
    .timeline-item.pending::before { content: "2"; position: absolute; left: -8px; top: 13px; background: #ccc; color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
    .timeline-item h4 { margin: 0; color: #333; font-weight: 600; }
    .timeline-item p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .button:hover { background: #059669; }
    .button-container { text-align: center; margin: 20px 0; }
    .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none; }
    .info-box { background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Réservation confirmée ✓</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Votre paiement a été reçu</p>
    </div>

    <div class="content">
      <p>Bonjour <strong>${contactName}</strong>,</p>
      
      <p>Excellent ! Nous avons bien reçu votre paiement. Votre réservation est maintenant confirmée et nous allons commencer à traiter votre demande.</p>

      <div class="confirmation-badge">
        <div class="checkmark">✅</div>
        <h2>Paiement confirmé</h2>
        <p style="margin: 0; color: #666; font-size: 14px;">
          Montant: <strong>${totalAmount}€</strong>
        </p>
      </div>

      <div class="booking-details">
        <h3 style="margin-top: 0; color: #059669;">Détails de votre réservation</h3>
        <div class="detail-row">
          <span class="detail-label">Numéro de réservation</span>
          <span class="detail-value"><strong>${bookingNumber}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date de collecte</span>
          <span class="detail-value">${
            booking.pickup_date
              ? new Date(booking.pickup_date).toLocaleDateString("fr-FR")
              : "À confirmer"
          }</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Créneau de collecte</span>
          <span class="detail-value">${booking.pickup_time_slot || "À confirmer"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date estimée de livraison</span>
          <span class="detail-value">72h après collecte</span>
        </div>
      </div>

      <div class="timeline">
        <h3 style="margin-top: 0; color: #059669; margin-bottom: 20px;">Suivi de votre réservation</h3>
        
        <div class="timeline-item">
          <div>
            <h4>Paiement reçu</h4>
            <p>Votre commande est confirmée</p>
          </div>
        </div>

        <div class="timeline-item pending">
          <div>
            <h4>Collecte à domicile</h4>
            <p>À la date et l'heure convenus</p>
          </div>
        </div>

        <div class="timeline-item pending">
          <div>
            <h4>Nettoyage en cours</h4>
            <p>Traitement professionnel de vos vêtements</p>
          </div>
        </div>

        <div class="timeline-item pending">
          <div>
            <h4>Livraison</h4>
            <p>Retour à votre domicile (72h après collecte)</p>
          </div>
        </div>
      </div>

      <div class="info-box">
        <strong>💡 Suivi en temps réel</strong><br>
        Vous pouvez suivre l'état de votre réservation à tout moment via votre compte.
      </div>

      <div class="button-container">
        <a href="${dashboardLink}" class="button">Accéder à mon compte</a>
      </div>

      <p style="margin: 20px 0; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666;">
        <strong>Des questions ?</strong><br>
        N'hésitez pas à nous contacter: <a href="mailto:support@ninowash.com">support@ninowash.com</a><br>
        Nous sommes disponibles du lundi au vendredi, 9h-18h.
      </p>

      <p style="margin-top: 20px; font-size: 13px; color: #999;">
        Numéro de transaction: <strong>${paymentIntentId || "N/A"}</strong>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">Merci d'avoir choisi Nino Wash !</p>
      <p style="margin: 5px 0 0 0; font-size: 11px;">
        <a href="https://ninowash.com">ninowash.com</a> • 
        <a href="mailto:support@ninowash.com">support@ninowash.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `

    const emailPlainText = `
Réservation confirmée - Nino Wash ✓

Bonjour ${contactName},

Excellent ! Nous avons bien reçu votre paiement. Votre réservation est maintenant confirmée.

Détails de votre réservation:
- Numéro: ${bookingNumber}
- Montant payé: ${totalAmount}€
- Date de collecte: ${booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString("fr-FR") : "À confirmer"}
- Créneau: ${booking.pickup_time_slot || "À confirmer"}
- Livraison estimée: 72h après collecte

Suivi:
1. ✓ Paiement reçu - Votre commande est confirmée
2. Collecte à domicile - À la date et l'heure convenus
3. Nettoyage en cours - Traitement professionnel
4. Livraison - Retour à votre domicile

Accédez à votre compte: ${dashboardLink}

Des questions ? Contactez-nous: support@ninowash.com

Merci d'avoir choisi Nino Wash !
Nino Wash - Service de nettoyage à domicile
https://ninowash.com
    `

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY")

    if (!resendApiKey) {
      console.error("[send-booking-confirmation-email] RESEND_API_KEY not configured")
      // Don't fail - just log the warning
      console.warn("[send-booking-confirmation-email] Email service not configured, continuing anyway")
    } else {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Nino Wash <confirmation@ninowash.com>",
          to: email,
          subject: emailSubject,
          html: emailHtml,
          text: emailPlainText,
          reply_to: "support@ninowash.com",
        }),
      })

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text()
        console.error("[send-booking-confirmation-email] Resend API error:", errorData)
        // Log but don't fail - confirmation already in DB
      } else {
        const emailResult = await emailResponse.json()
        console.log("[send-booking-confirmation-email] Email sent successfully:", {
          messageId: emailResult.id,
          to: email,
          bookingId: bookingId,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: bookingId,
        email: email,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("[send-booking-confirmation-email] Error:", error)
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
