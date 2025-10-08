# Guide: Test du Fix Stripe Subscription Duplicate

**Date:** 7 octobre 2025  
**Objectif:** Tester que le changement d'abonnement réutilise le customer existant et que le webhook crée correctement la ligne en DB

---

## ✅ Corrections Appliquées

### 1. **Erreur TypeScript corrigée**
- ❌ **Avant:** `fetchClientSecret` pouvait retourner `null`
- ✅ **Après:** Vérifie que `client_secret` existe, sinon lance une erreur

**Fichiers modifiés:**
- `app/actions/stripe.ts` - Ajout validation `client_secret`
- `components/subscription/checkout-form.tsx` - Type de retour explicite `Promise<string>`

### 2. **Webhook Secret configuré**
- ✅ Stripe CLI en écoute : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- ✅ Secret ajouté à `.env.local` : `STRIPE_WEBHOOK_SECRET=whsec_3ff1d...`
- ⚠️ **IMPORTANT:** Redémarrez `pnpm dev` pour charger la nouvelle variable !

---

## 📋 Étapes de Test (Ordre Important)

### Étape 1: Redémarrer le Serveur Next.js

**Terminal 1 - Arrêter et redémarrer Next.js:**
```bash
# Arrêter le serveur actuel (Ctrl+C)
pnpm dev
```

### Étape 2: Lancer Stripe CLI (Nouveau Terminal)

**Terminal 2 - Webhook listener:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Vous devriez voir :
```
> Ready! You are using Stripe API Version [2025-08-27.basil]. 
Your webhook signing secret is whsec_3ff1d... (^C to quit)
```

### Étape 3: Exécuter le Script SQL de Nettoyage

**Dans Supabase SQL Editor**, exécutez :

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

-- 2. Insert new quarterly subscription (if not exists)
INSERT INTO subscriptions (
  id, user_id, plan_id, stripe_subscription_id, stripe_customer_id,
  status, current_period_start, current_period_end, cancel_at_period_end,
  quantity, discount_amount, tax_amount, total_amount, metadata,
  created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  '4253ed6b-0e53-4187-ac30-7731744189e4',
  'bec281a0-b575-4e8b-89a4-97aaca824ccf',
  'sub_1SFbag4Zvo5TTGdYmYREu9Ni',
  'cus_TBgMH9MKtLLTij',
  'active', NOW(), NOW() + INTERVAL '3 months', false,
  1, 0.00, 0.00, 299.99, '{}', NOW(), NOW()
)
ON CONFLICT (stripe_subscription_id) 
DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  status = EXCLUDED.status,
  updated_at = NOW();

COMMIT;
```

**Vérifiez ensuite:**
```sql
SELECT stripe_subscription_id, stripe_customer_id, status, plan_id
FROM subscriptions 
WHERE user_id = '4253ed6b-0e53-4187-ac30-7731744189e4'
ORDER BY created_at DESC;
```

Résultat attendu : 2 lignes (1 canceled, 1 active)

### Étape 4: Tester un Nouveau Changement d'Abonnement

1. **Ouvrir l'app** : `http://localhost:3000/subscription`
2. **Choisir un plan différent** (par exemple, revenir au mensuel)
3. **Observer les logs dans Terminal 1** (Next.js) :
   ```
   [v0] getOrCreateStripeCustomer called for user: ...
   [v0] Using existing Stripe customer from subscription: cus_TBgMH9MKtLLTij
   [v0] User is changing subscription, canceling old subscription: sub_1SFbag...
   [v0] Old subscription canceled successfully
   [v0] Checkout session created: { sessionId: ..., clientSecret: "present", ... }
   ```

4. **Observer les logs dans Terminal 2** (Stripe CLI) :
   ```
   2025-10-07 ... --> checkout.session.completed [evt_...]
   2025-10-07 ... <-- [200] POST http://localhost:3000/api/webhooks/stripe
   ```

5. **Remplir les informations de paiement** (utiliser carte test Stripe : `4242 4242 4242 4242`)

6. **Après paiement réussi** :
   - ✅ Redirection vers `/subscription/success`
   - ✅ Vérifier dans Terminal 1 les logs du webhook :
     ```
     [v0] Webhook event type: checkout.session.completed
     [v0] Found existing subscriptions to replace: 1
     [v0] Subscription created successfully for user: ...
     ```

### Étape 5: Vérifier la Base de Données

```sql
-- Vérifier les subscriptions
SELECT 
  stripe_subscription_id, 
  stripe_customer_id, 
  status, 
  plan_id,
  created_at
FROM subscriptions 
WHERE user_id = '4253ed6b-0e53-4187-ac30-7731744189e4'
ORDER BY created_at DESC;
```

**Résultat attendu:**
| subscription_id | customer_id | status | plan | created_at |
|---|---|---|---|---|
| sub_NOUVEAU... | cus_TBgMH9MKtLLTij | active | monthly | 2025-10-07 (nouveau) |
| sub_1SFbag... | cus_TBgMH9MKtLLTij | canceled | quarterly | 2025-10-07 |
| sub_1SD0qE... | cus_T9JS9ijxFYidt2 | canceled | monthly | 2025-09-30 |

**✅ SUCCESS CRITERIA:**
- ✅ **Même customer_id** pour les 2 dernières subscriptions (`cus_TBgMH9MKtLLTij`)
- ✅ Ancienne subscription = `canceled`
- ✅ Nouvelle subscription = `active`

---

## 🔍 Logs à Surveiller

### Terminal 1 (Next.js - `pnpm dev`)
```
[v0] getOrCreateStripeCustomer called for user: 4253ed6b-...
[v0] Using existing Stripe customer from subscription: cus_TBgMH9MKtLLTij
[v0] User is changing subscription, canceling old subscription: sub_1SFbag...
[v0] Checkout session created: { sessionId: cs_..., clientSecret: "present" }
```

### Terminal 2 (Stripe CLI)
```
2025-10-07 ... --> checkout.session.completed [evt_1ABC...]
2025-10-07 ... <-- [200] POST http://localhost:3000/api/webhooks/stripe
```

### Après Webhook Reçu (Terminal 1)
```
[v0] Webhook received, signature present: true
[v0] Webhook event type: checkout.session.completed
[v0] Checkout session completed: { sessionId: ..., customerId: cus_TBgMH... }
[v0] Found existing subscriptions to replace: 1
[v0] Subscription created successfully for user: 4253ed6b-...
```

---

## ⚠️ Troubleshooting

### Problème : Webhook non reçu
**Cause:** Stripe CLI pas lancé OU mauvais port  
**Solution:**
```bash
# Vérifier que Stripe CLI écoute
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Vérifier le port de Next.js (devrait être 3000)
```

### Problème : Erreur 401 "Invalid signature"
**Cause:** `STRIPE_WEBHOOK_SECRET` pas à jour  
**Solution:**
1. Copier le secret depuis le terminal Stripe CLI
2. Mettre à jour `.env.local`
3. **REDÉMARRER** `pnpm dev`

### Problème : Subscription pas créée en DB
**Cause:** Metadata manquant dans checkout session  
**Solution:** Vérifier les logs webhook :
```
[v0] Missing userId or planId in session metadata
```

### Problème : Duplicate customer créé quand même
**Cause:** Ancien code toujours en cache  
**Solution:**
```bash
# Hard restart
rm -rf .next
pnpm dev
```

---

## 📊 Résultat Attendu

**Avant le Fix:**
- ❌ Chaque changement = Nouveau customer
- ❌ DB désynchronisée
- ❌ Plusieurs customers pour 1 user

**Après le Fix:**
- ✅ Un seul customer réutilisé (`cus_TBgMH9MKtLLTij`)
- ✅ DB synchronisée automatiquement par webhook
- ✅ Historique propre avec subscriptions canceled/active

---

## 🎯 Checklist Finale

Avant de déployer en production :

- [ ] Script SQL de nettoyage exécuté
- [ ] Stripe CLI testé en local (webhooks fonctionnent)
- [ ] Changement d'abonnement testé (aucun duplicate)
- [ ] Logs confirment réutilisation du customer
- [ ] DB reflète correctement l'état (canceled/active)
- [ ] `.env.local` a `STRIPE_WEBHOOK_SECRET` correct
- [ ] **IMPORTANT:** Configurer webhook en production Stripe Dashboard :
  - URL: `https://votre-domaine.com/api/webhooks/stripe`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Copier le **nouveau** signing secret production vers variables d'environnement

---

## 📝 Commandes Rapides

```bash
# Terminal 1 - Next.js
pnpm dev

# Terminal 2 - Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3 - Vérifier DB
# (Ouvrir Supabase SQL Editor et exécuter les requêtes ci-dessus)
```

**N'oubliez pas de REDÉMARRER le serveur Next.js après avoir ajouté le webhook secret !** 🔄
