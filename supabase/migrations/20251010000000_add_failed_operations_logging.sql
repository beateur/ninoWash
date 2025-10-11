-- Migration: Add Failed Operations Logging Tables
-- Description: Tables pour logger les échecs de création de compte et de réservation
-- Date: 2025-10-10
-- Purpose: Tracking des paiements Stripe réussis avec échec de création de compte/réservation

-- =====================================================
-- DROP existing tables if any (cleanup from previous versions)
-- =====================================================
DROP TABLE IF EXISTS failed_bookings CASCADE;
DROP TABLE IF EXISTS failed_account_creations CASCADE;

-- =====================================================
-- Table: failed_account_creations
-- Purpose: Logger les créations de compte qui échouent après paiement Stripe
-- =====================================================
CREATE TABLE failed_account_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe Payment Intent ID (référence unique)
  payment_intent_id TEXT NOT NULL,
  
  -- Informations utilisateur (guest booking)
  guest_email TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  
  -- Détails de l'erreur Supabase Auth
  error_message TEXT NOT NULL,
  error_code TEXT,
  
  -- Données complètes de la réservation (pour récupération manuelle)
  booking_data JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par payment_intent_id
CREATE INDEX idx_failed_account_creations_payment_intent 
  ON failed_account_creations(payment_intent_id);

-- Index pour recherche par email (support client)
CREATE INDEX idx_failed_account_creations_email 
  ON failed_account_creations(guest_email);

-- Index pour logs récents (admin dashboard)
CREATE INDEX idx_failed_account_creations_recent 
  ON failed_account_creations(created_at DESC);

-- =====================================================
-- Table: failed_bookings
-- Purpose: Logger les créations de réservation qui échouent après création de compte
-- =====================================================
CREATE TABLE failed_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe Payment Intent ID (référence unique)
  payment_intent_id TEXT NOT NULL,
  
  -- User ID (compte créé avec succès)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Détails de l'erreur Supabase Database
  error_message TEXT NOT NULL,
  error_code TEXT,
  
  -- Données complètes de la réservation (pour récupération manuelle)
  booking_data JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par payment_intent_id
CREATE INDEX idx_failed_bookings_payment_intent 
  ON failed_bookings(payment_intent_id);

-- Index pour recherche par user_id
CREATE INDEX idx_failed_bookings_user_id 
  ON failed_bookings(user_id);

-- Index pour logs récents (admin dashboard)
CREATE INDEX idx_failed_bookings_recent 
  ON failed_bookings(created_at DESC);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE failed_account_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Admin-only access (lecture + écriture)
-- Vérifie si l'utilisateur a le role 'admin' dans user_metadata OU app_metadata
CREATE POLICY admin_full_access_failed_account_creations ON failed_account_creations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        (auth.users.raw_user_meta_data->>'role')::text = 'admin'
        OR (auth.users.raw_app_meta_data->>'role')::text = 'admin'
      )
    )
  );

CREATE POLICY admin_full_access_failed_bookings ON failed_bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        (auth.users.raw_user_meta_data->>'role')::text = 'admin'
        OR (auth.users.raw_app_meta_data->>'role')::text = 'admin'
      )
    )
  );

-- Policy: Service role bypass (pour API backend)
-- Permet à l'API backend (avec service_role key) d'insérer des logs
CREATE POLICY service_role_insert_failed_account_creations ON failed_account_creations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY service_role_insert_failed_bookings ON failed_bookings
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Comments (documentation)
-- =====================================================
COMMENT ON TABLE failed_account_creations IS 'Logs des paiements Stripe réussis avec échec de création de compte Supabase (après 3 retries)';
COMMENT ON TABLE failed_bookings IS 'Logs des paiements Stripe + comptes créés avec échec de création de réservation (après 3 retries)';

COMMENT ON COLUMN failed_account_creations.payment_intent_id IS 'Stripe Payment Intent ID - référence unique pour le support client';
COMMENT ON COLUMN failed_account_creations.booking_data IS 'Contient: services, addresses, dates - pour récupération manuelle';

COMMENT ON COLUMN failed_bookings.payment_intent_id IS 'Stripe Payment Intent ID - référence unique pour le support client';
COMMENT ON COLUMN failed_bookings.user_id IS 'User créé avec succès - peut être utilisé pour créer manuellement la réservation';
COMMENT ON COLUMN failed_bookings.booking_data IS 'Contient: services, addresses, dates - pour récupération manuelle';

-- =====================================================
-- Migration complete
-- =====================================================
-- Tables créées:
-- - failed_account_creations (avec RLS admin-only + service_role insert)
-- - failed_bookings (avec RLS admin-only + service_role insert)
--
-- Utilisation:
-- 1. API backend (avec service_role key) peut INSERT dans ces tables
-- 2. Admin dashboard peut SELECT pour monitoring
-- 3. Support client peut récupérer manuellement les réservations perdues
