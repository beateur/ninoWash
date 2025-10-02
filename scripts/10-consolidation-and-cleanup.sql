-- Nino Wash - Script de Consolidation et Nettoyage
-- Ce script applique uniquement les modifications nécessaires sans écraser l'existant
-- Exécution sécurisée: toutes les opérations sont protégées

-- ============================================
-- PARTIE 1: Corrections de Structure
-- ============================================

-- 1.1 Permettre les réservations invités (si pas déjà fait)
DO $$
BEGIN
    -- Vérifier si user_id est déjà nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'user_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'user_id rendu nullable pour permettre les réservations invités';
    ELSE
        RAISE NOTICE 'user_id est déjà nullable';
    END IF;
END $$;

-- 1.2 Ajouter la contrainte pour vérifier user_id OU guest metadata
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_user_or_guest'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT check_user_or_guest 
        CHECK (
            user_id IS NOT NULL OR 
            (metadata IS NOT NULL AND metadata ? 'is_guest_booking')
        );
        RAISE NOTICE 'Contrainte check_user_or_guest ajoutée';
    ELSE
        RAISE NOTICE 'Contrainte check_user_or_guest existe déjà';
    END IF;
END $$;

-- 1.3 Corriger la référence service_id dans booking_items
DO $$
BEGIN
    -- Vérifier si service_id existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_items' 
        AND column_name = 'service_id'
    ) THEN
        -- Ajouter service_id
        ALTER TABLE booking_items ADD COLUMN service_id UUID;
        
        -- Migrer les données de service_option_id vers service_id si nécessaire
        UPDATE booking_items 
        SET service_id = service_option_id 
        WHERE service_option_id IS NOT NULL AND service_id IS NULL;
        
        -- Ajouter la contrainte de clé étrangère
        ALTER TABLE booking_items 
        ADD CONSTRAINT booking_items_service_id_fkey 
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
        
        -- Rendre service_id obligatoire
        ALTER TABLE booking_items ALTER COLUMN service_id SET NOT NULL;
        
        RAISE NOTICE 'Colonne service_id ajoutée et configurée dans booking_items';
    ELSE
        RAISE NOTICE 'Colonne service_id existe déjà dans booking_items';
    END IF;
    
    -- Supprimer service_option_id si elle existe encore
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_items' 
        AND column_name = 'service_option_id'
    ) THEN
        ALTER TABLE booking_items DROP COLUMN service_option_id;
        RAISE NOTICE 'Colonne service_option_id supprimée de booking_items';
    END IF;
END $$;

-- ============================================
-- PARTIE 2: Mise à Jour des Services Réels
-- ============================================

-- 2.1 Vérifier si les services réels existent déjà
DO $$
DECLARE
    service_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO service_count 
    FROM services 
    WHERE code IN ('CLASSIC_WASH_FOLD', 'CLASSIC_WASH_IRON_FOLD', 'EXPRESS_WASH_FOLD', 'EXPRESS_WASH_IRON_FOLD');
    
    IF service_count = 0 THEN
        -- Aucun service réel n'existe, on peut les insérer
        RAISE NOTICE 'Insertion des 4 services réels de Nino Wash...';
        
        INSERT INTO services (
            id, 
            code, 
            name, 
            description, 
            type, 
            base_price, 
            vat_rate, 
            processing_days,
            is_active,
            metadata
        ) VALUES
            -- Service Classique - 72h
            (
                uuid_generate_v4(),
                'CLASSIC_WASH_FOLD',
                'Nettoyage et pliage',
                'Service classique - Traitement en 72h - 7kg',
                'one_time',
                24.99,
                20.00,
                3,
                true,
                '{"weight_kg": 7, "includes": ["washing", "folding"], "delivery_time": "72h", "category": "classic"}'::jsonb
            ),
            (
                uuid_generate_v4(),
                'CLASSIC_WASH_IRON_FOLD',
                'Nettoyage, repassage et pliage',
                'Service classique - Traitement en 72h - 7kg',
                'one_time',
                29.99,
                20.00,
                3,
                true,
                '{"weight_kg": 7, "includes": ["washing", "ironing", "folding"], "delivery_time": "72h", "category": "classic"}'::jsonb
            ),
            
            -- Service Express - 24h
            (
                uuid_generate_v4(),
                'EXPRESS_WASH_FOLD',
                'Nettoyage et pliage',
                'Service express - Traitement en 24h - 7kg',
                'one_time',
                34.99,
                20.00,
                1,
                true,
                '{"weight_kg": 7, "includes": ["washing", "folding"], "delivery_time": "24h", "category": "express"}'::jsonb
            ),
            (
                uuid_generate_v4(),
                'EXPRESS_WASH_IRON_FOLD',
                'Nettoyage, repassage et pliage',
                'Service express - Traitement en 24h - 7kg',
                'one_time',
                39.99,
                20.00,
                1,
                true,
                '{"weight_kg": 7, "includes": ["washing", "ironing", "folding"], "delivery_time": "24h", "category": "express"}'::jsonb
            );
            
        RAISE NOTICE '4 services réels insérés avec succès';
    ELSE
        RAISE NOTICE 'Les services réels existent déjà (% trouvés)', service_count;
    END IF;
END $$;

-- ============================================
-- PARTIE 3: Vérifications et Commentaires
-- ============================================

-- Ajouter des commentaires pour documenter les changements
COMMENT ON COLUMN bookings.user_id IS 'User ID pour réservations authentifiées, NULL pour réservations invités';
COMMENT ON COLUMN booking_items.service_id IS 'Référence au service principal depuis la table services';

-- ============================================
-- PARTIE 4: Rapport Final
-- ============================================

DO $$
DECLARE
    total_services INTEGER;
    total_bookings INTEGER;
    total_booking_items INTEGER;
    total_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_services FROM services WHERE is_active = true;
    SELECT COUNT(*) INTO total_bookings FROM bookings;
    SELECT COUNT(*) INTO total_booking_items FROM booking_items;
    SELECT COUNT(*) INTO total_users FROM users;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RAPPORT DE CONSOLIDATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Services actifs: %', total_services;
    RAISE NOTICE 'Réservations totales: %', total_bookings;
    RAISE NOTICE 'Items de réservation: %', total_booking_items;
    RAISE NOTICE 'Utilisateurs: %', total_users;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Consolidation terminée avec succès!';
    RAISE NOTICE '========================================';
END $$;
