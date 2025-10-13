"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookingButton } from "@/components/ui/booking-button"
import { MobileNav } from "@/components/layout/mobile-nav"

/**
 * Header Marketing - Domaine Public (www)
 * 
 * Ce header est utilisé pour les pages marketing publiques.
 * Il ne fait AUCUNE vérification d'authentification.
 * 
 * Règles:
 * - Pas d'appel à useAuth()
 * - Pas de détection d'utilisateur connecté
 * - Pas d'icône de notification
 * - Pas d'avatar utilisateur
 * - Uniquement: Logo, Navigation publique, "Se connecter", "S'inscrire", "Réserver"
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">N</span>
            </div>
            <span className="font-serif text-xl font-semibold">Nino Wash</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/services" className="text-sm font-medium hover:text-primary transition-colors">
              Services
            </Link>
            <Link href="/comment-ca-marche" className="text-sm font-medium hover:text-primary transition-colors">
              Comment ça marche
            </Link>
            <Link href="/a-propos" className="text-sm font-medium hover:text-primary transition-colors">
              À propos
            </Link>
          </nav>

          {/* Desktop Actions - Marketing Only */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/auth/signin" className="text-sm font-medium hover:text-primary transition-colors">
              Se connecter
            </Link>
            {/*<Button asChild>
              <Link href="/auth/signup">S'inscrire</Link>
            </Button>*/}
            <BookingButton variant="secondary">
              Réserver maintenant
            </BookingButton>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  )
}
