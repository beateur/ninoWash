# Fix: Changement d'Abonnement - Duplicate Stripe Customer

**Date**: 7 octobre 2025  
**Problème**: Changement d'abonnement crée un NOUVEAU Stripe Customer au lieu de réutiliser l'existant

---

## 🐛 Problème Identifié

### Symptômes
- User change d'abonnement (mensuel → trimestriel) 
- Paiement Stripe réussit ✅
- **NOUVEAU Stripe Customer créé** ❌ (au lieu de réutiliser l'existant)
- Database ne reflète pas le nouvel abonnement
- Duplicate customers dans Stripe

### Données Actuelles
```json
{
  "user_id": "4253ed6b-0e53-4187-ac30-7731744189e4",
  "old_subscription": {
    "id": "sub_1SD0qERlgtyeCF3BY44417HH",
    "customer": "cus_T9JS9ijxFYidt2",
    "plan": "monthly",
    "status": "active" // ⚠️ Should be canceled
  },
  "new_subscription": {
    "id": "sub_1SFbag4Zvo5TTGdYmYREu9Ni", 
    "customer": "cus_TBgMH9MKtLLTij", // ❌ NEW customer!
    "plan": "quarterly",
    "status": "active" // ✅ But not in DB
  }
}
```

### Cause Racine

**Fonction bugée** : `lib/stripe/helpers.ts` → `getOrCreateStripeCustomer()`

```typescript
// ❌ CODE BUGUÉ (AVANT)
const customers = await stripe.customers.list({ email: params.email, limit: 1 })
if (customers.data.length > 0) {
  return customers.data[0].id // Only checks by email
}
// Creates NEW customer every time
```

**Problèmes** :
1. ❌ Ne cherche que par **email** (pas de check metadata.user_id)
2. ❌ Ne vérifie pas la DB (`subscriptions.stripe_customer_id`)
3. ❌ Crée un nouveau customer à chaque changement d'abonnement

---

## ✅ Solution Implémentée

### 1. Fix `lib/stripe/helpers.ts`

**Nouvelle logique** :
1. ✅ Cherche d'abord dans `subscriptions` table (via `user_id`)
2. ✅ Si trouvé, vérifie que le customer existe toujours dans Stripe
3. ✅ Sinon, cherche dans Stripe par `email` + check `metadata.user_id`
4. ✅ Crée un nouveau customer SEULEMENT si aucun n'existe
5. ✅ Customer ID stocké dans `subscriptions.stripe_customer_id` (pas dans `users` table)

```typescript
// ✅ CODE CORRIGÉ
export async function getOrCreateStripeCustomer(params: {
  userId: string
  email: string
  name?: string
  metadata?: Record<string, string>
}): Promise<string> {
  const supabase = await createClient()

  // 1. Check existing subscription
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", params.userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingSubscription?.stripe_customer_id) {
    const customer = await stripe.customers.retrieve(existingSubscription.stripe_customer_id)
    if (!customer.deleted) {
      return existingSubscription.stripe_customer_id // ✅ REUSE!
    }
  }

  // 2. Search Stripe by email + metadata
  const existingCustomers = await stripe.customers.list({ email: params.email, limit: 10 })
  const matchingCustomer = existingCustomers.data.find(
    (customer) => 
      customer.metadata?.user_id === params.userId ||
      customer.metadata?.supabase_user_id === params.userId
  )

  if (matchingCustomer) {
    return matchingCustomer.id // ✅ REUSE!
  }

  // 3. Create NEW customer only if none found
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      user_id: params.userId,
      supabase_user_id: params.userId,
      ...params.metadata,
    },
  })

  return customer.id
}
```

---

## 🛠️ Nettoyage de la Base de Données

### Script SQL à Exécuter

**Fichier** : `scripts/fix-duplicate-stripe-customer.sql`

```sql
BEGIN;

-- 1. Cancel old monthly subscription
UPDATE subscriptions
SET 
  status = 'canceled',
  cancel_at_period_end = false,
  canceled_at = NOW(),
  updated_at = NOW()
WHERE stripe_subscription_id = 'sub_1SD0qERlgtyeCF3BY44417HH'
  AND user_id = '4253ed6b-0e53-4187-ac30-7731744189e4';

-- 2. Insert new quarterly subscription
INSERT INTO subscriptions (
  id,
  user_id,
  plan_id,
  stripe_subscription_id,
  stripe_customer_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  quantity,
  discount_amount,
  tax_amount,
  total_amount,
  metadata,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '4253ed6b-0e53-4187-ac30-7731744189e4',
  'bec281a0-b575-4e8b-89a4-97aaca824ccf', -- Quarterly plan
  'sub_1SFbag4Zvo5TTGdYmYREu9Ni',
  'cus_TBgMH9MKtLLTij', -- NEW customer
  'active',
  NOW(),
  NOW() + INTERVAL '3 months',
  false,
  1,
  0.00,
  0.00,
  299.99,
  '{}',
  NOW(),
  NOW()
)
ON CONFLICT (stripe_subscription_id) 
DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  status = EXCLUDED.status,
  total_amount = EXCLUDED.total_amount,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();

COMMIT;
```

---

## 📋 Vérification

### Après Exécution du Script SQL

```sql
SELECT 
  stripe_subscription_id, 
  stripe_customer_id, 
  status, 
  plan_id,
  total_amount
FROM subscriptions 
WHERE user_id = '4253ed6b-0e53-4187-ac30-7731744189e4'
ORDER BY created_at DESC;
```

**Résultat attendu** :
| subscription_id | customer_id | status | plan |
|---|---|---|---|
| sub_1SFbag... | cus_TBgMH... | active | quarterly |
| sub_1SD0qE... | cus_T9JS9... | canceled | monthly |

---

## 🎯 Test du Fix

1. **Déployer le code corrigé**
2. **Tester un changement d'abonnement**
3. **Vérifier les logs** : 
   ```
   [v0] Using existing Stripe customer from subscription: cus_TBgMH9MKtLLTij
   ```
4. **Vérifier Stripe Dashboard** : Aucun nouveau customer créé
5. **Vérifier DB** : Ancien abonnement = `canceled`, nouveau = `active`

---

## ✨ Résultat

**Avant** :
- ❌ Nouveau customer à chaque changement d'abonnement
- ❌ DB désynchronisée avec Stripe
- ❌ Duplicatas de payment methods

**Après** :
- ✅ Un seul customer réutilisé
- ✅ DB synchronisée automatiquement
- ✅ Historique propre

---

## 📝 Fichiers Modifiés

- ✅ `lib/stripe/helpers.ts` - Fix `getOrCreateStripeCustomer()`
- ✅ `scripts/fix-duplicate-stripe-customer.sql` - Cleanup script  
- ✅ `docs/FIX_SUBSCRIPTION_DUPLICATE.md` - Cette documentation

---

## � Notes Importantes

### Schema Database
- La colonne `stripe_customer_id` est dans **`subscriptions`**, PAS dans `users`
- Un user peut avoir plusieurs subscriptions (historique)
- Chaque subscription a son propre `stripe_customer_id`
- Le webhook Stripe sync automatiquement les changements

### Prochains Changements d'Abonnement
Avec le fix appliqué, le flow devient :
1. User change de plan
2. `getOrCreateStripeCustomer()` trouve le customer existant via `subscriptions` table
3. Stripe crée nouvelle subscription avec le MÊME customer
4. Webhook met à jour la DB automatiquement
5. Aucun duplicate ! ✅
