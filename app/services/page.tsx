import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ServicesSection } from "@/components/sections/services-section"
import { Button } from "@/components/ui/button"
import { BookingButton } from "@/components/ui/booking-button"
import { TrackViewContent } from "@/components/analytics/track-view-content"
import Link from "next/link"

export default function ServicesPage() {
  return (
    <main className="min-h-screen">
      <TrackViewContent contentName="Services Page" contentCategory="services" />
      <Header />
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6">Le Pressing pensé pour vous</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Collecte, soin et livraison sans effort. Cinq minutes suffisent, on s’occupe du reste.
            L’entretien du linge devient un plaisir discret.    
          </p>
          <BookingButton size="lg">
            Réserver maintenant
          </BookingButton>
        </div>
      </section>

      <ServicesSection />

      {/* Additional Info Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="font-semibold text-lg mb-3">Savoir-Faire</h3>
              <p className="text-muted-foreground">
                Le soin de vos vêtements est notre priorité : exigence, précision et respect des matières.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Livraison Rapide</h3>
              <p className="text-muted-foreground">
                Collecte et livraison à domicile sous 72h pour le service classique.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Assurance Incluse</h3>
              <p className="text-muted-foreground">
                Vos vêtements sont couverts à chaque étape : notre engagement, votre tranquillité.
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
              <a href="mailto:contact@ninowash.org">Nous contacter</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/comment-ca-marche">Comment ça marche</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
