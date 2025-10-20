-- =============================================================================
-- MIGRATION COMPLÈTE VERS SUPABASE AUTH NATIF
-- =============================================================================
-- 
-- Ce script migre l'architecture de public.users vers auth.users + user_profiles
-- et corrige toutes les contraintes de clés étrangères
--
-- Date: 2025-10-19
-- Auteur: System Migration
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1: ANALYSE PRÉ-MIGRATION
-- =============================================================================

SELECT '========== ANALYSE PRÉ-MIGRATION ==========' as step;

-- Compter les enregistrements dans chaque table
SELECT 
  'ÉTAT INITIAL' as status,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count,
  (SELECT COUNT(*) FROM public.user_profiles) as user_profiles_count;

-- Lister les utilisateurs dans public.users
SELECT 'UTILISATEURS DANS public.users:' as info;
SELECT id, email, first_name, last_name, created_at FROM public.users ORDER BY created_at;

-- =============================================================================
-- ÉTAPE 2: MIGRER LES DONNÉES DE public.users vers user_profiles
-- =============================================================================

SELECT '========== MIGRATION DES DONNÉES ==========' as step;

-- Pour chaque utilisateur dans public.users qui a un compte auth.users correspondant,
-- créer ou mettre à jour son user_profile
INSERT INTO public.user_profiles (
  id,
  first_name,
  last_name,
  display_name,
  phone,
  email_verified,
  is_active,
  created_at,
  updated_at
)
SELECT 
  pu.id,
  pu.first_name,
  pu.last_name,
  COALESCE(pu.first_name || ' ' || pu.last_name, pu.email) as display_name,
  pu.phone,
  COALESCE(pu.email_verified, false) as email_verified,
  COALESCE(pu.status = 'active', true) as is_active,
  pu.created_at,
  COALESCE(pu.updated_at, pu.created_at) as updated_at
FROM public.users pu
WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id = pu.id)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  email_verified = EXCLUDED.email_verified,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

SELECT 'Profils migrés: ' || COUNT(*) as migration_result 
FROM public.user_profiles;

-- =============================================================================
-- ÉTAPE 3: CORRIGER LES CONTRAINTES FK
-- =============================================================================

SELECT '========== CORRECTION DES CONTRAINTES ==========' as step;

-- 3.1: Modifier user_addresses pour référencer auth.users
ALTER TABLE IF EXISTS public.user_addresses 
  DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;

ALTER TABLE public.user_addresses
  ADD CONSTRAINT user_addresses_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

SELECT '✅ user_addresses.user_id -> auth.users(id)' as status;

-- 3.2: Modifier bookings pour référencer auth.users
ALTER TABLE IF EXISTS public.bookings
  DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

SELECT '✅ bookings.user_id -> auth.users(id)' as status;

-- 3.3: Vérifier que user_profiles référence bien auth.users
ALTER TABLE IF EXISTS public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

SELECT '✅ user_profiles.id -> auth.users(id)' as status;

-- =============================================================================
-- ÉTAPE 4: RENOMMER public.users EN users_deprecated
-- =============================================================================

SELECT '========== ARCHIVAGE DE public.users ==========' as step;

-- Renommer la table users en users_deprecated (ne pas supprimer pour sécurité)
ALTER TABLE IF EXISTS public.users RENAME TO users_deprecated;

SELECT '✅ public.users renommée en users_deprecated' as status;

-- =============================================================================
-- ÉTAPE 5: CRÉER UNE VUE users POUR LA COMPATIBILITÉ
-- =============================================================================

SELECT '========== CRÉATION VUE COMPATIBILITÉ ==========' as step;

-- Créer une vue "users" qui combine auth.users et user_profiles
-- pour maintenir la compatibilité avec le code existant
CREATE OR REPLACE VIEW public.users AS
SELECT 
  au.id,
  au.email,
  up.first_name,
  up.last_name,
  up.phone,
  up.display_name,
  up.email_verified,
  up.is_active as status,
  up.created_at,
  up.updated_at,
  au.raw_user_meta_data->>'stripe_customer_id' as stripe_customer_id,
  up.avatar_url,
  up.bio,
  up.timezone,
  up.locale
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id;

SELECT '✅ Vue public.users créée pour compatibilité' as status;

-- Créer des triggers INSTEAD OF pour permettre les INSERT/UPDATE sur la vue
CREATE OR REPLACE FUNCTION public.users_view_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Les INSERT doivent passer par auth.signUp() ou admin.createUser()
  -- On ne peut pas insérer directement dans auth.users
  RAISE EXCEPTION 'INSERT dans la vue users non supporté. Utilisez Supabase Auth signUp() ou admin.createUser()';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.users_view_update()
RETURNS TRIGGER AS $$
BEGIN
  -- UPDATE sur user_profiles
  UPDATE public.user_profiles SET
    first_name = NEW.first_name,
    last_name = NEW.last_name,
    phone = NEW.phone,
    display_name = NEW.display_name,
    email_verified = NEW.email_verified,
    is_active = (NEW.status = true OR NEW.status::text = 'active'),
    avatar_url = NEW.avatar_url,
    bio = NEW.bio,
    timezone = NEW.timezone,
    locale = NEW.locale,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  -- UPDATE stripe_customer_id dans auth.users metadata
  IF NEW.stripe_customer_id IS NOT NULL THEN
    UPDATE auth.users SET
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                          jsonb_build_object('stripe_customer_id', NEW.stripe_customer_id)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.users_view_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- DELETE doit être fait via Supabase Auth admin API
  RAISE EXCEPTION 'DELETE dans la vue users non supporté. Utilisez Supabase Auth admin.deleteUser()';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_view_insert_trigger ON public.users;
CREATE TRIGGER users_view_insert_trigger
  INSTEAD OF INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_view_insert();

DROP TRIGGER IF EXISTS users_view_update_trigger ON public.users;
CREATE TRIGGER users_view_update_trigger
  INSTEAD OF UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_view_update();

DROP TRIGGER IF EXISTS users_view_delete_trigger ON public.users;
CREATE TRIGGER users_view_delete_trigger
  INSTEAD OF DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_view_delete();

SELECT '✅ Triggers INSTEAD OF créés pour la vue users' as status;

-- =============================================================================
-- ÉTAPE 6: VÉRIFICATION POST-MIGRATION
-- =============================================================================

SELECT '========== VÉRIFICATION POST-MIGRATION ==========' as step;

-- Vérifier que tous les auth.users ont un user_profile
SELECT 
  'RÉSULTAT FINAL' as status,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.user_profiles) as user_profiles_count,
  (SELECT COUNT(*) FROM auth.users au WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
  )) as users_without_profile;

-- Lister les utilisateurs finaux via la vue
SELECT 'UTILISATEURS FINAUX (via vue):' as info;
SELECT id, email, first_name, last_name, status, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- Vérifier les contraintes
SELECT '========== CONTRAINTES VÉRIFIÉES ==========' as step;
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname IN (
  'user_addresses_user_id_fkey',
  'bookings_user_id_fkey',
  'user_profiles_id_fkey'
);

COMMIT;

-- =============================================================================
-- RÉSUMÉ
-- =============================================================================

SELECT '
========================================
MIGRATION TERMINÉE AVEC SUCCÈS
========================================

✅ public.users renommée en users_deprecated
✅ Vue public.users créée (auth.users + user_profiles)
✅ Contraintes FK mises à jour vers auth.users
✅ Triggers INSTEAD OF créés pour compatibilité
✅ Architecture Supabase Auth native activée

ACTIONS SUIVANTES:
1. Tester les parcours signup et guest booking
2. Vérifier que le code fonctionne avec la vue
3. Après validation, supprimer users_deprecated
4. Mettre à jour le code pour utiliser user_profiles directement

' as summary;
