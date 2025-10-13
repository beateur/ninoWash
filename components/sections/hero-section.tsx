import { Button } from "@/components/ui/button"
import { BookingButton } from "@/components/ui/booking-button"
import { ArrowRight, Clock, Shield, Truck } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-fade-in-up">
            L’élégance d’un linge parfait, sans contrainte
          </h1>

          <p
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Un service sur mesure, éthique et discret, qui s’occupe de vos vêtements du ramassage à la livraison, avec le soin et la précision qu’exige votre quotidien
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <BookingButton size="lg" className="text-base px-8">
              Réserver maintenant
              <ArrowRight className="ml-2 h-4 w-4" />
            </BookingButton>
            <Button variant="outline" size="lg" asChild className="text-base px-8 bg-transparent">
              <Link href="/comment-ca-marche">Comment ça marche</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Livraison 72h</h3>
              <p className="text-xs text-muted-foreground">Garantie de délai</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Assurance incluse</h3>
              <p className="text-xs text-muted-foreground">Vos vêtements protégés</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Collecte gratuite</h3>
              <p className="text-xs text-muted-foreground">Dès la première commande</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>
    </section>
  )
}
