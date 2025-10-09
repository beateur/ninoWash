import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6">
            Prêt à simplifier l'entretien de vos vêtements ?
          </h2>
          <p className="text-lg sm:text-xl mb-8 text-primary-foreground/90">
            Rejoignez des milliers de clients satisfaits et profitez d'un service de pressing haut de gamme à domicile.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base px-8">
              <Link href="/reservation/guest">
                Réserver maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-base px-8 bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <a href="mailto:contact@ninowash.org">Nous contacter par email</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
