/**
 * Guest Booking Success Page
 * Displayed after successful booking creation with automatic account creation + auto-login
 * 
 * Route: /reservation/guest/success?bookingId=xxx&email=xxx&accessToken=xxx&refreshToken=xxx
 */

"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail, Calendar, Package, ArrowRight, Loader2 } from "lucide-react"

export default function GuestBookingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const bookingId = searchParams.get("bookingId")
  const email = searchParams.get("email")
  const accessToken = searchParams.get("accessToken")
  const refreshToken = searchParams.get("refreshToken")

  // Auto-login if tokens are present
  useEffect(() => {
    const performAutoLogin = async () => {
      if (!accessToken || !refreshToken) {
        console.log("[v0] No tokens provided, user will need to login manually")
        return
      }

      setIsLoggingIn(true)
      try {
        const supabase = createClient()

        // Set session with tokens
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (setSessionError) {
          console.error("[v0] Failed to set session:", setSessionError)
          setLoginError("Erreur lors de la connexion automatique")
          return
        }

        console.log("[v0] Session set successfully, redirecting to dashboard...")

        // Small delay to ensure session is persisted
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Redirect to dashboard with booking ID
        router.push(`/dashboard?newBookingId=${bookingId}`)
      } catch (error) {
        console.error("[v0] Auto-login error:", error)
        setLoginError("Erreur lors de la connexion automatique")
      } finally {
        setIsLoggingIn(false)
      }
    }

    performAutoLogin()
  }, [accessToken, refreshToken, bookingId, router])

  // Show loading state while logging in
  if (isLoggingIn) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Connexion en cours...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if login failed
  if (loginError) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-red-200">
          <CardContent className="p-8 space-y-4">
            <p className="text-red-600 font-semibold">{loginError}</p>
            <p className="text-sm text-muted-foreground">
              Vous pouvez continuer vers le dashboard et vous connecter manuellement si nécessaire.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Aller au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {/* Main Success Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Réservation reçue ! 
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          <p className="text-center text-muted-foreground">
            Votre réservation a été enregistrée. Elle est actuellement en attente de 
            confirmation de notre part.
          </p>

          {/* Booking ID */}
          {bookingId && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Numéro de réservation</span>
              </div>
              <p className="font-mono font-semibold text-lg">{bookingId}</p>
            </div>
          )}

          {/* Email Confirmation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Vérifiez votre email
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Un email de confirmation sera envoyé à l'adresse suivante :{" "}
                  <span className="font-medium">{email || "votre adresse email"}</span>.
                  Une fois votre réservation confirmée par nos équipes, vous recevrez 
                  un lien pour procéder au paiement.
                </p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Prochaines étapes
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>
                <strong>Vérifiez votre email</strong> pour l'email de confirmation
              </li>
              <li>
                <strong>Attendez notre confirmation</strong> que votre réservation est acceptée
              </li>
              <li>
                <strong>Recevez un email avec le lien de paiement</strong> une fois confirmée
              </li>
              <li>
                <strong>Procédez au paiement</strong> en cliquant sur le lien sécurisé
              </li>
            </ol>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Button 
              onClick={() => router.push("/dashboard")}
              size="lg" 
              className="w-full sm:w-auto min-w-[300px]"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Aller au tableau de bord
            </Button>
          </div>

          {/* Support */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Vous avez une question ?{" "}
              <a
                href="mailto:contact@ninowash.fr"
                className="text-primary hover:underline"
              >
                Contactez-nous
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          📱 Téléchargez notre application pour un suivi en temps réel
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" size="sm" disabled>
            App Store (bientôt)
          </Button>
          <Button variant="outline" size="sm" disabled>
            Google Play (bientôt)
          </Button>
        </div>
      </div>
    </div>
  )
}
