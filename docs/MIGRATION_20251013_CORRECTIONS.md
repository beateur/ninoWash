# Corrections Migration 20251013 - Logistic Slots

## Date
13 octobre 2025

## Contexte
Suite à l'audit détaillé de la migration initiale et à l'erreur `ERROR 42883: function trigger_set_timestamp() does not exist`, une refonte complète a été appliquée pour résoudre tous les problèmes de sécurité, d'intégrité et d'idempotence.

---

## Problèmes Résolus

### 🔴 Critiques

#### 1. Fonction trigger manquante
**Problème** : `trigger_set_timestamp()` n'existait pas, causant l'échec de la migration.

**Correction** :
```sql
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
```
- Création idempotente avec `CREATE OR REPLACE`
- Révocation d'accès pour `anon` et `authenticated` (helper interne uniquement)
- Trigger créé avec `DROP TRIGGER IF EXISTS` puis `CREATE TRIGGER`

#### 2. Policies RLS `slot_requests` trop permissives
**Problème** : `WITH CHECK (TRUE)` permettait insertion de données arbitraires, slots fermés, dates passées, incohérence de `role`.

**Correction** :
- **Policy authenticated** : validation stricte avec `created_by = auth.uid()` + vérification existence slot ouvert + date future + cohérence role
- **Policy anon** : même validation mais `created_by IS NULL`
- **Policy SELECT** : permet aux utilisateurs authentifiés de lire leurs propres demandes (`created_by = auth.uid()`)

```sql
CREATE POLICY "slot_requests_insert_authenticated"
    ON public.slot_requests FOR INSERT TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND slot_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.logistic_slots ls
            WHERE ls.id = slot_id
              AND ls.is_open = TRUE
              AND ls.role = slot_requests.role
              AND ls.slot_date >= CURRENT_DATE
        )
    );
```

#### 3. Foreign Keys bookings sans `ON DELETE`
**Problème** : Suppression d'un slot bloquerait les bookings ou laisserait des FK invalides.

**Correction** :
```sql
ADD COLUMN ... REFERENCES public.logistic_slots(id) ON DELETE SET NULL
```
- Permet de supprimer un slot sans casser les réservations existantes
- Les champs legacy (`pickup_date`, `pickup_time_slot`, etc.) servent de fallback

---

### 🟠 Importants

#### 4. Traçabilité utilisateur manquante
**Problème** : Impossible de savoir qui a demandé un slot.

**Correction** :
- Ajout colonne `created_by UUID DEFAULT auth.uid()` dans `slot_requests`
- Index sur `created_by` pour requêtes de traçabilité
- Policies RLS séparées pour authenticated (avec `created_by`) et anon (sans)

#### 5. Qualification schema absente
**Problème** : Risques de conflits si plusieurs schemas ou `search_path` non standard.

**Correction** :
- Qualification explicite `public.` sur toutes les tables/fonctions
- Vérifications dans `information_schema` filtrées par `table_schema = 'public'`
- `pg_policies` filtrées par `schemaname = 'public'`

#### 6. Index manquants
**Problème** : Requêtes par `slot_date` seul ou par `booking_id`/`created_by` non optimisées.

**Correction** :
```sql
CREATE INDEX logistic_slots_date_idx ON public.logistic_slots (slot_date) WHERE is_open = TRUE;
CREATE INDEX slot_requests_booking_id_idx ON public.slot_requests (booking_id);
CREATE INDEX slot_requests_created_by_idx ON public.slot_requests (created_by);
CREATE INDEX bookings_pickup_slot_id_idx ON public.bookings (pickup_slot_id);
CREATE INDEX bookings_delivery_slot_id_idx ON public.bookings (delivery_slot_id);
```

---

### 🟡 Améliorations

#### 7. Vérifications post-migration enrichies
**Avant** : Checks basiques avec `RAISE EXCEPTION` (pouvait casser CI/CD).

**Après** :
- Qualification schema dans toutes les vérifications
- Messages `RAISE NOTICE` pour feedback positif
- Vérification de toutes les colonnes ajoutées (`pickup_slot_id` + `delivery_slot_id`)

#### 8. Documentation inline améliorée
- Comments sur toutes les policies RLS
- Notes opérationnelles détaillées (section 5)
- Success notice avec emojis pour clarté visuelle

---

## Architecture Finale

### Tables créées

#### `public.logistic_slots`
```
id (UUID PK), role (TEXT), slot_date (DATE), start_time (TIME), end_time (TIME),
label (TEXT), is_open (BOOLEAN), notes (TEXT), created_at, updated_at
```
**RLS** :
- `SELECT` public (anon/auth) : `is_open = TRUE AND slot_date >= CURRENT_DATE`
- `ALL` service_role : accès complet

#### `public.slot_requests`
```
id (UUID PK), slot_id (UUID FK), role (TEXT), booking_id (UUID FK), 
created_by (UUID), requested_at (TIMESTAMPTZ)
```
**RLS** :
- `INSERT` authenticated : validation stricte + `created_by = auth.uid()`
- `INSERT` anon : validation stricte + `created_by IS NULL`
- `SELECT` authenticated : `created_by = auth.uid()` (lecture propres demandes)
- `ALL` service_role : accès complet

### Colonnes ajoutées

#### `public.bookings`
```sql
pickup_slot_id UUID REFERENCES public.logistic_slots(id) ON DELETE SET NULL
delivery_slot_id UUID REFERENCES public.logistic_slots(id) ON DELETE SET NULL
```
- FKs avec `ON DELETE SET NULL` pour permettre suppression slots
- Indexes créés pour optimiser requêtes
- Champs legacy conservés (compatibilité)

---

## Validation Post-Migration

### Commandes de test recommandées

#### 1. Vérifier création tables/fonction
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('logistic_slots', 'slot_requests');

SELECT proname FROM pg_proc WHERE proname = 'trigger_set_timestamp';
```

#### 2. Vérifier policies RLS
```sql
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('logistic_slots', 'slot_requests')
ORDER BY tablename, policyname;
```

#### 3. Tester trigger `updated_at`
```sql
-- Insérer un slot test
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label)
VALUES ('pickup', CURRENT_DATE + 1, '09:00', '12:00', 'Test slot');

-- Mettre à jour et vérifier updated_at
UPDATE public.logistic_slots SET label = 'Test updated' WHERE label = 'Test slot';
SELECT label, created_at, updated_at FROM public.logistic_slots WHERE label = 'Test updated';
-- ✅ updated_at doit être > created_at
```

#### 4. Tester RLS policies
```sql
-- En tant qu'anon : doit voir uniquement slots ouverts futurs
SET ROLE anon;
SELECT * FROM public.logistic_slots;
-- ✅ Doit voir uniquement is_open = TRUE et slot_date >= today

-- Tester insertion slot_request (doit échouer si slot fermé/passé)
INSERT INTO public.slot_requests (slot_id, role, booking_id)
VALUES ('00000000-0000-0000-0000-000000000000', 'pickup', NULL);
-- ❌ Doit échouer : WITH CHECK validation

RESET ROLE;
```

#### 5. Vérifier ON DELETE SET NULL
```sql
-- Créer booking test lié à un slot
INSERT INTO public.logistic_slots (id, role, slot_date, start_time, end_time)
VALUES ('11111111-1111-1111-1111-111111111111', 'pickup', CURRENT_DATE + 2, '14:00', '17:00');

UPDATE public.bookings SET pickup_slot_id = '11111111-1111-1111-1111-111111111111' WHERE id = (SELECT id FROM public.bookings LIMIT 1);

-- Supprimer le slot
DELETE FROM public.logistic_slots WHERE id = '11111111-1111-1111-1111-111111111111';

-- Vérifier que booking.pickup_slot_id est NULL (pas d'erreur FK)
SELECT id, pickup_slot_id FROM public.bookings WHERE id = ...;
-- ✅ pickup_slot_id doit être NULL
```

---

## Impact et Rétrocompatibilité

### ✅ Rétrocompatibilité assurée
- Champs legacy bookings (`pickup_date`, `pickup_time_slot`, etc.) **conservés**
- Migration utilise `IF NOT EXISTS` / `DROP ... IF EXISTS` (idempotente)
- Pas de modification des RLS existantes sur `bookings`

### ⚠️ Points d'attention
- **Timezone** : `slot_date >= CURRENT_DATE` utilise timezone serveur DB. Si clients multifuseaux, documenter comportement ou utiliser `AT TIME ZONE`.
- **Capacité slots** : Pas de gestion de capacité maximale pour le moment (logique future).
- **Flood protection** : Anon peut insérer `slot_requests` sans rate limiting (implémenter côté API si nécessaire).

---

## Checklist Déploiement

- [x] Migration SQL corrigée et testée localement
- [ ] Appliquer migration via Supabase Dashboard SQL Editor ou CLI
- [ ] Exécuter tests de validation (section ci-dessus)
- [ ] Insérer quelques slots tests pour valider front-end
- [ ] Documenter timezone policy pour équipe produit
- [ ] Implémenter rate limiting API si nécessaire (post-migration)
- [ ] Créer routes API `/api/logistic-slots` (prochaine étape)
- [ ] Refonte UI Collecte & Livraison (selon PRD)

---

## Prochaines Étapes

1. **Appliquer la migration corrigée** (via Dashboard ou CLI)
2. **Valider post-migration** (tests ci-dessus)
3. **Planifier refonte API & UI** (TODO restant dans plan)
4. **Créer routes API** :
   - `GET /api/logistic-slots?role=pickup&date=YYYY-MM-DD`
   - `POST /api/bookings` (mise à jour pour utiliser `pickup_slot_id`/`delivery_slot_id`)
5. **Refonte composants front** :
   - `CollectionDeliveryStep` (sélection slots visuels)
   - `BookingSummary` (affichage info slot)
   - Gestion erreurs (slot complet, fermé, etc.)

---

## Auteur
GitHub Copilot - 13 octobre 2025

## Références
- PRD : `docs/PRD/PRD_BOOKING_COLLECTION_DELIVERY.md`
- Migration : `supabase/migrations/20251013000100_create_logistic_slots.sql`
- Architecture : `docs/architecture.md`
- Database Schema : `docs/DATABASE_SCHEMA.md`
