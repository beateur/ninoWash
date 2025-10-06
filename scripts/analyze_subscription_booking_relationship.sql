-- ========================================================
-- Script d'analyse: Relation Abonnements ↔ Réservations
-- Date: 2025-10-05
-- Objectif: Comprendre la réalité de l'implémentation
-- ========================================================

-- ========================================================
-- 1. ANALYSE DES PLANS D'ABONNEMENT ACTUELS
-- ========================================================

\echo '========================================='
\echo '1. PLANS D ABONNEMENT ACTIFS'
\echo '========================================='

SELECT 
  name AS "Plan",
  description AS "Description",
  billing_interval AS "Période",
  price_amount AS "Prix (EUR)",
  features AS "Caractéristiques",
  metadata AS "Métadonnées"
FROM subscription_plans
WHERE is_active = true AND is_public = true
ORDER BY price_amount;

-- ========================================================
-- 2. STRUCTURE DE LA TABLE BOOKINGS
-- ========================================================

\echo ''
\echo '========================================='
\echo '2. COLONNES DE LA TABLE BOOKINGS'
\echo '========================================='

SELECT 
  column_name AS "Colonne",
  data_type AS "Type",
  is_nullable AS "Nullable",
  column_default AS "Défaut"
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================================
-- 3. VÉRIFICATION: Y a-t-il une colonne subscription_id ?
-- ========================================================

\echo ''
\echo '========================================='
\echo '3. LIEN DIRECT BOOKINGS <-> SUBSCRIPTIONS ?'
\echo '========================================='

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'OUI - La table bookings a une colonne subscription_id'
    ELSE 'NON - Aucun lien direct entre bookings et subscriptions'
  END AS "Résultat"
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name = 'subscription_id'
  AND table_schema = 'public';

-- ========================================================
-- 4. FOREIGN KEYS DE LA TABLE BOOKINGS
-- ========================================================

\echo ''
\echo '========================================='
\echo '4. FOREIGN KEYS DE BOOKINGS'
\echo '========================================='

SELECT
  tc.constraint_name AS "Contrainte",
  kcu.column_name AS "Colonne source",
  ccu.table_name AS "Table cible",
  ccu.column_name AS "Colonne cible"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'bookings'
  AND tc.table_schema = 'public';

-- ========================================================
-- 5. ANALYSE DES SERVICES ET LEURS PRIX
-- ========================================================

\echo ''
\echo '========================================='
\echo '5. SERVICES DISPONIBLES ET PRIX'
\echo '========================================='

SELECT 
  name AS "Service",
  type AS "Type",
  base_price AS "Prix de base",
  unit AS "Unité",
  is_active AS "Actif",
  metadata AS "Métadonnées"
FROM services
WHERE is_active = true
ORDER BY type, base_price;

-- ========================================================
-- 6. ABONNEMENTS ACTIFS DES UTILISATEURS
-- ========================================================

\echo ''
\echo '========================================='
\echo '6. ABONNEMENTS ACTIFS (Sample)'
\echo '========================================='

SELECT 
  s.id,
  sp.name AS "Plan",
  s.status AS "Statut",
  s.current_period_start AS "Début période",
  s.current_period_end AS "Fin période",
  s.total_amount AS "Montant",
  s.created_at AS "Créé le"
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status = 'active'
ORDER BY s.created_at DESC
LIMIT 5;

-- ========================================================
-- 7. EXEMPLE DE RÉSERVATIONS RÉCENTES
-- ========================================================

\echo ''
\echo '========================================='
\echo '7. RÉSERVATIONS RÉCENTES (Sample)'
\echo '========================================='

SELECT 
  booking_number AS "Numéro",
  status AS "Statut",
  pickup_date AS "Date collecte",
  total_amount AS "Montant total",
  payment_status AS "Statut paiement",
  created_at AS "Créé le"
FROM bookings
ORDER BY created_at DESC
LIMIT 5;

-- ========================================================
-- 8. ANALYSE: Réservations liées à des abonnements ?
-- ========================================================

\echo ''
\echo '========================================='
\echo '8. RÉSERVATIONS AVEC METADATA subscription_id ?'
\echo '========================================='

SELECT 
  COUNT(*) AS "Total réservations",
  COUNT(CASE WHEN metadata ? 'subscription_id' THEN 1 END) AS "Avec subscription_id dans metadata",
  COUNT(CASE WHEN metadata ? 'is_subscription_booking' THEN 1 END) AS "Avec is_subscription_booking"
FROM bookings;

-- ========================================================
-- 9. TRIGGERS ET FONCTIONS LIÉS AUX ABONNEMENTS
-- ========================================================

\echo ''
\echo '========================================='
\echo '9. TRIGGERS SUR LA TABLE BOOKINGS'
\echo '========================================='

SELECT 
  trigger_name AS "Trigger",
  event_manipulation AS "Événement",
  action_statement AS "Action"
FROM information_schema.triggers
WHERE event_object_table = 'bookings'
  AND event_object_schema = 'public';

-- ========================================================
-- 10. FONCTIONS PostgreSQL LIÉES AUX SUBSCRIPTIONS
-- ========================================================

\echo ''
\echo '========================================='
\echo '10. FONCTIONS LIÉES AUX SUBSCRIPTIONS'
\echo '========================================='

SELECT 
  routine_name AS "Fonction",
  routine_type AS "Type"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%subscription%'
    OR routine_name LIKE '%booking%'
  )
ORDER BY routine_name;

-- ========================================================
-- CONCLUSION
-- ========================================================

\echo ''
\echo '========================================='
\echo 'ANALYSE TERMINÉE'
\echo '========================================='
\echo ''
\echo 'Questions clés à répondre:'
\echo '1. Y a-t-il une colonne subscription_id dans bookings ?'
\echo '2. Les réservations sont-elles liées aux abonnements ?'
\echo '3. Les prix sont-ils différents selon l abonnement ?'
\echo '4. Quelle est la fréquence de réservation autorisée ?'
\echo ''
