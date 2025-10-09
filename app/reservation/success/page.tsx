import Link from "next/link"
import { Clock, CheckCircle2, CreditCard, Mail, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Réservation en attente | Nino Wash",
  description: "Votre réservation a été enregistrée et est en attente de validation",
  robots: "noindex, nofollow", // Page temporaire, ne pas indexer
}

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { number?: string }
}) {
  const bookingNumber = searchParams.number

  // Check if user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Clock className="h-16 w-16 text-blue-600" />
            </div>
            <CardTitle className="text-3xl text-blue-900">Réservation en attente de validation</CardTitle>
            <CardDescription className="text-base text-blue-700">
              Nous avons bien reçu votre demande
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Prochaines étapes :</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Validation en cours</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Notre équipe va examiner votre demande et la valider sous peu
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Lien de paiement</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vous recevrez un email avec un lien sécurisé pour régler la prestation et confirmer votre
                      réservation
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Email récapitulatif</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Un email de confirmation avec tous les détails vous sera envoyé
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Notification en cas de refus</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Si votre réservation ne peut être honorée, vous serez notifié par email immédiatement
                    </p>
                  </div>
                </li>
              </ul>

              {bookingNumber && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-center">
                    <span className="text-sm text-muted-foreground">Numéro de réservation :</span>
                    <br />
                    <span className="text-xl font-semibold text-blue-900">#{bookingNumber}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <>
                  <Button asChild size="lg">
                    <Link href="/dashboard">Accéder au tableau de bord</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/dashboard?tab=bookings">Voir mes réservations</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/">Retour à l&apos;accueil</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/services">Découvrir nos services</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
