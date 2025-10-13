-- Script d'insertion de slots de test pour Collecte & Livraison
-- Date: 13 octobre 2025
-- Purpose: Créer des créneaux de démonstration pour tester le nouveau système de scheduling

-- =============================================================================
-- SLOTS MARDI 14 OCTOBRE 2025
-- =============================================================================

-- Collecte: Mardi 14 Oct, 14h-17h (Après-midi)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-14', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi mardi'),
  ('delivery', '2025-10-14', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi mardi');

-- Collecte: Mardi 14 Oct, 18h-21h (Soirée)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-14', '18:00', '21:00', 'Soirée', TRUE, 'Créneau soirée mardi'),
  ('delivery', '2025-10-14', '18:00', '21:00', 'Soirée', TRUE, 'Créneau soirée mardi');

-- =============================================================================
-- SLOTS JEUDI 16 OCTOBRE 2025
-- =============================================================================

-- Collecte: Jeudi 16 Oct, 16h-18h (Fin d'après-midi)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-16', '16:00', '18:00', 'Fin d''après-midi', TRUE, 'Créneau fin d''après-midi jeudi'),
  ('delivery', '2025-10-16', '16:00', '18:00', 'Fin d''après-midi', TRUE, 'Créneau fin d''après-midi jeudi');

-- Collecte: Jeudi 16 Oct, 19h-21h (Soirée)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('pickup', '2025-10-16', '19:00', '21:00', 'Soirée', TRUE, 'Créneau soirée jeudi'),
  ('delivery', '2025-10-16', '19:00', '21:00', 'Soirée', TRUE, 'Créneau soirée jeudi');

-- =============================================================================
-- VERIFICATION POST-INSERTION
-- =============================================================================

DO $$
DECLARE
  slot_count INT;
BEGIN
  SELECT COUNT(*) INTO slot_count FROM public.logistic_slots 
  WHERE slot_date IN ('2025-10-14', '2025-10-16') AND is_open = TRUE;
  
  IF slot_count <> 8 THEN
    RAISE WARNING 'Nombre de slots incorrect: % (attendu: 8)', slot_count;
  ELSE
    RAISE NOTICE '✅ 8 slots de test créés avec succès';
  END IF;
  
  -- Afficher résumé
  RAISE NOTICE '📋 Résumé des slots créés:';
  RAISE NOTICE '  - Mardi 14 Oct: 4 slots (2 pickup + 2 delivery)';
  RAISE NOTICE '    • 14h-17h (Après-midi)';
  RAISE NOTICE '    • 18h-21h (Soirée)';
  RAISE NOTICE '  - Jeudi 16 Oct: 4 slots (2 pickup + 2 delivery)';
  RAISE NOTICE '    • 16h-18h (Fin d''après-midi)';
  RAISE NOTICE '    • 19h-21h (Soirée)';
END $$;

-- =============================================================================
-- REQUETE DE VERIFICATION (optionnelle - décommenter pour exécuter)
-- =============================================================================

-- SELECT 
--   role,
--   slot_date,
--   start_time || ' - ' || end_time AS horaire,
--   label,
--   is_open,
--   created_at
-- FROM public.logistic_slots
-- WHERE slot_date IN ('2025-10-14', '2025-10-16')
-- ORDER BY slot_date, role DESC, start_time;

-- =============================================================================
-- NOTES D'UTILISATION
-- =============================================================================
-- • Ces slots sont visibles immédiatement via GET /api/logistic-slots
-- • Pour tester: 
--   1. Exécuter ce script dans Supabase SQL Editor
--   2. Ouvrir l'app et naviguer vers /reservation
--   3. Sélectionner un service
--   4. L'étape "Collecte & Livraison" affichera ces créneaux
-- • Pour désactiver un slot: UPDATE logistic_slots SET is_open = false WHERE id = '...'
-- • Pour supprimer: DELETE FROM logistic_slots WHERE slot_date IN ('2025-10-14', '2025-10-16')
