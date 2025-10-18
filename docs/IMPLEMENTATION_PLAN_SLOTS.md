# Plan d'Implémentation – Collecte & Livraison (Slot-based Scheduling)

## Date
13 octobre 2025

## Référence PRD
`docs/PRD/PRD_BOOKING_COLLECTION_DELIVERY.md`

---

## Vue d'ensemble

Refonte complète du système de scheduling de réservation pour remplacer la sélection statique date/heure par un système de créneaux dynamiques gérés en base de données.

### Principes directeurs
- **Fullstack-first** : Chaque feature nécessite Frontend + Backend + Database + Validation
- **RLS-secured** : Toutes les queries utilisent Row-Level Security
- **Guest-compatible** : Flow anonyme maintenu avec traçabilité limitée
- **Fallback legacy** : Colonnes `pickup_date`, `delivery_date` conservées pour compatibilité
- **PRD-driven** : Implémentation stricte selon spécifications PRD

---

## Architecture Technique

### Data Flow
\`\`\`
User UI → CollectionDeliveryStep → GET /api/logistic-slots (fetch slots)
       ↓
User selects pickup + delivery slots
       ↓
BookingSummary displays selected slots
       ↓
POST /api/bookings (with pickupSlotId + deliverySlotId)
       ↓
Backend validates delay + slot availability
       ↓
Create booking + 2 slot_requests (tracking)
       ↓
Return success → redirect to confirmation
\`\`\`

### Stack Layers

#### 1. Database (✅ DONE)
- Tables : `logistic_slots`, `slot_requests`
- Colonnes : `bookings.pickup_slot_id`, `bookings.delivery_slot_id`
- RLS policies : read public, write service_role
- Migration : `20251013000100_create_logistic_slots.sql` (validated)

#### 2. Validation (TODO)
**File** : `lib/validations/logistic-slots.ts` (NEW)
\`\`\`typescript
export const logisticSlotSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['pickup', 'delivery']),
  slot_date: z.string(), // ISO date
  start_time: z.string(), // HH:mm
  end_time: z.string(),
  label: z.string().optional(),
})

export const getLogisticSlotsSchema = z.object({
  role: z.enum(['pickup', 'delivery']),
  startDate: z.string().optional(), // ISO format
  endDate: z.string().optional(),
})

export const slotSelectionSchema = z.object({
  pickupSlotId: z.string().uuid(),
  deliverySlotId: z.string().uuid(),
})
\`\`\`

**File** : `lib/validations/booking.ts` (UPDATE)
- Ajouter `pickupSlotId?: z.string().uuid().optional()`
- Ajouter `deliverySlotId?: z.string().uuid().optional()`
- Rendre `pickupDate` et `pickupTimeSlot` optionnels si slots fournis
- Ajouter validation custom : si `pickupSlotId` fourni, `deliverySlotId` requis (et vice-versa)

#### 3. Types TypeScript (TODO)
**File** : `lib/types/logistic-slots.ts` (NEW)
\`\`\`typescript
export interface LogisticSlot {
  id: string
  role: 'pickup' | 'delivery'
  slot_date: string // ISO
  start_time: string // HH:mm
  end_time: string
  label?: string
  is_open: boolean
  created_at: string
  updated_at: string
}

export interface SlotRequest {
  id: string
  slot_id: string
  role: 'pickup' | 'delivery'
  booking_id: string | null
  created_by: string | null
  requested_at: string
}

export interface SlotSelection {
  pickupSlot: LogisticSlot | null
  deliverySlot: LogisticSlot | null
}
\`\`\`

#### 4. Services Layer (TODO)
**File** : `lib/services/logistic-slots.ts` (NEW)
\`\`\`typescript
import { createClient } from "@/lib/supabase/server"
import type { LogisticSlot } from "@/lib/types/logistic-slots"

/**
 * Fetch available slots filtered by role and date range
 * Uses RLS: only returns is_open = true and slot_date >= today
 */
export async function getAvailableSlots(
  role: 'pickup' | 'delivery',
  startDate?: string,
  endDate?: string
): Promise<LogisticSlot[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('logistic_slots')
    .select('*')
    .eq('role', role)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true })
  
  if (startDate) query = query.gte('slot_date', startDate)
  if (endDate) query = query.lte('slot_date', endDate)
  
  const { data, error } = await query
  
  if (error) {
    console.error('[v0] Error fetching logistic slots:', error)
    throw new Error('Impossible de charger les créneaux disponibles')
  }
  
  return data || []
}

/**
 * Create slot request for tracking (called after booking creation)
 */
export async function createSlotRequest(
  slotId: string,
  role: 'pickup' | 'delivery',
  bookingId: string,
  createdBy?: string
) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('slot_requests')
    .insert({
      slot_id: slotId,
      role,
      booking_id: bookingId,
      created_by: createdBy || null,
    })
  
  if (error) {
    console.error('[v0] Error creating slot request:', error)
    // Non-blocking: tracking failure shouldn't break booking
  }
}

/**
 * Validate delay between pickup and delivery slots
 * @param pickupSlot Selected pickup slot
 * @param deliverySlot Selected delivery slot
 * @param serviceType 'express' (24h) or 'classic' (72h)
 * @returns true if delay is sufficient
 */
export function validateSlotDelay(
  pickupSlot: LogisticSlot,
  deliverySlot: LogisticSlot,
  serviceType: 'express' | 'classic'
): { valid: boolean; error?: string } {
  const pickupDate = new Date(`${pickupSlot.slot_date}T${pickupSlot.end_time}`)
  const deliveryDate = new Date(`${deliverySlot.slot_date}T${deliverySlot.start_time}`)
  
  const diffHours = (deliveryDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60)
  const minHours = serviceType === 'express' ? 24 : 72
  
  if (diffHours < minHours) {
    return {
      valid: false,
      error: `Le délai minimum entre collecte et livraison est de ${minHours}h pour le service ${serviceType}.`
    }
  }
  
  return { valid: true }
}
\`\`\`

#### 5. API Routes (TODO)

##### GET `/api/logistic-slots/route.ts` (NEW)
\`\`\`typescript
import { NextRequest, NextResponse } from "next/server"
import { getLogisticSlotsSchema } from "@/lib/validations/logistic-slots"
import { getAvailableSlots } from "@/lib/services/logistic-slots"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Validation
    const result = getLogisticSlotsSchema.safeParse({ role, startDate, endDate })
    if (!result.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', issues: result.error.issues },
        { status: 400 }
      )
    }
    
    const slots = await getAvailableSlots(result.data.role, result.data.startDate, result.data.endDate)
    
    return NextResponse.json({ slots })
  } catch (error) {
    console.error('[v0] GET /api/logistic-slots error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des créneaux' },
      { status: 500 }
    )
  }
}
\`\`\`

##### UPDATE `app/api/bookings/route.ts`
- Ajouter logic pour détecter si `pickupSlotId` présent
- Si slots fournis :
  - Charger les slots depuis DB
  - Valider délai avec `validateSlotDelay()`
  - Persister `pickup_slot_id`, `delivery_slot_id` dans booking
  - Générer fallback `pickup_date`, `delivery_date` depuis slot_date
  - Créer 2 `slot_requests` via `createSlotRequest()`
- Si slots absents (legacy flow) :
  - Conserver logique existante

#### 6. Frontend Components (TODO)

##### Hook `hooks/use-logistic-slots.ts` (NEW)
\`\`\`typescript
import { useState, useEffect } from 'react'
import type { LogisticSlot } from '@/lib/types/logistic-slots'

export function useLogisticSlots(role: 'pickup' | 'delivery', startDate?: string, endDate?: string) {
  const [slots, setSlots] = useState<LogisticSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchSlots() {
      try {
        setLoading(true)
        const params = new URLSearchParams({ role })
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        
        const res = await fetch(`/api/logistic-slots?${params}`)
        if (!res.ok) throw new Error('Erreur de chargement')
        
        const data = await res.json()
        setSlots(data.slots || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSlots()
  }, [role, startDate, endDate])
  
  return { slots, loading, error }
}
\`\`\`

##### Component `components/booking/collection-delivery-step.tsx` (NEW)
- Remplace `datetime-step.tsx` (guest + auth)
- Affiche 2 sections : "Collecte" et "Livraison"
- Charge slots via `useLogisticSlots`
- Affiche grille de cards cliquables (date + plage horaire + label optionnel)
- États :
  - Loading : skeleton cards
  - Empty : message "Aucun créneau disponible" + CTA contact
  - Error : toast Sonner
  - Success : grille interactive
- Props :
  \`\`\`typescript
  interface Props {
    onPickupSelect: (slot: LogisticSlot) => void
    onDeliverySelect: (slot: LogisticSlot) => void
    selectedPickup: LogisticSlot | null
    selectedDelivery: LogisticSlot | null
    serviceType: 'express' | 'classic' // for delay validation
  }
  \`\`\`
- Validation client-side : désactive slots livraison ne respectant pas délai minimum
- Responsive : 1 col mobile, 2 cols desktop
- Accessibilité : `aria-pressed`, focus management

##### Update `components/booking/guest/steps/summary-step.tsx`
- Détecter si booking utilise slots ou dates legacy
- Si slots :
  - Afficher format : "Collecte : Lundi 14 Oct, 9h-12h (Matin)"
  - Afficher format : "Livraison : Jeudi 17 Oct, 14h-17h"
- Si legacy :
  - Conserver affichage actuel

##### Update `components/booking/summary-step.tsx` (auth flow)
- Même logique que guest summary

---

## Plan d'Exécution Détaillé

### Phase 1 : Fondations (Backend + Validation)
**Durée estimée** : 1-2h

1. ✅ Database migration validée
2. **Créer `lib/types/logistic-slots.ts`** (interfaces TS)
3. **Créer `lib/validations/logistic-slots.ts`** (Zod schemas)
4. **Update `lib/validations/booking.ts`** (ajouter pickupSlotId/deliverySlotId)
5. **Créer `lib/services/logistic-slots.ts`** (business logic)

### Phase 2 : API Routes
**Durée estimée** : 1h

6. **Créer `app/api/logistic-slots/route.ts`** (GET)
7. **Update `app/api/bookings/route.ts`** (POST logic slots)
8. **Tester API** avec curl/Postman

### Phase 3 : Frontend Components
**Durée estimée** : 2-3h

9. **Créer `hooks/use-logistic-slots.ts`**
10. **Créer `components/booking/collection-delivery-step.tsx`**
11. **Update guest flow** : remplacer datetime-step par collection-delivery-step
12. **Update auth flow** : même remplacement
13. **Update summaries** (guest + auth)

### Phase 4 : Tests & Validation
**Durée estimée** : 1h

14. **Tests manuels** :
    - Insérer slots tests en DB
    - Flow guest complet (sélection → booking)
    - Flow auth complet
    - Validation délai (24h/72h)
    - Cas limites (aucun slot, erreur API)
15. **Tests unitaires** (optionnel) :
    - `validateSlotDelay` function
    - Zod schemas

### Phase 5 : Documentation
**Durée estimée** : 30min

16. **Créer `docs/OPERATIONS/SLOTS_MANAGEMENT.md`** :
    - Procédure ajout slots (SQL INSERT)
    - Désactivation slots (UPDATE is_open = false)
    - Monitoring slot_requests
17. **Update `docs/DATABASE_SCHEMA.md`** (nouvelles tables)

---

## Checklist de Validation

### Backend
- [ ] Schemas Zod créés et exportés
- [ ] Service `logistic-slots.ts` fonctionne (fetch + validation)
- [ ] API GET `/api/logistic-slots` retourne JSON valide
- [ ] API POST `/api/bookings` accepte slot IDs et crée slot_requests
- [ ] Validation délai fonctionne (24h/72h)
- [ ] Logs `[v0]` ajoutés pour debugging

### Frontend
- [ ] Hook `useLogisticSlots` charge données
- [ ] Composant `CollectionDeliveryStep` affiche grille
- [ ] Sélection slots met à jour state parent
- [ ] Validation client-side désactive slots invalides
- [ ] Summary affiche infos slots correctement
- [ ] Loading/error/empty states fonctionnent
- [ ] Responsive mobile/desktop OK
- [ ] Accessibilité clavier OK

### Tests
- [ ] Flow guest complet (avec slots)
- [ ] Flow auth complet (avec slots)
- [ ] Cas limite : aucun slot disponible
- [ ] Cas limite : erreur API (500)
- [ ] Validation délai bloque booking invalide
- [ ] Fallback legacy fonctionne si slots non fournis

### Documentation
- [ ] PRD respecté intégralement
- [ ] Operations guide créé (gestion slots)
- [ ] Database schema mis à jour
- [ ] Comments inline ajoutés dans code

---

## Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Aucun slot disponible (DB vide) | Blocage complet réservation | Message + CTA contact admin / fallback legacy temporaire |
| Timezone inconsistencies (DB vs client) | Mauvais affichage dates | Documenter timezone DB + formatter ISO strict |
| Flood slot_requests (anon) | DB bloat | Rate limiting API (future) + INDEX pour cleanup |
| Délai validation trop strict | UX frustration | Afficher message explicite + suggestion alternative |
| Legacy flow break | Régression users existants | Tests exhaustifs fallback + feature flag possible |

---

## Next Steps Immédiats

1. **Commencer Phase 1** : créer fichiers types/validations/services
2. **Tester service localement** avec slots insérés manuellement
3. **Implémenter API route GET** et valider réponse
4. **Créer composant UI** avec mock data
5. **Intégrer end-to-end** et tester flow complet

**Ordre recommandé** : Backend → API → Frontend (évite blocages dépendances)

---

## Auteur
GitHub Copilot - 13 octobre 2025

## Références
- PRD : `docs/PRD/PRD_BOOKING_COLLECTION_DELIVERY.md`
- Migration : `supabase/migrations/20251013000100_create_logistic_slots.sql`
- Corrections : `docs/MIGRATION_20251013_CORRECTIONS.md`
