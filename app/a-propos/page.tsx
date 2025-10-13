import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { BookingButton } from "@/components/ui/booking-button"
import { ArrowRight, Sparkles, Heart, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-fade-in-up text-balance">
              Le soin du linge, <span className="block text-primary">réinventé.</span>
            </h1>

            <p
              className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up text-pretty leading-relaxed"
              style={{ animationDelay: "0.1s" }}
            >
              Confier son linge, c'est confier une part de soi. Nino Wash vous offre la sérénité d'un service haut de
              gamme, discret et fiable.
            </p>

            <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" variant="outline" asChild className="text-base px-8 bg-transparent">
                <Link href="/services">
                  Découvrir nos Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* Notre Mission */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground text-balance">
                  Notre Mission
                  <span className="block text-primary mt-2">Libérer votre temps</span>
                </h2>

                <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
                  Chez Nino Wash, nous croyons que le vrai luxe est le temps. Notre mission est de vous libérer de la
                  corvée du linge, pour que vous puissiez consacrer vos journées à ce qui compte vraiment : vos proches,
                  vos projets, vos passions.
                </p>

                <div className="pt-4">
                  <Button variant="link" asChild className="text-primary p-0 h-auto">
                    <Link href="/comment-ca-marche" className="flex items-center gap-2">
                      Comment ça marche ?
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative h-[400px] rounded-lg overflow-hidden bg-secondary/20">
                <Image
                  src="/famille-heureuse-moment-de-qualit--ensemble-lifest.jpg"
                  alt="Moment de qualité en famille"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Savoir-Faire */}
      <section className="py-24 bg-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Notre Savoir-Faire
                <span className="block text-primary mt-2">L'Art du Détail</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Précision */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-background">
                  <Image src="/v-tement-trait--avec-soin-pressing-professionnel-d.jpg" alt="Précision du traitement" fill className="object-cover" />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Précision</h3>
                <p className="text-muted-foreground text-pretty leading-relaxed">
                  Chaque vêtement est traité avec une attention particulière.
                </p>
              </div>

              {/* Expertise textile */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-background">
                  <Image src="/tissus-d-licats-soie-luxe-textile-premium.jpg" alt="Expertise textile" fill className="object-cover" />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Expertise textile</h3>
                <p className="text-muted-foreground text-pretty leading-relaxed">
                  Des méthodes adaptées aux tissus les plus délicats.
                </p>
              </div>

              {/* Confiance */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-background">
                  <Image
                    src="/livraison-pressing-suivi-transparent-service-clien.jpg"
                    alt="Confiance et transparence"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Confiance</h3>
                <p className="text-muted-foreground text-pretty leading-relaxed">
                  Un suivi transparent, du ramassage à la livraison.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button variant="link" asChild className="text-primary">
                <Link href="/services">Voir nos Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Engagement */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-[400px] rounded-lg overflow-hidden bg-secondary/20 order-2 lg:order-1">
                <Image src="/linge-emball--avec-soin-packaging-premium--l-gant.jpg" alt="Linge emballé avec soin" fill className="object-cover" />
              </div>

              <div className="space-y-6 order-1 lg:order-2">
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground text-balance">
                  Notre Engagement
                  <span className="block text-primary mt-2">Haut de gamme & durable</span>
                </h2>

                <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
                  La qualité ne doit jamais compromettre la confiance ni l'environnement. Chez Nino Wash, nous allions
                  exigence, durabilité et simplicité, pour un service qui s'adapte à votre rythme de vie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-b from-secondary/20 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance">
              Libérez votre temps.
              <span className="block text-primary mt-2">Confiez-nous l'essentiel.</span>
            </h2>

            <BookingButton size="lg" className="text-base px-8">
              Réserver maintenant
              <ArrowRight className="ml-2 h-4 w-4" />
            </BookingButton>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
