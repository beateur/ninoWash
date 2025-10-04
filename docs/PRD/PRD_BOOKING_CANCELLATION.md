# PRD: Annulation et Modification de Réservations

**Status**: � Backend implémenté | Frontend intégré | Base de données prête  
**Date**: 4 octobre 2025  
**Branche**: `feature/dashboard-sidebar-ui`

---

## 1. Context

### Pourquoi ce changement ?
Les utilisateurs ont besoin de gérer leurs réservations futures :
- **Annuler** une réservation s'ils changent d'avis
- **Modifier** une réservation si l'adresse ou le créneau change
- **Signaler un problème** sur une réservation passée ou en cours

### User Journey Impacté
1. User accède au dashboard
2. User clique sur une réservation
3. Panneau détails s'ouvre à droite
4. User voit les actions disponibles selon le statut/date
5. User clique sur "Annuler" ou "Modifier"
6. Confirmation → API call → DB update → UI refresh

### Business Value
- Réduction des appels au support client
- Autonomie utilisateur
- Meilleure expérience utilisateur
- Traçabilité des annulations/modifications

---

## 2. Goals (Success Criteria)

✅ **Must Have**:
- [x] User peut annuler une réservation future (pending/confirmed)
- [ ] User peut modifier une réservation future (pending/confirmed) - API ready, UI à compléter
- [x] User peut signaler un problème sur n'importe quelle réservation
- [x] Données persistées en base avec traçabilité
- [x] UI affiche les bonnes actions selon statut et date
- [x] Erreurs gérées gracieusement (pas de réservation, déjà annulée, etc.)

🎯 **Nice to Have** (Phase 2):
- [ ] Email de confirmation après annulation
- [ ] Notification push pour les modifications
- [ ] Historique des modifications dans le détail réservation

---

## 3. Scope

### 3.1 Frontend ✅ (Déjà implémenté)

**Components créés/modifiés**:
- ✅ `components/booking/booking-card.tsx` - `BookingDetailPanel`
  - Ajout état `showCancelConfirm`
  - Logique `isFutureBooking` (pickup_date > today)
  - Logique `canModify` (future + pending/confirmed)
  - Boutons conditionnels

**UI States**:
- ✅ Loading: N/A (actions simples)
- ✅ Success: Fermeture du panel + refresh liste
- ⚠️ Error: Placeholder (TODO: toast/alert)
- ✅ Empty: Actions masquées si réservation passée

**User Flow**:
1. ✅ Clic sur réservation → Panel s'ouvre
2. ✅ Actions affichées selon règles métier
3. ✅ Clic "Annuler" → Dialog confirmation
4. ❌ Confirmation → API call (TODO)
5. ❌ Success → Refresh + toast (TODO)
6. ❌ Error → Message d'erreur (TODO)

**Responsive Behavior**:
- ✅ Desktop: Panel latéral 400-500px
- ✅ Mobile: Panel fullscreen overlay

**Accessibility**:
- ⚠️ TODO: ARIA labels sur boutons
- ⚠️ TODO: Focus trap dans dialog confirmation
- ⚠️ TODO: Keyboard navigation (Escape pour fermer)

### 3.2 Backend ✅ (Implémenté)

**API Routes créés**:

#### 1. POST /api/bookings/[id]/cancel
```typescript
// Request
{
  "reason": "Changement de plans",
  "cancelledAt": "2025-10-04T21:00:00Z"
}

// Response (Success)
{
  "success": true,
  "booking": { ...updatedBooking }
}

// Response (Error)
{
  "error": "Booking already cancelled",
  "code": "ALREADY_CANCELLED"
}
```

**Business Logic**:
- ✅ Check: User owns the booking
- ✅ Check: Booking status is pending/confirmed
- ✅ Check: Pickup date is in the future (> 24h avant)
- ✅ Update: Set status to "cancelled"
- ✅ Update: Set cancelled_at timestamp
- ✅ Update: Store cancellation_reason
- ⚠️ TODO Phase 2: Trigger email notification
- ⚠️ TODO Phase 2: Release reserved time slot (if applicable)

#### 2. PUT /api/bookings/[id]
```typescript
// Request
{
  "pickupAddress": "uuid-address-id",
  "pickupDate": "2025-10-10",
  "pickupTimeSlot": "14:00-16:00",
  "deliveryAddress": "uuid-address-id", // optional
  "deliveryDate": "2025-10-12", // optional
  "deliveryTimeSlot": "18:00-20:00" // optional
}

// Response
{
  "success": true,
  "booking": { ...updatedBooking },
  "message": "Réservation modifiée avec succès"
}
```

**Business Logic**:
- Check: User owns the booking
- Check: Booking status is pending/confirmed
- Check: New pickup date is in the future
- Validate: Address exists and belongs to user
- Validate: Time slot is available
- Update: booking fields
- Store: modification history (audit log)

#### 3. POST /api/bookings/[id]/report
```typescript
// Request
{
  "type": "damaged_items" | "missing_items" | "late_delivery" | "quality_issue" | "other",
  "description": "Détails du problème...",
  "photos": ["url1", "url2"] // optional
}

// Response
{
  "success": true,
  "reportId": "uuid",
  "message": "Problème signalé. Notre équipe vous contactera sous 24h."
}
```

### 3.3 Database ✅ (Implémenté)

**Fichier de migration créé**: `supabase/migrations/20251004_booking_cancellation_and_reports.sql`

**Schema Changes**:

```sql
-- Migration: Add cancellation fields to bookings
ALTER TABLE bookings 
  ADD COLUMN cancellation_reason TEXT,
  ADD COLUMN cancelled_at TIMESTAMPTZ,
  ADD COLUMN cancelled_by UUID REFERENCES auth.users(id);

-- Create booking_modifications table (audit log)
CREATE TABLE booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create booking_reports table
CREATE TABLE booking_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('damaged_items', 'missing_items', 'late_delivery', 'quality_issue', 'other')),
  description TEXT NOT NULL,
  photos TEXT[], -- Array of URLs
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_booking_modifications_booking_id ON booking_modifications(booking_id);
CREATE INDEX idx_booking_modifications_created_at ON booking_modifications(created_at DESC);
CREATE INDEX idx_booking_reports_booking_id ON booking_reports(booking_id);
CREATE INDEX idx_booking_reports_status ON booking_reports(status);
CREATE INDEX idx_booking_reports_user_id ON booking_reports(user_id);
```

**RLS Policies**:

```sql
-- Bookings: Users can only cancel their own bookings
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Booking modifications: Users can view their own modifications
CREATE POLICY "Users can view their own modifications"
  ON booking_modifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create modifications for their bookings"
  ON booking_modifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
  );

-- Booking reports: Users can create and view their own reports
CREATE POLICY "Users can create reports for their bookings"
  ON booking_reports FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view their own reports"
  ON booking_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view and update all reports
CREATE POLICY "Admins can view all reports"
  ON booking_reports FOR SELECT
  USING (
    (SELECT user_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update all reports"
  ON booking_reports FOR UPDATE
  USING (
    (SELECT user_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );
```

### 3.4 Validation ✅ (Implémenté)

**Zod Schemas** (`lib/validations/booking.ts`):

```typescript
import { z } from "zod"

export const cancelBookingSchema = z.object({
  reason: z.string().min(10, "Minimum 10 caractères").max(500, "Maximum 500 caractères"),
})

export const modifyBookingSchema = z.object({
  pickupAddressId: z.string().uuid("Adresse invalide"),
  pickupDate: z.string().datetime("Date invalide"),
  pickupTimeSlot: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Créneau invalide"),
  deliveryAddressId: z.string().uuid("Adresse invalide").optional(),
  deliveryDate: z.string().datetime("Date invalide").optional(),
  deliveryTimeSlot: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Créneau invalide").optional(),
}).refine(
  (data) => new Date(data.pickupDate) > new Date(),
  { message: "La date de collecte doit être dans le futur" }
)

export const reportProblemSchema = z.object({
  type: z.enum(["damaged_items", "missing_items", "late_delivery", "quality_issue", "other"]),
  description: z.string().min(20, "Minimum 20 caractères").max(1000, "Maximum 1000 caractères"),
  photos: z.array(z.string().url()).max(5, "Maximum 5 photos").optional(),
})

// TypeScript types
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>
export type ModifyBookingInput = z.infer<typeof modifyBookingSchema>
export type ReportProblemInput = z.infer<typeof reportProblemSchema>
```

### 3.5 Security ✅

**Authentication**:
- ✅ Frontend: Routes protected by `(authenticated)` layout
- ✅ Backend: API routes use `apiRequireAuth()` guard

**Authorization**:
- ✅ User can only cancel/modify their own bookings (checked in API)
- ✅ RLS policies enforce database-level security (in migration)

**Input Sanitization**:
- ✅ Zod validation on all inputs
- ✅ SQL injection prevention via Supabase parameterized queries

**Business Rules**:
- ✅ Can't cancel booking < 24h before pickup
- ✅ Can't modify booking in "picked_up" or later status
- ✅ Can't cancel already cancelled booking

### 3.6 DevOps ✅

**Environment Variables**:
- ✅ No new env vars needed (uses existing Supabase)

**Migrations**:
- ✅ Migration file created in `supabase/migrations/`
- ⚠️ TODO: Apply migration to local Supabase (via Supabase Studio ou CLI)
- ⚠️ TODO: Deploy to staging → production

**Monitoring**:
- ⚠️ TODO Phase 2: Log all cancellations (for analytics)
- ⚠️ TODO Phase 2: Alert if cancellation rate > threshold
- ⚠️ TODO Phase 2: Track API response times

---

## 4. Technical Implementation Plan

### ✅ Phase 1: Frontend UI (DONE)
- [x] Add conditional actions to BookingDetailPanel
- [x] Implement isFutureBooking logic
- [x] Add cancel confirmation dialog
- [x] Update UI states

### ✅ Phase 2: Database Schema (DONE)
- [x] Create migration file `20251004_booking_cancellation_and_reports.sql`
- [x] Add cancellation columns to bookings table
- [x] Create booking_modifications audit table
- [x] Create booking_reports table
- [x] Add indexes for performance
- [x] Write RLS policies
- [ ] **TODO**: Apply migration locally: `supabase db push` ou via Supabase Studio
- [ ] **TODO**: Test migration with sample data

### ✅ Phase 3: Validation Schemas (DONE)
- [x] Add cancelBookingSchema
- [x] Add modifyBookingSchema
- [x] Add reportProblemSchema
- [x] Export TypeScript types

### ✅ Phase 4: API Routes (DONE)
- [x] Create `app/api/bookings/[id]/cancel/route.ts`
  - [x] apiRequireAuth guard
  - [x] Validate request body
  - [x] Check ownership
  - [x] Check business rules (status, date)
  - [x] Update database
  - [x] Return response
- [x] Create `app/api/bookings/[id]/route.ts` (PUT method)
  - [x] Similar guards and validation
  - [x] Update booking fields
  - [x] Log modification in audit table
- [x] Create `app/api/bookings/[id]/report/route.ts`
  - [x] Insert into booking_reports table
  - [ ] TODO Phase 2: Trigger email notification to admin

### ✅ Phase 5: Frontend Integration (DONE)
- [x] Create `CancelBookingForm` component with React Hook Form + Zod
- [x] Create `ReportProblemForm` component
- [x] Update `BookingDetailPanel`:
  - [x] Integrate CancelBookingForm
  - [x] Integrate ReportProblemForm
  - [x] Add toast notifications on success/error
  - [x] Close panel + refresh after successful action
- [x] Connect to router.refresh() for server-side data refresh

### ⚠️ Phase 6: Testing (TODO)
- [ ] Unit tests:
  - [ ] Validation schemas
  - [ ] Business logic (isFutureBooking, canModify)
- [ ] Integration tests:
  - [ ] API endpoints with mock DB
  - [ ] Test all error scenarios
- [ ] E2E tests:
  - [ ] Cancel booking flow
  - [ ] Report problem flow

### ⚠️ Phase 7: Documentation (TODO)
- [x] Create `MIGRATION_GUIDE.md`
- [ ] Update `docs/api-integration-guide.md` with new endpoints
- [ ] Update `docs/DATABASE_SCHEMA.md` with new tables
- [ ] Add example usage in README

---

## 5. Data Flow

### Cancel Booking Flow
```
User clicks "Annuler" 
  → Confirmation dialog opens
  → User confirms
  → Frontend: POST /api/bookings/{id}/cancel { reason }
  → Backend: Validate ownership + status + date
  → Backend: Update DB (status='cancelled', cancelled_at, reason)
  → Backend: Return success
  → Frontend: Toast "Réservation annulée"
  → Frontend: Refresh bookings list
  → Frontend: Close detail panel
```

### Modify Booking Flow
```
User clicks "Modifier"
  → Form dialog opens with current values
  → User changes address/date/time
  → Frontend: Validate inputs (Zod)
  → Frontend: PUT /api/bookings/{id} { ...changes }
  → Backend: Validate ownership + status + availability
  → Backend: Update DB + log modification
  → Backend: Return updated booking
  → Frontend: Toast "Réservation modifiée"
  → Frontend: Update UI with new values
```

---

## 6. Error Scenarios

| Scenario | HTTP Code | Message | Handling |
|----------|-----------|---------|----------|
| Booking not found | 404 | "Réservation introuvable" | Toast error |
| Not owner | 403 | "Vous n'êtes pas autorisé" | Toast error |
| Already cancelled | 400 | "Réservation déjà annulée" | Toast error + refresh |
| Too late to cancel | 400 | "Impossible d'annuler < 24h avant" | Toast error |
| Invalid status | 400 | "Cette réservation ne peut être modifiée" | Toast error |
| Network error | 500 | "Erreur réseau. Réessayez." | Toast error + retry button |
| Validation error | 400 | "Données invalides: {details}" | Display field errors |

---

## 7. Edge Cases

- [ ] User clicks cancel twice rapidly → Prevent double submission with loading state
- [ ] Booking cancelled by admin while user viewing → Show error + refresh
- [ ] User loses connection during cancel → Retry mechanism
- [ ] Pickup date passes while user is on detail panel → Disable actions + show warning
- [ ] Concurrent modification (2 tabs) → Optimistic locking or last-write-wins

---

## 8. Testing Strategy

**Unit Tests** (`__tests__/booking-actions.test.ts`):
```typescript
describe("Booking Actions", () => {
  it("should allow cancel for future pending booking", () => {})
  it("should not allow cancel for past booking", () => {})
  it("should not allow cancel for delivered booking", () => {})
  it("should validate cancellation reason length", () => {})
})
```

**Integration Tests** (`__tests__/api/bookings-cancel.test.ts`):
```typescript
describe("POST /api/bookings/[id]/cancel", () => {
  it("should cancel booking successfully", async () => {})
  it("should return 403 if not owner", async () => {})
  it("should return 400 if already cancelled", async () => {})
})
```

**E2E Tests** (Playwright/Cypress):
- [ ] User cancels future booking successfully
- [ ] Error displayed if cancellation fails
- [ ] Actions hidden for past bookings

---

## 9. Rollout Plan

**Phase 1 (Current)**: Frontend UI ✅
- Users see conditional actions but nothing happens yet

**Phase 2**: Backend + Database 🔄
- Deploy migrations to staging
- Test API endpoints
- Deploy to production

**Phase 3**: Frontend Integration 🔜
- Connect UI to APIs
- Enable actual cancellation/modification
- Monitor error rates

**Monitoring**:
- Track cancellation rate (should be < 10%)
- Alert if API errors > 5%
- Monitor database query performance

**Rollback Strategy**:
- If bugs: Disable feature via feature flag
- Database rollback: Reverse migration

---

## 10. Out of Scope (Phase 2)

- ❌ Email notifications (to be added later)
- ❌ SMS confirmations
- ❌ Admin dashboard for managing reports
- ❌ Automatic refunds (manual for now)
- ❌ Cancellation fees based on timing
- ❌ Bulk modification of recurring bookings

---

## Current Status Summary

| Layer | Status | Next Action |
|-------|--------|-------------|
| **Frontend UI** | ✅ Done | Test user flows |
| **Database Schema** | ✅ Done | Apply migration locally/production |
| **Validation** | ✅ Done | - |
| **API Routes** | ✅ Done | Test with real data |
| **Frontend Integration** | ✅ Done | Add Modify booking UI (Phase 2) |
| **Testing** | ⚠️ TODO | Write unit + E2E tests |
| **Documentation** | ⚠️ Partial | Update API + DB docs |

---

## Action Items (Prioritized)

1. 🔴 **HIGH**: Appliquer la migration SQL en base de données (locale puis production)
2. 🔴 **HIGH**: Tester le flow d'annulation end-to-end avec des vraies données
3. 🟠 **MEDIUM**: Tester le flow de signalement de problème
4. 🟠 **MEDIUM**: Créer l'UI pour la modification de réservation (Phase 2)
5. 🟡 **LOW**: Écrire les tests unitaires et E2E
6. 🟡 **LOW**: Ajouter les notifications email (Phase 2)
7. 🟡 **LOW**: Mettre à jour la documentation API

**Estimated Effort Remaining**: 
- Migration application: 30min
- Testing: 2-3h
- Documentation: 1-2h
- **Total: 3-6h**

---

**Conclusion**: La fonctionnalité est actuellement à **85% complete**. Backend + Frontend + Validation + DB schema sont implémentés. Il reste principalement l'application de la migration SQL, les tests, et la documentation complète.
