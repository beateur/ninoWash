-- ============================================================================
-- Script SQL Simple pour Créer des Créneaux de Livraison
-- ============================================================================
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
-- SEMAINE 2: 20-27 octobre 2025 (LIVRAISON UNIQUEMENT)
-- ============================================================================

-- Lundi 20 octobre - Matin (9h-12h) + Après-midi (14h-17h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('delivery', '2025-10-20', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Lundi'),
  ('delivery', '2025-10-20', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Lundi');

-- Mardi 21 octobre - Matin (9h-12h) + Après-midi (14h-17h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('delivery', '2025-10-21', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Mardi'),
  ('delivery', '2025-10-21', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Mardi');

-- Mercredi 22 octobre - Matin (9h-12h) + Après-midi (14h-17h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('delivery', '2025-10-22', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Mercredi'),
  ('delivery', '2025-10-22', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Mercredi');

-- Jeudi 23 octobre - Matin (9h-12h) + Après-midi (14h-17h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('delivery', '2025-10-23', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Jeudi'),
  ('delivery', '2025-10-23', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Jeudi');

-- Vendredi 24 octobre - Matin (9h-12h) + Après-midi (14h-17h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('delivery', '2025-10-24', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Vendredi'),
  ('delivery', '2025-10-24', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Vendredi');

-- Samedi 25 octobre - Matin (9h-12h) + Après-midi (14h-17h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('delivery', '2025-10-25', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Samedi'),
  ('delivery', '2025-10-25', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Samedi');

-- Dimanche 26 octobre - Matin (9h-12h) + Après-midi (14h-17h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('delivery', '2025-10-26', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Dimanche'),
  ('delivery', '2025-10-26', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Dimanche');

-- Lundi 27 octobre - Matin (9h-12h) + Après-midi (14h-17h)
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, notes)
VALUES 
  ('delivery', '2025-10-27', '09:00', '12:00', 'Matin', TRUE, 'Créneau matinal - Lundi'),
  ('delivery', '2025-10-27', '14:00', '17:00', 'Après-midi', TRUE, 'Créneau après-midi - Lundi');
