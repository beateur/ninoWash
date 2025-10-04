import type React from "react"
import { requireAdmin } from "@/lib/auth/admin-guard"
import { Sidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"

// <CHANGE> Convert to Server Component with SSR admin guard (Sprint P0)
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side admin check - will redirect if not admin
  await requireAdmin()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
