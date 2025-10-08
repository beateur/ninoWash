# PRD: Modification de Réservation

**Statut**: ⏳ En Cours  
**Date de création**: 2025-10-06  
**Owner**: Dev Team

---

## 1. Contexte

### Pourquoi cette feature ?
Les utilisateurs doivent pouvoir modifier leurs réservations futures (date, créneau horaire, adresse) sans avoir à les annuler et recréer une nouvelle réservation.

### Parcours Utilisateur Actuel
1. User consulte ses réservations dans `/dashboard`
2. User clique sur une réservation pour voir les détails
3. User voit un bouton "Modifier la réservation" (seulement pour réservations futures avec statut `pending` ou `confirmed`)
4. ❌ **Problème**: Aucun parcours de modification n'existe actuellement

### Solution Proposée
Réutiliser le parcours de réservation existant (`/reservation`) en **préchargeant les données** de la réservation à modifier.

---

## 2. Goals (Success Criteria)

- [x] Bouton "Modifier la réservation" redirige vers `/reservation?modify={bookingId}`
- [ ] Page `/reservation` détecte le paramètre `modify` et précharge les données
- [ ] User peut modifier uniquement les champs autorisés (date, créneau, adresses)
- [ ] Les services sélectionnés sont préchargés et non modifiables
- [ ] API `PATCH /api/bookings/[id]` met à jour la réservation
- [ ] Validation: Impossibilité de modifier une réservation passée
- [ ] Validation: Impossibilité de modifier une réservation avec statut `cancelled`, `delivered`, etc.
- [ ] Notification de succès après modification
- [ ] Redirection vers `/dashboard` après modification réussie

---

## 3. Scope

### Frontend

#### 3.1 Composant Booking Card (✅ FAIT)
**Fichier**: `components/booking/booking-card.tsx`

**Changement effectué**:
```tsx
{/* Modifier la réservation - seulement pour réservations futures */}
{canModify && (
  <Button variant="outline" className="w-full justify-start" asChild>
    <Link href={`/reservation?modify=${booking.id}`}>
      <Edit className="mr-2 h-4 w-4" />
      Modifier la réservation
    </Link>
  </Button>
)}
```

**Règle métier**: `canModify` est `true` si:
- Réservation est dans le futur (`pickupDate > new Date()`)
- ET statut est `pending` ou `confirmed`

#### 3.2 Page Réservation (⏳ À FAIRE)
**Fichier**: `app/reservation/page.tsx`

**Modifications nécessaires**:

1. **Détecter le mode modification**:
```typescript
// app/reservation/page.tsx (Server Component)
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/route-guards"
import { createClient } from "@/lib/supabase/server"
import BookingFlowClient from "./booking-flow-client"

export default async function ReservationPage({
  searchParams,
}: {
  searchParams: { modify?: string }
}) {
  const user = await requireAuth()
  const modifyBookingId = searchParams.modify

  let existingBooking = null

  // Si mode modification, charger la réservation existante
  if (modifyBookingId) {
    const supabase = await createClient()
    
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        pickup_address:user_addresses!pickup_address_id(*),
        delivery_address:user_addresses!delivery_address_id(*)
      `)
      .eq("id", modifyBookingId)
      .eq("user_id", user.id) // Sécurité: user peut seulement modifier ses propres réservations
      .single()

    if (error || !booking) {
      notFound()
    }

    // Vérifier que la réservation peut être modifiée
    const canModify = 
      new Date(booking.pickup_date) > new Date() &&
      ["pending", "confirmed"].includes(booking.status)

    if (!canModify) {
      redirect("/dashboard?error=cannot_modify_booking")
    }

    existingBooking = booking
  }

  return (
    <BookingFlowClient 
      user={user} 
      existingBooking={existingBooking}
      isModification={!!modifyBookingId}
    />
  )
}
```

2. **Précharger les données dans le formulaire**:
```typescript
// app/reservation/booking-flow-client.tsx (Client Component)
"use client"

interface BookingFlowClientProps {
  user: User
  existingBooking?: Booking | null
  isModification?: boolean
}

export default function BookingFlowClient({ 
  user, 
  existingBooking, 
  isModification = false 
}: BookingFlowClientProps) {
  // État initial préchargé si modification
  const [selectedServices, setSelectedServices] = useState(
    existingBooking?.booking_items || []
  )
  const [pickupAddress, setPickupAddress] = useState(
    existingBooking?.pickup_address || null
  )
  const [deliveryAddress, setDeliveryAddress] = useState(
    existingBooking?.delivery_address || null
  )
  const [pickupDate, setPickupDate] = useState(
    existingBooking?.pickup_date ? new Date(existingBooking.pickup_date) : null
  )
  const [pickupTimeSlot, setPickupTimeSlot] = useState(
    existingBooking?.pickup_time_slot || null
  )
  const [deliveryDate, setDeliveryDate] = useState(
    existingBooking?.delivery_date ? new Date(existingBooking.delivery_date) : null
  )
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(
    existingBooking?.delivery_time_slot || null
  )

  // Si mode modification, désactiver la modification des services
  const servicesReadOnly = isModification

  // Afficher un badge "Modification" dans le header
  return (
    <div>
      {isModification && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-sm font-medium text-blue-900">
            ℹ️ Mode modification - Les services sélectionnés ne peuvent pas être modifiés
          </p>
        </div>
      )}

      {/* Reste du flow de réservation... */}
    </div>
  )
}
```

### Backend

#### 3.3 API Route PATCH (⏳ À FAIRE)
**Fichier**: `app/api/bookings/[id]/route.ts`

**Méthode à ajouter**: `PATCH`

```typescript
// app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/route-guards"
import { z } from "zod"

const updateBookingSchema = z.object({
  pickup_date: z.string().datetime().optional(),
  pickup_time_slot: z.string().optional(),
  delivery_date: z.string().datetime().optional(),
  delivery_time_slot: z.string().optional(),
  pickup_address_id: z.string().uuid().optional(),
  delivery_address_id: z.string().uuid().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const bookingId = params.id
    const body = await request.json()

    // Validation
    const result = updateBookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: result.error.issues },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Vérifier que la réservation existe et appartient à l'user
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, pickup_date, status")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // 2. Vérifier que la réservation peut être modifiée
    const canModify = 
      new Date(booking.pickup_date) > new Date() &&
      ["pending", "confirmed"].includes(booking.status)

    if (!canModify) {
      return NextResponse.json(
        { error: "Booking cannot be modified (past date or invalid status)" },
        { status: 403 }
      )
    }

    // 3. Mettre à jour la réservation
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating booking:", updateError)
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("Error in PATCH /api/bookings/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### Database

#### 3.4 Schema (✅ EXISTANT)
Aucun changement de schéma nécessaire. Les colonnes suivantes sont déjà modifiables:
- `pickup_date`
- `pickup_time_slot`
- `delivery_date`
- `delivery_time_slot`
- `pickup_address_id`
- `delivery_address_id`
- `updated_at`

**Contrainte**: Les `booking_items` (services) ne sont **pas modifiables** pour simplifier la logique métier.

### Validation

#### 3.5 Règles Métier

1. **Qui peut modifier ?**
   - ✅ Propriétaire de la réservation (`user_id` match)
   - ❌ Autre utilisateur (403 Forbidden)

2. **Quand peut-on modifier ?**
   - ✅ Réservation dans le futur (`pickup_date > now()`)
   - ✅ Statut `pending` ou `confirmed`
   - ❌ Réservation passée (400 Bad Request)
   - ❌ Statut `cancelled`, `picked_up`, `in_progress`, `delivered` (403 Forbidden)

3. **Que peut-on modifier ?**
   - ✅ Date de collecte
   - ✅ Créneau horaire de collecte
   - ✅ Date de livraison
   - ✅ Créneau horaire de livraison
   - ✅ Adresse de collecte
   - ✅ Adresse de livraison
   - ❌ Services sélectionnés (nécessiterait recalcul du prix)
   - ❌ Montant total (calculé automatiquement)

4. **Validation temporelle**:
   - Date de collecte doit être au minimum 24h dans le futur
   - Date de livraison doit être après la date de collecte
   - Créneaux horaires doivent être disponibles

### Security

#### 3.6 Vérifications de Sécurité

1. **Server-Side Auth Check**:
   ```typescript
   const user = await requireAuth() // Vérifie JWT token
   ```

2. **Ownership Verification**:
   ```typescript
   .eq("user_id", user.id) // User peut seulement modifier ses réservations
   ```

3. **Status & Date Validation**:
   ```typescript
   const canModify = 
     new Date(booking.pickup_date) > new Date() &&
     ["pending", "confirmed"].includes(booking.status)
   ```

4. **RLS Policies** (déjà en place):
   ```sql
   -- Les users peuvent seulement modifier leurs propres réservations
   CREATE POLICY "Users can update own bookings"
     ON bookings FOR UPDATE
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);
   ```

### Error Handling

#### 3.7 Scénarios d'Erreur

| Erreur | Code HTTP | Message | Action User |
|--------|-----------|---------|-------------|
| Réservation introuvable | 404 | "Booking not found" | Redirection vers dashboard |
| Réservation passée | 400 | "Cannot modify past booking" | Afficher message d'erreur |
| Statut invalide | 403 | "Booking status does not allow modification" | Afficher message |
| Pas le propriétaire | 403 | "You don't own this booking" | Redirection vers dashboard |
| Validation échouée | 400 | "Invalid input: {details}" | Afficher erreurs de champs |
| Erreur serveur | 500 | "Internal server error" | Toast d'erreur + retry |

---

## 4. Technical Implementation Plan

### Step 1: Backend API (Priority P0)
- [ ] Ajouter méthode `PATCH` dans `app/api/bookings/[id]/route.ts`
- [ ] Implémenter validation Zod
- [ ] Ajouter checks de sécurité (ownership, status, date)
- [ ] Tester avec curl/Postman

### Step 2: Frontend - Détection Mode Modification (Priority P0)
- [ ] Modifier `app/reservation/page.tsx` (Server Component)
- [ ] Détecter paramètre `?modify={bookingId}`
- [ ] Fetch booking existante depuis Supabase
- [ ] Passer `existingBooking` au Client Component

### Step 3: Frontend - Préchargement Formulaire (Priority P0)
- [ ] Créer/modifier `app/reservation/booking-flow-client.tsx`
- [ ] Initialiser états avec données existantes
- [ ] Désactiver modification des services (read-only)
- [ ] Afficher badge "Mode modification"

### Step 4: Frontend - Soumission (Priority P0)
- [ ] Détecter si mode création ou modification
- [ ] Appeler `POST /api/bookings` (création) OU `PATCH /api/bookings/[id]` (modification)
- [ ] Gérer réponses succès/erreur
- [ ] Redirection vers dashboard après succès

### Step 5: Testing (Priority P1)
- [ ] Unit tests pour API route PATCH
- [ ] Tests de validation (dates, statuts, ownership)
- [ ] Tests E2E du parcours complet
- [ ] Test responsive mobile

### Step 6: Documentation (Priority P2)
- [ ] Mettre à jour `docs/booking-system-workflow.md`
- [ ] Ajouter exemples API dans `docs/api-integration-guide.md`
- [ ] Ajouter section troubleshooting

---

## 5. Data Flow

### Modification de Réservation (Complet)

```
1. User clique "Modifier" dans dashboard
   ↓
2. Redirection vers /reservation?modify={bookingId}
   ↓
3. Server Component (page.tsx):
   - await requireAuth()
   - fetch booking depuis Supabase
   - vérifier ownership (user_id)
   - vérifier canModify (date + status)
   ↓
4. Client Component (booking-flow-client.tsx):
   - Recevoir existingBooking en props
   - Précharger tous les champs
   - Services en read-only
   - Badge "Mode modification"
   ↓
5. User modifie date/créneau/adresse
   ↓
6. User clique "Confirmer les modifications"
   ↓
7. API Call: PATCH /api/bookings/{bookingId}
   - Validation Zod
   - Check ownership
   - Check canModify
   - Update database
   ↓
8. Réponse Succès:
   - Toast "Réservation modifiée avec succès"
   - Redirection vers /dashboard
   - Afficher réservation mise à jour
```

---

## 6. Edge Cases

### 6.1 Réservation Modifiée Entre-Temps
**Scénario**: User ouvre le formulaire de modification, mais admin annule la réservation pendant ce temps.

**Solution**:
- Validation côté serveur lors du PATCH
- Si statut a changé → 403 Forbidden
- Message: "Cette réservation a été modifiée/annulée. Veuillez rafraîchir."

### 6.2 Conflits de Créneaux
**Scénario**: User modifie pour un créneau qui devient indisponible.

**Solution**:
- Vérifier disponibilité des créneaux lors du PATCH
- Si indisponible → 409 Conflict
- Recharger créneaux disponibles et demander nouvelle sélection

### 6.3 User Ferme et Rouvre le Formulaire
**Scénario**: User commence modification, ferme l'onglet, revient plus tard.

**Solution**:
- Pas de sauvegarde temporaire
- Chaque ouverture refetch les données actuelles de la réservation
- Pas de risque de données obsolètes

### 6.4 Modification Après Date de Collecte Passée
**Scénario**: User laisse le formulaire ouvert pendant 24h, la date passe.

**Solution**:
- Validation côté serveur lors du PATCH
- Si `pickup_date <= now()` → 400 Bad Request
- Message: "Cette réservation ne peut plus être modifiée (date passée)"

---

## 7. Testing Strategy

### Unit Tests
```typescript
// __tests__/api/bookings/[id]/patch.test.ts
describe("PATCH /api/bookings/[id]", () => {
  it("should update booking successfully", async () => {
    // Test cas nominal
  })

  it("should return 403 if booking is past", async () => {
    // Test réservation passée
  })

  it("should return 403 if status is not pending/confirmed", async () => {
    // Test statut invalide
  })

  it("should return 404 if booking not found", async () => {
    // Test booking inexistante
  })

  it("should return 403 if user is not owner", async () => {
    // Test ownership
  })

  it("should validate input with Zod", async () => {
    // Test validation dates invalides
  })
})
```

### Integration Tests
```typescript
// __tests__/booking-modification-flow.test.tsx
describe("Booking Modification Flow", () => {
  it("should prefill form with existing booking data", async () => {
    // Test préchargement
  })

  it("should disable service selection in modification mode", async () => {
    // Test services read-only
  })

  it("should show error if booking cannot be modified", async () => {
    // Test erreur modification impossible
  })

  it("should redirect to dashboard after successful update", async () => {
    // Test redirection
  })
})
```

### E2E Tests
```typescript
// __tests__/e2e/booking-modification.spec.ts
test("Complete booking modification flow", async ({ page }) => {
  // 1. Login
  // 2. Go to dashboard
  // 3. Click on booking
  // 4. Click "Modify"
  // 5. Change date
  // 6. Confirm
  // 7. Verify updated booking in dashboard
})
```

---

## 8. Out of Scope (Explicitly)

### Non Inclus dans Cette Itération

1. **Modification des Services**
   - Ajouter/retirer des services nécessite recalcul du prix
   - Complexité supplémentaire avec gestion des crédits d'abonnement
   - → Feature séparée pour V2

2. **Historique des Modifications**
   - Pas de tracking des changements (qui a modifié quoi et quand)
   - → Feature audit trail pour V2

3. **Notifications Email**
   - Pas d'email de confirmation de modification
   - → Feature notifications pour V2

4. **Modification Admin**
   - Seul le user peut modifier sa réservation
   - Admin doit utiliser l'interface admin séparée
   - → Déjà géré dans `/admin/bookings`

5. **Modification du Prix**
   - Prix reste fixe même si modification de dates
   - → Business rule à valider avec PO

---

## 9. Rollout Plan

### Phase 1: Backend (Semaine 1)
- ✅ API route PATCH implémentée
- ✅ Tests unitaires passent
- ✅ Documentation API

### Phase 2: Frontend (Semaine 2)
- ✅ Page reservation détecte mode modification
- ✅ Formulaire préchargé
- ✅ Soumission fonctionne

### Phase 3: Testing (Semaine 3)
- ✅ Tests E2E passent
- ✅ QA manual testing
- ✅ Fix bugs critiques

### Phase 4: Release (Semaine 4)
- ✅ Feature flag activée en production
- ✅ Monitoring des erreurs
- ✅ Support team briefé

---

## 10. Success Metrics

### KPIs à Suivre
1. **Taux d'utilisation**: % de réservations modifiées vs annulées+recréées
2. **Erreurs**: Taux d'erreur lors de la modification
3. **Performance**: Temps de chargement du formulaire prérempli
4. **Abandon**: % d'utilisateurs qui ouvrent le formulaire mais ne confirment pas

### Target
- Réduction de 30% des annulations+recréations
- <5% d'erreurs techniques
- Formulaire chargé en <2s
- Taux d'abandon <20%

---

## 11. References

**Fichiers Clés**:
- ✅ `components/booking/booking-card.tsx` - Bouton "Modifier" implémenté
- ⏳ `app/reservation/page.tsx` - À modifier pour mode modification
- ⏳ `app/api/bookings/[id]/route.ts` - Ajouter méthode PATCH
- 📖 `docs/booking-system-workflow.md` - Documentation existante
- 📖 `.github/copilot-instructions.md` - Règles architecture

**PRDs Liés**:
- `PRD_BOOKING_CANCELLATION.md` - Système d'annulation (déjà implémenté)
- `PRD_SUBSCRIPTION_CREDITS_SYSTEM.md` - Gestion des crédits

---

**Statut Actuel**: 
- ✅ **Bouton "Modifier"** implémenté dans `booking-card.tsx`
- ⏳ **Parcours de modification** à implémenter selon ce PRD
- 📝 **Documentation** complète pour l'implémentation future
