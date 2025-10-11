"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Home, Wrench, HelpCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Mobile Nav Marketing - Domaine Public (www)
 * 
 * Navigation mobile pour les pages marketing publiques.
 * Pas de vérification d'authentification.
 * 
 * Règles:
 * - Pas d'appel à useAuth()
 * - Navigation publique uniquement
 * - Boutons "Se connecter" / "S'inscrire" en bas
 */

const publicNavigation = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Services", href: "/services", icon: Wrench },
  { name: "Comment ça marche", href: "/comment-ca-marche", icon: HelpCircle },
  { name: "À propos", href: "/a-propos", icon: Info },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
        {/* Header avec padding */}
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">N</span>
            </div>
            <span className="font-bold text-lg">Nino Wash</span>
          </Link>
        </div>

        {/* Navigation avec padding */}
        <nav className="px-4 py-6 space-y-1">
          {publicNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Actions Marketing avec padding */}
        <div className="px-4 py-4 mt-auto border-t space-y-3">
          <Link href="/auth/signin" onClick={() => setIsOpen(false)} className="block">
            <Button variant="outline" className="w-full">
              Se connecter
            </Button>
          </Link>
          {/*<Link href="/auth/signup" onClick={() => setIsOpen(false)} className="block">
            <Button className="w-full">S'inscrire</Button>
          </Link>*/}
          <Link href="/reservation/guest" onClick={() => setIsOpen(false)} className="block">
            <Button className="w-full">
              Réserver maintenant
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
