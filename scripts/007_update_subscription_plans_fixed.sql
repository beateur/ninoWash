-- Script de mise à jour des plans d'abonnement
-- Version corrigée sans ON CONFLICT
-- Date: 2025-01-XX

-- Étape 1: Désactiver tous les plans existants (soft delete)
UPDATE subscription_plans
SET 
  is_active = false,
  is_public = false,
  updated_at = NOW()
WHERE is_active = true;

-- Étape 2: Insérer les nouveaux plans d'abonnement alignés avec la page services

-- Plan Mensuel - 99.99 EUR
INSERT INTO subscription_plans (
  name,
  description,
  price_amount,
  currency,
  billing_interval,
  features,
  is_active,
  is_public,
  plan_type,
  trial_days,
  sort_order,
  metadata,
  created_at,
  updated_at
) VALUES (
  'Abonnement Mensuel',
  'Profitez de nos services de pressing premium avec un abonnement mensuel flexible. Idéal pour un usage régulier.',
  99.99,
  'EUR',
  'monthly',
  jsonb_build_array(
    'Collecte et livraison à domicile',
    'Nettoyage professionnel de vêtements',
    'Repassage inclus',
    'Traitement des taches',
    'Emballage soigné',
    'Support client prioritaire',
    'Annulation flexible'
  ),
  true,
  true,
  'standard',
  0,
  1,
  jsonb_build_object(
    'recommended', false,
    'popular', false,
    'service_type', 'subscription',
    'billing_cycle', 'monthly'
  ),
  NOW(),
  NOW()
);

-- Plan Trimestriel - 249.99 EUR (tous les 3 mois)
INSERT INTO subscription_plans (
  name,
  description,
  price_amount,
  currency,
  billing_interval,
  features,
  is_active,
  is_public,
  plan_type,
  trial_days,
  sort_order,
  metadata,
  created_at,
  updated_at
) VALUES (
  'Abonnement Trimestriel',
  'Économisez avec notre abonnement trimestriel. Le meilleur rapport qualité-prix pour un usage intensif de nos services.',
  249.99,
  'EUR',
  'quarterly',
  jsonb_build_array(
    'Collecte et livraison à domicile',
    'Nettoyage professionnel de vêtements',
    'Repassage inclus',
    'Traitement des taches avancé',
    'Emballage premium',
    'Support client VIP 24/7',
    'Garantie satisfaction',
    'Remise de 17% par rapport au mensuel',
    'Service express gratuit',
    'Stockage temporaire inclus'
  ),
  true,
  true,
  'premium',
  0,
  2,
  jsonb_build_object(
    'recommended', true,
    'popular', true,
    'service_type', 'subscription',
    'billing_cycle', 'quarterly',
    'savings_percentage', 17
  ),
  NOW(),
  NOW()
);

-- Vérification: Afficher les plans actifs
SELECT 
  id,
  name,
  price_amount,
  currency,
  billing_interval,
  is_active,
  sort_order
FROM subscription_plans
WHERE is_active = true
ORDER BY sort_order;
