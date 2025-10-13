"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookingButton } from "@/components/ui/booking-button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Lock } from "lucide-react"
import Link from "next/link"
import { SUBSCRIPTIONS_ENABLED } from "@/lib/flags"

const services = [
  {
    id: "classic",
    name: "Service Classique",
    description: "Parfait pour vos besoins ponctuels",
    price: "24,99€",
    priceDetail: "pour 7 kg (+2 €/kg supplémentaire)",
    features: [
      "Collecte et livraison à domicile",
      "Nettoyage professionnel",
      "Livraison sous 72h",
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
            Choisissez la formule qui correspond le mieux à vos besoins. Toutes incluent notre qualité
            de service irréprochable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((service) => {
            const isSubscription = service.id !== "classic"
            const isLocked = isSubscription && !SUBSCRIPTIONS_ENABLED

            return (
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
                  <div className="flex items-center justify-center gap-2">
                    <CardTitle className="text-xl font-semibold">{service.name}</CardTitle>
                    {/* TEASER LAYER — delete when subscriptions go live */}
                    {isLocked && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Bientôt
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm">{service.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">{service.price}</span>
                    <span className="text-sm text-muted-foreground ml-1 block mt-1">{service.priceDetail}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features list with conditional blur overlay */}
                  <div className="relative">
                    <ul className="space-y-3">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* TEASER LAYER — Blur overlay on features only */}
                    {isLocked && (
                      <div
                        className="absolute inset-0 rounded-xl backdrop-blur-[2px] bg-background/40 flex items-end justify-center p-3"
                        aria-label="Bientôt disponible"
                      >
                        <p className="text-xs font-medium text-muted-foreground">Bientôt disponible</p>
                      </div>
                    )}
                  </div>

                  {/* Conditional CTA: Link (active) or Button (disabled) */}
                  {isLocked ? (
                    // TEASER LAYER — Disabled button with no href
                    <Button
                      className="w-full opacity-80 cursor-not-allowed"
                      variant={service.popular ? "default" : "outline"}
                      aria-disabled="true"
                      onClick={(e) => e.preventDefault()}
                      tabIndex={-1}
                    >
                      S'abonner
                    </Button>
                  ) : service.id === "classic" ? (
                    // Classic service → Guest booking flow
                    <BookingButton 
                      className="w-full" 
                      variant={service.popular ? "default" : "outline"}
                      href="/reservation/guest"
                    >
                      Réserver
                    </BookingButton>
                  ) : (
                    // Subscriptions → Authenticated booking flow
                    <Button asChild className="w-full" variant={service.popular ? "default" : "outline"}>
                      <Link href={`/reservation?service=${service.id}`}>
                        S'abonner
                      </Link>
                    </Button>
                  )}

                  {service.requiresAuth && !isLocked && (
                    <p className="text-xs text-muted-foreground text-center">* Connexion requise pour les abonnements</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">Besoin d'une solution sur mesure ?</p>
          <Button variant="outline" asChild>
            <a href="mailto:contact@ninowash.org">Contactez-nous</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
