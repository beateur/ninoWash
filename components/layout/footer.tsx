import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                <span className="text-sm font-bold text-foreground">N</span>
              </div>
              <span className="font-serif text-xl font-semibold">Nino Wash</span>
            </Link>
            <p className="text-sm text-background/80 leading-relaxed">
              Votre pressing à domicile haut de gamme. Service professionnel, collecte et livraison incluses.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-background/80 hover:text-background">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-background/80 hover:text-background">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-background/80 hover:text-background">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold">Services</h3>
            <ul className="space-y-2 text-sm text-background/80">
              <li>
                <Link href="/services" className="hover:text-background transition-colors">
                  Service classique
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-background transition-colors">
                  Abonnement mensuel
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-background transition-colors">
                  Abonnement trimestriel
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-background/80">
              <li>
                <Link href="/comment-ca-marche" className="hover:text-background transition-colors">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-background transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-background transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/compte" className="hover:text-background transition-colors">
                  Mon compte
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <div className="space-y-3 text-sm text-background/80">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>01 23 45 67 89</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contact@ninowash.fr</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Paris et petite couronne</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="max-w-md">
            <h3 className="font-semibold mb-2">Newsletter</h3>
            <p className="text-sm text-background/80 mb-4">Recevez nos offres exclusives et conseils d'entretien.</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Votre email"
                className="bg-background/10 border-background/20 text-background placeholder:text-background/60"
              />
              <Button variant="secondary" size="sm">
                S'abonner
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-background/20 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-background/80">
          <p>&copy; 2025 Nino Wash. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link href="/mentions-legales" className="hover:text-background transition-colors">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-background transition-colors">
              Confidentialité
            </Link>
            <Link href="/cgv" className="hover:text-background transition-colors">
              CGV
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
