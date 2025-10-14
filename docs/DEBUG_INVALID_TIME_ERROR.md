# 🔧 Debug Guide - Invalid Time Value Error

## ❌ Erreur Rencontrée

\`\`\`
RangeError: Invalid time value at Date.toISOString()
collection-delivery-step.tsx:72
\`\`\`

Cette erreur se produisait lors de la sélection d'un créneau de collecte.

## 🔍 Cause Identifiée

PostgreSQL stocke les colonnes `TIME` au format **`HH:MM:SS`** (convention standard), mais le code JavaScript essayait de construire une date ISO en ajoutant `:00`, ce qui donnait :
- ❌ `2025-10-14T12:00:00:00` (4 groupes → invalide)
- ✅ `2025-10-14T12:00:00` (3 groupes → valide)

## ✅ Solution Appliquée

**Le code s'adapte maintenant au format PostgreSQL** au lieu de modifier la base de données.

### Fichiers Corrigés

#### 1. `components/booking/collection-delivery-step.tsx`
**Lignes 70-88** : Extraction de `HH:MM` avant construction de la date
\`\`\`typescript
let timeStr = selectedPickup.end_time
// PostgreSQL retourne TIME avec secondes (HH:MM:SS)
// On extrait uniquement HH:MM pour l'ISO format
if (timeStr.length > 5) {
  timeStr = timeStr.substring(0, 5) // "12:00:00" -> "12:00"
}
\`\`\`

**Lignes 124** : Fallback aussi adapté
\`\`\`typescript
time: `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`
\`\`\`

#### 2. `lib/services/logistic-slots.ts`
**Fonction `validateSlotDelay`** (lignes 113-119) : Extraction avant construction de dates
\`\`\`typescript
const pickupEndTime = pickupSlot.end_time.substring(0, 5)
const deliveryStartTime = deliverySlot.start_time.substring(0, 5)
\`\`\`

**Fonction `generateLegacyDatesFromSlots`** (lignes 212, 225) : Format legacy cohérent
\`\`\`typescript
const pickupTimeSlot = `${pickupSlot.start_time.substring(0, 5)}-${pickupSlot.end_time.substring(0, 5)}`
\`\`\`

## 📊 Vérification

Le format PostgreSQL est maintenant géré automatiquement. Vous pouvez vérifier dans Supabase :

\`\`\`sql
SELECT 
  id,
  role,
  slot_date,
  start_time,  -- Affichera "09:00:00" (normal)
  end_time,    -- Affichera "12:00:00" (normal)
  slot_date || 'T' || SUBSTRING(end_time::text FROM 1 FOR 5) || ':00' as iso_format
FROM logistic_slots
WHERE is_open = TRUE
LIMIT 5;
\`\`\`

**Résultat attendu** : `iso_format` contient `2025-10-14T12:00:00` ✅

## 🎉 Statut

✅ **RÉSOLU** : L'application gère maintenant correctement le format `TIME` de PostgreSQL sans nécessiter de modification de la base de données.

## 📝 Leçon Apprise

**Convention PostgreSQL** : Les colonnes `TIME` stockent toujours les secondes (`HH:MM:SS`). C'est la responsabilité du code applicatif de formater selon ses besoins, pas celle de la base de données.

1. **Ouvrir Supabase Dashboard > SQL Editor**
2. **Exécuter cette requête pour voir le format actuel** :
   \`\`\`sql
   SELECT 
     id,
     role,
     slot_date,
     start_time,
     end_time,
     label,
     pg_typeof(slot_date) as date_type,
     pg_typeof(start_time) as start_type,
     pg_typeof(end_time) as end_type
   FROM logistic_slots
   LIMIT 5;
   \`\`\`

3. **Vérifier les résultats** :
   - `slot_date` doit être de type `date` et format `YYYY-MM-DD` (ex: `2025-10-14`)
   - `start_time` doit être de type `time` ou `text` et format `HH:MM` (ex: `14:00`)
   - `end_time` doit être de type `time` ou `text` et format `HH:MM` (ex: `17:00`)

### Solution 2 : Corriger les Données Existantes

Si le format est incorrect (par exemple `HH:MM:SS` au lieu de `HH:MM`), exécuter :

\`\`\`sql
-- Voir les données actuelles
SELECT role, slot_date, start_time, end_time FROM logistic_slots;

-- Si le format inclut les secondes (14:00:00), les enlever
UPDATE logistic_slots
SET 
  start_time = SUBSTRING(start_time::text FROM 1 FOR 5),
  end_time = SUBSTRING(end_time::text FROM 1 FOR 5);
\`\`\`

### Solution 3 : Réinsérer les Slots de Test avec le Bon Format

1. **Supprimer les slots existants** :
   \`\`\`sql
   DELETE FROM logistic_slots WHERE slot_date >= '2025-10-14';
   \`\`\`

2. **Réexécuter le script de test** :
   - Fichier : `scripts/insert-test-slots.sql`
   - Vérifier que le format dans le script est bien `'14:00'` et non `'14:00:00'`

### Solution 4 : Vérifier les Types de Colonnes dans la Migration

Ouvrir `supabase/migrations/20251013000000_create_logistic_slots.sql` et vérifier :

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.logistic_slots (
  ...
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,  -- Doit être TIME, pas TIMESTAMP
  end_time TIME NOT NULL,    -- Doit être TIME, pas TIMESTAMP
  ...
);
\`\`\`

Si les colonnes sont de type `TIMESTAMP` ou `TIMESTAMPTZ`, il faut corriger :

\`\`\`sql
ALTER TABLE logistic_slots 
  ALTER COLUMN start_time TYPE TIME USING start_time::time,
  ALTER COLUMN end_time TYPE TIME USING end_time::time;
\`\`\`

## 🧪 Test Rapide

Pour vérifier rapidement si les données sont correctes :

\`\`\`sql
-- Cette requête doit retourner des dates valides
SELECT 
  id,
  role,
  slot_date || 'T' || end_time || ':00' as combined_datetime
FROM logistic_slots
WHERE is_open = TRUE
LIMIT 5;
\`\`\`

**Résultat attendu** : Des chaînes comme `2025-10-14T17:00:00` (format ISO valide)

Si vous voyez des choses comme :
- `2025-10-14T17:00:00:00` (trop de zéros) ❌
- `2025-10-14T17` (temps incomplet) ❌
- `null` (donnée manquante) ❌

Alors il faut corriger les données.

## 🔄 Fix Appliqué dans le Code

Le composant `CollectionDeliveryStep` a été modifié pour :
1. ✅ Ajouter un `try/catch` pour capturer l'erreur
2. ✅ Vérifier la validité de la date avec `isNaN(pickupEnd.getTime())`
3. ✅ Logger les données problématiques dans la console
4. ✅ Retourner une date fallback (`today`) en cas d'erreur

**Fichier modifié** : `components/booking/collection-delivery-step.tsx` (lignes 63-87)

## 📋 Checklist de Vérification

- [ ] Ouvrir la console du navigateur (F12)
- [ ] Chercher le log `[v0] CollectionDeliveryStep selectedPickup:`
- [ ] Vérifier le format de `slot_date` et `end_time` dans le log
- [ ] Si erreur `[v0] Invalid pickup date:`, les données Supabase sont incorrectes
- [ ] Exécuter les requêtes SQL ci-dessus pour corriger
- [ ] Rafraîchir la page et retester

## 🆘 Si le Problème Persiste

1. **Copier les logs de la console** (avec les données du slot)
2. **Exécuter cette requête dans Supabase** :
   \`\`\`sql
   SELECT * FROM logistic_slots WHERE role = 'pickup' AND is_open = TRUE;
   \`\`\`
3. **Partager les résultats** pour diagnostic approfondi

## 📖 Ressources

- **Migration SQL** : `supabase/migrations/20251013000000_create_logistic_slots.sql`
- **Script de test** : `scripts/insert-test-slots.sql`
- **Composant** : `components/booking/collection-delivery-step.tsx`
- **Documentation** : `docs/TESTING_SLOT_UI.md`

---

**Note** : Cette erreur est typiquement causée par un décalage entre le format attendu par le code JavaScript (`YYYY-MM-DDTHH:MM:00`) et le format réel stocké dans PostgreSQL. Le fix appliqué ajoute une protection, mais la vraie solution est de corriger les données à la source (Supabase).
