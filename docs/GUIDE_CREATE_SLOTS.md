# 📘 Guide d'Utilisation - Scripts de Création de Créneaux

## 🎯 Vue d'Ensemble

Deux scripts sont disponibles pour créer des créneaux de collecte et livraison :

| Script | Type | Avantages | Utilisation |
|--------|------|-----------|-------------|
| `create-slots.ts` | Node.js/TypeScript | ✅ Validation automatique<br>✅ Retour coloré<br>✅ Exécution depuis terminal | Développeurs |
| `create-slots-simple.sql` | SQL pur | ✅ Simple à modifier<br>✅ Pas besoin de dépendances<br>✅ Exécution directe dans Supabase | Tous |

---

## 🚀 Méthode 1 : Script TypeScript (Recommandé pour Devs)

### Prérequis
- Variables d'environnement configurées dans `.env.local` :
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
  ```

### Utilisation

#### Étape 1 : Configurer les créneaux

Ouvrir `scripts/create-slots.ts` et modifier la constante `SLOT_CONFIG` :

```typescript
const SLOT_CONFIG: SlotConfig[] = [
  {
    date: "2025-10-21",           // Date du créneau (YYYY-MM-DD)
    startTime: "09:00",            // Heure de début (HH:MM)
    endTime: "12:00",              // Heure de fin (HH:MM)
    label: "Matin",                // Label affiché à l'utilisateur
    createBoth: true,              // true = pickup + delivery, false = pickup seul
    notes: "Créneau matinal",      // Notes optionnelles
  },
  {
    date: "2025-10-21",
    startTime: "14:00",
    endTime: "17:00",
    label: "Après-midi",
    createBoth: true,
  },
  // Ajouter autant de créneaux que nécessaire...
]
```

#### Étape 2 : Exécuter le script

```bash
pnpm tsx scripts/create-slots.ts
```

#### Sortie Attendue

```
🚀 Script de création de créneaux logistiques

📋 Configuration:
   - 8 dates configurées
   - Capacité par défaut: 5 réservations/créneau

📊 16 créneaux à créer:

   ✓ Collecte - 2025-10-14 09:00-12:00 (Matin)
   ✓ Livraison - 2025-10-14 09:00-12:00 (Matin)
   ...

⏳ Insertion dans Supabase...

✅ 16 créneaux créés avec succès!

📊 Résumé par date:
   2025-10-14: 3 collecte(s) + 3 livraison(s)
   2025-10-16: 3 collecte(s) + 3 livraison(s)
   2025-10-18: 2 collecte(s) + 2 livraison(s)

🎉 Terminé! Les créneaux sont maintenant disponibles dans l'application.
```

---

## 📝 Méthode 2 : Script SQL (Plus Simple)

### Utilisation

#### Étape 1 : Modifier le fichier SQL

Ouvrir `scripts/create-slots-simple.sql` et éditer les blocs `INSERT INTO` :

```sql
-- Modifier la date, les horaires, le label selon vos besoins
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, capacity_limit, capacity_used, notes)
VALUES 
  ('pickup', '2025-10-21', '09:00', '12:00', 'Matin', TRUE, 5, 0, 'Mon créneau personnalisé'),
  ('delivery', '2025-10-21', '09:00', '12:00', 'Matin', TRUE, 5, 0, 'Mon créneau personnalisé');
```

**Champs à personnaliser** :
- `role` : `'pickup'` (collecte) ou `'delivery'` (livraison)
- `slot_date` : `'YYYY-MM-DD'` (ex: `'2025-10-21'`)
- `start_time` : `'HH:MM'` (ex: `'09:00'`)
- `end_time` : `'HH:MM'` (ex: `'12:00'`)
- `label` : Texte libre (ex: `'Matin'`, `'Après-midi'`, `'Soirée'`)
- `capacity_limit` : Nombre max de réservations (ex: `5`)
- `notes` : Description optionnelle

#### Étape 2 : Exécuter dans Supabase

1. **Ouvrir Supabase Dashboard** : https://supabase.com
2. **Aller dans SQL Editor** (menu latéral)
3. **Cliquer sur "+ New query"**
4. **Copier tout le contenu** de `create-slots-simple.sql`
5. **Coller dans l'éditeur**
6. **Cliquer sur "Run"** (ou `Cmd+Enter` / `Ctrl+Enter`)

#### Sortie Attendue

```
✅ Script exécuté avec succès!
📊 Nombre de créneaux créés: 16

📋 Résumé par date:
   2025-10-14 : 3 collecte(s) + 3 livraison(s)
   2025-10-16 : 3 collecte(s) + 3 livraison(s)
   2025-10-18 : 2 collecte(s) + 2 livraison(s)

🎉 Créneaux disponibles dans l'application!
```

---

## 🛠️ Cas d'Usage Courants

### Créer une semaine complète de créneaux

```typescript
// Dans create-slots.ts
const DAYS = ["2025-10-21", "2025-10-23", "2025-10-25"] // Lun, Mer, Ven
const TIMES = [
  { start: "09:00", end: "12:00", label: "Matin" },
  { start: "14:00", "17:00", label: "Après-midi" },
  { start: "18:00", end: "21:00", label: "Soirée" },
]

const SLOT_CONFIG = DAYS.flatMap(date => 
  TIMES.map(time => ({
    date,
    startTime: time.start,
    endTime: time.end,
    label: time.label,
    createBoth: true,
  }))
)
```

### Créer uniquement des créneaux de collecte (sans livraison)

```typescript
{
  date: "2025-10-21",
  startTime: "09:00",
  endTime: "12:00",
  label: "Matin",
  createBoth: false,  // ← Pas de livraison
}
```

### Créer un créneau avec capacité limitée

Modifier la constante `DEFAULT_CAPACITY` :

```typescript
const DEFAULT_CAPACITY = 10 // Au lieu de 5
```

Ou directement dans le SQL :

```sql
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, capacity_limit, ...)
VALUES 
  ('pickup', '2025-10-21', '09:00', '12:00', 'Matin', TRUE, 10, 0, ...);
  --                                                          ↑ Capacité modifiée
```

---

## 🔍 Requêtes Utiles

### Voir tous les créneaux disponibles

```sql
SELECT 
  role,
  slot_date,
  start_time,
  end_time,
  label,
  capacity_limit,
  capacity_used,
  (capacity_limit - capacity_used) as remaining,
  is_open
FROM logistic_slots 
WHERE slot_date >= CURRENT_DATE 
  AND is_open = TRUE
ORDER BY slot_date, role, start_time;
```

### Fermer un créneau (le rendre indisponible)

```sql
-- Fermer par date + horaire + rôle
UPDATE logistic_slots 
SET is_open = FALSE 
WHERE slot_date = '2025-10-21' 
  AND start_time = '09:00' 
  AND role = 'pickup';

-- Ou fermer par ID (plus précis)
UPDATE logistic_slots 
SET is_open = FALSE 
WHERE id = 'uuid-du-slot';
```

### Rouvrir un créneau fermé

```sql
UPDATE logistic_slots 
SET is_open = TRUE 
WHERE slot_date = '2025-10-21' 
  AND start_time = '09:00';
```

### Modifier la capacité d'un créneau

```sql
UPDATE logistic_slots 
SET capacity_limit = 10 
WHERE slot_date = '2025-10-21' 
  AND start_time = '09:00';
```

### Supprimer des créneaux

```sql
-- Supprimer une date spécifique
DELETE FROM logistic_slots 
WHERE slot_date = '2025-10-21';

-- Supprimer une plage de dates
DELETE FROM logistic_slots 
WHERE slot_date BETWEEN '2025-10-14' AND '2025-10-18';

-- Supprimer tous les créneaux de test (ancien)
DELETE FROM logistic_slots 
WHERE slot_date < CURRENT_DATE;
```

### Vérifier les créneaux les plus demandés

```sql
SELECT 
  slot_date,
  start_time,
  end_time,
  label,
  role,
  capacity_used,
  capacity_limit,
  ROUND((capacity_used::numeric / capacity_limit * 100), 2) as fill_rate_percent
FROM logistic_slots 
WHERE slot_date >= CURRENT_DATE
  AND is_open = TRUE
ORDER BY fill_rate_percent DESC
LIMIT 10;
```

---

## ⚠️ Points d'Attention

### Format des Heures

- ✅ **Correct** : `"09:00"`, `"14:30"`, `"21:00"`
- ❌ **Incorrect** : `"9:00"` (pas de zéro), `"09:00:00"` (secondes automatiques par PostgreSQL)

Le code extrait automatiquement `HH:MM` des colonnes `TIME` PostgreSQL qui stockent `HH:MM:SS`.

### Dates Valides

- ✅ **Correct** : `"2025-10-21"` (format ISO YYYY-MM-DD)
- ❌ **Incorrect** : `"21/10/2025"`, `"10-21-2025"`

### Logique Métier

- Un créneau de **collecte** peut exister sans créneau de **livraison** correspondant
- Un créneau de **livraison** doit respecter les délais minimum après la collecte :
  - **Express** : 24h minimum
  - **Classic** : 72h minimum
- La validation se fait côté backend lors de la création de réservation

### Capacité

- `capacity_limit` : Nombre max de réservations
- `capacity_used` : Nombre actuel de réservations (mis à jour automatiquement)
- Si `capacity_used >= capacity_limit`, le créneau n'apparaît plus dans l'interface

---

## 🧪 Tester les Créneaux Créés

Après exécution du script :

1. **Ouvrir l'application** : `http://localhost:3000/reservation/guest`
2. **Aller à l'étape 3** : "Collecte & Livraison"
3. **Vérifier que les créneaux apparaissent** :
   - Onglets avec les dates configurées
   - Cartes avec les horaires et labels

---

## 📚 Ressources

- **Migration DB** : `supabase/migrations/20251013000000_create_logistic_slots.sql`
- **Types** : `lib/types/logistic-slots.ts`
- **Service** : `lib/services/logistic-slots.ts`
- **API** : `app/api/logistic-slots/route.ts`
- **Composant UI** : `components/booking/collection-delivery-step.tsx`

---

## 🆘 Dépannage

### Erreur "Variables d'environnement manquantes" (Script TS)

Vérifier `.env.local` :
```bash
cat .env.local | grep SUPABASE
```

### Erreur SQL "permission denied"

Utiliser la clé **service_role** (pas la clé anon) dans le script TypeScript.

### Les créneaux n'apparaissent pas dans l'interface

1. Vérifier que `is_open = TRUE` :
   ```sql
   SELECT * FROM logistic_slots WHERE is_open = FALSE;
   ```

2. Vérifier que la date est future :
   ```sql
   SELECT * FROM logistic_slots WHERE slot_date < CURRENT_DATE;
   ```

3. Vérifier les RLS policies (Supabase Dashboard > Authentication > Policies)

---

**Bonne création de créneaux ! 🎉**
