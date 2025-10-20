"use client"

import { useState, useEffect } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { createSetupIntent } from "@/app/actions/payment-methods"
import { useToast } from "@/hooks/use-toast"
import { stripePromise } from "@/lib/stripe/client"

interface AddPaymentMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

/**
 * Formulaire Stripe pour ajouter une carte
 * Composant interne qui utilise les hooks Stripe
 */
function PaymentForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Confirm setup intent
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-methods`, // Fallback (pas utilisé en mode sans redirect)
        },
        redirect: "if_required", // Pas de redirect, gérer en client
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      if (!setupIntent || setupIntent.status !== "succeeded") {
        throw new Error("La configuration du moyen de paiement a échoué")
      }

      // Get payment method ID from setup intent
      const paymentMethodId = setupIntent.payment_method

      if (typeof paymentMethodId !== "string") {
        throw new Error("ID de moyen de paiement invalide")
      }

      // The payment method details are already in setupIntent.payment_method
      // Stripe Elements attaches the payment method to the customer automatically
      // We just need to save the reference to our database
      
      // Save to database via API (backend will fetch details from Stripe)
      const response = await fetch("/api/payments/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "card",
          provider: "stripe",
          providerPaymentMethodId: paymentMethodId,
          // Backend API will fetch remaining details from Stripe
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de l'enregistrement de la carte")
      }

      const { paymentMethod: savedMethod } = await response.json()

      toast({
        title: "Carte ajoutée avec succès",
        description: savedMethod 
          ? `Carte ${savedMethod.card_brand} •••• ${savedMethod.card_last4} enregistrée.`
          : "Votre carte a été enregistrée avec succès.",
      })

      onSuccess()
    } catch (err) {
      console.error("[v0] Error adding payment method:", err)
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue"
      setError(errorMessage)
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="py-4">
        <PaymentElement />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Ajouter la carte"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Dialog pour ajouter un moyen de paiement via Stripe
 * Utilise Setup Intent (pas de paiement, juste enregistrer la carte)
 */
export function AddPaymentMethodDialog({ open, onOpenChange, onSuccess }: AddPaymentMethodDialogProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoadingIntent, setIsLoadingIntent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create setup intent when dialog opens
  useEffect(() => {
    if (open && !clientSecret && !isLoadingIntent) {
      const fetchSetupIntent = async () => {
        try {
          setIsLoadingIntent(true)
          setError(null)
          console.log("[v0] Creating setup intent...")
          const result = await createSetupIntent()
          console.log("[v0] Setup intent created:", result)
          setClientSecret(result.clientSecret)
        } catch (err) {
          console.error("[v0] Error creating setup intent:", err)
          setError(err instanceof Error ? err.message : "Erreur lors de l'initialisation")
        } finally {
          setIsLoadingIntent(false)
        }
      }
      
      fetchSetupIntent()
    }
    
    // Reset when closing
    if (!open) {
      setClientSecret(null)
      setError(null)
    }
  }, [open, clientSecret, isLoadingIntent])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un moyen de paiement</DialogTitle>
          <DialogDescription>
            Ajoutez une carte bancaire pour faciliter vos paiements futurs. Vos informations sont sécurisées par
            Stripe.
          </DialogDescription>
        </DialogHeader>

        {/* Debug info */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-muted-foreground space-y-1 border p-2 rounded bg-muted/50">
            <div>Loading: {isLoadingIntent ? "✅ Oui" : "❌ Non"}</div>
            <div>Client Secret: {clientSecret ? "✅ Défini" : "❌ Non défini"}</div>
            <div>Error: {error ? `⚠️ ${error}` : "✅ Aucune"}</div>
          </div>
        )}

        {isLoadingIntent && (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Initialisation du paiement sécurisé...</p>
          </div>
        )}

        {error && !isLoadingIntent && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {clientSecret && !isLoadingIntent && !error && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#0F172A",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <PaymentForm
              onSuccess={() => {
                onSuccess()
                onOpenChange(false)
              }}
              onCancel={() => onOpenChange(false)}
            />
          </Elements>
        )}

        {/* Debug: If nothing displays */}
        {!isLoadingIntent && !clientSecret && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>🔍 État inattendu - vérifiez la console</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
