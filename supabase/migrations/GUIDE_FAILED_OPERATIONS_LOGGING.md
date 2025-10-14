# Guide d'Application de la Migration : Failed Operations Logging

## Fichier de Migration
`20251010000000_add_failed_operations_logging.sql`

## Objectif
Créer les tables `failed_account_creations` et `failed_bookings` pour logger les échecs lors du processus de guest booking (paiement Stripe réussi mais création de compte ou réservation échoue).

## Tables Créées

### 1. `failed_account_creations`
Logs des paiements Stripe réussis avec échec de création de compte Supabase.

**Colonnes** :
- `id` (UUID, PK)
- `payment_intent_id` (TEXT) - Stripe Payment Intent ID
- `guest_email` (TEXT) - Email du guest
- `guest_name` (TEXT) - Nom complet du guest
- `guest_phone` (TEXT, nullable)
- `error_message` (TEXT) - Message d'erreur Supabase Auth
- `error_code` (TEXT, nullable) - Code d'erreur technique
- `booking_data` (JSONB) - Données complètes de la réservation (services, addresses, dates)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Index** :
- `idx_failed_account_creations_payment_intent` sur `payment_intent_id`
- `idx_failed_account_creations_email` sur `guest_email`
- `idx_failed_account_creations_recent` sur `created_at DESC`

**RLS Policies** :
- `admin_full_access_failed_account_creations` : Admin-only (lecture + écriture)
- `service_role_insert_failed_account_creations` : Service role peut INSERT (API backend)

### 2. `failed_bookings`
Logs des comptes créés avec succès mais création de réservation échouée.

**Colonnes** :
- `id` (UUID, PK)
- `payment_intent_id` (TEXT) - Stripe Payment Intent ID
- `user_id` (UUID, FK) - Référence vers auth.users (compte créé avec succès)
- `error_message` (TEXT) - Message d'erreur Supabase Database
- `error_code` (TEXT, nullable)
- `booking_data` (JSONB) - Données complètes de la réservation
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Index** :
- `idx_failed_bookings_payment_intent` sur `payment_intent_id`
- `idx_failed_bookings_user_id` sur `user_id`
- `idx_failed_bookings_recent` sur `created_at DESC`

**RLS Policies** :
- `admin_full_access_failed_bookings` : Admin-only (lecture + écriture)
- `service_role_insert_failed_bookings` : Service role peut INSERT (API backend)

## Méthodes d'Application

### Méthode 1 : Supabase Dashboard (Recommandée)

1. **Ouvrir Supabase Dashboard** :
   \`\`\`
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   \`\`\`

2. **Naviguer vers SQL Editor** :
   - Cliquer sur "SQL Editor" dans la sidebar

3. **Nouvelle requête** :
   - Cliquer sur "New query"

4. **Copier-Coller le SQL** :
   - Ouvrir le fichier `20251010000000_add_failed_operations_logging.sql`
   - Copier tout le contenu
   - Coller dans l'éditeur SQL

5. **Exécuter** :
   - Cliquer sur "Run" (ou Cmd+Enter)
   - Attendre le message de confirmation

6. **Vérifier** :
   \`\`\`sql
   -- Vérifier que les tables existent
   SELECT table_name, table_type 
   FROM information_schema.tables 
   WHERE table_name IN ('failed_account_creations', 'failed_bookings');
   
   -- Vérifier les colonnes de failed_account_creations
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'failed_account_creations';
   
   -- Vérifier les colonnes de failed_bookings
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'failed_bookings';
   
   -- Vérifier les RLS policies
   SELECT tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE tablename IN ('failed_account_creations', 'failed_bookings');
   \`\`\`

### Méthode 2 : Supabase CLI

1. **Vérifier que Supabase CLI est installé** :
   \`\`\`bash
   supabase --version
   \`\`\`

2. **Installer si nécessaire** :
   \`\`\`bash
   brew install supabase/tap/supabase
   # OU
   npm install -g supabase
   \`\`\`

3. **Se connecter** :
   \`\`\`bash
   supabase login
   \`\`\`

4. **Lier le projet** :
   \`\`\`bash
   cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
   supabase link --project-ref YOUR_PROJECT_REF
   \`\`\`

5. **Appliquer la migration** :
   \`\`\`bash
   supabase db push
   \`\`\`

### Méthode 3 : Script apply-migration.sh

1. **Naviguer vers le dossier migrations** :
   \`\`\`bash
   cd supabase/migrations
   \`\`\`

2. **Rendre le script exécutable** (si nécessaire) :
   \`\`\`bash
   chmod +x apply-migration.sh
   \`\`\`

3. **Exécuter le script** :
   \`\`\`bash
   ./apply-migration.sh
   \`\`\`

## Vérification Post-Migration

### 1. Vérifier les tables

\`\`\`sql
-- Lister les tables
\dt

-- Description de failed_account_creations
\d failed_account_creations

-- Description de failed_bookings
\d failed_bookings
\`\`\`

### 2. Tester l'insertion (Service Role)

\`\`\`sql
-- Test insert dans failed_account_creations
INSERT INTO failed_account_creations (
  payment_intent_id,
  guest_email,
  guest_name,
  guest_phone,
  error_message,
  error_code,
  booking_data
) VALUES (
  'pi_test_123456',
  'test@example.com',
  'Test User',
  '0612345678',
  'Test error message',
  'auth_error',
  '{"services": [], "pickup_date": "2025-10-10"}'::jsonb
);

-- Vérifier
SELECT * FROM failed_account_creations WHERE payment_intent_id = 'pi_test_123456';

-- Nettoyer
DELETE FROM failed_account_creations WHERE payment_intent_id = 'pi_test_123456';
\`\`\`

### 3. Tester les RLS Policies

\`\`\`sql
-- En tant qu'admin (via Dashboard), devrait fonctionner
SELECT * FROM failed_account_creations LIMIT 5;

-- Via service_role (API backend), INSERT devrait fonctionner
-- Via anon/authenticated role sans admin, devrait échouer (policy violation)
\`\`\`

## Utilisation dans le Code

Les fonctions `logFailedAccountCreation()` et `logFailedBooking()` dans `app/api/bookings/guest/route.ts` utiliseront automatiquement ces tables :

\`\`\`typescript
// Exemple d'utilisation (déjà implémenté)
await logFailedAccountCreation(supabase, {
  paymentIntentId,
  guestEmail,
  guestName,
  guestPhone,
  error: error as Error,
  bookingData: {
    services,
    pickupAddress,
    deliveryAddress,
    pickupDate,
    pickupTimeSlot,
  },
})
\`\`\`

## Monitoring

### Requêtes utiles pour l'admin dashboard

\`\`\`sql
-- Compter les échecs récents (dernières 24h)
SELECT 
  COUNT(*) as total_failures,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as last_24h
FROM failed_account_creations;

-- Top 5 erreurs les plus fréquentes
SELECT 
  error_code,
  COUNT(*) as occurrences,
  MAX(created_at) as last_occurrence
FROM failed_account_creations
GROUP BY error_code
ORDER BY occurrences DESC
LIMIT 5;

-- Logs non résolus
SELECT 
  payment_intent_id,
  guest_email,
  error_message,
  created_at
FROM failed_account_creations
ORDER BY created_at DESC
LIMIT 20;
\`\`\`

## Récupération Manuelle

Pour récupérer une réservation perdue :

1. **Identifier le log** :
   \`\`\`sql
   SELECT * FROM failed_account_creations 
   WHERE payment_intent_id = 'pi_xxx';
   \`\`\`

2. **Récupérer les données** :
   \`\`\`sql
   SELECT booking_data FROM failed_account_creations 
   WHERE id = 'uuid';
   \`\`\`

3. **Créer manuellement le compte et la réservation** via admin dashboard

## Rollback

Si besoin de supprimer les tables :

\`\`\`sql
DROP TABLE IF EXISTS failed_bookings CASCADE;
DROP TABLE IF EXISTS failed_account_creations CASCADE;
\`\`\`

## Notes Importantes

- ✅ Les tables sont protégées par RLS (admin-only)
- ✅ Service role peut INSERT (pour l'API backend)
- ✅ Les données sensibles (email, phone) sont stockées - conformité RGPD à vérifier
- ✅ Les index permettent des recherches rapides
- ⚠️ Pas de système de cleanup automatique - à implémenter plus tard

## Support

En cas de problème lors de l'application :
1. Vérifier les logs Supabase Dashboard
2. Vérifier que la connexion au projet est active
3. Vérifier les permissions (service_role key valide)
4. Consulter la documentation Supabase : https://supabase.com/docs

---

**Date de création** : 10 octobre 2025  
**Auteur** : GitHub Copilot  
**Statut** : ✅ Prêt à appliquer
