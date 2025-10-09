# 🚀 Quick Fix - ALL User Foreign Keys

## Problème
Erreurs lors de la création d'adresse/réservation : `Key (user_id) is not present in table "users"`

**Tables affectées** :
- ❌ `user_addresses` → Création d'adresse échoue
- ❌ `bookings` → Création de réservation échoue
- ❌ `subscriptions`, `payments`, `payment_methods`, etc.

## Solution Rapide (2 min) - FIX COMPLET

### Via Supabase Dashboard

1. **Ouvrir** → [app.supabase.com](https://app.supabase.com) → Votre projet → SQL Editor

2. **Copier/Coller le contenu de ce fichier** :
   ```
   supabase/migrations/20250108000001_fix_all_user_foreign_keys.sql
   ```

   Ou directement ce code simplifié :

```sql
-- Fix ALL user_id foreign keys at once
DO $$
BEGIN
  -- user_addresses
  ALTER TABLE public.user_addresses DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;
  ALTER TABLE public.user_addresses ADD CONSTRAINT user_addresses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- bookings
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- subscriptions
  ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
  ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- payments
  ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
  ALTER TABLE public.payments ADD CONSTRAINT payments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- payment_methods
  ALTER TABLE public.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_user_id_fkey;
  ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- subscription_credits
  ALTER TABLE public.subscription_credits DROP CONSTRAINT IF EXISTS subscription_credits_user_id_fkey;
  ALTER TABLE public.subscription_credits ADD CONSTRAINT subscription_credits_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- credit_transactions
  ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;
  ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  RAISE NOTICE '✅ All foreign keys fixed!';
END $$;
```

3. **Cliquer sur "Run"** (ou `Ctrl+Enter`)

4. **Vérifier** : Vous devez voir `✅ All foreign keys fixed!`

✅ **C'est réglé pour TOUTES les tables !**

---

## Test Complet

```bash
# 1. Redémarrer le serveur (si nécessaire)
pnpm dev

# 2. Tester création d'adresse
open http://localhost:3000/addresses
# → Cliquer "Ajouter une adresse" → ✅ Devrait fonctionner

# 3. Tester création de réservation
open http://localhost:3000/reservation
# → Compléter le flow jusqu'à "Confirmer" → ✅ Devrait fonctionner

# 4. Vérifier dans Supabase
# → Dashboard → Table Editor → bookings → ✅ Nouvelle ligne créée
```

---

**Documentation complète** : 
- `docs/troubleshooting/FIX_USER_ADDRESSES_FOREIGN_KEY.md`
- Migration : `supabase/migrations/20250108000001_fix_all_user_foreign_keys.sql`
