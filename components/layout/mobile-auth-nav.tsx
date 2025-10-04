"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Home, Calendar, User, Package, Crown, LogOut } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"

/**
 * Mobile Auth Nav - Domaine Authentifié (app)
 * 
 * Navigation mobile pour les pages authentifiées.
 * Affiche les liens utilisateur et le bouton de déconnexion.
 */

const authenticatedNavigation = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: User },
  { name: "Réserver", href: "/reservation", icon: Calendar },
  { name: "Mes réservations", href: "/bookings", icon: Package },
  { name: "Abonnement", href: "/subscription", icon: Crown, highlight: true },
  { name: "Profil", href: "/profile", icon: User },
]

export function MobileAuthNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">N</span>
            </div>
            <span className="font-bold text-lg">Nino Wash</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="mb-6 p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm">
              {user.user_metadata?.first_name} {user.user_metadata?.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

        <nav className="space-y-2">
          {authenticatedNavigation.map((item) => {
            const isActive = pathname === item.href
            const isHighlighted = "highlight" in item && item.highlight
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isHighlighted
                      ? "text-primary hover:bg-primary/10 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
                {isHighlighted && !isActive && (
                  <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary text-xs">
                    Upgrade
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="mt-6 pt-6 border-t">
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
