/**
 * Stripe Payment Component for Guest Booking
 * Handles payment intent creation and Stripe Elements integration
 */

"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Lock } from "lucide-react"
import { toast } from "sonner"

// Load Stripe publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentProps {
  bookingData: {
    contact: {
      fullName: string
      email: string
      phone: string
    }
    pickupAddress: {
      street_address: string
      city: string
      postal_code: string
    }
    deliveryAddress: {
      street_address: string
      city: string
      postal_code: string
    }
    items: Array<{
      serviceId: string
      quantity: number
    }>
    services: Array<{
      id: string
      name: string
      base_price: number
    }>
    pickupDate: string
    pickupTimeSlot: string
    totalAmount: number
  }
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

function PaymentForm({
  clientSecret,
  bookingData,
  onSuccess,
  onError,
}: {
  clientSecret: string
  bookingData: StripePaymentProps["bookingData"]
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      console.error("[v0] Stripe not loaded")
      return
    }

    setIsProcessing(true)

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/reservation/success`,
          receipt_email: bookingData.contact.email,
        },
        redirect: "if_required", // Stay on page if 3D Secure not needed
      })

      if (error) {
        console.error("[v0] Payment error:", error)
        
        // User-friendly error messages
        let errorMessage = "Une erreur est survenue lors du paiement"
        
        if (error.type === "card_error") {
          errorMessage = error.message || "Carte refusée. Vérifiez vos informations."
        } else if (error.type === "validation_error") {
          errorMessage = "Informations de paiement invalides"
        }

        toast.error(errorMessage)
        onError(errorMessage)
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("[v0] Payment succeeded:", paymentIntent.id)
        toast.success("Paiement réussi !")
        onSuccess(paymentIntent.id)
      } else {
        console.log("[v0] Payment status:", paymentIntent?.status)
        toast.info("Paiement en cours de traitement...")
      }
    } catch (err: any) {
      console.error("[v0] Payment exception:", err)
      toast.error("Erreur lors du traitement du paiement")
      onError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Payment Element */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <PaymentElement
          options={{
            layout: "tabs",
            business: {
              name: "Nino Wash",
            },
          }}
        />
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Paiement sécurisé par Stripe</span>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Payer {bookingData.totalAmount.toFixed(2)} €
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        En confirmant le paiement, vous acceptez nos{" "}
        <a href="/conditions-generales" className="underline">
          conditions générales
        </a>
      </p>
    </form>
  )
}

export function StripePayment({ bookingData, onSuccess, onError }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isCreatingIntent, setIsCreatingIntent] = useState(false)
  const [intentError, setIntentError] = useState<string | null>(null)

  const createPaymentIntent = async () => {
    setIsCreatingIntent(true)
    setIntentError(null)

    try {
      console.log("[v0] Creating Payment Intent...")

      // Prepare service data with prices
      const servicesWithPrices = bookingData.items.map((item) => {
        const service = bookingData.services.find((s) => s.id === item.serviceId)
        if (!service) {
          throw new Error(`Service not found: ${item.serviceId}`)
        }
        return {
          serviceId: item.serviceId,
          serviceName: service.name,
          quantity: item.quantity,
          unitPrice: service.base_price,
        }
      })

      const response = await fetch("/api/bookings/guest/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestEmail: bookingData.contact.email,
          guestName: bookingData.contact.fullName,
          guestPhone: bookingData.contact.phone,
          services: servicesWithPrices,
          pickupAddress: {
            street: bookingData.pickupAddress.street_address,
            city: bookingData.pickupAddress.city,
            postalCode: bookingData.pickupAddress.postal_code,
          },
          deliveryAddress: {
            street: bookingData.deliveryAddress.street_address,
            city: bookingData.deliveryAddress.city,
            postalCode: bookingData.deliveryAddress.postal_code,
          },
          pickupDate: bookingData.pickupDate,
          pickupTimeSlot: bookingData.pickupTimeSlot,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la création du paiement")
      }

      const data = await response.json()
      console.log("[v0] Payment Intent created:", data.paymentIntentId)

      setClientSecret(data.clientSecret)
      toast.success("Prêt pour le paiement")
    } catch (error: any) {
      console.error("[v0] Failed to create Payment Intent:", error)
      setIntentError(error.message)
      toast.error(error.message)
      onError(error.message)
    } finally {
      setIsCreatingIntent(false)
    }
  }

  // Auto-create payment intent on mount
  useState(() => {
    if (!clientSecret && !isCreatingIntent && !intentError) {
      createPaymentIntent()
    }
  })

  if (intentError) {
    return (
      <div className="text-center space-y-4 py-8">
        <p className="text-destructive">{intentError}</p>
        <Button onClick={createPaymentIntent} variant="outline">
          Réessayer
        </Button>
      </div>
    )
  }

  if (isCreatingIntent || !clientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Préparation du paiement...</p>
        </div>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0F172A",
            colorBackground: "#ffffff",
            colorText: "#0F172A",
            colorDanger: "#ef4444",
            fontFamily: "system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
        locale: "fr",
      }}
    >
      <PaymentForm
        clientSecret={clientSecret}
        bookingData={bookingData}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}
