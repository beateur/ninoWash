/**
 * Guest Booking Success Page
 * Displayed after successful payment + account creation + booking creation
 * 
 * Route: /reservation/guest/success?bookingId=xxx&email=xxx
 */

"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail, Calendar, Package, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function GuestBookingSuccessPage() {
  const searchParams = useSearchParams()

  const bookingId = searchParams.get("bookingId")
  const email = searchParams.get("email")

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-6">
          <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
        </div>
      </div>

      {/* Main Success Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            🎉 Réservation confirmée !
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          <p className="text-center text-muted-foreground">
            Votre paiement a été traité avec succès et votre réservation est
            confirmée.
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
                  Un email de confirmation a été envoyé à{" "}
                  <span className="font-medium">{email || "votre adresse email"}</span>.
                  Vous y trouverez les détails de votre compte et un lien pour
                  définir votre mot de passe.
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
                <strong>Vérifiez votre email</strong> pour les détails de votre
                compte
              </li>
              <li>
                <strong>Définissez votre mot de passe</strong> en cliquant sur
                le lien dans l'email
              </li>
              <li>
                <strong>Connectez-vous</strong> pour suivre votre réservation en
                temps réel
              </li>
              <li>
                <strong>Nous viendrons chercher votre linge</strong> à la date
                et l'heure convenues
              </li>
            </ol>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto min-w-[300px]">
              <Link href="/dashboard">
                <ArrowRight className="mr-2 h-4 w-4" />
                Accéder à mon tableau de bord
              </Link>
            </Button>
          </div>

          {/* Support */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Vous avez une question ?{" "}
              <a
                href="mailto:contact@ninowash.org"
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
