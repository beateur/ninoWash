import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { requireAuth } from "@/lib/auth/route-guards"

/**
 * Authenticated Layout
 * 
 * Layout pour les pages nécessitant une authentification :
 * - /dashboard
 * - /profile
 * - /bookings
 * - /subscription
 * 
 * 🚨 RÈGLE ARCHITECTURE : Pas de Header/Footer dans les pages authentifiées
 * 
 * Navigation :
 * - Desktop : DashboardSidebar fixe (w-64) avec toggle plier/déplier
 * - Mobile : DashboardSidebar en overlay (Sheet) déclenché par bouton hamburger
 * 
 * Le DashboardSidebar gère :
 * - Logo + Branding
 * - Avatar utilisateur + dropdown
 * - Navigation (Dashboard, Réservations, Abonnement, Profil, Adresses, Paiements)
 * - CTA "Nouvelle réservation"
 * - Bouton Déconnexion
 */

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode
}) {
  const { user, supabase } = await requireAuth()

  // Check for active subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle()

  return (
    <>
      {/* DashboardSidebar - Gère Desktop (fixed) + Mobile (hamburger + sheet) */}
      <DashboardSidebar user={user} hasActiveSubscription={!!subscription} />

      {/* Main Content Area - Décalé sur desktop pour laisser place à la sidebar */}
      <main className="min-h-screen overflow-y-auto bg-background md:ml-64 transition-all duration-300">
        {children}
      </main>
    </>
  )
}
