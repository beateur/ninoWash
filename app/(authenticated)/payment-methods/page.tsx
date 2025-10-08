import { requireAuth } from "@/lib/auth/route-guards"
import { PaymentMethodsList } from "@/components/payment-methods/payment-methods-list"

export const metadata = {
  title: "Moyens de paiement | Nino Wash",
  description: "Gérez vos cartes bancaires et moyens de paiement",
}

/**
 * Page de gestion des moyens de paiement
 * Route protégée : nécessite authentification
 */
export default async function PaymentMethodsPage() {
  // Protection auth (server-side)
  await requireAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-balance">Moyens de paiement</h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos cartes bancaires pour faciliter vos paiements
            </p>
          </div>

          {/* Payment Methods List */}
          <PaymentMethodsList />
        </div>
      </div>
    </div>
  )
}
