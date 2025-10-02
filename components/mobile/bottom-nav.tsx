"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Home, Calendar, Package, Crown, User } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"

const navigation = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Réserver", href: "/reservation", icon: Calendar },
  { name: "Commandes", href: "/bookings", icon: Package },
  { name: "Abonnement", href: "/subscription", icon: Crown, highlight: true },
  { name: "Profil", href: "/profile", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Don't show bottom nav if user is not logged in or on auth pages
  if (!user || pathname.startsWith("/auth") || pathname.startsWith("/admin")) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const isHighlighted = "highlight" in item && item.highlight
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors relative",
                isActive
                  ? "text-primary bg-primary/5"
                  : isHighlighted
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {isHighlighted && !isActive && (
                  <Badge className="absolute -top-1 -right-2 h-2 w-2 p-0 bg-primary border-2 border-background" />
                )}
              </div>
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
