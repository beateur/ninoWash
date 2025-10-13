# Guide d'Intégration – Collecte & Livraison (Slot-based Scheduling)

## Date
13 octobre 2025

## Statut
✅ **Implémentation backend/frontend complète** – Prêt pour intégration dans les flows booking

---

## Résumé Exécutif

Le système de scheduling basé sur des créneaux dynamiques (`logistic_slots`) est maintenant **opérationnel**. Les anciennes sélections date/heure statiques peuvent coexister avec le nouveau système (compatibilité totale).

### Ce qui a été livré

- ✅ **Database** : Tables `logistic_slots`, `slot_requests`, colonnes `pickup_slot_id`/`delivery_slot_id` dans `bookings`
- ✅ **Backend** : Service `logistic-slots.ts`, API `GET /api/logistic-slots`, adaptation `POST /api/bookings`
- ✅ **Frontend** : Hook `useLogisticSlots`, composant `CollectionDeliveryStep`
- ✅ **Validation** : Zod schemas, validation délai 24h/72h selon service
- ✅ **Script de test** : `scripts/insert-test-slots.sql` (slots mardi 14 & jeudi 16 octobre)

---

## Quick Start (5 minutes)

### 1. Appliquer la migration SQL (SI PAS DÉJÀ FAIT)

```bash
# Via Supabase Dashboard
# → SQL Editor → Copier/coller le contenu de :
supabase/migrations/20251013000100_create_logistic_slots.sql

# Ou via CLI
supabase migration up
```

### 2. Insérer les slots de test

```bash
# Via Supabase Dashboard → SQL Editor
# Copier/coller le contenu de :
scripts/insert-test-slots.sql

# Exécuter → Vérifier message: "✅ 8 slots de test créés avec succès"
```

### 3. Tester l'API

```bash
# Terminal (ou Postman)
curl "http://localhost:3000/api/logistic-slots?role=pickup"

# Réponse attendue:
# {
#   "slots": [
#     { "id": "...", "role": "pickup", "slot_date": "2025-10-14", ... },
#     ...
#   ]
# }
```

### 4. Intégrer dans le flow de réservation

**Option A : Remplacer l'étape existante (recommandé)**
```tsx
// Dans app/reservation/page.tsx (ou wizard guest)
import { CollectionDeliveryStep } from "@/components/booking/collection-delivery-step"

// Remplacer <DateTimeStep /> par :
<CollectionDeliveryStep
  onPickupSelect={(slot) => setPickupSlot(slot)}
  onDeliverySelect={(slot) => setDeliverySlot(slot)}
  selectedPickup={pickupSlot}
  selectedDelivery={deliverySlot}
  serviceType="classic" // ou "express" selon le service sélectionné
  onNext={handleNextStep}
  onBack={handlePreviousStep}
/>
```

**Option B : Feature flag progressive (si rollout phasé)**
```tsx
const useNewSlotSystem = process.env.NEXT_PUBLIC_USE_SLOT_SCHEDULING === "true"

{useNewSlotSystem ? (
  <CollectionDeliveryStep ... />
) : (
  <DateTimeStep ... /> // Legacy
)}
```

---

## Architecture Détaillée

### Data Flow Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER SELECTS SERVICE                                      │
│    → Détermine serviceType: 'express' (24h) ou 'classic' (72h) │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. COLLECTION DELIVERY STEP (Component)                      │
│    → useLogisticSlots(role: 'pickup')                        │
│    → Fetch GET /api/logistic-slots?role=pickup              │
│    → RLS Policy: only is_open = TRUE & slot_date >= today   │
│    → Display slots as clickable cards                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER SELECTS PICKUP SLOT                                  │
│    → Store pickupSlot in state                               │
│    → Calculate deliveryStartDate (pickup.end + minHours)     │
│    → Re-fetch delivery slots with startDate filter           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. USER SELECTS DELIVERY SLOT                                │
│    → Store deliverySlot in state                             │
│    → Enable "Continue" button                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. BOOKING SUBMISSION                                         │
│    → POST /api/bookings with:                                │
│      {                                                        │
│        pickupSlotId: "uuid",                                 │
│        deliverySlotId: "uuid",                               │
│        items: [...],                                         │
│        ... (addresses, etc.)                                 │
│      }                                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. BACKEND VALIDATION (app/api/bookings/route.ts)           │
│    → Fetch slots from DB (getSlotById x2)                   │
│    → Validate: is_open = TRUE & slot_date >= today          │
│    → Validate: delay between pickup.end & delivery.start    │
│      ├─ Express: min 24h                                     │
│      └─ Classic: min 72h                                     │
│    → If valid: proceed, else return 400 error               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. BOOKING CREATION                                           │
│    → Generate legacy dates from slots (fallback)             │
│    → Insert booking with:                                    │
│      - pickup_slot_id (FK)                                   │
│      - delivery_slot_id (FK)                                 │
│      - pickup_date (legacy fallback)                         │
│      - pickup_time_slot (legacy fallback)                    │
│      - delivery_date (legacy fallback)                       │
│      - delivery_time_slot (legacy fallback)                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. TRACKING (slot_requests table)                            │
│    → createSlotRequest(pickupSlotId, 'pickup', bookingId)   │
│    → createSlotRequest(deliverySlotId, 'delivery', bookingId)│
│    → Non-blocking: analytics only                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Fichiers Créés/Modifiés

### Nouveaux Fichiers

| Fichier | Description |
|---------|-------------|
| `lib/types/logistic-slots.ts` | Interfaces TypeScript (LogisticSlot, SlotRequest, etc.) |
| `lib/validations/logistic-slots.ts` | Schemas Zod (validation params API) |
| `lib/services/logistic-slots.ts` | Business logic (getAvailableSlots, validateSlotDelay, etc.) |
| `app/api/logistic-slots/route.ts` | API Route GET (fetch slots avec filtres) |
| `hooks/use-logistic-slots.ts` | React Hook (fetch + cache slots) |
| `components/booking/collection-delivery-step.tsx` | Composant UI sélection slots |
| `scripts/insert-test-slots.sql` | Script SQL insertion slots de test |
| `supabase/migrations/20251013000100_create_logistic_slots.sql` | Migration DB (tables + RLS + indexes) |
| `docs/IMPLEMENTATION_PLAN_SLOTS.md` | Plan d'implémentation détaillé |
| `docs/MIGRATION_20251013_CORRECTIONS.md` | Corrections audit migration |

### Fichiers Modifiés

| Fichier | Changements |
|---------|-------------|
| `lib/validations/booking.ts` | Ajout `pickupSlotId`/`deliverySlotId` optionnels + validation soit slots soit legacy |
| `app/api/bookings/route.ts` | Ajout logic slot-based : validation délai, fetch slots, génération legacy dates, création slot_requests |

---

## Intégration dans les Flows Existants

### Flow Guest (Wizard `/reservation/guest`)

**Fichier à modifier** : `app/reservation/guest/page.tsx` (ou équivalent)

```tsx
import { useState } from "react"
import { CollectionDeliveryStep } from "@/components/booking/collection-delivery-step"
import type { LogisticSlot } from "@/lib/types/logistic-slots"

export default function GuestBookingPage() {
  const [step, setStep] = useState(1)
  const [pickupSlot, setPickupSlot] = useState<LogisticSlot | null>(null)
  const [deliverySlot, setDeliverySlot] = useState<LogisticSlot | null>(null)
  const [serviceType, setServiceType] = useState<"express" | "classic">("classic")

  // ... autres states (addresses, items, etc.)

  const handleSubmitBooking = async () => {
    const payload = {
      pickupSlotId: pickupSlot?.id,
      deliverySlotId: deliverySlot?.id,
      items: selectedItems,
      guestPickupAddress: pickupAddress,
      guestDeliveryAddress: deliveryAddress,
      guestContact: contactInfo,
      serviceType, // Important pour validation délai
      // ... autres champs
    }

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    // ... handle response
  }

  return (
    <div>
      {step === 3 && ( // ou numéro d'étape approprié
        <CollectionDeliveryStep
          onPickupSelect={setPickupSlot}
          onDeliverySelect={setDeliverySlot}
          selectedPickup={pickupSlot}
          selectedDelivery={deliverySlot}
          serviceType={serviceType}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {/* Autres steps... */}
    </div>
  )
}
```

### Flow Authentifié (Dashboard `/dashboard/reservation`)

**Similaire au flow guest**, mais sans besoin de `guestPickupAddress`/`guestDeliveryAddress`/`guestContact`.

```tsx
const payload = {
  pickupSlotId: pickupSlot?.id,
  deliverySlotId: deliverySlot?.id,
  pickupAddressId: selectedPickupAddressId, // UUID existante
  deliveryAddressId: selectedDeliveryAddressId,
  items: selectedItems,
  serviceType,
}
```

---

## Testing Checklist

### Backend API

- [ ] **GET /api/logistic-slots?role=pickup** retourne slots ouverts futurs
- [ ] **GET /api/logistic-slots?role=delivery&startDate=2025-10-15** filtre correctement
- [ ] **POST /api/bookings** avec `pickupSlotId` + `deliverySlotId` → succès
- [ ] **POST /api/bookings** avec délai insuffisant (< 24h/72h) → erreur 400
- [ ] **POST /api/bookings** avec slot fermé (is_open = false) → erreur 400
- [ ] **POST /api/bookings** sans slots (legacy) → fonctionne toujours

### Frontend Component

- [ ] **CollectionDeliveryStep** affiche grille de cards cliquables
- [ ] Sélection pickup → auto-switch vers delivery
- [ ] Sélection pickup → delivery slots filtrés selon délai minimum
- [ ] Sélection delivery → bouton "Continuer" activé
- [ ] Loading state (skeleton) pendant fetch
- [ ] Empty state si aucun slot disponible
- [ ] Error state si API fail (toast Sonner)
- [ ] Responsive mobile (1 col) / desktop (2 cols)
- [ ] Navigation clavier (Tab, Enter, Space)

### Database

- [ ] Tables `logistic_slots`, `slot_requests` créées
- [ ] Colonnes `pickup_slot_id`, `delivery_slot_id` ajoutées dans `bookings`
- [ ] RLS policies : SELECT public (anon/authenticated), INSERT/UPDATE/DELETE service_role
- [ ] Trigger `set_timestamp_logistic_slots` fonctionne (updated_at change)
- [ ] Indexes créés (role + date, slot_requests FKs)
- [ ] ON DELETE SET NULL fonctionne (suppression slot ne casse pas booking)

### E2E Flow

- [ ] **Guest** : Sélectionner service → slots → addresses → confirm → booking créé
- [ ] **Authenticated** : Même flow avec adresses existantes
- [ ] Booking créé avec `pickup_slot_id` + `delivery_slot_id` persistés
- [ ] Champs legacy (`pickup_date`, `pickup_time_slot`) remplis automatiquement
- [ ] `slot_requests` créés (2 entrées par booking)
- [ ] Dashboard admin : slots visibles dans backoffice

---

## Gestion Opérationnelle

### Ajouter de nouveaux slots

```sql
-- Via Supabase SQL Editor (ou script automatisé futur)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-20', '09:00', '12:00', 'Matin', TRUE, 'Créneau matin lundi 20'),
  ('delivery', '2025-10-20', '09:00', '12:00', 'Matin', TRUE, 'Créneau matin lundi 20');
```

### Désactiver un slot (suppression logique)

```sql
UPDATE public.logistic_slots 
SET is_open = FALSE 
WHERE id = 'slot-uuid-here';
```

### Supprimer définitivement un slot

```sql
-- Attention: supprime aussi les slot_requests associés (CASCADE)
-- Les bookings gardent leur FK à NULL grâce à ON DELETE SET NULL
DELETE FROM public.logistic_slots WHERE id = 'slot-uuid-here';
```

### Monitoring des demandes de slots

```sql
-- Dashboard admin: voir les slots les plus demandés
SELECT 
  ls.slot_date,
  ls.role,
  ls.start_time || ' - ' || ls.end_time AS horaire,
  ls.label,
  COUNT(sr.id) AS nb_demandes
FROM public.logistic_slots ls
LEFT JOIN public.slot_requests sr ON sr.slot_id = ls.id
WHERE ls.slot_date >= CURRENT_DATE
GROUP BY ls.id, ls.slot_date, ls.role, ls.start_time, ls.end_time, ls.label
ORDER BY ls.slot_date, ls.role DESC, ls.start_time;
```

---

## Troubleshooting

### Problème : "Aucun créneau disponible"

**Causes possibles** :
- Base de données vide (aucun slot inséré)
- Tous les slots sont `is_open = FALSE`
- Tous les slots ont `slot_date < today` (passés)
- RLS policies bloquent l'accès (vérifier auth.uid() si connecté)

**Solutions** :
1. Exécuter `scripts/insert-test-slots.sql`
2. Vérifier dans Supabase Table Editor : `logistic_slots` contient des lignes
3. Vérifier RLS : `SELECT * FROM logistic_slots` en tant qu'utilisateur anonyme doit retourner des résultats

### Problème : "Délai minimum non respecté"

**Causes possibles** :
- `serviceType` non passé au composant (default 'classic' = 72h)
- Slots pickup trop proches dans le temps des slots delivery

**Solutions** :
1. S'assurer que `serviceType` est propagé : `<CollectionDeliveryStep serviceType={selectedServiceType} />`
2. Vérifier la logique de calcul : `deliveryStartDate = pickup.end + minHours`

### Problème : API retourne 500

**Causes possibles** :
- Fonction `trigger_set_timestamp()` manquante (migration non appliquée)
- Connexion Supabase échouée (env vars incorrects)

**Solutions** :
1. Ré-exécuter la migration `20251013000100_create_logistic_slots.sql`
2. Vérifier `.env.local` : `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Prochaines Évolutions (Post-MVP)

### Court terme (Sprint +1)
- [ ] Composant admin pour créer/modifier/supprimer slots (UI dashboard)
- [ ] Gestion de capacité max par slot (éviter overbooking)
- [ ] Notifications email avec détails slots (au lieu de dates legacy)
- [ ] Rate limiting sur API `/api/logistic-slots` (protection flood)

### Moyen terme (Sprint +2/+3)
- [ ] Synchronisation Google Calendar (slots → événements)
- [ ] Webhook notification équipe ops lors de booking slot
- [ ] Analytics dashboard (slots les plus demandés, taux conversion)
- [ ] Système de buffer automatique (créneaux générés par règles)

### Long terme (Roadmap)
- [ ] IA prédictive : suggérer slots selon historique utilisateur
- [ ] Multi-timezone support (utilisateurs à l'étranger)
- [ ] Réservation récurrente (abonnés = slots fixes hebdo)

---

## Contacts & Support

**Questions techniques** : Voir documentation inline dans code source
**Bugs/Issues** : Créer ticket avec logs `[v0]` dans console
**Feature requests** : PRD-first workflow (voir `docs/PRD/`)

---

## Auteur & Date

- **Implémentation** : GitHub Copilot
- **Date** : 13 octobre 2025
- **Version** : 1.0.0 (Production-ready)

## Références

- PRD : `docs/PRD/PRD_BOOKING_COLLECTION_DELIVERY.md`
- Plan d'implémentation : `docs/IMPLEMENTATION_PLAN_SLOTS.md`
- Migration : `supabase/migrations/20251013000100_create_logistic_slots.sql`
- Corrections audit : `docs/MIGRATION_20251013_CORRECTIONS.md`
