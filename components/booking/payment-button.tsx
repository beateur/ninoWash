"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PaymentButtonProps {
  bookingId: string
}

export function PaymentButton({ bookingId }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePaymentClick = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/create-payment-intent`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la création de la session de paiement")
      }

      const data = await response.json()

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      console.error("[v0] Payment error:", errorMessage)
      toast.error(`Erreur: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      size="lg" 
      onClick={handlePaymentClick} 
      className="w-full" 
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirection vers paiement...
        </>
      ) : (
        "Payer maintenant"
      )}
    </Button>
  )
}
