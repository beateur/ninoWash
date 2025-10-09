import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Politique de confidentialité</h1>
          <p className="text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Collecte des données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Nous collectons uniquement les données nécessaires au fonctionnement de notre service de pressing à
              domicile :
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Informations de compte (nom, email, téléphone)</li>
              <li>Adresses de collecte et de livraison</li>
              <li>Historique des réservations</li>
              <li>Informations de paiement (via Stripe, nous ne stockons pas les données bancaires)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Utilisation des données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Traiter vos réservations et livraisons</li>
              <li>Communiquer avec vous concernant votre service</li>
              <li>Améliorer notre service (données anonymisées)</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Protection des données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Nous mettons en œuvre des mesures de sécurité strictes :</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Chiffrement des données sensibles au repos</li>
              <li>Accès restreint aux données personnelles</li>
              <li>Audits de sécurité réguliers</li>
              <li>Conformité RGPD</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Vos droits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification de vos données</li>
              <li>Droit à l'effacement (droit à l'oubli)</li>
              <li>Droit à la portabilité de vos données</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit de retirer votre consentement</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à{" "}
              <a href="mailto:privacy@ninowash.fr" className="text-primary underline">
                privacy@ninowash.org
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Nous utilisons les cookies suivants :</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Cookies nécessaires :</strong> Requis pour le fonctionnement du site (authentification,
                sécurité)
              </li>
              <li>
                <strong>Cookies analytiques :</strong> Pour comprendre l'utilisation du site (avec votre consentement)
              </li>
              <li>
                <strong>Cookies marketing :</strong> Pour personnaliser le contenu (avec votre consentement)
              </li>
            </ul>
            <p className="mt-4">Vous pouvez gérer vos préférences de cookies à tout moment.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Conservation des données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Nous conservons vos données :</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Données de compte : Tant que votre compte est actif</li>
              <li>Historique des réservations : 3 ans après la dernière réservation</li>
              <li>Données de paiement : Selon les obligations légales (10 ans)</li>
              <li>Données analytiques : Anonymisées après 2 ans</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Partage des données</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Nous ne vendons jamais vos données. Nous les partageons uniquement avec :</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Nos prestataires de services (hébergement, paiement)</li>
              <li>Les autorités légales si requis par la loi</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Pour toute question concernant cette politique de confidentialité, contactez notre délégué à la protection
              des données :
            </p>
            <div className="mt-4 space-y-1">
              <p>
                Email :{" "}
                <a href="mailto:dpo@ninowash.fr" className="text-primary underline">
                  dpo@ninowash.fr
                </a>
              </p>
              <p>Adresse : Nino Wash, 123 Rue de la Paix, 75001 Paris, France</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
