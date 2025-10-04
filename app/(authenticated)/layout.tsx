import type React from "react"
import { AuthenticatedHeader } from "@/components/layout/authenticated-header"
import { Footer } from "@/components/layout/footer"
import { BottomNav } from "@/components/mobile/bottom-nav"

/**
 * Authenticated Layout
 * 
 * Layout pour les pages nécessitant une authentification :
 * - /dashboard
 * - /profile
 * - /bookings
 * - /subscription
 * 
 * Utilise AuthenticatedHeader qui affiche :
 * - Notifications
 * - Avatar utilisateur
 * - Navigation utilisateur
 */
import { ReactNode } from "react"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { MobileAuthNav } from "@/components/layout/mobile-auth-nav"
import { requireAuth } from "@/lib/auth/route-guards"

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
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar user={user} hasActiveSubscription={!!subscription} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileAuthNav />
      </div>
    </div>
  )
}
