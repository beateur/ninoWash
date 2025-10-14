# Guide d'Application de la Migration - Booking Cancellation

Ce guide explique comment appliquer la migration SQL pour activer les fonctionnalités d'annulation, modification et signalement de problèmes.

## 📋 Pré-requis

- Accès à Supabase Studio ou au CLI Supabase
- Droits d'administration sur le projet Supabase
- Backup de la base de données (recommandé)

## 🚀 Étapes d'Application

### Option 1: Via Supabase Studio (Recommandé pour production)

1. **Se connecter à Supabase Studio**
   - Ouvrir https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Ouvrir SQL Editor**
   - Menu de gauche → SQL Editor
   - Cliquer sur "New query"

3. **Copier-coller la migration**
   - Copier tout le contenu de `supabase/migrations/20251004_booking_cancellation_and_reports.sql`
   - Coller dans l'éditeur SQL

4. **Exécuter la migration**
   - Cliquer sur "Run"
   - Vérifier qu'il n'y a pas d'erreurs

5. **Vérifier les changements**
   \`\`\`sql
   -- Vérifier les nouvelles colonnes
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'bookings' 
   AND column_name IN ('cancellation_reason', 'cancelled_at', 'cancelled_by');

   -- Vérifier les nouvelles tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('booking_modifications', 'booking_reports');

   -- Vérifier les policies RLS
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN ('booking_modifications', 'booking_reports');
   \`\`\`

### Option 2: Via Supabase CLI (Recommandé pour développement local)

1. **Installer Supabase CLI** (si pas déjà fait)
   \`\`\`bash
   brew install supabase/tap/supabase
   \`\`\`

2. **Se connecter à votre projet**
   \`\`\`bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   \`\`\`

3. **Appliquer la migration**
   \`\`\`bash
   cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
   supabase db push
   \`\`\`

4. **Vérifier le statut**
   \`\`\`bash
   supabase db status
   \`\`\`

### Option 3: Via Script psql (Pour experts)

\`\`\`bash
psql "postgresql://postgres:[YOUR_PASSWORD]@[YOUR_PROJECT_REF].supabase.co:5432/postgres" \
  -f supabase/migrations/20251004_booking_cancellation_and_reports.sql
\`\`\`

## ✅ Tests de Validation

Après l'application de la migration, exécutez ces requêtes pour valider :

### 1. Test des colonnes de cancellation
\`\`\`sql
-- Doit retourner 3 lignes
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('cancellation_reason', 'cancelled_at', 'cancelled_by');
\`\`\`

### 2. Test de la table booking_modifications
\`\`\`sql
-- Doit retourner la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'booking_modifications'
ORDER BY ordinal_position;
\`\`\`

### 3. Test de la table booking_reports
\`\`\`sql
-- Doit retourner la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'booking_reports'
ORDER BY ordinal_position;
\`\`\`

### 4. Test des indexes
\`\`\`sql
-- Doit retourner 6 indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('bookings', 'booking_modifications', 'booking_reports')
AND indexname LIKE 'idx_%';
\`\`\`

### 5. Test des RLS policies
\`\`\`sql
-- Doit retourner au moins 7 policies
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('booking_modifications', 'booking_reports')
ORDER BY tablename, policyname;
\`\`\`

## 🔄 Rollback (en cas de problème)

Si vous devez annuler les changements :

\`\`\`sql
-- 1. Drop triggers
DROP TRIGGER IF EXISTS booking_reports_updated_at ON booking_reports;

-- 2. Drop tables
DROP TABLE IF EXISTS booking_reports CASCADE;
DROP TABLE IF EXISTS booking_modifications CASCADE;

-- 3. Remove columns from bookings
ALTER TABLE bookings 
  DROP COLUMN IF EXISTS cancellation_reason,
  DROP COLUMN IF EXISTS cancelled_at,
  DROP COLUMN IF EXISTS cancelled_by;

-- 4. Drop function
DROP FUNCTION IF EXISTS update_booking_reports_updated_at();
\`\`\`

## 🎯 Tests Fonctionnels

Après la migration, testez les fonctionnalités :

### 1. Test d'annulation
\`\`\`bash
curl -X POST http://localhost:3000/api/bookings/[BOOKING_ID]/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test cancellation reason with at least 10 characters"}' \
  -H "Cookie: [YOUR_SESSION_COOKIE]"
\`\`\`

### 2. Test de signalement
\`\`\`bash
curl -X POST http://localhost:3000/api/bookings/[BOOKING_ID]/report \
  -H "Content-Type: application/json" \
  -d '{
    "type": "quality_issue",
    "description": "Test report with at least twenty characters to pass validation"
  }' \
  -H "Cookie: [YOUR_SESSION_COOKIE]"
\`\`\`

### 3. Test de modification
\`\`\`bash
curl -X PUT http://localhost:3000/api/bookings/[BOOKING_ID] \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddressId": "[ADDRESS_UUID]",
    "pickupDate": "2025-10-15T10:00:00Z",
    "pickupTimeSlot": "09:00-12:00"
  }' \
  -H "Cookie: [YOUR_SESSION_COOKIE]"
\`\`\`

## 📊 Monitoring Post-Migration

Surveillez ces métriques après le déploiement :

1. **Taux d'erreur API** (doit rester < 1%)
   - `/api/bookings/[id]/cancel`
   - `/api/bookings/[id]/report`
   - `/api/bookings/[id]` (PUT)

2. **Performance des requêtes** (doit rester < 200ms)
   \`\`\`sql
   -- Vérifier que les indexes sont utilisés
   EXPLAIN ANALYZE 
   SELECT * FROM bookings WHERE cancelled_at IS NOT NULL;
   \`\`\`

3. **Volume de cancellations** (alerte si > 10% des bookings)
   \`\`\`sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
     COUNT(*) as total,
     ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'cancelled') / COUNT(*), 2) as cancel_rate
   FROM bookings
   WHERE created_at > NOW() - INTERVAL '7 days';
   \`\`\`

## 🆘 Troubleshooting

### Erreur: "column already exists"
- La migration a peut-être été partiellement appliquée
- Vérifier l'état actuel : `\d bookings` dans psql
- Appliquer uniquement les parties manquantes

### Erreur: "permission denied"
- Vérifier que vous avez les droits d'administration
- Se connecter avec le user `postgres`

### Erreur: "relation does not exist"
- Vérifier que vous êtes sur le bon schéma (public)
- Lister les schemas : `\dn`

## 📝 Changelog

- **2025-10-04**: Migration initiale créée
  - Ajout colonnes cancellation sur bookings
  - Création table booking_modifications
  - Création table booking_reports
  - Mise en place RLS policies
  - Ajout indexes pour performance

## 🔗 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [PRD Booking Cancellation](../PRD/PRD_BOOKING_CANCELLATION.md)
- [Architecture Database](../DATABASE_SCHEMA.md)
