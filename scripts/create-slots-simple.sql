-- ============================================================================
-- Script SQL Simple pour Créer des Créneaux
-- ============================================================================
-- 
-- Instructions:
-- 1. Modifier les valeurs INSERT ci-dessous selon vos besoins
-- 2. Copier tout le contenu de ce fichier
-- 3. Ouvrir Supabase Dashboard > SQL Editor
-- 4. Coller et exécuter
--
-- Format des colonnes:
-- - role: 'pickup' (collecte) ou 'delivery' (livraison)
-- - slot_date: 'YYYY-MM-DD'
-- - start_time: 'HH:MM'
-- - end_time: 'HH:MM'
-- - label: Texte libre (ex: "Matin", "Après-midi", "Soirée")
-- - is_open: TRUE (ouvert) ou FALSE (fermé)
-- - notes: Texte libre optionnel
-- ============================================================================

-- ============================================================================
-- SEMAINE 1: 14-18 octobre 2025
-- ============================================================================

-- Mardi 14 octobre - Matin (9h-12h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-14', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Mardi'),
  ('delivery', '2025-10-14', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Mardi');

-- Mardi 14 octobre - Après-midi (14h-17h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-14', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Mardi'),
  ('delivery', '2025-10-14', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Mardi');

-- Mardi 14 octobre - Soirée (18h-21h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-14', '18:00', '21:00', 'Soirée', TRUE, 'Créneau soirée - Mardi'),
  ('delivery', '2025-10-14', '18:00', '21:00', 'Soirée', TRUE, 'Créneau soirée - Mardi');

-- Jeudi 16 octobre - Matin (9h-12h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-16', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Jeudi'),
  ('delivery', '2025-10-16', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Jeudi');

-- Jeudi 16 octobre - Après-midi (14h-17h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-16', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Jeudi'),
  ('delivery', '2025-10-16', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Jeudi');

-- Jeudi 16 octobre - Soirée (18h-21h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-16', '18:00', '21:00', 'Soirée', TRUE, 'Créneau soirée - Jeudi'),
  ('delivery', '2025-10-16', '18:00', '21:00', 'Soirée', TRUE, 'Créneau soirée - Jeudi');

-- Samedi 18 octobre - Fin d'après-midi (16h-18h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-18', '16:00', '18:00', 'Fin d''après-midi', TRUE, 'Créneau fin d''après-midi - Samedi'),
  ('delivery', '2025-10-18', '16:00', '18:00', 'Fin d''après-midi', TRUE, 'Créneau fin d''après-midi - Samedi');

-- Samedi 18 octobre - Soirée (19h-21h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-18', '19:00', '21:00', 'Soirée', TRUE, 'Créneau soirée - Samedi'),
  ('delivery', '2025-10-18', '19:00', '21:00', 'Soirée', TRUE, 'Créneau soirée - Samedi');

-- ============================================================================
-- VERIFICATION POST-INSERTION
-- ============================================================================

DO $$
DECLARE
  slot_count INT;
BEGIN
  SELECT COUNT(*) INTO slot_count FROM public.logistic_slots 
  WHERE slot_date BETWEEN '2025-10-14' AND '2025-10-18' AND is_open = TRUE;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Script exécuté avec succès!';
  RAISE NOTICE '📊 Nombre de créneaux créés: %', slot_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Résumé par date:';
  
  FOR rec IN 
    SELECT 
      slot_date,
      COUNT(*) FILTER (WHERE role = 'pickup') as pickup_count,
      COUNT(*) FILTER (WHERE role = 'delivery') as delivery_count
    FROM public.logistic_slots 
    WHERE slot_date BETWEEN '2025-10-14' AND '2025-10-18' AND is_open = TRUE
    GROUP BY slot_date
    ORDER BY slot_date
  LOOP
    RAISE NOTICE '   % : % collecte(s) + % livraison(s)', 
      rec.slot_date, 
      rec.pickup_count, 
      rec.delivery_count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Créneaux disponibles dans l''application!';
  RAISE NOTICE '   → Testez sur: http://localhost:3000/reservation/guest (étape 3)';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- REQUÊTES UTILES POUR LA GESTION
-- ============================================================================

-- Voir tous les créneaux créés
-- SELECT role, slot_date, start_time, end_time, label, capacity_limit, capacity_used, is_open 
-- FROM logistic_slots 
-- WHERE slot_date >= CURRENT_DATE 
-- ORDER BY slot_date, role, start_time;

-- Fermer un créneau spécifique (remplacer l'ID)
-- UPDATE logistic_slots SET is_open = FALSE WHERE id = 'UUID_ICI';

-- Supprimer tous les créneaux d'une date spécifique
-- DELETE FROM logistic_slots WHERE slot_date = '2025-10-14';

-- Supprimer tous les créneaux de test
-- DELETE FROM logistic_slots WHERE slot_date >= '2025-10-14' AND slot_date <= '2025-10-18';
