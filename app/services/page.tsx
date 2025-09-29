import { Services } from "@/components/sections/services"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6">Nos Services</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Découvrez nos différentes formules de pressing à domicile, conçues pour répondre à tous vos besoins. Du
            service ponctuel aux abonnements avantageux, trouvez la solution qui vous convient.
          </p>
          <Button asChild size="lg">
            <Link href="/reservation">Réserver maintenant</Link>
          </Button>
        </div>
      </section>

      {/* Services Component */}
      <Services />

      {/* Additional Info Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="font-semibold text-lg mb-3">Qualité Garantie</h3>
              <p className="text-muted-foreground">
                Nos professionnels utilisent des techniques de nettoyage respectueuses de vos vêtements.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Livraison Rapide</h3>
              <p className="text-muted-foreground">
                Collecte et livraison à domicile sous 48h pour le service classique.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Assurance Incluse</h3>
              <p className="text-muted-foreground">
                Tous nos services incluent une assurance pour votre tranquillité d'esprit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Une question sur nos services ?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Notre équipe est là pour vous aider à choisir la formule qui correspond le mieux à vos besoins.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">Nous contacter</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/comment-ca-marche">Comment ça marche</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
