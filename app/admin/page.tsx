import { requireAdmin } from "@/lib/auth/route-guards"
import AdminDashboardClient from "./dashboard-client"

export default async function AdminDashboard() {
  // Server Component: Vérifie les permissions admin
  await requireAdmin()

  // Rend le composant client avec l'UI interactive
  return <AdminDashboardClient />
}
