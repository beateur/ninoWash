# Payment Methods Components

Ce dossier contient tous les composants liés à la gestion des moyens de paiement (cartes bancaires).

## Architecture

### Composants principaux

1. **`payment-methods-list.tsx`** (Container)
   - Récupère la liste des cartes via `/api/payments/methods`
   - Gère les états : loading, empty, error, success
   - Affiche les cartes + bouton "Ajouter une carte"

2. **`payment-method-card.tsx`** (Presentational)
   - Affiche une carte bancaire (brand logo, last 4 digits, expiration)
   - Badge "Par défaut" si applicable
   - Actions : Définir par défaut, Supprimer

3. **`add-payment-method-dialog.tsx`** (Modal)
   - Formulaire avec Stripe Elements (CardElement)
   - Gère le Setup Intent pour collecter la carte
   - Submit → POST `/api/payments/methods`

4. **`payment-method-delete-confirm.tsx`** (Modal)
   - Dialog de confirmation avant suppression
   - DELETE `/api/payments/methods/[id]`

## Data Flow

\`\`\`
User visits /payment-methods
  → PaymentMethodsList fetches GET /api/payments/methods
  → Displays PaymentMethodCard[] with actions
  → User clicks "Ajouter"
    → AddPaymentMethodDialog opens
    → Stripe CardElement collects card info
    → Submit → Stripe Setup Intent confirmation
    → POST /api/payments/methods with payment method ID
    → Success → Refresh list + close dialog
\`\`\`

## Usage

\`\`\`tsx
import { PaymentMethodsList } from "@/components/payment-methods/payment-methods-list"

export default function PaymentMethodsPage() {
  return (
    <div>
      <h1>Mes moyens de paiement</h1>
      <PaymentMethodsList />
    </div>
  )
}
\`\`\`

## Types

Les types sont définis dans la validation Zod (`lib/validations/payment.ts`) :

\`\`\`typescript
{
  id: string
  user_id: string
  type: "card" | "paypal" | ...
  provider: "stripe"
  provider_payment_method_id: string
  last_four: string
  brand: string (visa, mastercard, amex, etc.)
  exp_month: number (1-12)
  exp_year: number (2024+)
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}
\`\`\`

## Security

- **RLS Policies** : Les utilisateurs ne voient QUE leurs propres cartes
- **Stripe Elements** : Validation côté client + tokenization sécurisée
- **API Protection** : Routes protégées via `apiRequireAuth()`
- **No PCI Scope** : Aucune donnée sensible stockée (seulement last 4 digits)

## Stripe Integration

- **Add Card** : Utilise Setup Intent (pas de paiement immédiat)
- **Delete Card** : Detach payment method via Stripe API
- **Update Default** : Mise à jour locale uniquement (Stripe pas affecté)

## Testing

\`\`\`bash
# Test cards (Stripe test mode)
4242 4242 4242 4242  # Visa success
4000 0000 0000 0002  # Card declined
4000 0000 0000 9995  # Insufficient funds
\`\`\`

## TODO (Future Iterations)

- [ ] Support Apple Pay / Google Pay
- [ ] Édition expiration (actuellement Stripe ne permet que add/delete)
- [ ] Historique des transactions liées à chaque carte
- [ ] Export PDF des moyens de paiement
