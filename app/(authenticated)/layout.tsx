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
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthenticatedHeader />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  )
}
