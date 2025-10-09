import Link from "next/link"
import { XCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SubscriptionErrorPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <CardTitle className="text-3xl text-red-900">Erreur de paiement</CardTitle>
            <CardDescription className="text-base text-red-700">
              Une erreur est survenue lors du traitement de votre paiement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Que s'est-il passé ?</h3>
              <p className="text-muted-foreground">
                Le paiement n'a pas pu être traité. Cela peut être dû à plusieurs raisons :
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Fonds insuffisants sur votre carte</li>
                <li>Informations de carte incorrectes</li>
                <li>Votre banque a refusé la transaction</li>
                <li>Problème de connexion pendant le paiement</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Que faire maintenant ?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Vérifiez les informations de votre carte bancaire</li>
                <li>• Assurez-vous d'avoir suffisamment de fonds</li>
                <li>• Contactez votre banque si nécessaire</li>
                <li>• Réessayez avec une autre carte de paiement</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/subscription">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Réessayer
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="mailto:contact@ninowash.org">Contacter le support</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
