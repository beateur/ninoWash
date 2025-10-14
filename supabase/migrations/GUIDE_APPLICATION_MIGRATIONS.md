# Guide d'Application des Migrations - booking_number Fix

## 🎯 Objectif
Appliquer les migrations pour résoudre l'erreur `booking_number NOT NULL violation` et activer le logging des échecs.

---

## 📦 Migrations à Appliquer (PAR ORDRE)

### **Migration 1 : Trigger booking_number** (P0 - CRITIQUE)
**Fichier** : `20251010000001_add_booking_number_trigger.sql`
**But** : Auto-générer booking_number si NULL lors d'INSERT
**Statut** : ⚠️ **À APPLIQUER**

### **Migration 2 : Failed Operations Logging** (P0 - CRITIQUE)
**Fichier** : `20251010000000_add_failed_operations_logging.sql`
**But** : Créer tables `failed_account_creations` et `failed_bookings` pour logging
**Statut** : ⚠️ **À APPLIQUER**

---

## 🚀 Méthode d'Application (Supabase Dashboard)

### Étape 1 : Ouvrir Supabase Dashboard
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet Nino Wash
3. Cliquer sur **"SQL Editor"** dans la sidebar

### Étape 2 : Appliquer Migration 1 (Trigger booking_number)
1. Cliquer sur **"New query"**
2. Copier tout le contenu de `supabase/migrations/20251010000001_add_booking_number_trigger.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur **"Run"** (ou Cmd+Enter)
5. Vérifier le message de succès

**Vérification** :
\`\`\`sql
-- Tester que le trigger fonctionne
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'trg_bookings_booking_number';

-- Devrait retourner 1 ligne avec enabled = 'O' (pour "Origin")
\`\`\`

### Étape 3 : Appliquer Migration 2 (Failed Operations Logging)
1. Cliquer sur **"New query"**
2. Copier tout le contenu de `supabase/migrations/20251010000000_add_failed_operations_logging.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur **"Run"** (ou Cmd+Enter)
5. Vérifier le message de succès

**Vérification** :
\`\`\`sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('failed_account_creations', 'failed_bookings');

-- Devrait retourner 2 lignes
\`\`\`

---

## ✅ Tests Post-Migration

### Test 1 : Trigger booking_number
\`\`\`sql
-- Test INSERT sans booking_number (devrait être auto-généré)
INSERT INTO bookings (
  user_id, 
  status, 
  pickup_date, 
  pickup_time_slot,
  delivery_date,
  total_amount
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'pending',
  NOW(),
  '18:00-21:00',
  NOW() + INTERVAL '3 days',
  29.99
) RETURNING booking_number;

-- ✅ Devrait retourner : BK-20251010-000001 (ou similaire)

-- Nettoyer le test
DELETE FROM bookings WHERE user_id = '00000000-0000-0000-0000-000000000000';
\`\`\`

### Test 2 : Failed Operations Tables
\`\`\`sql
-- Test INSERT dans failed_account_creations
INSERT INTO failed_account_creations (
  payment_intent_id,
  guest_email,
  guest_name,
  error_message,
  booking_data
) VALUES (
  'pi_test_123',
  'test@example.com',
  'Test User',
  'Test error',
  '{}'::jsonb
) RETURNING id;

-- ✅ Devrait retourner un UUID

-- Test INSERT dans failed_bookings
INSERT INTO failed_bookings (
  payment_intent_id,
  user_id,
  error_message,
  booking_data
) VALUES (
  'pi_test_456',
  '00000000-0000-0000-0000-000000000000',
  'Test error',
  '{}'::jsonb
) RETURNING id;

-- ✅ Devrait retourner un UUID

-- Nettoyer les tests
DELETE FROM failed_account_creations WHERE payment_intent_id = 'pi_test_123';
DELETE FROM failed_bookings WHERE payment_intent_id = 'pi_test_456';
\`\`\`

---

## 🧪 Test End-to-End (Application)

Après avoir appliqué les migrations, tester le flow complet :

### Test Scenario 1 : Nouvelle Réservation Guest
1. Aller sur http://localhost:3000/reservation
2. Remplir formulaire avec **nouvelle email**
3. Compléter paiement Stripe (test card : `4242 4242 4242 4242`)
4. **Vérifier** :
   - ✅ Pas d'erreur 500
   - ✅ User créé dans auth.users
   - ✅ Booking créé avec booking_number format `BK-YYYYMMDD-XXXXXX`
   - ✅ Auto-login fonctionne
   - ✅ Redirect vers success page

### Test Scenario 2 : Email Existante
1. Créer compte via `/auth/signup`
2. Se déconnecter
3. Aller sur `/reservation` (guest mode)
4. Remplir formulaire avec **même email**
5. Compléter paiement
6. **Vérifier** :
   - ✅ Pas de tentative de recréation de compte
   - ✅ Booking créé pour user existant
   - ✅ Auto-login fonctionne

### Test Scenario 3 : Vérifier Logging (Optionnel)
Si vous voulez tester le logging des erreurs (nécessite de provoquer une erreur) :

\`\`\`sql
-- Désactiver temporairement le trigger pour forcer l'erreur
ALTER TABLE bookings DISABLE TRIGGER trg_bookings_booking_number;

-- Tenter réservation (devrait échouer ET logger dans failed_bookings)

-- Vérifier le log
SELECT * FROM failed_bookings ORDER BY created_at DESC LIMIT 1;

-- Réactiver le trigger
ALTER TABLE bookings ENABLE TRIGGER trg_bookings_booking_number;
\`\`\`

---

## 🔍 Monitoring Queries (Admin Dashboard)

### Compter bookings par date
\`\`\`sql
SELECT 
  DATE(created_at) as booking_date,
  COUNT(*) as total_bookings,
  COUNT(DISTINCT user_id) as unique_users
FROM bookings
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY booking_date DESC;
\`\`\`

### Vérifier format booking_number
\`\`\`sql
SELECT 
  booking_number,
  created_at,
  status
FROM bookings
WHERE booking_number NOT LIKE 'BK-%'
ORDER BY created_at DESC;

-- Devrait retourner 0 lignes (tous les booking_number ont le bon format)
\`\`\`

### Logs d'échecs récents
\`\`\`sql
-- Failed account creations
SELECT 
  payment_intent_id,
  guest_email,
  error_message,
  created_at
FROM failed_account_creations
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Failed bookings
SELECT 
  payment_intent_id,
  user_id,
  error_message,
  created_at
FROM failed_bookings
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
\`\`\`

---

## 🚨 Rollback (En Cas de Problème)

### Rollback Migration 1 (Trigger)
\`\`\`sql
DROP TRIGGER IF EXISTS trg_bookings_booking_number ON public.bookings;
DROP FUNCTION IF EXISTS generate_booking_number();
DROP SEQUENCE IF EXISTS booking_number_seq;
\`\`\`

### Rollback Migration 2 (Failed Operations)
\`\`\`sql
DROP TABLE IF EXISTS failed_bookings CASCADE;
DROP TABLE IF EXISTS failed_account_creations CASCADE;
\`\`\`

---

## 📊 Checklist Finale

- [ ] Migration 1 appliquée (trigger booking_number)
- [ ] Migration 2 appliquée (failed_operations tables)
- [ ] Test SQL trigger réussi
- [ ] Test SQL failed_operations réussi
- [ ] Test E2E nouvelle email réussi
- [ ] Test E2E email existante réussi
- [ ] Logs backend propres (pas d'erreur booking_number)
- [ ] Monitoring queries fonctionnent

---

## 📞 Support

Si problème durant l'application :
1. Vérifier les logs Supabase Dashboard (section "Logs")
2. Vérifier que les variables d'environnement sont correctes
3. Redémarrer dev server : `rm -rf .next && pnpm dev`
4. Consulter ce guide : `docs/DATABASE_SCHEMA.md`

---

**Date de création** : 10 octobre 2025  
**Auteur** : GitHub Copilot  
**Statut** : ✅ Prêt à appliquer
