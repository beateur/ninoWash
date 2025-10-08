"use client"

import { useCallback, useState } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { createCheckoutSession } from "@/app/actions/stripe"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutFormProps {
  planId: string
}

interface ScheduledDowngradeResponse {
  type: 'scheduled_downgrade'
  message: string
  effectiveDate: string
  currentPeriodEnd: string
  newPlanName: string
}

export function CheckoutForm({ planId }: CheckoutFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [scheduledDowngrade, setScheduledDowngrade] = useState<ScheduledDowngradeResponse | null>(null)
  const router = useRouter()

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    try {
      setError(null)
      const result = await createCheckoutSession(planId)
      
      // Check if it's a scheduled downgrade response (JSON string)
      try {
        const parsed = JSON.parse(result) as ScheduledDowngradeResponse
        if (parsed.type === 'scheduled_downgrade') {
          setScheduledDowngrade(parsed)
          // Return empty string to prevent checkout from loading
          throw new Error("SCHEDULED_DOWNGRADE")
        }
      } catch (parseError) {
        // Not JSON or not a scheduled downgrade, continue normally
        if (parseError instanceof Error && parseError.message === "SCHEDULED_DOWNGRADE") {
          throw parseError
        }
      }
      
      // CRITICAL: Stripe embedded checkout REQUIRES a client_secret
      if (!result) {
        throw new Error("Impossible de créer la session de paiement")
      }
      
      return result
    } catch (err) {
      if (err instanceof Error && err.message === "SCHEDULED_DOWNGRADE") {
        // This is expected for scheduled downgrades
        return ""
      }
      console.error("[v0] Error creating checkout session:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      throw err
    }
  }, [planId])

  // Show scheduled downgrade message
  if (scheduledDowngrade) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Changement d'abonnement planifié
          </CardTitle>
          <CardDescription>Votre demande a été enregistrée</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-900">
              {scheduledDowngrade.message}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Nouveau plan :</strong> {scheduledDowngrade.newPlanName}
            </p>
            <p>
              <strong>Date d'effet :</strong>{" "}
              {new Date(scheduledDowngrade.effectiveDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p className="pt-2">
              Vous continuerez à bénéficier de votre abonnement actuel jusqu'à cette date.
              Aucun paiement ne sera effectué maintenant.
            </p>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => router.push('/subscription')}
              className="flex-1"
            >
              Retour à mes abonnements
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription>Impossible de charger le formulaire de paiement</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations de paiement</CardTitle>
        <CardDescription>Paiement sécurisé par Stripe</CardDescription>
      </CardHeader>
      <CardContent>
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </CardContent>
    </Card>
  )
}
