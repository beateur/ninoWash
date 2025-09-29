"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Home, Calendar, User, CreditCard, Package, Wrench, HelpCircle, Info, Phone } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"

const publicNavigation = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Services", href: "/services", icon: Wrench },
  { name: "Comment ça marche", href: "/comment-ca-marche", icon: HelpCircle },
  { name: "À propos", href: "/a-propos", icon: Info },
  { name: "Contact", href: "/contact", icon: Phone },
]

const authenticatedNavigation = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Réserver", href: "/reservation", icon: Calendar },
  { name: "Mes réservations", href: "/bookings", icon: Package },
  { name: "Abonnement", href: "/subscription", icon: CreditCard },
  { name: "Profil", href: "/profile", icon: User },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const pathname = usePathname()

  const navigation = user ? authenticatedNavigation : publicNavigation

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Nino Wash</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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

        {!user && (
          <div className="mt-6 pt-6 border-t space-y-2">
            <Link href="/auth/signin" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full bg-transparent">
                Se connecter
              </Button>
            </Link>
            <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
              <Button className="w-full">S'inscrire</Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
