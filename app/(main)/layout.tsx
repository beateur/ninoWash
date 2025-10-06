import type React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

/**
 * Main Layout (Marketing + Public Pages)
 * 
 * Layout pour les pages publiques (domaine www) :
 * - / (landing page)
 * - /services
 * - /a-propos
 * - /comment-ca-marche
 * - /contact
 * 
 * Navigation Mobile : MobileNav (dans Header)
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
