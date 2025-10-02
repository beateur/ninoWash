import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star } from "lucide-react"
import Link from "next/link"

const services = [
  {
    id: "classic",
    name: "Service Classique",
    description: "Parfait pour vos besoins ponctuels",
    price: "24,99€",
    priceDetail: "pour 8 kg (+1€/kg supplémentaire)",
    features: [
      "Collecte et livraison à domicile",
      "Nettoyage professionnel",
      "Livraison sous 48h",
      "Assurance incluse",
      "Accessible sans connexion",
    ],
    popular: false,
    requiresAuth: false, // New field to indicate if auth is required
  },
  {
    id: "monthly",
    name: "Abonnement Mensuel",
    description: "Pour un pressing régulier et économique",
    price: "99,99€",
    priceDetail: "par mois (2 collectes/semaine)",
    features: [
      "2 collectes par semaine",
      "Collecte et livraison illimitées",
      "Priorité sur les créneaux",
      "Tarifs préférentiels",
      "Service client dédié",
      "1 collecte gratuite après 10 commandes",
    ],
    popular: true,
    requiresAuth: true, // Requires authentication
  },
  {
    id: "quarterly",
    name: "Abonnement Trimestriel",
    description: "La solution la plus avantageuse",
    price: "249,99€",
    priceDetail: "par trimestre (3 collectes/semaine)",
    features: [
      "3 collectes par semaine",
      "Collecte et livraison illimitées",
      "Priorité absolue",
      "Tarifs préférentiels maximaux",
      "Service client premium",
      "1 collecte gratuite après 10 commandes",
      "Stockage gratuit 7 jours",
    ],
    popular: false,
    requiresAuth: true, // Requires authentication
  },
]

export function ServicesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">Nos formules</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choisissez la formule qui correspond le mieux à vos besoins. Toutes incluent notre service de qualité
            irréprochable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((service) => (
            <Card
              key={service.id}
              className={`relative ${service.popular ? "border-primary shadow-lg scale-105" : ""}`}
            >
              {service.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  <Star className="w-3 h-3 mr-1" />
                  Plus populaire
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold">{service.name}</CardTitle>
                <CardDescription className="text-sm">{service.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-primary">{service.price}</span>
                  <span className="text-sm text-muted-foreground ml-1 block mt-1">{service.priceDetail}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full" variant={service.popular ? "default" : "outline"}>
                  <Link href={`/reservation?service=${service.id}`}>
                    {service.id === "classic" ? "Réserver" : "S'abonner"}
                  </Link>
                </Button>

                {service.requiresAuth && (
                  <p className="text-xs text-muted-foreground text-center">* Connexion requise pour les abonnements</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">Besoin d'une solution sur mesure ?</p>
          <Button variant="outline" asChild>
            <Link href="/contact">Contactez-nous</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
