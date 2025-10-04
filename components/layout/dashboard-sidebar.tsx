"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  MapPin,
  Crown,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  User,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { clientAuth } from "@/lib/services/auth.service.client"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface DashboardSidebarProps {
  user: SupabaseUser
  hasActiveSubscription?: boolean
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Mes réservations",
    href: "/bookings",
    icon: Calendar,
  },
  {
    label: "Mon abonnement",
    href: "/subscription",
    icon: Crown,
  },
]

export function DashboardSidebar({ user, hasActiveSubscription }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    await clientAuth.signOut()
    router.push("/")
    router.refresh()
  }

  const userInitials = user.user_metadata?.first_name && user.user_metadata?.last_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`
    : user.email?.[0]?.toUpperCase() || "U"

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-bold text-lg">N</span>
          </div>
          <span className="font-bold text-xl">Nino Wash</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {/* Nouvelle réservation */}
        <Button asChild className="w-full justify-start mb-4" size="lg">
          <Link href="/reservation">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle réservation
          </Link>
        </Button>

        {/* Menu items */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User menu at bottom */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-2 py-6 hover:bg-muted"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium">
                  {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user.email}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/subscription/manage" className="cursor-pointer">
                <Crown className="mr-2 h-4 w-4" />
                Gérer l'abonnement
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile#payment-methods" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Modes de paiement
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile#addresses" className="cursor-pointer">
                <MapPin className="mr-2 h-4 w-4" />
                Mes adresses
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
