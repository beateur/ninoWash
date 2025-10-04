import type React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
