-- ============================================
-- RAPPORT COMPLET DE LA BASE DE DONNÉES
-- ============================================
-- Ce script génère un rapport détaillé de l'état actuel
-- de votre base de données Nino Wash
-- Version: Affichage avec SELECT pour garantir la visibilité

-- ============================================
-- PARTIE 1: STATISTIQUES GÉNÉRALES
-- ============================================

SELECT 
    '📊 STRUCTURE DE LA BASE DE DONNÉES' as section,
    '' as details;

SELECT 
    'Tables totales' as metric,
    COUNT(*)::text as valeur
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT 
    'user_id nullable (invités)' as metric,
    CASE WHEN is_nullable = 'YES' THEN '✅ OUI' ELSE '❌ NON' END as valeur
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'user_id';

SELECT 
    'service_id existe (booking_items)' as metric,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_items' AND column_name = 'service_id'
    ) THEN '✅ OUI' ELSE '❌ NON' END as valeur;

-- ============================================
-- PARTIE 2: UTILISATEURS
-- ============================================

SELECT 
    '👥 UTILISATEURS' as section,
    '' as details;

SELECT 
    'Total utilisateurs' as metric,
    COUNT(*)::text as valeur
FROM users;

SELECT 
    'Utilisateurs actifs' as metric,
    COUNT(*)::text as valeur
FROM users 
WHERE deleted_at IS NULL;

SELECT 
    'Utilisateurs avec réservations' as metric,
    COUNT(DISTINCT user_id)::text as valeur
FROM bookings 
WHERE user_id IS NOT NULL;

SELECT 
    'Utilisateurs avec abonnements' as metric,
    COUNT(DISTINCT user_id)::text as valeur
FROM subscriptions 
WHERE user_id IS NOT NULL;

-- ============================================
-- PARTIE 3: SERVICES
-- ============================================

SELECT 
    '🧺 SERVICES' as section,
    '' as details;

SELECT 
    'Total services' as metric,
    COUNT(*)::text as valeur
FROM services;

SELECT 
    'Services actifs' as metric,
    COUNT(*)::text as valeur
FROM services 
WHERE is_active = true;

SELECT 
    'Services inactifs' as metric,
    COUNT(*)::text as valeur
FROM services 
WHERE is_active = false;

SELECT 
    'Services Classiques (72h)' as metric,
    COUNT(*)::text as valeur
FROM services 
WHERE metadata->>'category' = 'classic';

SELECT 
    'Services Express (24h)' as metric,
    COUNT(*)::text as valeur
FROM services 
WHERE metadata->>'category' = 'express';

-- ============================================
-- PARTIE 4: DÉTAIL DES SERVICES ACTIFS
-- ============================================

SELECT 
    '📋 DÉTAIL DES SERVICES ACTIFS' as section,
    '' as details;

SELECT 
    name as "Service",
    code as "Code",
    base_price::text || '€' as "Prix",
    COALESCE(metadata->>'category', 'N/A') as "Catégorie",
    COALESCE(metadata->>'delivery_time', processing_days::text || ' jours') as "Délai"
FROM services 
WHERE is_active = true
ORDER BY base_price;

-- ============================================
-- PARTIE 5: RÉSERVATIONS
-- ============================================

SELECT 
    '📅 RÉSERVATIONS' as section,
    '' as details;

SELECT 
    'Total réservations' as metric,
    COUNT(*)::text as valeur
FROM bookings;

SELECT 
    'Réservations invités' as metric,
    COUNT(*)::text as valeur
FROM bookings 
WHERE user_id IS NULL;

SELECT 
    'Réservations utilisateurs' as metric,
    COUNT(*)::text as valeur
FROM bookings 
WHERE user_id IS NOT NULL;

SELECT 
    'En attente' as metric,
    COUNT(*)::text as valeur
FROM bookings 
WHERE status = 'pending';

SELECT 
    'Confirmées' as metric,
    COUNT(*)::text as valeur
FROM bookings 
WHERE status = 'confirmed';

SELECT 
    'Complétées' as metric,
    COUNT(*)::text as valeur
FROM bookings 
WHERE status = 'completed';

SELECT 
    'Annulées' as metric,
    COUNT(*)::text as valeur
FROM bookings 
WHERE status = 'cancelled';

SELECT 
    'Items de réservation' as metric,
    COUNT(*)::text as valeur
FROM booking_items;

-- ============================================
-- PARTIE 6: DONNÉES COMPLÉMENTAIRES
-- ============================================

SELECT 
    '📦 DONNÉES COMPLÉMENTAIRES' as section,
    '' as details;

SELECT 
    'Adresses' as metric,
    COUNT(*)::text as valeur
FROM user_addresses;

SELECT 
    'Livreurs' as metric,
    COUNT(*)::text as valeur
FROM delivery_drivers;

SELECT 
    'Abonnements' as metric,
    COUNT(*)::text as valeur
FROM subscriptions;

SELECT 
    'Factures' as metric,
    COUNT(*)::text as valeur
FROM invoices;

SELECT 
    'Transactions paiement' as metric,
    COUNT(*)::text as valeur
FROM payment_transactions;

-- ============================================
-- PARTIE 7: APERÇU FINANCIER
-- ============================================

SELECT 
    '💰 APERÇU FINANCIER' as section,
    '' as details;

SELECT 
    'Revenu total (complété)' as metric,
    COALESCE(SUM(total_amount), 0)::text || '€' as valeur
FROM bookings 
WHERE status = 'completed';

SELECT 
    'Revenu en attente' as metric,
    COALESCE(SUM(total_amount), 0)::text || '€' as valeur
FROM bookings 
WHERE status IN ('pending', 'confirmed');

-- ============================================
-- PARTIE 8: RÉSUMÉ FINAL
-- ============================================

SELECT 
    '✨ RÉSUMÉ FINAL' as section,
    '' as details;

SELECT 
    'Structure de base' as aspect,
    CASE 
        WHEN (SELECT is_nullable FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'user_id') = 'YES'
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'booking_items' AND column_name = 'service_id')
        THEN '✅ CONFORME'
        ELSE '⚠️ NÉCESSITE CORRECTIONS'
    END as statut;

SELECT 
    'Services configurés' as aspect,
    CASE 
        WHEN (SELECT COUNT(*) FROM services WHERE is_active = true) >= 4 
        THEN '✅ CONFIGURÉS (' || (SELECT COUNT(*) FROM services WHERE is_active = true)::text || ' actifs)'
        ELSE '⚠️ INCOMPLETS (' || (SELECT COUNT(*) FROM services)::text || ' services)'
    END as statut;

SELECT 
    'Réservations' as aspect,
    CASE 
        WHEN (SELECT COUNT(*) FROM bookings) > 0 
        THEN '✅ OPÉRATIONNELLES (' || (SELECT COUNT(*) FROM bookings)::text || ' réservations)'
        ELSE 'ℹ️ AUCUNE DONNÉE'
    END as statut;

SELECT 
    '✅ Rapport généré avec succès!' as message,
    NOW()::text as timestamp;
