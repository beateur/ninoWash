"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Home, Calendar, Package, CreditCard, User } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"

const navigation = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Réserver", href: "/reservation", icon: Calendar },
  { name: "Commandes", href: "/bookings", icon: Package },
  { name: "Abonnement", href: "/subscription", icon: CreditCard },
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
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
