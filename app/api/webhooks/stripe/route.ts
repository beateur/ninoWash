import { headers } from "next/headers"
import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe, validateWebhookSignature, STRIPE_WEBHOOK_CONFIG } from "@/lib/stripe/index"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get("stripe-signature")

  console.log("[v0] Webhook received, signature present:", !!signature)

  if (!signature) {
    return NextResponse.json({ error: "No signature provided" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = validateWebhookSignature(body, signature, STRIPE_WEBHOOK_CONFIG.secret)
    console.log("[v0] Webhook event type:", event.type)
  } catch (err) {
    console.error("[v0] Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        console.log("[v0] Checkout session completed:", {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          paymentIntent: session.payment_intent,
          metadata: session.metadata,
        })

        // =====================================================
        // BOOKING PAYMENT (mode: "payment")
        // =====================================================
        const bookingId = session.metadata?.booking_id

        if (bookingId) {
          console.log("[v0] Processing booking payment checkout:", bookingId)

          // Update booking status to confirmed and mark payment as paid
          const { error: updateError } = await supabase
            .from("bookings")
            .update({
              status: "confirmed",
              payment_status: "paid", // ✅ Utiliser "paid" (contrainte SQL)
              paid_at: new Date().toISOString(),
              stripe_session_id: session.id,
              payment_intent_id: session.payment_intent as string,
              updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId)

          if (updateError) {
            console.error("[v0] Error updating booking after checkout success:", updateError)
            break
          }

          console.log("[v0] ✅ Booking confirmed via checkout.session.completed:", bookingId)
          // TODO: Trigger send-booking-confirmation-email Edge Function
          break // ✅ Sortie précoce après traitement booking
        }

        // =====================================================
        // SUBSCRIPTION PAYMENT (mode: "subscription")
        // =====================================================
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId

        // Si on arrive ici sans booking_id, on attend userId + planId pour subscription
        if (!userId || !planId) {
          console.warn("[v0] checkout.session.completed received without booking_id, userId, or planId:", {
            hasBookingId: !!bookingId,
            hasUserId: !!userId,
            hasPlanId: !!planId,
            metadata: session.metadata,
          })
          break // ✅ Pas de traitement si metadata invalides
        }

        console.log("[v0] Processing subscription payment checkout:", { userId, planId })

        // Get subscription details
        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        console.log("[v0] Retrieved subscription from Stripe:", {
          id: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
        })

        // Check if user has an existing subscription (for subscription changes)
        const { data: existingSubscriptions } = await supabase
          .from("subscriptions")
          .select("id, stripe_subscription_id")
          .eq("user_id", userId)
          .neq("stripe_subscription_id", subscriptionId) // Exclude the new one
          .eq("cancelled", false) // Only active subscriptions

        // If there are existing active subscriptions, mark them as cancelled (soft delete)
        if (existingSubscriptions && existingSubscriptions.length > 0) {
          console.log("[v0] Found existing subscriptions to mark as cancelled:", existingSubscriptions.length)
          
          for (const oldSub of existingSubscriptions) {
            await supabase
              .from("subscriptions")
              .update({
                cancelled: true,
                status: "canceled",
                canceled_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", oldSub.id)
          }
        }

        const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan_id: planId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            status: subscription.status,
            // @ts-expect-error - Stripe types don't include these properties but they exist
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            // @ts-expect-error - Stripe types don't include these properties but they exist
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            cancelled: false, // New subscription is active by default
          },
          {
            onConflict: "stripe_subscription_id",
          },
        )

        if (subscriptionError) {
          console.error("[v0] Error creating subscription:", subscriptionError)
          break
        }

        console.log("[v0] Subscription created successfully for user:", userId)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            // @ts-expect-error - Stripe types don't include these properties but they exist
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            // @ts-expect-error - Stripe types don't include these properties but they exist
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          })
          .eq("stripe_subscription_id", subscription.id)

        if (updateError) {
          console.error("[v0] Error updating subscription:", updateError)
          break
        }

        console.log("[v0] Subscription updated:", subscription.id)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        // Mark subscription as cancelled in database (soft delete - keeps history)
        const { error: deleteError } = await supabase
          .from("subscriptions")
          .update({
            cancelled: true,
            status: "canceled",
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)

        if (deleteError) {
          console.error("[v0] Error marking subscription as cancelled:", deleteError)
          break
        }

        console.log("[v0] Subscription marked as cancelled:", subscription.id)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("id, user_id")
          // @ts-expect-error - Stripe types don't include subscription property but it exists
          .eq("stripe_subscription_id", invoice.subscription as string)
          .single()

        if (!subscription) {
          console.error("[v0] Subscription not found for invoice:", invoice.id)
          break
        }

        // Record successful payment
        const { error: paymentError } = await supabase.from("payments").upsert(
          {
            user_id: subscription.user_id,
            subscription_id: subscription.id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: "succeeded",
            paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
          },
          {
            onConflict: "stripe_invoice_id",
          },
        )

        if (paymentError) {
          console.error("[v0] Error recording payment:", paymentError)
          break
        }

        console.log("[v0] Payment recorded:", invoice.id)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("id, user_id")
          // @ts-expect-error - Stripe types don't include subscription property but it exists
          .eq("stripe_subscription_id", invoice.subscription as string)
          .single()

        if (!subscription) {
          console.error("[v0] Subscription not found for failed invoice:", invoice.id)
          break
        }

        // Record failed payment
        const { error: paymentError } = await supabase.from("payments").upsert(
          {
            user_id: subscription.user_id,
            subscription_id: subscription.id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            status: "failed",
          },
          {
            onConflict: "stripe_invoice_id",
          },
        )

        if (paymentError) {
          console.error("[v0] Error recording failed payment:", paymentError)
          break
        }

        console.log("[v0] Failed payment recorded:", invoice.id)
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        console.log("[v0] Payment intent succeeded:", {
          paymentIntentId: paymentIntent.id,
          metadata: paymentIntent.metadata,
        })

        const bookingId = paymentIntent.metadata?.booking_id

        if (!bookingId) {
          console.error("[v0] Missing booking_id in payment intent metadata")
          break
        }

        // Update booking status to confirmed and mark payment as paid
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid", // ✅ Utiliser "paid" (contrainte SQL)
            paid_at: new Date().toISOString(),
            payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)

        if (updateError) {
          console.error("[v0] Error updating booking after payment success:", updateError)
          break
        }

        console.log("[v0] Booking confirmed after payment:", bookingId)

        // TODO: Trigger send-booking-confirmation-email Edge Function
        // This will send a confirmation email to the customer
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        console.log("[v0] Payment intent failed:", {
          paymentIntentId: paymentIntent.id,
          lastPaymentError: paymentIntent.last_payment_error,
          metadata: paymentIntent.metadata,
        })

        const bookingId = paymentIntent.metadata?.booking_id

        if (!bookingId) {
          console.error("[v0] Missing booking_id in failed payment intent metadata")
          break
        }

        // Update booking payment status to failed
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            payment_status: "failed",
            payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId)

        if (updateError) {
          console.error("[v0] Error updating booking after payment failure:", updateError)
          break
        }

        console.log("[v0] Booking payment marked as failed:", bookingId)

        // TODO: Trigger send-booking-payment-failed-email Edge Function
        // This will notify the customer that payment failed and retry needed
        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
