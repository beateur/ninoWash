-- Migration: Create logistic slots & tracking tables for Collecte & Livraison
-- Date: 2025-10-13
-- Purpose: Persist remote scheduling slots for pickup/delivery flows and link bookings

-- =============================================================================
-- 0. CREATE HELPER FUNCTION (idempotent)
-- =============================================================================

-- Ensure trigger_set_timestamp() exists for updated_at automation
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Revoke public execution (internal helper only)
REVOKE EXECUTE ON FUNCTION public.trigger_set_timestamp() FROM anon, authenticated;

COMMENT ON FUNCTION public.trigger_set_timestamp() IS 
'Trigger automatique pour mettre à jour la colonne updated_at avant UPDATE.';

-- =============================================================================
-- 1. CREATE TABLE logistic_slots
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.logistic_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('pickup', 'delivery')),
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    label TEXT,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.logistic_slots IS 'Référentiel des créneaux de collecte et livraison configurés manuellement.';
COMMENT ON COLUMN public.logistic_slots.role IS 'pickup ou delivery.';
COMMENT ON COLUMN public.logistic_slots.slot_date IS 'Jour du slot (timezone project-level).';
COMMENT ON COLUMN public.logistic_slots.is_open IS 'False = slot masqué côté front.';

-- Trigger updated_at (idempotent)
DROP TRIGGER IF EXISTS set_timestamp_logistic_slots ON public.logistic_slots;
CREATE TRIGGER set_timestamp_logistic_slots
    BEFORE UPDATE ON public.logistic_slots
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS logistic_slots_role_date_idx
    ON public.logistic_slots (role, slot_date)
    WHERE is_open = TRUE;

CREATE INDEX IF NOT EXISTS logistic_slots_date_idx
    ON public.logistic_slots (slot_date)
    WHERE is_open = TRUE;

-- Enable RLS
ALTER TABLE public.logistic_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to maintain idempotency
DROP POLICY IF EXISTS "logistic_slots_select_public" ON public.logistic_slots;
DROP POLICY IF EXISTS "logistic_slots_all_service_role" ON public.logistic_slots;

-- Policies
CREATE POLICY "logistic_slots_select_public"
    ON public.logistic_slots
    FOR SELECT
    TO anon, authenticated
    USING (is_open = TRUE AND slot_date >= CURRENT_DATE);

CREATE POLICY "logistic_slots_all_service_role"
    ON public.logistic_slots
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

COMMENT ON POLICY "logistic_slots_select_public" ON public.logistic_slots IS
'Permet aux utilisateurs (guest/auth) de lire les slots ouverts à partir d''aujourd''hui.';
COMMENT ON POLICY "logistic_slots_all_service_role" ON public.logistic_slots IS
'Accès complet réservé aux opérations (service_role).';

-- =============================================================================
-- 2. CREATE TABLE slot_requests
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.slot_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES public.logistic_slots(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('pickup', 'delivery')),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    created_by UUID DEFAULT auth.uid(),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.slot_requests IS 'Historique des demandes de réservation de slots (tracking analytique).';
COMMENT ON COLUMN public.slot_requests.created_by IS 'Utilisateur authentifié qui a créé la demande (NULL pour guest).';

CREATE INDEX IF NOT EXISTS slot_requests_slot_id_idx ON public.slot_requests (slot_id);
CREATE INDEX IF NOT EXISTS slot_requests_booking_id_idx ON public.slot_requests (booking_id);
CREATE INDEX IF NOT EXISTS slot_requests_created_by_idx ON public.slot_requests (created_by);

ALTER TABLE public.slot_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slot_requests_insert_authenticated" ON public.slot_requests;
DROP POLICY IF EXISTS "slot_requests_insert_anon" ON public.slot_requests;
DROP POLICY IF EXISTS "slot_requests_select_own" ON public.slot_requests;
DROP POLICY IF EXISTS "slot_requests_select_service_role" ON public.slot_requests;

-- Policy: authenticated users can insert their own slot requests (with validation)
CREATE POLICY "slot_requests_insert_authenticated"
    ON public.slot_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND slot_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.logistic_slots ls
            WHERE ls.id = slot_id
              AND ls.is_open = TRUE
              AND ls.role = slot_requests.role
              AND ls.slot_date >= CURRENT_DATE
        )
    );

-- Policy: anon users can insert slot requests (with validation but no user tracking)
CREATE POLICY "slot_requests_insert_anon"
    ON public.slot_requests
    FOR INSERT
    TO anon
    WITH CHECK (
        created_by IS NULL
        AND slot_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.logistic_slots ls
            WHERE ls.id = slot_id
              AND ls.is_open = TRUE
              AND ls.role = slot_requests.role
              AND ls.slot_date >= CURRENT_DATE
        )
    );

-- Policy: authenticated users can read their own slot requests
CREATE POLICY "slot_requests_select_own"
    ON public.slot_requests
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

-- Policy: service_role has full access
CREATE POLICY "slot_requests_select_service_role"
    ON public.slot_requests
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

COMMENT ON POLICY "slot_requests_insert_authenticated" ON public.slot_requests IS
'Permet aux utilisateurs authentifiés de consigner leurs demandes de slots ouverts et futurs.';
COMMENT ON POLICY "slot_requests_insert_anon" ON public.slot_requests IS
'Permet aux invités de consigner des demandes de slots (sans traçabilité utilisateur).';
COMMENT ON POLICY "slot_requests_select_own" ON public.slot_requests IS
'Permet aux utilisateurs de lire leurs propres demandes de slots.';
COMMENT ON POLICY "slot_requests_select_service_role" ON public.slot_requests IS
'Accès complet pour analyse analytique (service_role).';

-- =============================================================================
-- 3. ALTER TABLE bookings
-- =============================================================================

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS pickup_slot_id UUID REFERENCES public.logistic_slots(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS delivery_slot_id UUID REFERENCES public.logistic_slots(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.bookings.pickup_slot_id IS 'FK vers logistic_slots (collecte). NULL si slot supprimé.';
COMMENT ON COLUMN public.bookings.delivery_slot_id IS 'FK vers logistic_slots (livraison). NULL si slot supprimé.';

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS bookings_pickup_slot_id_idx ON public.bookings (pickup_slot_id);
CREATE INDEX IF NOT EXISTS bookings_delivery_slot_id_idx ON public.bookings (delivery_slot_id);

-- Conserver pickup_date / pickup_time_slot / delivery_date / delivery_time_slot comme fallback (aucune modification).

-- =============================================================================
-- 4. VERIFICATION BLOCS (avec qualification schema)
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'logistic_slots'
    ) THEN
        RAISE EXCEPTION 'Table public.logistic_slots absente.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'slot_requests'
    ) THEN
        RAISE EXCEPTION 'Table public.slot_requests absente.';
    END IF;
    
    RAISE NOTICE 'Tables logistic_slots et slot_requests créées avec succès.';
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'logistic_slots'
          AND policyname = 'logistic_slots_select_public'
    ) THEN
        RAISE EXCEPTION 'Policy logistic_slots_select_public manquante.';
    END IF;
    
    RAISE NOTICE 'Policies RLS logistic_slots appliquées.';
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'public.bookings'::regclass AND attname = 'pickup_slot_id'
    ) THEN
        RAISE EXCEPTION 'Colonne public.bookings.pickup_slot_id manquante.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'public.bookings'::regclass AND attname = 'delivery_slot_id'
    ) THEN
        RAISE EXCEPTION 'Colonne public.bookings.delivery_slot_id manquante.';
    END IF;
    
    RAISE NOTICE 'Colonnes bookings.pickup_slot_id et delivery_slot_id ajoutées.';
END $$;

-- =============================================================================
-- 5. NOTES OPERATIONS
-- =============================================================================
-- • Les slots sont insérés manuellement (via SQL ou outil interne futur).
-- • La suppression logique se fait via is_open=false.
-- • Les dates passées ne sont jamais renvoyées côté API grâce au filtre RLS.
-- • slot_requests trace les demandes avec validation stricte (slot ouvert + futur + rôle cohérent).
-- • ON DELETE SET NULL sur bookings FKs permet de supprimer des slots sans casser les réservations.
-- • created_by dans slot_requests permet traçabilité pour utilisateurs authentifiés.

-- =============================================================================
-- 6. SUCCESS NOTICE
-- =============================================================================
DO $$ BEGIN
    RAISE NOTICE '✅ Migration logistic_slots exécutée avec succès.';
    RAISE NOTICE '📋 Tables créées : logistic_slots, slot_requests';
    RAISE NOTICE '🔗 Colonnes ajoutées : bookings.pickup_slot_id, bookings.delivery_slot_id';
    RAISE NOTICE '🔒 Policies RLS appliquées avec validation stricte';
    RAISE NOTICE '⚙️  Fonction trigger_set_timestamp() créée/mise à jour';
END $$;
