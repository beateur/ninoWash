-- DEBUG: Vérifier la structure d'une réservation guest
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier les dernières réservations
SELECT 
  id,
  user_id,
  status,
  payment_status,
  created_at,
  metadata
FROM bookings
ORDER BY created_at DESC
LIMIT 5;

-- 2. Vérifier spécifiquement les réservations guest (sans user_id)
SELECT 
  id,
  user_id,
  status,
  payment_status,
  metadata->>'guest_contact' as guest_contact,
  metadata->'guest_contact'->>'email' as guest_email,
  metadata->'guest_contact'->>'name' as guest_name,
  created_at
FROM bookings
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. Vérifier les réservations avec user_id mais problème d'email
SELECT 
  b.id,
  b.user_id,
  b.status,
  b.payment_status,
  au.email as auth_email,
  b.metadata->'guest_contact'->>'email' as metadata_email,
  b.created_at
FROM bookings b
LEFT JOIN auth.users au ON b.user_id = au.id
WHERE b.user_id IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 5;

-- 4. Trouver les réservations qui n'ont NI user_id NI guest_contact
SELECT 
  id,
  user_id,
  status,
  payment_status,
  metadata,
  created_at
FROM bookings
WHERE 
  user_id IS NULL 
  AND (
    metadata IS NULL 
    OR metadata->'guest_contact' IS NULL
    OR metadata->'guest_contact'->>'email' IS NULL
  )
ORDER BY created_at DESC
LIMIT 10;
