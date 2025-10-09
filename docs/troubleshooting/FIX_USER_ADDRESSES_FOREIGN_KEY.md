# Fix: user_addresses Foreign Key Error

**Date**: 8 janvier 2025  
**Issue**: Foreign key constraint `user_addresses_user_id_fkey` points to wrong table  
**Error**: `Key (user_id)=(xxx) is not present in table "users"`

---

## 🐛 Problème

La table `user_addresses` a une contrainte de clé étrangère qui pointe vers `public.users` au lieu de `auth.users` (table d'authentification Supabase).

### Erreur Rencontrée

```
code: '23503',
details: 'Key (user_id)=(134d7be6-fdc5-4a45-89f9-4a0f5b21e474) is not present in table "users".',
message: 'insert or update on table "user_addresses" violates foreign key constraint "user_addresses_user_id_fkey"'
```

**Cause**: 
- Les utilisateurs sont stockés dans `auth.users` (table Supabase)
- La contrainte FK pointe vers `public.users` (qui n'existe pas ou est vide)
- Lors de la création d'une adresse, Supabase ne trouve pas l'utilisateur

---

## ✅ Solution

### Option 1: Via Script (Recommandé)

```bash
# 1. Définir l'URL de votre base de données
export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres'

# 2. Exécuter le script
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
./scripts/apply-user-addresses-fix.sh
```

---

### Option 2: Via Supabase Dashboard (Manuel)

1. **Ouvrir Supabase Dashboard**
   - Aller sur [app.supabase.com](https://app.supabase.com)
   - Sélectionner votre projet

2. **Ouvrir SQL Editor**
   - Menu latéral → SQL Editor
   - Cliquer sur "New query"

3. **Copier/Coller ce SQL**

```sql
-- Drop the incorrect foreign key constraint
ALTER TABLE public.user_addresses 
DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;

-- Add the correct foreign key constraint pointing to auth.users
ALTER TABLE public.user_addresses
ADD CONSTRAINT user_addresses_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Verify the constraint exists
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_addresses'
  AND kcu.column_name = 'user_id';
```

4. **Exécuter la requête**
   - Cliquer sur "Run" (ou Ctrl+Enter)
   - Vérifier le résultat

**Résultat attendu** :
```
constraint_name              | user_addresses_user_id_fkey
table_name                   | user_addresses
column_name                  | user_id
foreign_table_schema         | auth
foreign_table_name           | users
foreign_column_name          | id
```

✅ La contrainte pointe maintenant vers `auth.users` !

---

## 🧪 Test de Validation

Après avoir appliqué la migration :

### 1. Test Création d'Adresse (Booking Flow)

```bash
# 1. Démarrer le serveur de développement
pnpm dev

# 2. Ouvrir le navigateur
open http://localhost:3000/reservation
```

**Étapes** :
1. Cliquer sur "Nouvelle réservation"
2. Sélectionner services
3. Aller à l'étape "Adresses"
4. Cliquer "Ajouter une nouvelle adresse"
5. Remplir le formulaire
6. Cliquer "Enregistrer"

**Résultat attendu** :
- ✅ Adresse créée avec succès
- ✅ Pas d'erreur 500
- ✅ Adresse apparaît dans la liste

---

### 2. Vérifier dans la Base de Données

Via Supabase Dashboard → Table Editor → `user_addresses`

```sql
SELECT 
  id,
  user_id,
  label,
  type,
  street_address,
  city,
  postal_code,
  created_at
FROM public.user_addresses
WHERE user_id = 'VOTRE_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

---

### 3. Test API Direct

```bash
# Créer une adresse via API
curl -X POST http://localhost:3000/api/addresses \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "label": "Domicile",
    "type": "home",
    "streetAddress": "123 rue de la Paix",
    "city": "Paris",
    "postalCode": "75001",
    "buildingInfo": "Bâtiment A",
    "accessInstructions": "Code 1234"
  }'
```

**Résultat attendu** :
```json
{
  "address": {
    "id": "uuid",
    "user_id": "uuid",
    "label": "Domicile",
    ...
  },
  "message": "Adresse créée avec succès"
}
```

---

## 🔍 Diagnostic

Si le problème persiste après la migration :

### 1. Vérifier la contrainte actuelle

```sql
SELECT
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_addresses'
  AND constraint_type = 'FOREIGN KEY';
```

### 2. Vérifier l'utilisateur existe dans auth.users

```sql
SELECT id, email, created_at
FROM auth.users
WHERE id = '134d7be6-fdc5-4a45-89f9-4a0f5b21e474';
```

Si vide → L'utilisateur n'existe pas (problème d'authentification)

### 3. Vérifier les logs backend

```bash
# Dans le terminal où tourne `pnpm dev`
# Rechercher les logs :
[v0] Address creation error: ...
```

---

## 📝 Checklist Post-Migration

- [ ] Migration appliquée avec succès
- [ ] Contrainte FK pointe vers `auth.users`
- [ ] Test création adresse dans booking flow (✅)
- [ ] Test création adresse via `/addresses` page (✅)
- [ ] Test modification adresse (✅)
- [ ] Test suppression adresse (✅)
- [ ] Vérifier données dans Supabase Dashboard (✅)

---

## 🚨 Rollback (Si Problème)

Si la migration cause des problèmes :

```sql
-- Revenir à l'ancien état (déconseillé)
ALTER TABLE public.user_addresses 
DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;

ALTER TABLE public.user_addresses
ADD CONSTRAINT user_addresses_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;
```

**⚠️ Attention** : Cela ne résoudra pas le problème, juste le restaurera.

---

## 📚 Références

- **Migration file**: `supabase/migrations/20250108000000_fix_user_addresses_foreign_key.sql`
- **Script**: `scripts/apply-user-addresses-fix.sh`
- **Supabase Docs**: [Foreign Keys](https://supabase.com/docs/guides/database/tables#foreign-keys)
- **PostgreSQL Docs**: [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

---

## 💡 Prévention Future

Pour éviter ce genre de problème :

1. **Toujours utiliser `auth.users`** pour les FK utilisateur
2. **Vérifier les migrations** avant application
3. **Tester localement** avec Supabase local instance
4. **Documentation** : Maintenir le schéma à jour dans `docs/DATABASE_SCHEMA.md`

---

**Status**: ✅ **RÉSOLU** après application de la migration
