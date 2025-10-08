import { AddressesSection } from "@/components/addresses/addresses-section"
import { requireAuth } from "@/lib/auth/route-guards"

export const metadata = {
  title: "Mes adresses | Nino Wash",
  description: "Gérez vos adresses de collecte et de livraison",
}

export default async function AddressesPage() {
  // Verify authentication
  await requireAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-balance">Mes adresses</h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos adresses de collecte et de livraison
            </p>
          </div>

          {/* Addresses Section */}
          <AddressesSection />
        </div>
      </div>
    </div>
  )
}
