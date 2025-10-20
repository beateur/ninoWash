# ⚠️ DOCUMENT ARCHIVÉ - Correction du problème de schéma de base de données

> **Statut :** ✅ RÉSOLU  
> **Date de résolution :** Septembre 2025  
> **Document actuel :** Voir [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) pour le schéma à jour  
> **Changements récents :** Voir [`docs/TECHNICAL_CHANGELOG.md`](docs/TECHNICAL_CHANGELOG.md)

---

## 📌 Contexte Historique

Ce document décrit un problème de schéma de base de données qui a été résolu. Il est conservé à titre de référence historique.

---

## Problème identifié (RÉSOLU)

L'application rencontrait des erreurs 400/500 en cascade dues à un décalage entre le code et le schéma réel de la base de données Supabase.

### Erreurs observées

1. **Erreur initiale (400):**
   \`\`\`
   column subscription_plans_1.code does not exist
   \`\`\`

2. **Cascade d'erreurs:**
   - Boucle infinie de requêtes
   - Rate limiting Supabase (429 "Too Many Requests")
   - Erreurs de parsing JSON (500)

### Cause racine

Le code essayait de sélectionner des colonnes inexistantes dans la table `subscription_plans`:
- ❌ `code` (n'existe pas)
- ❌ `type` (devrait être `plan_type`)
- ❌ `included_services` (n'existe pas)
- ❌ `extra_service_price` (n'existe pas)

## Schéma réel de Supabase

### Table `subscription_plans`
\`\`\`
- id: uuid
- name: text
- description: text (nullable)
- plan_type: text (NOT "type")
- billing_interval: text
- price_amount: numeric (NOT "price")
- currency: text
- trial_days: integer (nullable)
- features: jsonb
- metadata: jsonb (nullable)
- is_active: boolean (nullable)
- is_public: boolean (nullable)
- sort_order: integer (nullable)
- created_at: timestamptz (nullable)
- updated_at: timestamptz (nullable)
\`\`\`

### Table `subscriptions`
\`\`\`
- id: uuid
- user_id: uuid
- plan_id: uuid
- status: text
- current_period_start: timestamptz
- current_period_end: timestamptz
- trial_start: timestamptz (nullable)
- trial_end: timestamptz (nullable)
- canceled_at: timestamptz (nullable)
- cancel_at_period_end: boolean (nullable)
- stripe_subscription_id: text (nullable)
- stripe_customer_id: text (nullable)
- payment_method_id: uuid (nullable)
- quantity: integer (nullable)
- discount_amount: numeric (nullable)
- tax_amount: numeric (nullable)
- total_amount: numeric
- next_billing_date: timestamptz (nullable)
- billing_cycle_anchor: timestamptz (nullable)
- metadata: jsonb (nullable)
- created_at: timestamptz (nullable)
- updated_at: timestamptz (nullable)
\`\`\`

## Corrections appliquées

### 1. API Routes
- ✅ `app/api/subscriptions/route.ts` - Utilise maintenant `plan_type`, `price_amount`, `billing_interval`, `currency`
- ✅ `app/api/subscriptions/plans/route.ts` - Sélectionne toutes les colonnes avec `*`

### 2. Frontend
- ✅ `app/subscription/page.tsx` - Interface TypeScript mise à jour avec le bon schéma
- ✅ Gestion d'erreur améliorée avec retry et affichage des erreurs de rate limit

### 3. Validations
- ✅ `lib/validations/payment.ts` - Schémas Zod mis à jour pour correspondre au schéma réel

## Solution si les erreurs persistent

Si vous voyez toujours les anciennes erreurs après ces corrections, c'est un problème de **cache**:

### Option 1: Hard Refresh du navigateur
1. Ouvrez les DevTools (F12)
2. Cliquez droit sur le bouton de rafraîchissement
3. Sélectionnez "Vider le cache et actualiser"

### Option 2: Redémarrage du serveur Next.js
1. Arrêtez le serveur de développement (Ctrl+C)
2. Supprimez le dossier `.next` (cache de build)
3. Redémarrez avec `npm run dev`

### Option 3: Vérification Supabase
1. Allez dans le dashboard Supabase
2. Vérifiez que les tables `subscriptions` et `subscription_plans` existent
3. Vérifiez que les colonnes correspondent au schéma ci-dessus

## Prévention future

Pour éviter ce type de problème:

1. **Toujours synchroniser le schéma:**
   - Mettez à jour les types TypeScript quand vous modifiez la base de données
   - Utilisez des migrations SQL versionnées

2. **Validation stricte:**
   - Les schémas Zod doivent refléter exactement la structure de la base de données
   - Ajoutez des tests d'intégration pour les requêtes API

3. **Gestion d'erreur robuste:**
   - Vérifiez toujours le statut HTTP avant de parser le JSON
   - Gérez les erreurs 429 (rate limit) avec retry et backoff exponentiel
   - Évitez les boucles infinies de requêtes avec useCallback et dépendances correctes

## Fichiers modifiés

- `app/api/subscriptions/route.ts`
- `app/api/subscriptions/plans/route.ts`
- `app/subscription/page.tsx`
- `lib/validations/payment.ts`
