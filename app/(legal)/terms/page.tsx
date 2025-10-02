import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Conditions d'utilisation</h1>
          <p className="text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Acceptation des conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              En utilisant Nino Wash, vous acceptez ces conditions d'utilisation. Si vous n'acceptez pas ces conditions,
              veuillez ne pas utiliser notre service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Description du service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Nino Wash propose un service de pressing à domicile comprenant :</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Collecte de vos vêtements à votre domicile</li>
              <li>Nettoyage professionnel de vos articles</li>
              <li>Livraison à votre domicile</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Responsabilités du client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>En tant que client, vous vous engagez à :</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Fournir des informations exactes lors de la réservation</li>
              <li>Être présent aux heures de collecte et de livraison convenues</li>
              <li>Signaler tout article délicat ou nécessitant un traitement spécial</li>
              <li>Vider les poches de vos vêtements</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Tarification et paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Les tarifs sont indiqués sur notre site et peuvent être modifiés sans préavis.</p>
            <p>Le paiement s'effectue en ligne via notre plateforme sécurisée Stripe.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Annulation et remboursement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Vous pouvez annuler votre réservation :</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Jusqu'à 24h avant la collecte : Remboursement intégral</li>
              <li>Moins de 24h avant : Frais d'annulation de 50%</li>
              <li>Après la collecte : Aucun remboursement</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Limitation de responsabilité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Nous prenons le plus grand soin de vos vêtements. Cependant, nous ne pouvons être tenus responsables pour
              :
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Les dommages causés par des défauts de fabrication</li>
              <li>Les articles non signalés comme délicats</li>
              <li>Les objets laissés dans les poches</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Pour toute question concernant ces conditions :</p>
            <div className="mt-4 space-y-1">
              <p>
                Email :{" "}
                <a href="mailto:contact@ninowash.fr" className="text-primary underline">
                  contact@ninowash.fr
                </a>
              </p>
              <p>Téléphone : +33 1 23 45 67 89</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
