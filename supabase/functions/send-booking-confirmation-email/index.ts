/**
 * Supabase Edge Function: send-booking-confirmation-email
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const { bookingId, bookingNumber, email, totalAmount, paymentIntentId } = payload

    if (!bookingId || !bookingNumber || !email) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 })
    }

    const formattedAmount = (totalAmount || 0).toString()
    const emailSubject = `Paiement confirmé - Réservation ${bookingNumber}`

    const emailHtml = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>${emailSubject}</title></head>
<body><div style="max-width:600px;margin:0 auto">
<h1>✓ Paiement confirmé !</h1>
<p>Réservation: <strong>${bookingNumber}</strong></p>
<p>Montant: <strong>${formattedAmount}€</strong></p>
<p>État: <strong style="color:green">Confirmé ✓</strong></p>
<p>Nous viendrons chercher vos vêtements à la date convenue.</p>
<p>Merci d'avoir choisi Nino Wash !</p>
</div></body></html>`

    const emailPlainText = `Paiement confirmé\nRéservation: ${bookingNumber}\nMontant: ${formattedAmount}€\nÉtat: Confirmé ✓\n\nMerci!`

    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured")
      return new Response(JSON.stringify({ success: true, warning: "Email not sent" }), { status: 200 })
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nino Wash <confirmation@ninowash.fr>",
        to: contactEmail,
        subject: emailSubject,
        html: emailHtml,
        text: emailPlainText,
      }),
    })

    if (!emailResponse.ok) {
      console.error("Resend API error")
    }

    return new Response(JSON.stringify({ success: true, bookingId, email }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 200 
    })
  } catch (error) {
    console.error("Error:", error)
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 })
  }
}

if (import.meta.main) {
  serve(handler)
}
