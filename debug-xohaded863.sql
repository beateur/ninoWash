-- ============================================================================
-- DEBUG: Réservation Guest pour xohaded863@fixwap.com
-- ============================================================================
-- À exécuter dans Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm/editor

-- 1. Trouver la réservation
SELECT 
  b.id,
  b.user_id,
  b.status,
  b.payment_status,
  b.created_at,
  b.metadata,
  au.email as auth_email
FROM bookings b
LEFT JOIN auth.users au ON b.user_id = au.id
WHERE 
  au.email = 'xohaded863@fixwap.com'
  OR b.metadata::text LIKE '%xohaded863@fixwap.com%'
ORDER BY b.created_at DESC
LIMIT 5;

-- 2. Vérifier la structure metadata complète
SELECT 
  id,
  user_id,
  jsonb_pretty(metadata) as metadata_formatted
FROM bookings
WHERE 
  metadata::text LIKE '%xohaded863@fixwap.com%'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Vérifier si le user existe dans auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'xohaded863@fixwap.com';

-- 4. Extraire spécifiquement guest_contact
SELECT 
  id,
  user_id,
  metadata->'guest_contact' as guest_contact,
  metadata->'guest_contact'->>'email' as guest_email,
  metadata->'guest_contact'->>'name' as guest_name,
  metadata->'guest_contact'->>'phone' as guest_phone,
  metadata->>'is_guest_booking' as is_guest
FROM bookings
WHERE metadata::text LIKE '%xohaded863@fixwap.com%'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Vérifier toutes les clés du metadata
SELECT 
  id,
  jsonb_object_keys(metadata) as metadata_keys
FROM bookings
WHERE metadata::text LIKE '%xohaded863@fixwap.com%'
ORDER BY created_at DESC
LIMIT 1;
