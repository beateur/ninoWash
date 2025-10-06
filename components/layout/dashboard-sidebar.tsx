"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { clientAuth } from "@/lib/services/auth.service.client"
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
]

/**
 * SidebarContent - Contenu partagé entre Desktop et Mobile
 */
interface SidebarContentProps {
  user: SupabaseUser
  hasActiveSubscription?: boolean
  isCollapsed?: boolean
  onNavigate?: () => void
}

function SidebarContent({ user, hasActiveSubscription, isCollapsed = false, onNavigate }: SidebarContentProps) {
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

  const handleNavClick = () => {
    if (onNavigate) onNavigate()
  }

  return (
    <>
      {/* Header - Logo */}
      <div className="border-b p-6">
        <Link href="/dashboard" className="flex items-center space-x-2" onClick={handleNavClick}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <span className="font-bold text-lg">N</span>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-xl">Nino Wash</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {/* Nouvelle réservation CTA */}
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-center mb-4" size="lg">
                  <Link href="/reservation" onClick={handleNavClick}>
                    <Plus className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Nouvelle réservation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button asChild className="w-full justify-start mb-4" size="lg">
            <Link href="/reservation" onClick={handleNavClick}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </Link>
          </Button>
        )}

        {/* Menu items */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          const Icon = item.icon

          if (isCollapsed) {
            return (
              <TooltipProvider key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
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

        {/* Badge Abonnement Actif */}
        {!isCollapsed && hasActiveSubscription && (
          <div className="mt-4 rounded-lg bg-primary/5 px-3 py-2 text-center">
            <p className="text-xs font-medium text-primary">✨ Abonnement Actif</p>
          </div>
        )}
      </nav>

      {/* User menu at bottom */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary",
                isCollapsed ? "justify-center" : "gap-3"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="flex flex-1 flex-col items-start overflow-hidden">
                    <span className="text-sm font-medium truncate w-full">
                      {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {user.email}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 mb-2">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer" onClick={handleNavClick}>
                <User className="mr-2 h-4 w-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/subscription/manage" className="cursor-pointer" onClick={handleNavClick}>
                <Crown className="mr-2 h-4 w-4" />
                Gérer l'abonnement
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile#payment-methods" className="cursor-pointer" onClick={handleNavClick}>
                <CreditCard className="mr-2 h-4 w-4" />
                Modes de paiement
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile#addresses" className="cursor-pointer" onClick={handleNavClick}>
                <MapPin className="mr-2 h-4 w-4" />
                Mes adresses
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

/**
 * DashboardSidebar - Navigation responsive (Desktop + Mobile)
 * 
 * Desktop (≥ 768px) :
 * - Sidebar fixe avec toggle plier/déplier
 * - États : Expanded (w-64) ou Collapsed (w-16, icons only)
 * - Persistance état dans localStorage
 * 
 * Mobile (< 768px) :
 * - Sidebar cachée par défaut (aucun espace pris)
 * - Hamburger button fixed (coin haut gauche)
 * - Sheet overlay (slide depuis la gauche)
 * - Auto-close après navigation
 */
export function DashboardSidebar({ user, hasActiveSubscription }: DashboardSidebarProps) {
  // Desktop: État collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Mobile: État sheet open/close
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Restaurer état collapsed depuis localStorage
  useEffect(() => {
    const collapsed = localStorage.getItem("sidebar-collapsed") === "true"
    setIsCollapsed(collapsed)
  }, [])

  // Toggle collapsed et sauvegarder dans localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  return (
    <>
      {/* Mobile: Header with Hamburger Button */}
      <div className="sticky top-0 z-50 md:hidden bg-background border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <span className="font-bold text-lg">N</span>
        </div>
        <span className="font-bold text-xl">Nino Wash</span>
      </div>

      {/* Mobile: Sheet Overlay */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex h-full flex-col">
            <SidebarContent
              user={user}
              hasActiveSubscription={hasActiveSubscription}
              onNavigate={() => setIsMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: Fixed Sidebar with Toggle */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen flex-col border-r bg-background transition-all duration-300 ease-in-out z-40",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle Button (en haut à droite du header) */}
        <div className="border-b p-4 flex items-center justify-between gap-2">
          {!isCollapsed ? (
            <>
              <Link href="/dashboard" className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                  <span className="font-bold text-lg">N</span>
                </div>
                <span className="font-bold text-xl truncate">Nino Wash</span>
              </Link>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleCollapsed}
                      className="shrink-0"
                      aria-label="Réduire la sidebar"
                    >
                      <PanelLeftClose className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Réduire la sidebar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapsed}
                    className="w-full"
                    aria-label="Étendre la sidebar"
                  >
                    <PanelLeftOpen className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Étendre la sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Sidebar Content (sans le header qui est déjà au-dessus) */}
        <nav className="flex-1 space-y-1 p-4">
          {/* Nouvelle réservation CTA */}
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild className="w-full justify-center mb-4" size="lg">
                    <Link href="/reservation">
                      <Plus className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Nouvelle réservation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button asChild className="w-full justify-center mb-4 h-12" size="lg">
              <Link href="/reservation">
                <Plus className="mr-2 h-5 w-5" />
                Nouvelle réservation
              </Link>
            </Button>
          )}

          {/* Navigation Items */}
          {navItems.map((item) => {
            const pathname = usePathname()
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            const Icon = item.icon

            if (isCollapsed) {
              return (
                <TooltipProvider key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors h-12",
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

          {/* Badge Abonnement Actif */}
          {!isCollapsed && hasActiveSubscription && (
            <div className="mt-4 rounded-lg bg-primary/5 px-3 py-2 text-center">
              <p className="text-xs font-medium text-primary">✨ Abonnement Actif</p>
            </div>
          )}
        </nav>

        {/* User Menu (bottom) */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary",
                  isCollapsed ? "justify-center" : "gap-3"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.user_metadata?.first_name?.[0]}{user.user_metadata?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-1 flex-col items-start overflow-hidden">
                      <span className="text-sm font-medium truncate w-full">
                        {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {user.email}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 mb-2">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
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
                onClick={async () => {
                  await clientAuth.signOut()
                  window.location.href = "/"
                }}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}
