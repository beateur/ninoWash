# 🧪 Guide de Test Rapide - Booking Cancellation

## Pré-requis

1. ✅ Migration SQL appliquée en base
2. ✅ Application démarrée (`pnpm dev`)
3. ✅ Utilisateur connecté avec au moins 1 réservation future

---

## Test 1: Annulation d'une réservation future ⏱️ 5min

### Préparation
1. Créer une réservation avec `pickup_date` = dans 3 jours
2. Status = "pending" ou "confirmed"

### Steps
1. 🖥️ Aller sur `/dashboard`
2. 🖱️ Cliquer sur la réservation créée
3. 👁️ Vérifier que le panneau détails s'ouvre
4. ✅ Vérifier que le bouton "Annuler la réservation" est visible
5. 🖱️ Cliquer sur "Annuler la réservation"
6. 📝 Remplir la raison: "Test d'annulation pour validation"
7. 🖱️ Cliquer "Confirmer l'annulation"

### Résultat attendu
- ✅ Toast success "Réservation annulée"
- ✅ Panel se ferme automatiquement
- ✅ Liste des réservations rafraîchie
- ✅ Réservation affiche badge "Annulée" (rouge)
- ✅ En base: `status='cancelled'`, `cancelled_at` rempli, `cancellation_reason` présent

### Vérification DB
```sql
SELECT 
  id, 
  status, 
  cancelled_at, 
  cancellation_reason,
  cancelled_by
FROM bookings 
WHERE id = 'YOUR_BOOKING_ID';

-- Doit retourner:
-- status: cancelled
-- cancelled_at: timestamp récent
-- cancellation_reason: "Test d'annulation pour validation"
-- cancelled_by: YOUR_USER_ID
```

---

## Test 2: Annulation impossible < 24h ⏱️ 3min

### Préparation
1. Créer une réservation avec `pickup_date` = demain à 10h

### Steps
1. 🖥️ Aller sur `/dashboard`
2. 🖱️ Cliquer sur cette réservation
3. 🖱️ Cliquer "Annuler la réservation"
4. 📝 Remplir une raison
5. 🖱️ Cliquer "Confirmer l'annulation"

### Résultat attendu
- ❌ Message d'erreur: "Impossible d'annuler une réservation moins de 24h avant la collecte"
- ❌ Réservation reste "pending" ou "confirmed"
- ❌ Pas de changement en base

---

## Test 3: Annulation déjà annulée ⏱️ 2min

### Steps
1. Prendre une réservation déjà annulée (du Test 1)
2. 🖱️ Cliquer dessus dans le dashboard
3. 👁️ Vérifier que le bouton "Annuler" n'est PAS visible
4. ✅ Seul "Signaler un problème" devrait être visible

### Résultat attendu
- ✅ Pas de bouton "Annuler" pour réservation cancelled
- ✅ Logique `canModify` fonctionne correctement

---

## Test 4: Signalement de problème ⏱️ 5min

### Préparation
Réservation dans n'importe quel statut (passée ou future)

### Steps
1. 🖥️ Dashboard → Cliquer sur réservation
2. 🖱️ Cliquer "Signaler un problème"
3. 📋 Sélectionner type: "Problème de qualité"
4. 📝 Description: "Le vêtement X présente une tache qui n'était pas là avant le pressing"
5. 🖱️ Cliquer "Signaler le problème"

### Résultat attendu
- ✅ Toast success "Problème signalé. Notre équipe vous contactera sous 24h."
- ✅ Formulaire se ferme
- ✅ En base: nouvelle entrée dans `booking_reports`

### Vérification DB
```sql
SELECT 
  id, 
  booking_id, 
  type, 
  description, 
  status, 
  created_at
FROM booking_reports 
WHERE booking_id = 'YOUR_BOOKING_ID'
ORDER BY created_at DESC;

-- Doit retourner:
-- type: quality_issue
-- description: votre texte
-- status: pending
-- created_at: timestamp récent
```

---

## Test 5: Actions conditionnelles ⏱️ 5min

### Test 5.1: Réservation passée
1. Créer réservation avec `pickup_date` = hier
2. Cliquer dessus dans le dashboard
3. ✅ Vérifier: Seulement "Signaler un problème" visible
4. ❌ "Annuler" et "Modifier" invisibles

### Test 5.2: Réservation status "picked_up"
1. Réservation avec status = "picked_up"
2. Cliquer dessus
3. ✅ Vérifier: Seulement "Signaler un problème" visible

### Test 5.3: Réservation status "delivered"
1. Réservation avec status = "delivered"
2. Cliquer dessus
3. ✅ Vérifier: Seulement "Signaler un problème" visible

---

## Test 6: Validation formulaires ⏱️ 5min

### Test 6.1: Raison d'annulation trop courte
1. Ouvrir formulaire annulation
2. Écrire "Test" (< 10 chars)
3. Soumettre
4. ✅ Vérifier: Erreur "La raison doit contenir au moins 10 caractères"

### Test 6.2: Description problème trop courte
1. Ouvrir formulaire signalement
2. Écrire "Bug" (< 20 chars)
3. Soumettre
4. ✅ Vérifier: Erreur "La description doit contenir au moins 20 caractères"

### Test 6.3: Type problème non sélectionné
1. Ouvrir formulaire signalement
2. Remplir description SANS sélectionner type
3. Soumettre
4. ✅ Vérifier: Erreur de validation

---

## Test 7: Audit Trail ⏱️ 3min

### Steps
1. Annuler une réservation
2. Vérifier en DB:

```sql
SELECT 
  bm.id,
  bm.booking_id,
  bm.field_changed,
  bm.old_value,
  bm.new_value,
  bm.reason,
  bm.created_at,
  u.email as user_email
FROM booking_modifications bm
JOIN auth.users u ON bm.user_id = u.id
WHERE bm.booking_id = 'YOUR_BOOKING_ID'
ORDER BY bm.created_at DESC;

-- Doit retourner:
-- field_changed: status
-- old_value: pending (ou confirmed)
-- new_value: cancelled
-- reason: votre texte de cancellation
-- user_email: votre email
```

---

## Test 8: Security - Ownership ⏱️ 5min

### Préparation
- User A avec booking_1
- User B (autre compte)

### Test avec curl (simule user B essayant d'annuler booking de user A)
```bash
# 1. Se connecter en tant que User B
# 2. Copier le cookie de session

# 3. Essayer d'annuler booking de User A
curl -X POST http://localhost:3000/api/bookings/BOOKING_1_ID/cancel \
  -H "Content-Type: application/json" \
  -H "Cookie: [USER_B_SESSION_COOKIE]" \
  -d '{"reason": "Trying to cancel someone else booking"}'

# Résultat attendu: 403 Forbidden
# { "error": "Vous n'êtes pas autorisé à annuler cette réservation" }
```

---

## Test 9: RLS Policies ⏱️ 5min

### Via Supabase Studio SQL Editor

```sql
-- 1. Se connecter en tant que User A
-- 2. Essayer de voir les modifications d'un autre user

-- Doit retourner UNIQUEMENT les modifications de User A
SELECT * FROM booking_modifications WHERE user_id != auth.uid();
-- Expected: 0 rows (RLS policy bloque)

-- Doit retourner les modifications de User A
SELECT * FROM booking_modifications WHERE user_id = auth.uid();
-- Expected: Vos modifications visibles

-- 3. Essayer d'insérer une modification pour un booking pas à soi
INSERT INTO booking_modifications (booking_id, user_id, field_changed, old_value, new_value)
VALUES ('BOOKING_ID_NOT_YOURS', auth.uid(), 'test', 'old', 'new');
-- Expected: Error (RLS policy bloque si booking.user_id != auth.uid())
```

---

## Test 10: Performance ⏱️ 3min

### Vérifier que les indexes sont utilisés

```sql
-- Test 1: Index sur cancelled_at
EXPLAIN ANALYZE 
SELECT * FROM bookings WHERE cancelled_at IS NOT NULL;
-- Vérifier dans le plan: "Index Scan using idx_bookings_cancelled_at"

-- Test 2: Index sur booking_reports.status
EXPLAIN ANALYZE
SELECT * FROM booking_reports WHERE status = 'pending';
-- Vérifier: "Index Scan using idx_booking_reports_status"

-- Test 3: Index sur booking_modifications.booking_id
EXPLAIN ANALYZE
SELECT * FROM booking_modifications WHERE booking_id = 'YOUR_BOOKING_ID';
-- Vérifier: "Index Scan using idx_booking_modifications_booking_id"
```

---

## ✅ Checklist Complète

- [ ] Test 1: Annulation réussie
- [ ] Test 2: Annulation < 24h bloquée
- [ ] Test 3: Annulation déjà annulée
- [ ] Test 4: Signalement problème
- [ ] Test 5: Actions conditionnelles (3 scénarios)
- [ ] Test 6: Validation formulaires (3 scénarios)
- [ ] Test 7: Audit trail visible
- [ ] Test 8: Security ownership
- [ ] Test 9: RLS policies actives
- [ ] Test 10: Indexes utilisés

---

## 🐛 Troubleshooting

### Erreur: "Column does not exist"
→ Migration SQL pas appliquée. Voir `MIGRATION_GUIDE.md`

### Erreur: "Permission denied"
→ RLS policies pas créées. Relancer migration SQL

### Boutons "Annuler/Modifier" toujours visibles
→ Vérifier logique `canModify` dans `BookingDetailPanel`
→ Vérifier que `pickup_date` est bien une date ISO

### Toast ne s'affiche pas
→ Vérifier que `useToast` est importé
→ Vérifier console pour erreurs React

### Refresh ne fonctionne pas après annulation
→ Vérifier que `onBookingUpdated` est bien passé au panel
→ Vérifier que `router.refresh()` est appelé

---

## 📊 Temps Total Estimé

**Tests manuels complets**: ~40-45 minutes

**Tests critiques uniquement** (1, 4, 5, 8):
- Test 1: Annulation
- Test 4: Signalement
- Test 5: Actions conditionnelles
- Test 8: Security

**Total rapide**: ~20 minutes

---

## ✅ Validation Production

Avant de déployer en production:
- ✅ Tous les tests passent
- ✅ Aucune erreur en console browser
- ✅ Aucune erreur en logs serveur
- ✅ TypeScript compile (`pnpm tsc --noEmit`)
- ✅ Lint passe (`pnpm lint`)
- ✅ RLS policies testées
- ✅ Performance OK (queries < 200ms)
