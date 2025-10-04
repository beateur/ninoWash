"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/hooks/use-auth"
import { User, Settings, LogOut, Package, Crown, Home } from "lucide-react"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { MobileAuthNav } from "@/components/layout/mobile-auth-nav"

/**
 * Authenticated Header - Domaine Authentifié (app)
 * 
 * Ce header est utilisé pour les pages nécessitant une authentification.
 * Il détecte l'utilisateur connecté et affiche les éléments appropriés.
 * 
 * Utilisé dans:
 * - /dashboard
 * - /profile
 * - /bookings
 * - /subscription
 * - etc.
 */
export function AuthenticatedHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">N</span>
            </div>
            <span className="font-serif text-xl font-semibold">Nino Wash</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
              <Home className="h-4 w-4" />
              Accueil
            </Link>
            <Link href="/reservation" className="text-sm font-medium hover:text-primary transition-colors">
              Réserver
            </Link>
            <Link href="/bookings" className="text-sm font-medium hover:text-primary transition-colors">
              Mes réservations
            </Link>
            <Link href="/subscription" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2">
              <Crown className="h-4 w-4" />
              S'abonner
            </Link>
          </nav>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
            ) : user ? (
              <>
                <NotificationCenter />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.user_metadata?.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">
                          {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                        </p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" className="text-primary font-semibold">
                        <Crown className="mr-2 h-4 w-4" />
                        S'abonner
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookings">
                        <Package className="mr-2 h-4 w-4" />
                        Mes réservations
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <Settings className="mr-2 h-4 w-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {user && <NotificationCenter />}
            <MobileAuthNav />
          </div>
        </div>
      </div>
    </header>
  )
}
