# ✅ Scripts de Création de Créneaux - Guide Rapide

## 🎯 Deux Options Disponibles

### Option 1 : Script TypeScript (Recommandé) ⭐

**Commande** :
\`\`\`bash
pnpm slots:create
\`\`\`

**Avantages** :
- ✅ Validation automatique
- ✅ Retour coloré dans le terminal
- ✅ Comptage automatique
- ✅ Détection d'erreurs

**Configuration** :
Ouvrir `scripts/create-slots.ts` et modifier :

\`\`\`typescript
const SLOT_CONFIG: SlotConfig[] = [
  {
    date: "2025-10-21",      // Date (YYYY-MM-DD)
    startTime: "09:00",      // Début (HH:MM)
    endTime: "12:00",        // Fin (HH:MM)
    label: "Matin",          // Label affiché
    createBoth: true,        // true = pickup + delivery
    notes: "Mon créneau",    // Notes optionnelles
  },
  // Ajouter d'autres créneaux...
]
\`\`\`

Puis exécuter :
\`\`\`bash
pnpm slots:create
\`\`\`

---

### Option 2 : Script SQL (Plus Simple) 📝

**Étapes** :
1. Ouvrir `scripts/create-slots-simple.sql`
2. Modifier les blocs `INSERT INTO` :
   \`\`\`sql
   INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, capacity_limit, capacity_used, notes)
   VALUES 
     ('pickup', '2025-10-21', '09:00', '12:00', 'Matin', TRUE, 5, 0, 'Mon créneau'),
     ('delivery', '2025-10-21', '09:00', '12:00', 'Matin', TRUE, 5, 0, 'Mon créneau');
   \`\`\`
3. Copier tout le fichier
4. Ouvrir Supabase Dashboard > SQL Editor
5. Coller et exécuter (Run)

---

## 🧪 Tester les Créneaux

Après exécution :
1. Ouvrir `http://localhost:3000/reservation/guest`
2. Aller à l'étape 3 : "Collecte & Livraison"
3. Vérifier que les créneaux apparaissent

---

## 📖 Documentation Complète

👉 **[Guide Complet : docs/GUIDE_CREATE_SLOTS.md](../docs/GUIDE_CREATE_SLOTS.md)**

Contient :
- Instructions détaillées
- Cas d'usage avancés
- Requêtes SQL utiles (fermer/rouvrir/supprimer des créneaux)
- Dépannage

---

## 💡 Exemples Rapides

### Créer 3 créneaux pour une journée

**TypeScript** :
\`\`\`typescript
const SLOT_CONFIG = [
  { date: "2025-10-21", startTime: "09:00", endTime: "12:00", label: "Matin", createBoth: true },
  { date: "2025-10-21", startTime: "14:00", endTime: "17:00", label: "Après-midi", createBoth: true },
  { date: "2025-10-21", startTime: "18:00", endTime: "21:00", label: "Soirée", createBoth: true },
]
\`\`\`

**SQL** :
\`\`\`sql
-- Matin
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, capacity_limit, capacity_used)
VALUES 
  ('pickup', '2025-10-21', '09:00', '12:00', 'Matin', TRUE, 5, 0),
  ('delivery', '2025-10-21', '09:00', '12:00', 'Matin', TRUE, 5, 0);

-- Après-midi
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, capacity_limit, capacity_used)
VALUES 
  ('pickup', '2025-10-21', '14:00', '17:00', 'Après-midi', TRUE, 5, 0),
  ('delivery', '2025-10-21', '14:00', '17:00', 'Après-midi', TRUE, 5, 0);

-- Soirée
INSERT INTO public.logistic_slots (role, slot_date, start_time, end_time, label, is_open, capacity_limit, capacity_used)
VALUES 
  ('pickup', '2025-10-21', '18:00', '21:00', 'Soirée', TRUE, 5, 0),
  ('delivery', '2025-10-21', '18:00', '21:00', 'Soirée', TRUE, 5, 0);
\`\`\`

---

## 🔍 Requêtes SQL Utiles

### Voir tous les créneaux
\`\`\`sql
SELECT role, slot_date, start_time, end_time, label, is_open, capacity_limit, capacity_used
FROM logistic_slots 
WHERE slot_date >= CURRENT_DATE 
ORDER BY slot_date, role, start_time;
\`\`\`

### Fermer un créneau
\`\`\`sql
UPDATE logistic_slots 
SET is_open = FALSE 
WHERE slot_date = '2025-10-21' AND start_time = '09:00' AND role = 'pickup';
\`\`\`

### Supprimer des créneaux
\`\`\`sql
DELETE FROM logistic_slots WHERE slot_date = '2025-10-21';
\`\`\`

---

**Besoin d'aide ?** Consultez `docs/GUIDE_CREATE_SLOTS.md` 📚
