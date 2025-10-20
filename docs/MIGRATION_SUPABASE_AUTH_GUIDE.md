# Migration vers Supabase Auth Natif - Guide Complet

## 📋 Contexte

Le projet utilisait une architecture hybride avec :
- `public.users` (table custom) ❌
- `auth.users` (Supabase Auth) ✅
- `public.user_profiles` (extension de auth.users) ✅

Cette architecture causait des incohérences et des profils orphelins.

## 🎯 Solution Mise en Place

### Architecture Finale (Supabase Auth Natif)

```
auth.users (Supabase Auth natif)
    ↓ (1:1 relation)
public.user_profiles (données de profil étendues)
    ↓ (relations)
public.user_addresses, bookings, etc.
```

### Vue de Compatibilité

Pour maintenir la compatibilité avec le code existant, une vue `public.users` a été créée :

```sql
CREATE VIEW public.users AS
SELECT 
  au.id,
  au.email,
  up.first_name,
  up.last_name,
  up.phone,
  ...
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id;
```

## 🔧 Migration à Effectuer

### Étape 1: Exécuter le Script de Migration

```bash
# Connectez-vous à Supabase Dashboard
# SQL Editor > New Query > Coller le contenu de:
scripts/MIGRATION_TO_SUPABASE_AUTH.sql

# Ou via CLI:
psql $DATABASE_URL -f scripts/MIGRATION_TO_SUPABASE_AUTH.sql
```

### Étape 2: Corriger les Fichiers Utilisant `public.users`

#### ❌ Code à NE PLUS utiliser (5 fichiers identifiés)

1. **`app/api/auth/signup/route.ts`** (ligne 36)
2. **`components/forms/profile-form.tsx`** (ligne 68)
3. **`app/actions/payment-methods.ts`** (lignes 46, 70)
4. **`app/(authenticated)/profile/page.tsx`** (ligne 9)

#### ✅ Solutions

**Option A: Utiliser la vue (compatibilité immédiate)**
```typescript
// Fonctionne tel quel grâce à la vue
const { data } = await supabase.from("users").select("*")
```

**Option B: Utiliser user_profiles (recommandé à terme)**
```typescript
// Meilleure pratique
const { data } = await supabase.from("user_profiles").select("*")
```

## 📝 Fichiers à Modifier

### 1. `app/api/auth/signup/route.ts`

**Problème actuel:**
```typescript
// Ligne 36: Tente d'insérer dans public.users
const { error: dbError } = await supabase.from("users").insert({
  id: authData.user.id,
  email: validatedData.email,
  // ...
})
```

**Solution:**
```typescript
// Le trigger handle_new_user() crée automatiquement le user_profile
// Ce code est REDONDANT et peut être SUPPRIMÉ
// OU mettre à jour user_profiles si données supplémentaires:
const { error: dbError } = await supabase.from("user_profiles").upsert({
  id: authData.user.id,
  first_name: validatedData.firstName,
  last_name: validatedData.lastName,
  phone: validatedData.phone,
  display_name: `${validatedData.firstName} ${validatedData.lastName}`,
})
```

### 2. `components/forms/profile-form.tsx`

**Problème actuel:**
```typescript
// Ligne 68: UPDATE sur public.users
const { error: dbError } = await supabase
  .from("users")
  .update({
    first_name: data.firstName,
    // ...
  })
```

**Solution:**
```typescript
// Utiliser user_profiles
const { error: dbError } = await supabase
  .from("user_profiles")
  .update({
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone,
    updated_at: new Date().toISOString(),
  })
  .eq("id", user.id)
```

### 3. `app/actions/payment-methods.ts`

**Problème actuel:**
```typescript
// Ligne 46: SELECT stripe_customer_id depuis public.users
const { data: userData } = await supabase
  .from("users")
  .select("stripe_customer_id")
  .eq("id", user.id)
  .single()
```

**Solution:**
```typescript
// Stripe customer ID devrait être dans user metadata ou une table séparée
const { data: { user: authUser } } = await supabase.auth.getUser()
const stripeCustomerId = authUser?.user_metadata?.stripe_customer_id

// OU créer une table payment_customers
const { data: customerData } = await supabase
  .from("payment_customers")
  .select("stripe_customer_id")
  .eq("user_id", user.id)
  .single()
```

### 4. `app/(authenticated)/profile/page.tsx`

**Problème actuel:**
```typescript
// Ligne 9: SELECT depuis public.users
const { data: profile } = await supabase
  .from("users")
  .select("*")
  .eq("id", user.id)
  .single()
```

**Solution:**
```typescript
// Utiliser user_profiles
const { data: profile } = await supabase
  .from("user_profiles")
  .select("*")
  .eq("id", user.id)
  .single()
```

## ✅ Bonnes Pratiques à Adopter

### Pour la Création d'Utilisateurs

**Parcours Authentifié (Signup)**
```typescript
// 1. Créer via Supabase Auth
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      first_name: firstName,
      last_name: lastName,
    }
  }
})

// 2. Le trigger handle_new_user() crée automatiquement le user_profile
// Rien d'autre à faire !
```

**Parcours Guest (Admin Create)**
```typescript
// 1. Créer via Admin API
const { data, error } = await supabase.auth.admin.createUser({
  email: guestEmail,
  password: tempPassword,
  email_confirm: true,
  user_metadata: {
    full_name: guestName,
    phone: guestPhone,
  }
})

// 2. Le trigger handle_new_user() crée automatiquement le user_profile
// 3. Optionnel: mettre à jour avec plus de données
await supabase.from("user_profiles").update({
  phone: guestPhone,
  // ... autres données
}).eq("id", data.user.id)
```

### Pour la Lecture de Données

**Préférer user_profiles:**
```typescript
// ✅ RECOMMANDÉ
const { data: profile } = await supabase
  .from("user_profiles")
  .select(`
    *,
    user_addresses (*)
  `)
  .eq("id", userId)
  .single()
```

**Ou utiliser la vue pour compatibilité:**
```typescript
// ✅ OK (transition)
const { data: user } = await supabase
  .from("users") // C'est la vue
  .select("*")
  .eq("id", userId)
  .single()
```

### Pour la Mise à Jour

**Toujours via user_profiles:**
```typescript
// ✅ CORRECT
const { error } = await supabase
  .from("user_profiles")
  .update({
    first_name: newFirstName,
    last_name: newLastName,
  })
  .eq("id", userId)
```

## 🧪 Tests à Effectuer

1. **Test Signup:**
   ```bash
   # Créer un nouveau compte
   # Vérifier que:
   # - auth.users a l'entrée
   # - user_profiles a l'entrée correspondante
   # - Aucune erreur dans les logs
   ```

2. **Test Guest Booking:**
   ```bash
   # Faire une réservation guest
   # Vérifier que:
   # - auth.users a l'utilisateur
   # - user_profiles a le profil
   # - booking est créé
   ```

3. **Test Profile Update:**
   ```bash
   # Mettre à jour le profil
   # Vérifier que:
   # - user_profiles est mis à jour
   # - Pas d'erreur de contrainte FK
   ```

## 📊 Vérifications Post-Migration

```sql
-- 1. Tous les auth.users ont un user_profile
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM user_profiles) as profiles,
  (SELECT COUNT(*) FROM auth.users au 
   WHERE NOT EXISTS (
     SELECT 1 FROM user_profiles up WHERE up.id = au.id
   )) as users_without_profile;

-- 2. Aucun profil orphelin
SELECT COUNT(*) as orphan_profiles
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = up.id
);

-- 3. Contraintes FK correctes
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conname LIKE '%user%fkey%';
```

## 🚨 Erreurs Courantes et Solutions

### Erreur: "violates foreign key constraint user_profiles_id_fkey"
**Cause:** Tentative de créer un user_profile sans auth.user correspondant
**Solution:** Toujours créer via `supabase.auth.signUp()` ou `admin.createUser()`

### Erreur: "relation public.users does not exist"
**Cause:** La migration n'a pas été exécutée
**Solution:** Exécuter `scripts/MIGRATION_TO_SUPABASE_AUTH.sql`

### Erreur: "column stripe_customer_id does not exist"
**Cause:** stripe_customer_id n'est plus dans public.users
**Solution:** Utiliser user_metadata ou créer table payment_customers

## 📅 Plan de Transition

1. **Phase 1 (Immédiat):** ✅
   - Exécuter la migration SQL
   - Vue de compatibilité active
   - Code continue de fonctionner

2. **Phase 2 (1-2 semaines):**
   - Modifier les 5 fichiers identifiés
   - Utiliser user_profiles au lieu de la vue
   - Tests approfondis

3. **Phase 3 (après validation):**
   - Supprimer users_deprecated
   - Supprimer la vue users (optionnel)
   - Architecture 100% Supabase Auth native

## 📞 Support

En cas de problème:
1. Vérifier les logs Supabase
2. Consulter ce guide
3. Vérifier les triggers et contraintes FK
