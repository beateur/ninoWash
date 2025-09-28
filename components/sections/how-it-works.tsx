import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Package, Sparkles } from "lucide-react"

const steps = [
  {
    number: "1",
    title: "Réservez en ligne",
    description: "Choisissez votre créneau de collecte en quelques clics. Nous nous adaptons à votre emploi du temps.",
    icon: Calendar,
    color: "bg-blue-50 text-blue-600",
  },
  {
    number: "2",
    title: "Nous collectons",
    description: "Notre équipe vient récupérer vos vêtements à domicile dans un sac de transport sécurisé.",
    icon: Package,
    color: "bg-orange-50 text-orange-600",
  },
  {
    number: "3",
    title: "Nettoyage expert",
    description:
      "Vos vêtements sont traités par nos professionnels avec des produits haut de gamme et des techniques adaptées.",
    icon: Sparkles,
    color: "bg-green-50 text-green-600",
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">Comment ça marche</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un processus simple et transparent pour un résultat impeccable. Votre pressing à domicile en 3 étapes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <Card className="h-full border-0 shadow-sm bg-card/50 backdrop-blur">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${step.color} mb-6`}>
                    <step.icon className="h-8 w-8" />
                  </div>

                  <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>

              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border -translate-y-1/2 z-10" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Livraison sous 48h garantie
          </div>
        </div>
      </div>
    </section>
  )
}
