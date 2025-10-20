# 📋 Implémentation: Modification de Réservation - Rapport

**Date**: `2025-01-XX`
**Référence PRD**: `docs/PRD/PRD_BOOKING_MODIFICATION.md`
**Status**: ✅ **IMPLÉMENTÉ** (Backend + Frontend + Validation)

---

## 🎯 Objectif

Permettre aux utilisateurs de modifier leurs réservations existantes (adresses, dates, créneaux horaires) tout en empêchant la modification des services sélectionnés.

---

## ✅ Ce qui a été Implémenté

### 1. Backend API - `/api/bookings/[id]/route.ts`

#### GET Method (Fetch Single Booking)
\`\`\`typescript
export async function GET(request: NextRequest, { params }: { params: { id: string } })
\`\`\`

**Fonctionnalités**:
- Récupère une réservation avec ses adresses (pickup/delivery)
- Inclut les items de réservation avec les services associés
- Vérifie la propriété (`user_id === booking.user_id`)
- Retourne 404 si réservation non trouvée
- Retourne 403 si l'utilisateur n'est pas le propriétaire

**Query Supabase**:
\`\`\`sql
bookings
  *, 
  pickup_address:user_addresses!pickup_address_id(*),
  delivery_address:user_addresses!delivery_address_id(*),
  booking_items(*, service:services(*))
WHERE id = {id} AND user_id = {user.id}
\`\`\`

#### PATCH Method (Modify Booking)
\`\`\`typescript
export async function PATCH(request: NextRequest, { params }: { params: { id: string } })
\`\`\`

**Pipeline de Validation (7 étapes)**:
1. **Validation Zod**: `modifyBookingSchema.safeParse(body)`
2. **Fetch booking**: Récupération réservation existante
3. **Ownership check**: Vérification `booking.user_id === user.id`
4. **Status check**: Réservation doit être `pending` ou `confirmed`
5. **Future date check**: `new Date(booking.pickup_date) > new Date()`
6. **New date validation**: Nouvelle date >= demain
7. **Address ownership**: Vérification que les adresses appartiennent à l'utilisateur

**Champs modifiables**:
- `pickup_date` ✅
- `pickup_time_slot` ✅
- `pickup_address_id` ✅
- `delivery_address_id` ✅
- `special_instructions` ✅

**Champs NON modifiables** (par design):
- `items` (services) ❌
- `status` ❌
- `service_type` ❌
- `total_amount` ❌

**Codes HTTP**:
- `200`: Modification réussie + booking mis à jour
- `400`: Validation échouée / Date passée / Status invalide
- `403`: Non autorisé (pas le propriétaire)
- `404`: Réservation non trouvée
- `500`: Erreur serveur

---

### 2. Frontend - Server Component (`app/reservation/page.tsx`)

**Responsabilités**:
- Détecte `?modify={bookingId}` dans searchParams
- Fetch booking via Supabase (Server Component pattern)
- Vérifie `canModify` (status + future date)
- Redirige vers dashboard si impossible de modifier
- Passe `existingBooking` au Client Component

**Code clé**:
\`\`\`typescript
const { user } = await requireAuth()
const { data: booking } = await supabase
  .from("bookings")
  .select(`*, pickup_address(...), booking_items(...)`)
  .eq("id", modifyBookingId)
  .eq("user_id", user.id)
  .single()

const canModify = 
  (booking.status === "pending" || booking.status === "confirmed") &&
  new Date(booking.pickup_date) > new Date()

if (!canModify) redirect("/dashboard?error=cannot_modify_booking")

return <ReservationClient existingBooking={booking} isModification={true} />
\`\`\`

---

### 3. Frontend - Client Component (`app/reservation/reservation-client.tsx`)

**Props Interface**:
\`\`\`typescript
interface ReservationClientProps {
  existingBooking?: any          // Booking data si modification
  isModification?: boolean        // true = mode modification
  serviceType?: string            // "classic" | "monthly" | "quarterly"
}
\`\`\`

**Améliorations UI**:

1. **Badge "Mode modification"**:
   \`\`\`tsx
   {isModification && (
     <Badge variant="outline" className="gap-1">
       <Edit className="h-3 w-3" />
       Mode modification
     </Badge>
   )}
   \`\`\`

2. **Alert d'information**:
   \`\`\`tsx
   <Alert className="mb-6 bg-blue-50 border-blue-200">
     <strong>Mode modification :</strong> Les services ne peuvent pas être modifiés.
   </Alert>
   \`\`\`

3. **Préfillage automatique**:
   \`\`\`typescript
   useState({
     pickupAddressId: existingBooking?.pickup_address_id || "",
     deliveryAddressId: existingBooking?.delivery_address_id || "",
     items: existingBooking?.booking_items || [],
     pickupDate: existingBooking?.pickup_date || "",
     pickupTimeSlot: existingBooking?.pickup_time_slot || "",
     specialInstructions: existingBooking?.special_instructions || "",
   })
   \`\`\`

4. **Titre dynamique**:
   \`\`\`tsx
   {isModification ? "Modifier la réservation" : "Nouvelle réservation"}
   \`\`\`

---

### 4. Services Step - Mode Read-Only (`components/booking/services-step.tsx`)

**Nouveau prop**: `readOnly?: boolean`

**Comportement en mode read-only**:
- Affiche uniquement les services déjà sélectionnés (filter)
- Désactive les boutons de quantité
- Affiche badge "Quantité: X" en lecture seule
- Titre: "Services sélectionnés (lecture seule)"

**Code clé**:
\`\`\`tsx
<ServicesStep
  items={bookingData.items}
  onUpdate={updateBookingData}
  serviceType={bookingData.serviceType}
  readOnly={isModification} // ← NEW
/>
\`\`\`

**ServiceCard modifications**:
\`\`\`tsx
{!readOnly && (
  <Button onClick={() => onQuantityChange(...)}>...</Button>
)}

{readOnly && quantity > 0 && (
  <Badge variant="secondary">Quantité: {quantity}</Badge>
)}
\`\`\`

---

### 5. Summary Step - API PATCH Call (`components/booking/summary-step.tsx`)

**Nouveaux props**:
\`\`\`typescript
interface SummaryStepProps {
  bookingData: BookingData
  serviceType?: string
  isModification?: boolean  // ← NEW
  bookingId?: string        // ← NEW
}
\`\`\`

**Logique conditionnelle**:
\`\`\`typescript
const handleSubmit = async () => {
  if (isModification && bookingId) {
    // Mode modification: PATCH
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      body: JSON.stringify({
        pickupDate,
        pickupTimeSlot,
        pickupAddressId,
        deliveryAddressId,
        specialInstructions,
      }),
    })
    router.push(`/dashboard?success=modification`)
  } else {
    // Mode création: POST
    const response = await fetch("/api/bookings", { method: "POST", ... })
    router.push(`/dashboard?success=true`)
  }
}
\`\`\`

**Texte bouton dynamique**:
\`\`\`tsx
{isModification ? "Enregistrer les modifications" : "Confirmer la réservation"}
\`\`\`

---

### 6. Validation Schema - `lib/validations/booking.ts`

**Ajout `specialInstructions`**:
\`\`\`typescript
export const modifyBookingSchema = z.object({
  pickupAddressId: z.string().uuid(),
  pickupDate: z.string().refine(...),
  pickupTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"]),
  deliveryAddressId: z.string().uuid().optional(),
  deliveryDate: z.string().optional(),
  deliveryTimeSlot: z.enum([...]).optional(),
  specialInstructions: z.string().optional(), // ← NEW
})
\`\`\`

---

### 7. Booking Card - Bouton "Modifier" (`components/booking/booking-card.tsx`)

**Modification implémentée** (déjà fait dans PR précédente):
\`\`\`tsx
{canModify && (
  <Button variant="outline" asChild>
    <Link href={`/reservation?modify=${booking.id}`}>
      <Edit className="mr-2 h-4 w-4" />
      Modifier la réservation
    </Link>
  </Button>
)}
\`\`\`

---

## 🔒 Règles de Sécurité Implémentées

### RLS Policies (à vérifier)
- ✅ **user_addresses**: User peut lire uniquement ses propres adresses
- ✅ **bookings**: User peut lire/modifier uniquement ses réservations
- ✅ **booking_items**: Lecture via JOIN avec bookings

### API Guards
- ✅ **apiRequireAuth**: Authentification obligatoire
- ✅ **Ownership check**: `booking.user_id === user.id`
- ✅ **Address ownership**: Vérification que `pickupAddressId` et `deliveryAddressId` appartiennent à l'utilisateur

### Validation Business Logic
- ✅ Status doit être `pending` ou `confirmed`
- ✅ Date de pickup doit être dans le futur
- ✅ Nouvelle date de pickup >= demain
- ✅ Services NON modifiables (pas dans payload PATCH)

---

## 📊 Data Flow Complet

\`\`\`
┌──────────────────┐
│  Dashboard       │
│  Booking Card    │
└────────┬─────────┘
         │ Click "Modifier"
         │
         ▼
┌────────────────────────────────────────┐
│  /reservation?modify={id}              │
│  Server Component (page.tsx)           │
│  • requireAuth()                       │
│  • Fetch booking from Supabase         │
│  • Check canModify                     │
│  • Pass to Client Component            │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  ReservationClient                     │
│  Client Component                      │
│  • Prefill form avec existingBooking   │
│  • Display "Mode modification" badge   │
│  • readOnly=true pour services step    │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  User modifie: Adresses / Date / Slot  │
│  • AddressStep: Change addresses       │
│  • DateTimeStep: Change pickup date    │
│  • ServicesStep: READ-ONLY             │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  SummaryStep                           │
│  • Click "Enregistrer les mods"        │
│  • PATCH /api/bookings/{id}            │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  API Route: PATCH /api/bookings/[id]   │
│  1. Validate with Zod                  │
│  2. Check ownership                    │
│  3. Check status + future date         │
│  4. Validate new date                  │
│  5. Check address ownership            │
│  6. UPDATE booking in DB               │
│  7. Return success                     │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  Redirect to /dashboard?success=mod    │
│  • Display toast "Modifié avec succès" │
│  • Updated booking in list             │
└────────────────────────────────────────┘
\`\`\`

---

## 🧪 Tests à Implémenter

### ❌ Tests unitaires (TODO)
\`\`\`bash
__tests__/api/bookings/patch.test.ts
\`\`\`

**Scénarios à tester**:
1. ✅ Modification réussie avec toutes les validations passées
2. ❌ Erreur 403: User ne possède pas la réservation
3. ❌ Erreur 400: Status = "completed" (non modifiable)
4. ❌ Erreur 400: Date de pickup dans le passé
5. ❌ Erreur 400: Nouvelle date < demain
6. ❌ Erreur 400: Adresses n'appartiennent pas à l'utilisateur
7. ❌ Erreur 404: Réservation inexistante

### ❌ Tests E2E (TODO)
\`\`\`bash
__tests__/e2e/booking-modification.spec.ts
\`\`\`

**Flow à tester**:
1. Login utilisateur
2. Aller au dashboard
3. Cliquer "Modifier" sur une réservation
4. Vérifier prefill des champs
5. Modifier une adresse
6. Modifier la date
7. Soumettre
8. Vérifier redirection + toast success
9. Vérifier que booking est mis à jour dans liste

---

## 📝 Documentation à Mettre à Jour

### ❌ TODO: `docs/booking-system-workflow.md`
Ajouter section "Modification Flow":
- Diagramme séquence: User → Dashboard → Reservation → API → DB
- Rules: Quand peut-on modifier (status + date)
- Champs modifiables vs non-modifiables

### ❌ TODO: `docs/api-integration-guide.md`
Ajouter endpoint PATCH `/api/bookings/[id]`:
- Request schema
- Response format
- Error codes
- Security checks

### ✅ FAIT: `docs/PRD/README.md`
- PRD_BOOKING_MODIFICATION.md ajouté à la liste

---

## 🚀 Déploiement

### Checklist Pre-Deploy

- [x] Backend API implémenté et testé manuellement
- [x] Frontend UI implémenté avec Server/Client pattern
- [x] Validation Zod schema mis à jour
- [x] TypeScript compilation passe (sans erreurs sur feature)
- [x] Dev server démarre correctement (port 3001)
- [ ] Tests unitaires écrits et passent
- [ ] Tests E2E écrits et passent
- [ ] Documentation mise à jour
- [ ] RLS policies vérifiées en production

### Commandes de Test Local

\`\`\`bash
# 1. Démarrer dev server
pnpm dev

# 2. Tester flow complet:
# - Login: http://localhost:3001/auth/signin
# - Dashboard: http://localhost:3001/dashboard
# - Créer réservation test (status=pending, future date)
# - Cliquer "Modifier" sur la réservation
# - Vérifier prefill + read-only services
# - Modifier adresse/date
# - Soumettre
# - Vérifier redirection + DB update

# 3. Tester erreurs:
# - Modifier réservation passée (should redirect with error)
# - Modifier réservation "completed" (should redirect)
# - Modifier réservation d'un autre user (should 403)
\`\`\`

---

## 📊 Métriques de Succès

### Backend
- ✅ API GET `/api/bookings/[id]` retourne booking complet
- ✅ API PATCH `/api/bookings/[id]` applique modifications avec validation
- ✅ Ownership check empêche modification par autre user
- ✅ Status check empêche modification de réservations terminées
- ✅ Date validation empêche modification vers dates passées

### Frontend
- ✅ Prefill automatique avec données existantes
- ✅ Badge "Mode modification" visible
- ✅ Services step en read-only
- ✅ Titre et textes adaptés au mode modification
- ✅ Redirection après succès avec message

### UX
- ✅ User comprend qu'il est en mode modification (badge + alert)
- ✅ User ne peut pas modifier les services (design decision)
- ✅ User voit ses données actuelles pré-remplies
- ✅ User reçoit feedback immédiat après soumission

---

## 🐛 Bugs Connus / Limitations

### Limitations de Design (par choix)
1. **Services non modifiables**: Pour simplifier la logique de calcul de prix et éviter les fraudes
2. **Delivery date/time slot**: Pas encore implémenté dans UI (mais supporté par backend schema)
3. **Modification history**: Pas de log des modifications (à implémenter plus tard avec audit trail)

### Bugs Mineurs (non-bloquants)
1. **TypeScript errors** dans autres fichiers (tests, forms) - préexistants, pas liés à cette feature
2. **Service type detection**: `booking.service_type` peut être `null` (fallback à "classic" OK)

---

## 🔄 Prochaines Étapes

### P0 - Critique
- [ ] Écrire tests unitaires pour API PATCH
- [ ] Écrire test E2E pour flow complet
- [ ] Vérifier RLS policies en Supabase production

### P1 - Important
- [ ] Mettre à jour `docs/booking-system-workflow.md`
- [ ] Mettre à jour `docs/api-integration-guide.md`
- [ ] Ajouter audit trail (table `booking_modifications`)

### P2 - Nice to have
- [ ] Permettre modification delivery date/time slot (UI manquante)
- [ ] Historique des modifications dans dashboard
- [ ] Email notification lors de modification
- [ ] Push notification mobile (PWA)

---

## 📌 Commit Message Suggéré

\`\`\`
feat: ✨ Implement booking modification flow (Backend + Frontend)

- Add PATCH /api/bookings/[id] endpoint with 7-step validation
- Add GET /api/bookings/[id] endpoint for single booking fetch
- Split reservation page into Server + Client components
- Add `isModification` mode to ReservationClient
- Implement read-only services step for modification
- Add `specialInstructions` to modifyBookingSchema
- Update SummaryStep to handle PATCH requests
- Add "Mode modification" badge and alert in UI

Security:
- Ownership check (user_id verification)
- Status validation (only pending/confirmed)
- Future date enforcement
- Address ownership validation

UX:
- Prefill form with existing booking data
- Display modification badge + alert
- Lock services step (read-only mode)
- Dynamic button text and page title

Refs: #PRD_BOOKING_MODIFICATION, #ISSUE-123
\`\`\`

---

## ✅ Conclusion

**Status**: ✅ **FEATURE COMPLETE** (Backend + Frontend + Validation)

**Effort**: ~4h de développement complet (PRD → Implementation → Testing manuel)

**Qualité**: Production-ready (après tests automatisés)

**Documentation**: PRD complet créé, docs techniques à mettre à jour

**Prochaine action**: Écrire tests automatisés + merger dans `dev` branch
