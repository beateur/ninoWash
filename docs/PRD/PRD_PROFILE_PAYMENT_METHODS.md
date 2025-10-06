# PRD: Gestion des Modes de Paiement

**Status**: 🔴 À implémenter  
**Date**: 5 octobre 2025  
**Priority**: 🟠 Medium (Important mais non bloquant)  
**Design**: Épuré, sécurisé, confiance premium

---

## 1. Vision

Gérer ses moyens de paiement doit être aussi simple qu'élégant. Sécurité maximale, friction minimale. L'utilisateur doit se sentir en confiance à chaque étape.

### Principes Design
- **Confiance** : Badges sécurité visibles (Stripe, SSL)
- **Clarté** : Informations essentielles uniquement
- **Discrétion** : Numéros masqués (•••• 4242)
- **Fluidité** : Ajout carte en 1 clic via Stripe Elements

---

## 2. User Journey

### Scénario Principal
1. User clique "Modes de paiement" dans menu profil
2. Page `/profile#payment-methods` affiche ses cartes
3. User voit cartes enregistrées (design type Apple Pay)
4. User peut ajouter, définir par défaut, supprimer
5. Intégration Stripe fluide et sécurisée

### Moments Clés
- **Première carte** : Message rassurant sur sécurité Stripe
- **Ajout carte** : Stripe Elements embedded, design cohérent
- **Paiement réussi** : Badge discret "Carte vérifiée"
- **Erreur carte** : Message clair sans jargon technique

---

## 3. Spécifications Fonctionnelles

### 3.1 Vue Liste (État par défaut)

```
┌─────────────────────────────────────────────────────────┐
│  Modes de paiement                           [+ Ajouter une carte]
│
│  🔒 Vos paiements sont sécurisés par Stripe
│
│  ┌──────────────────────────────────────────────┐
│  │  💳 Visa                         [PAR DÉFAUT] │
│  │     •••• •••• •••• 4242                        │
│  │     Expire 12/2026                             │
│  │     Ajoutée le 15 sept. 2025                   │
│  │                                   [Modifier] [•••] │
│  └──────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────┐
│  │  💳 Mastercard                                 │
│  │     •••• •••• •••• 5555                        │
│  │     Expire 03/2027                             │
│  │     Ajoutée le 2 oct. 2025                     │
│  │                                   [Modifier] [•••] │
│  └──────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────┘
```

### 3.2 Composants UI

#### Card Payment Method
```typescript
interface PaymentMethodCardProps {
  paymentMethod: StripePaymentMethod
  isDefault: boolean
  onSetDefault: () => void
  onDelete: () => void
}

interface StripePaymentMethod {
  id: string
  type: 'card'
  card: {
    brand: 'visa' | 'mastercard' | 'amex' | 'discover'
    last4: string
    exp_month: number
    exp_year: number
  }
  created: number
}
```

**Design**:
```typescript
// Card normale
<Card className="border border-gray-200 bg-white rounded-xl p-6">
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-4">
      {/* Brand icon */}
      <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
        <CreditCard className="h-5 w-5 text-white" />
      </div>
      
      {/* Card info */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="font-medium capitalize">{brand}</span>
          {isDefault && (
            <Badge className="bg-primary/10 text-primary text-xs">
              Par défaut
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          •••• •••• •••• {last4}
        </p>
        <p className="text-xs text-muted-foreground">
          Expire {exp_month}/{exp_year}
        </p>
      </div>
    </div>

    {/* Actions */}
    <DropdownMenu>...</DropdownMenu>
  </div>
</Card>
```

#### Dialog Ajout Carte (Stripe Elements)

```typescript
<DialogContent className="sm:max-w-md">
  <DialogHeader>
    <DialogTitle className="text-2xl font-light flex items-center">
      <Lock className="mr-2 h-5 w-5 text-green-600" />
      Ajouter une carte
    </DialogTitle>
    <DialogDescription>
      Paiement sécurisé par <strong>Stripe</strong>. 
      Vos informations ne sont jamais stockées sur nos serveurs.
    </DialogDescription>
  </DialogHeader>

  {/* Stripe Elements */}
  <div className="space-y-4 py-4">
    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
      <CardElement options={{
        style: {
          base: {
            fontSize: '16px',
            color: '#1f2937',
            fontFamily: 'Inter, sans-serif',
            '::placeholder': {
              color: '#9ca3af',
            },
          },
        },
      }} />
    </div>

    {/* Badge sécurité */}
    <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
      <div className="flex items-center">
        <Shield className="h-4 w-4 mr-1 text-green-600" />
        Sécurisé SSL
      </div>
      <div className="flex items-center">
        <Check className="h-4 w-4 mr-1 text-green-600" />
        Certifié PCI-DSS
      </div>
    </div>
  </div>

  <DialogFooter>
    <Button variant="outline" onClick={onCancel}>
      Annuler
    </Button>
    <Button onClick={handleSubmit} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Vérification...
        </>
      ) : (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Ajouter la carte
        </>
      )}
    </Button>
  </DialogFooter>
</DialogContent>
```

### 3.3 Actions Disponibles

| Action | Déclencheur | Résultat | Feedback |
|--------|-------------|----------|----------|
| **Ajouter carte** | Bouton "+ Ajouter une carte" | Dialog Stripe Elements | Form Stripe embedded |
| **Définir par défaut** | Menu "•••" → "Définir par défaut" | Badge se déplace | Toast "Carte par défaut mise à jour" |
| **Supprimer** | Menu "•••" → "Supprimer" | Confirmation dialog | Toast "Carte supprimée" |
| **Voir détails** | Click sur card | Expand: date ajout, dernière utilisation | Animation slide-down |

### 3.4 États Spéciaux

#### Liste Vide (Première carte)
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              💳                                          │
│         Aucune carte enregistrée                         │
│                                                          │
│    Ajoutez une carte pour faciliter vos paiements        │
│    lors de vos réservations de pressing.                 │
│                                                          │
│    🔒 Sécurisé par Stripe • PCI-DSS certifié             │
│                                                          │
│         [+ Ajouter ma première carte]                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Loading
- Skeleton cards avec animation shimmer
- Placeholder Stripe Elements (loading state)

#### Erreur Stripe
```typescript
const stripeErrors = {
  card_declined: "Votre carte a été refusée. Veuillez en essayer une autre.",
  insufficient_funds: "Fonds insuffisants sur cette carte.",
  expired_card: "Cette carte a expiré. Veuillez en utiliser une autre.",
  incorrect_cvc: "Le code de sécurité (CVC) est incorrect.",
  processing_error: "Une erreur est survenue. Réessayez dans un instant.",
}
```

---

## 4. Architecture Technique

### 4.1 Frontend

**Fichiers à créer**:
```
components/profile/
  ├── payment-methods-section.tsx    ← Section principale
  ├── payment-method-card.tsx        ← Card individuelle
  ├── add-payment-method-dialog.tsx  ← Dialog Stripe Elements
  └── payment-method-delete-confirm.tsx
```

**Dépendances**:
```json
{
  "@stripe/stripe-js": "^2.4.0",
  "@stripe/react-stripe-js": "^2.4.0"
}
```

**Intégration Stripe Elements**:
```typescript
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function AddPaymentMethodDialog({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <Elements stripe={stripePromise}>
          <PaymentMethodForm onSuccess={() => {
            onClose()
            toast.success("Carte ajoutée avec succès")
          }} />
        </Elements>
      </DialogContent>
    </Dialog>
  )
}

function PaymentMethodForm({ onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    // 1. Create payment method with Stripe
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement)!,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // 2. Attach to customer via API
    const response = await fetch('/api/payments/methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
    })

    if (response.ok) {
      onSuccess()
    } else {
      toast.error("Erreur lors de l'ajout de la carte")
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <Button type="submit" disabled={!stripe || loading}>
        Ajouter la carte
      </Button>
    </form>
  )
}
```

### 4.2 Backend

**API Routes à créer/modifier**:

#### GET `/api/payments/methods`
```typescript
// app/api/payments/methods/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { apiRequireAuth } from '@/lib/auth/api-guards'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const { user, error } = await apiRequireAuth(request)
  if (error) return error

  try {
    // 1. Get Stripe customer ID from user metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ paymentMethods: [] })
    }

    // 2. List payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card',
    })

    // 3. Get default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method

    return NextResponse.json({
      paymentMethods: paymentMethods.data,
      defaultPaymentMethodId,
    })
  } catch (error) {
    console.error('[API] Payment methods error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
  }
}
```

#### POST `/api/payments/methods`
```typescript
export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await apiRequireAuth(request)
  if (authError) return authError

  try {
    const { paymentMethodId } = await request.json()

    // 1. Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_uid: user.id },
      })
      customerId = customer.id

      // Save to database
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // 2. Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // 3. Set as default if first card
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    if (paymentMethods.data.length === 1) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Add payment method error:', error)
    return NextResponse.json({ error: 'Failed to add payment method' }, { status: 500 })
  }
}
```

#### PUT `/api/payments/methods/[id]`
```typescript
// Set as default
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, error: authError } = await apiRequireAuth(request)
  if (authError) return authError

  try {
    const paymentMethodId = params.id

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer' }, { status: 404 })
    }

    // Set as default
    await stripe.customers.update(profile.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Set default payment method error:', error)
    return NextResponse.json({ error: 'Failed to set default' }, { status: 500 })
  }
}
```

#### DELETE `/api/payments/methods/[id]`
```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error: authError } = await apiRequireAuth(request)
  if (authError) return authError

  try {
    const paymentMethodId = params.id

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Delete payment method error:', error)
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 })
  }
}
```

### 4.3 Database

**Migration à créer**:
```sql
-- Add stripe_customer_id to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
  ON profiles(stripe_customer_id);

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for payment management';
```

---

## 5. Design System

### 5.1 Brand Icons par Carte

```typescript
const cardBrandIcons = {
  visa: (
    <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center">
      <span className="text-white text-xs font-bold">VISA</span>
    </div>
  ),
  mastercard: (
    <div className="w-12 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded flex items-center justify-center">
      <div className="flex space-x-[-4px]">
        <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
        <div className="w-3 h-3 rounded-full bg-orange-500 opacity-80" />
      </div>
    </div>
  ),
  amex: (
    <div className="w-12 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center">
      <span className="text-white text-xs font-bold">AMEX</span>
    </div>
  ),
}
```

### 5.2 Messages de Confiance

```typescript
<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
  <div className="flex items-start">
    <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
    <div>
      <p className="text-sm font-medium text-green-900">
        Paiements 100% sécurisés
      </p>
      <p className="text-xs text-green-700 mt-1">
        Vos informations bancaires sont chiffrées et gérées par Stripe, 
        leader mondial des paiements en ligne. Nous ne stockons jamais 
        vos coordonnées bancaires sur nos serveurs.
      </p>
    </div>
  </div>
</div>
```

---

## 6. Edge Cases & Sécurité

### Règles Métier

| Situation | Comportement |
|-----------|--------------|
| **Supprimer carte par défaut** | Erreur : "Veuillez d'abord définir une autre carte par défaut" |
| **Supprimer dernière carte** | Autorisé (user peut réajouter) |
| **Carte expirée** | Badge "Expirée" + CTA "Mettre à jour" |
| **Carte refusée lors ajout** | Message Stripe traduit en français |
| **Doublon carte** | Stripe détecte automatiquement (même last4 + exp) |

### Sécurité PCI-DSS

✅ **Conformité** :
- Jamais de données carte en clair côté serveur
- Stripe Elements handle tout le processing
- Communication via HTTPS uniquement
- Tokenization automatique par Stripe
- Pas de log des infos sensibles

---

## 7. User Flow Détaillé

### 7.1 Ajouter une Carte

```
1. User clique "+ Ajouter une carte"
2. Dialog s'ouvre avec Stripe Elements
3. User saisit numéro carte + date expiration + CVC
4. Validation en temps réel (format, checksum Luhn)
5. User clique "Ajouter la carte"
6. Loading "Vérification..." (200-500ms)
7. Stripe valide carte
8. API attache à customer
9. Dialog se ferme
10. Nouvelle card apparaît en liste
11. Toast "Carte ajoutée avec succès"
```

### 7.2 Définir par Défaut

```
1. User clique menu "•••" → "Définir par défaut"
2. API call à Stripe (< 200ms)
3. Badge "Par défaut" se déplace instantanément
4. Toast "Carte par défaut mise à jour"
```

---

## 8. Tests à Réaliser

### Cartes de Test Stripe

```
Visa réussite:       4242 4242 4242 4242
Visa refusée:        4000 0000 0000 0002
Mastercard:          5555 5555 5555 4444
Amex:                3782 822463 10005
Fonds insuffisants:  4000 0000 0000 9995
Expirée:             4000 0000 0000 0069
CVC incorrect:       4000 0000 0000 0127

CVC: n'importe quel 3 chiffres
Date: n'importe quelle date future
```

### Scénarios
- [ ] Ajouter première carte (devient default auto)
- [ ] Ajouter deuxième carte
- [ ] Changer carte par défaut
- [ ] Supprimer carte (non default)
- [ ] Supprimer carte par défaut (erreur)
- [ ] Carte refusée (message clair)
- [ ] Carte expirée (badge affiché)
- [ ] Responsive mobile

---

## 9. Rollout Plan

### Phase 1 (Semaine 1)
- [ ] Migration BDD (stripe_customer_id)
- [ ] API Routes CRUD payment methods
- [ ] Tests Postman/curl

### Phase 2 (Semaine 2)
- [ ] `PaymentMethodsSection` component
- [ ] Intégration Stripe Elements
- [ ] Tests desktop

### Phase 3 (Semaine 3)
- [ ] Responsive mobile
- [ ] Messages de confiance
- [ ] Tests avec cartes Stripe test
- [ ] Documentation

---

## 10. Success Metrics

| Métrique | Cible | Mesure |
|----------|-------|--------|
| **Temps ajout carte** | < 45s | Analytics |
| **Taux échec ajout** | < 3% | Logs Stripe |
| **Cartes enregistrées** | > 1.5 par user | BDD |
| **Confiance (survey)** | > 4.7/5 | In-app |

---

## 11. Out of Scope

- ❌ Support PayPal / Apple Pay (Phase 2)
- ❌ Virements bancaires
- ❌ Cryptomonnaies
- ❌ Paiement en plusieurs fois

---

**Temps estimé** : 3-4 jours développement + 1 jour tests  
**Dépendances** : Stripe account setup + API keys  
**Risques** : Moyen (intégration Stripe délicate)
