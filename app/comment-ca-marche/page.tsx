import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HowItWorksSection } from "@/components/sections/how-it-works-section"
import { Button } from "@/components/ui/button"
import { BookingButton } from "@/components/ui/booking-button"
import Link from "next/link"

export default function CommentCaMarchePage() {
  return (
    <main className="min-h-screen">
      <Header />
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-6">Comment ça marche</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Découvrez notre processus simple et transparent pour un service de pressing à domicile haut de gamme. En
            seulement 3 étapes, vos vêtements sont collectés, nettoyés et livrés.
          </p>
          <BookingButton size="lg">
            Réserver maintenant
          </BookingButton>
        </div>
      </section>

      <HowItWorksSection />

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Prêt à essayer ?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de clients satisfaits qui nous font confiance pour l'entretien de leurs vêtements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <BookingButton size="lg">
              Réserver maintenant
            </BookingButton>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">Voir nos services</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
