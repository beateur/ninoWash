-- Script pour nettoyer les doublons d'abonnement et garder le plus récent
-- À exécuter dans Supabase SQL Editor

-- 1. Voir tous les abonnements de l'utilisateur
SELECT 
  id,
  user_id,
  plan_id,
  status,
  stripe_subscription_id,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
FROM subscriptions
WHERE user_id = '4253ed6b-0e53-4187-ac30-7731744189e4'
ORDER BY created_at DESC;

-- 2. Annuler l'ancien abonnement (mensuel)
-- Remplacer <OLD_SUBSCRIPTION_ID> par l'ID de l'ancien abonnement
UPDATE subscriptions
SET 
  status = 'canceled',
  canceled_at = NOW(),
  updated_at = NOW()
WHERE user_id = '4253ed6b-0e53-4187-ac30-7731744189e4'
  AND stripe_subscription_id = 'sub_1SD0qERlgtyeCF3BY44417HH' -- L'ancien abonnement mensuel
  AND status = 'active';

-- 3. Vérifier le résultat
SELECT 
  id,
  user_id,
  plan_id,
  status,
  stripe_subscription_id,
  current_period_start,
  current_period_end,
  created_at
FROM subscriptions
WHERE user_id = '4253ed6b-0e53-4187-ac30-7731744189e4'
ORDER BY created_at DESC;

-- 4. Si le nouvel abonnement trimestriel n'existe pas encore, il faut le créer
-- Vérifiez d'abord dans Stripe Dashboard quel est le nouveau subscription_id
-- Puis créez-le manuellement si nécessaire :

/*
INSERT INTO subscriptions (
  user_id,
  plan_id,
  stripe_subscription_id,
  stripe_customer_id,
  status,
  current_period_start,
  current_period_end,
  quantity
)
VALUES (
  '4253ed6b-0e53-4187-ac30-7731744189e4',
  'bec281a0-b575-4e8b-89a4-97aaca824ccf', -- ID du plan trimestriel (à vérifier)
  'sub_XXXXXX', -- Nouveau subscription ID depuis Stripe
  'cus_T9JS9ijxFYidt2',
  'active',
  NOW(),
  NOW() + INTERVAL '3 months',
  1
);
*/
