import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Marie Dubois",
    location: "Paris 16e",
    rating: 5,
    comment:
      "Service exceptionnel ! Mes vêtements reviennent toujours impeccables et le service client est très réactif. Je recommande vivement.",
    avatar: "/professional-woman-smiling.png",
  },
  {
    name: "Thomas Martin",
    location: "Neuilly-sur-Seine",
    rating: 5,
    comment:
      "Très pratique pour quelqu'un comme moi qui travaille beaucoup. La collecte et livraison à domicile me fait gagner un temps précieux.",
    avatar: "/business-man-professional.jpg",
  },
  {
    name: "Sophie Laurent",
    location: "Boulogne-Billancourt",
    rating: 5,
    comment:
      "L'abonnement mensuel est parfait pour ma famille. Le rapport qualité-prix est excellent et le service toujours au rendez-vous.",
    avatar: "/elegant-woman-smiling.png",
  },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">Ce que disent nos clients</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Plus de 2000 clients nous font confiance pour l'entretien de leurs vêtements. Découvrez leurs témoignages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-sm bg-card/50 backdrop-blur">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <blockquote className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.comment}"</blockquote>

                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm font-medium">4.9/5 sur plus de 500 avis</span>
          </div>
        </div>
      </div>
    </section>
  )
}
