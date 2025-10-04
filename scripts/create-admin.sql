-- =============================================================================
-- Script de Promotion Utilisateur Admin - Nino Wash
-- =============================================================================
-- Email cible: habilel99@gmail.com
-- Date: 3 octobre 2025
-- =============================================================================

-- Étape 1: Vérifier que l'utilisateur existe
SELECT 
    id, 
    email, 
    raw_user_meta_data,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'habilel99@gmail.com';

-- =============================================================================
-- Si l'utilisateur existe, exécuter les étapes suivantes
-- =============================================================================

-- Étape 2: Promouvoir l'utilisateur au rôle admin
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'habilel99@gmail.com';

-- Étape 3: Vérifier que la mise à jour a réussi
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'habilel99@gmail.com';

-- =============================================================================
-- Résultat attendu:
-- - id: <uuid>
-- - email: habilel99@gmail.com
-- - role: admin
-- - raw_user_meta_data: {"role": "admin"}
-- =============================================================================

-- =============================================================================
-- Si l'utilisateur n'existe pas encore:
-- 1. Créez d'abord un compte via: http://localhost:3000/auth/signup
-- 2. Utilisez l'email: habilel99@gmail.com
-- 3. Vérifiez l'email si nécessaire
-- 4. Puis exécutez ce script
-- =============================================================================
