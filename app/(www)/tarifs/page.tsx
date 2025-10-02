import { PricingSection } from "@/components/sections/pricing-section"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { STATIC_SERVICE_FEATURES } from "@/lib/data/static-pricing"
import { ShieldCheck, Truck, Shield, Headset, Leaf, Star } from "lucide-react"

const iconMap = {
  "shield-check": ShieldCheck,
  truck: Truck,
  shield: Shield,
  headset: Headset,
  leaf: Leaf,
  star: Star,
}

export const metadata = {
  title: "Tarifs - Nino Wash",
  description:
    "Découvrez nos tarifs transparents pour le pressing à domicile. Plans flexibles adaptés à tous les besoins.",
}

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6">Tarifs Transparents</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Pas de frais cachés, pas de surprises. Choisissez le plan qui vous convient et profitez d'un service de
            pressing premium à domicile.
          </p>
          <Button asChild size="lg">
            <Link href="/reservation">Commencer maintenant</Link>
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Features Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-bold text-center mb-12">Inclus dans tous nos plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.values(STATIC_SERVICE_FEATURES).map((feature) => {
              const Icon = iconMap[feature.icon as keyof typeof iconMap]
              return (
                <div key={feature.title} className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="font-serif text-3xl font-bold text-center mb-12">Questions Fréquentes</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Puis-je changer de plan à tout moment ?</h3>
              <p className="text-muted-foreground">
                Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. Les changements prennent effet
                immédiatement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Y a-t-il un engagement minimum ?</h3>
              <p className="text-muted-foreground">
                Non, tous nos plans sont sans engagement. Vous pouvez annuler à tout moment sans frais supplémentaires.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Comment fonctionne la facturation ?</h3>
              <p className="text-muted-foreground">
                Les plans mensuels sont facturés automatiquement chaque mois. Le plan Essentiel est facturé à chaque
                commande.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Proposez-vous des remises pour les entreprises ?</h3>
              <p className="text-muted-foreground">
                Oui, nous offrons des tarifs préférentiels pour les entreprises et les volumes importants.
                Contactez-nous pour un devis personnalisé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Prêt à commencer ?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de clients satisfaits qui font confiance à Nino Wash pour leur pressing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/reservation">Réserver maintenant</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
