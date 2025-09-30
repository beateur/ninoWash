-- ============================================
-- RAPPORT COMPLET DE LA BASE DE DONNÉES
-- ============================================
-- Ce script génère un rapport détaillé de l'état actuel
-- de votre base de données Nino Wash

DO $$
DECLARE
    -- Compteurs généraux
    total_tables INTEGER;
    total_users INTEGER;
    total_services INTEGER;
    total_bookings INTEGER;
    total_booking_items INTEGER;
    total_addresses INTEGER;
    total_drivers INTEGER;
    total_subscriptions INTEGER;
    total_invoices INTEGER;
    total_payments INTEGER;
    
    -- Détails services
    classic_services INTEGER;
    express_services INTEGER;
    active_services INTEGER;
    inactive_services INTEGER;
    
    -- Détails réservations
    guest_bookings INTEGER;
    user_bookings INTEGER;
    pending_bookings INTEGER;
    confirmed_bookings INTEGER;
    completed_bookings INTEGER;
    cancelled_bookings INTEGER;
    
    -- Détails utilisateurs
    active_users INTEGER;
    users_with_bookings INTEGER;
    users_with_subscriptions INTEGER;
    
    -- Vérifications structure
    user_id_nullable BOOLEAN;
    service_id_exists BOOLEAN;
    guest_constraint_exists BOOLEAN;
    
    -- Détails financiers
    total_revenue NUMERIC;
    pending_revenue NUMERIC;
    
BEGIN
    -- ============================================
    -- COLLECTE DES DONNÉES
    -- ============================================
    
    -- Tables
    SELECT COUNT(*) INTO total_tables 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- Utilisateurs
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO active_users FROM users WHERE deleted_at IS NULL;
    SELECT COUNT(DISTINCT user_id) INTO users_with_bookings FROM bookings WHERE user_id IS NOT NULL;
    SELECT COUNT(DISTINCT user_id) INTO users_with_subscriptions FROM subscriptions WHERE user_id IS NOT NULL;
    
    -- Services
    SELECT COUNT(*) INTO total_services FROM services;
    SELECT COUNT(*) INTO active_services FROM services WHERE is_active = true;
    SELECT COUNT(*) INTO inactive_services FROM services WHERE is_active = false;
    SELECT COUNT(*) INTO classic_services FROM services WHERE metadata->>'category' = 'classic';
    SELECT COUNT(*) INTO express_services FROM services WHERE metadata->>'category' = 'express';
    
    -- Réservations
    SELECT COUNT(*) INTO total_bookings FROM bookings;
    SELECT COUNT(*) INTO guest_bookings FROM bookings WHERE user_id IS NULL;
    SELECT COUNT(*) INTO user_bookings FROM bookings WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO pending_bookings FROM bookings WHERE status = 'pending';
    SELECT COUNT(*) INTO confirmed_bookings FROM bookings WHERE status = 'confirmed';
    SELECT COUNT(*) INTO completed_bookings FROM bookings WHERE status = 'completed';
    SELECT COUNT(*) INTO cancelled_bookings FROM bookings WHERE status = 'cancelled';
    
    -- Items de réservation
    SELECT COUNT(*) INTO total_booking_items FROM booking_items;
    
    -- Autres données
    SELECT COUNT(*) INTO total_addresses FROM user_addresses;
    SELECT COUNT(*) INTO total_drivers FROM delivery_drivers;
    SELECT COUNT(*) INTO total_subscriptions FROM subscriptions;
    SELECT COUNT(*) INTO total_invoices FROM invoices;
    SELECT COUNT(*) INTO total_payments FROM payment_transactions;
    
    -- Vérifications structure
    SELECT is_nullable = 'YES' INTO user_id_nullable
    FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'user_id';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_items' AND column_name = 'service_id'
    ) INTO service_id_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_user_or_guest'
    ) INTO guest_constraint_exists;
    
    -- Calculs financiers
    SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue
    FROM bookings WHERE status = 'completed';
    
    SELECT COALESCE(SUM(total_amount), 0) INTO pending_revenue
    FROM bookings WHERE status IN ('pending', 'confirmed');
    
    -- ============================================
    -- AFFICHAGE DU RAPPORT
    -- ============================================
    
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║         RAPPORT COMPLET - BASE DE DONNÉES NINO WASH       ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    
    -- STRUCTURE
    RAISE NOTICE '📊 STRUCTURE DE LA BASE DE DONNÉES';
    RAISE NOTICE '   ├─ Tables totales: %', total_tables;
    RAISE NOTICE '   ├─ user_id nullable (réservations invités): %', CASE WHEN user_id_nullable THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE '   ├─ service_id existe (booking_items): %', CASE WHEN service_id_exists THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE '   └─ Contrainte invités (check_user_or_guest): %', CASE WHEN guest_constraint_exists THEN '✅ OUI' ELSE '❌ NON' END;
    RAISE NOTICE '';
    
    -- UTILISATEURS
    RAISE NOTICE '👥 UTILISATEURS';
    RAISE NOTICE '   ├─ Total: %', total_users;
    RAISE NOTICE '   ├─ Actifs: %', active_users;
    RAISE NOTICE '   ├─ Avec réservations: %', users_with_bookings;
    RAISE NOTICE '   └─ Avec abonnements: %', users_with_subscriptions;
    RAISE NOTICE '';
    
    -- SERVICES
    RAISE NOTICE '🧺 SERVICES';
    RAISE NOTICE '   ├─ Total: %', total_services;
    RAISE NOTICE '   ├─ Actifs: %', active_services;
    RAISE NOTICE '   ├─ Inactifs: %', inactive_services;
    RAISE NOTICE '   ├─ Services Classiques (72h): %', classic_services;
    RAISE NOTICE '   └─ Services Express (24h): %', express_services;
    RAISE NOTICE '';
    
    -- RÉSERVATIONS
    RAISE NOTICE '📅 RÉSERVATIONS';
    RAISE NOTICE '   ├─ Total: %', total_bookings;
    RAISE NOTICE '   ├─ Réservations invités: %', guest_bookings;
    RAISE NOTICE '   ├─ Réservations utilisateurs: %', user_bookings;
    RAISE NOTICE '   ├─ En attente: %', pending_bookings;
    RAISE NOTICE '   ├─ Confirmées: %', confirmed_bookings;
    RAISE NOTICE '   ├─ Complétées: %', completed_bookings;
    RAISE NOTICE '   ├─ Annulées: %', cancelled_bookings;
    RAISE NOTICE '   └─ Items de réservation: %', total_booking_items;
    RAISE NOTICE '';
    
    -- DONNÉES COMPLÉMENTAIRES
    RAISE NOTICE '📦 DONNÉES COMPLÉMENTAIRES';
    RAISE NOTICE '   ├─ Adresses: %', total_addresses;
    RAISE NOTICE '   ├─ Livreurs: %', total_drivers;
    RAISE NOTICE '   ├─ Abonnements: %', total_subscriptions;
    RAISE NOTICE '   ├─ Factures: %', total_invoices;
    RAISE NOTICE '   └─ Transactions: %', total_payments;
    RAISE NOTICE '';
    
    -- FINANCIER
    RAISE NOTICE '💰 APERÇU FINANCIER';
    RAISE NOTICE '   ├─ Revenu total (complété): %€', total_revenue;
    RAISE NOTICE '   └─ Revenu en attente: %€', pending_revenue;
    RAISE NOTICE '';
    
    -- RÉSUMÉ
    RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║                         RÉSUMÉ                             ║';
    RAISE NOTICE '╠════════════════════════════════════════════════════════════╣';
    
    IF user_id_nullable AND service_id_exists THEN
        RAISE NOTICE '║  ✅ Structure de base: CONFORME                            ║';
    ELSE
        RAISE NOTICE '║  ⚠️  Structure de base: NÉCESSITE CORRECTIONS              ║';
    END IF;
    
    IF total_services >= 4 THEN
        RAISE NOTICE '║  ✅ Services: CONFIGURÉS (% services actifs)              ║', active_services;
    ELSE
        RAISE NOTICE '║  ⚠️  Services: INCOMPLETS (seulement % services)          ║', total_services;
    END IF;
    
    IF total_bookings > 0 THEN
        RAISE NOTICE '║  ✅ Réservations: OPÉRATIONNELLES (% réservations)        ║', total_bookings;
    ELSE
        RAISE NOTICE '║  ℹ️  Réservations: AUCUNE DONNÉE                          ║';
    END IF;
    
    RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '✨ Rapport généré avec succès!';
    RAISE NOTICE '';
    
END $$;

-- ============================================
-- DÉTAILS DES SERVICES (si existants)
-- ============================================

DO $$
DECLARE
    service_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 DÉTAIL DES SERVICES ACTIFS:';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    
    FOR service_record IN 
        SELECT 
            code,
            name,
            base_price,
            processing_days,
            metadata->>'category' as category,
            metadata->>'delivery_time' as delivery_time
        FROM services 
        WHERE is_active = true
        ORDER BY base_price
    LOOP
        RAISE NOTICE '   • % (%)', service_record.name, service_record.code;
        RAISE NOTICE '     ├─ Prix: %€', service_record.base_price;
        RAISE NOTICE '     ├─ Catégorie: %', COALESCE(service_record.category, 'N/A');
        RAISE NOTICE '     ├─ Délai: %', COALESCE(service_record.delivery_time, service_record.processing_days || ' jours');
        RAISE NOTICE '     └─────────────────────────────────────────────';
    END LOOP;
    
    RAISE NOTICE '';
END $$;
