# Guide de Test - Proration Intelligente

**Date**: 7 janvier 2025  
**Objectif**: Tester le système de proration upgrade/downgrade

---

## 🚀 Setup Rapide

### 1. Démarrer les Services

```bash
# Terminal 1 : Dev server
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
pnpm dev

# Terminal 2 : Stripe Webhook Listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3 : Logs Supabase (optionnel)
# Ouvrir Supabase Dashboard → Logs
```

### 2. Vérifier Configuration

- ✅ `.env.local` contient `STRIPE_WEBHOOK_SECRET`
- ✅ Stripe CLI connecté et en écoute
- ✅ Dev server tourne sur `localhost:3000`

---

## 🧪 Test 1 : Upgrade avec Proration

**Scénario** : User upgrade de Mensuel (99.99€) → Trimestriel (299.99€)

### Étapes

1. **Créer abonnement initial**
   - Aller sur `/subscription`
   - Choisir plan "Mensuel" (99.99€)
   - Compléter le paiement test
   - ✅ Vérifier redirection vers `/subscription/success`

2. **Vérifier dans Database**
   ```sql
   SELECT 
     id,
     plan_id,
     status,
     total_amount,
     cancelled,
     current_period_end
   FROM subscriptions
   WHERE user_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC;
   ```
   - ✅ `cancelled = false`
   - ✅ `status = 'active'`
   - ✅ `total_amount = 99.99`

3. **Changer vers Trimestriel**
   - Retourner sur `/subscription`
   - Cliquer "Choisir" sur plan "Trimestriel" (299.99€)
   - ✅ Observer formulaire Stripe Checkout s'affiche

4. **Vérifier Logs Server**
   ```
   [v0] User is changing subscription from plan [mensuel_id] to [trimestriel_id]
   [v0] Change type: UPGRADE
   [v0] Upgrade proration info: { daysRemaining: 23, ... }
   [v0] Old subscription cancelled for upgrade
   [v0] Checkout session created
   ```

5. **Compléter Paiement Test**
   - Utiliser carte test : `4242 4242 4242 4242`
   - Date : Future (ex: 12/26)
   - CVC : 123
   - ✅ Paiement réussi

6. **Vérifier Proration dans Stripe Dashboard**
   - Aller sur [Stripe Dashboard → Customers](https://dashboard.stripe.com/test/customers)
   - Trouver le customer
   - Regarder l'invoice récente
   - ✅ Doit voir ligne "Crédit prorata" avec montant négatif
   - ✅ Total facturé < 299.99€ (ex: 223.33€)

7. **Vérifier Database Finale**
   ```sql
   SELECT 
     id,
     plan_id,
     status,
     total_amount,
     cancelled,
     stripe_subscription_id
   FROM subscriptions
   WHERE user_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC;
   ```
   - ✅ 2 lignes : Ancien `cancelled = true`, Nouveau `cancelled = false`
   - ✅ Nouveau : `total_amount = 299.99`, `status = 'active'`

### ✅ Résultat Attendu

- Ancien abonnement annulé immédiatement
- Nouveau créé avec proration appliquée
- Montant facturé réduit (299.99€ - crédit prorata)
- Database synchronisée : 2 subscriptions (1 cancelled, 1 active)

---

## 🧪 Test 2 : Downgrade Planifié

**Scénario** : User downgrade de Trimestriel (299.99€) → Mensuel (99.99€)

### Étapes

1. **Créer abonnement initial**
   - Aller sur `/subscription`
   - Choisir plan "Trimestriel" (299.99€)
   - Compléter le paiement test
   - ✅ Vérifier redirection vers `/subscription/success`

2. **Vérifier Database**
   ```sql
   SELECT 
     id,
     plan_id,
     status,
     total_amount,
     cancelled,
     cancel_at_period_end,
     current_period_end
   FROM subscriptions
   WHERE user_id = 'YOUR_USER_ID';
   ```
   - ✅ `cancelled = false`
   - ✅ `cancel_at_period_end = false`
   - ✅ `current_period_end` dans ~3 mois

3. **Changer vers Mensuel**
   - Retourner sur `/subscription`
   - Cliquer "Choisir" sur plan "Mensuel" (99.99€)
   - ✅ **PAS de formulaire Stripe**
   - ✅ **Message s'affiche** : "Changement d'abonnement planifié"

4. **Vérifier UI Message**
   - ✅ Icône calendrier visible
   - ✅ Message : "Votre changement sera effectif le [DATE]"
   - ✅ Nouveau plan affiché : "Mensuel"
   - ✅ Date d'effet : ~3 mois dans le futur
   - ✅ Boutons : "Retour à mes abonnements" + "Retour au tableau de bord"

5. **Vérifier Logs Server**
   ```
   [v0] User is changing subscription from plan [trimestriel_id] to [mensuel_id]
   [v0] Change type: DOWNGRADE
   [v0] Processing downgrade: scheduling change at period end
   [v0] Downgrade scheduled for: 2025-04-07T...
   ```

6. **Vérifier Database Après Planification**
   ```sql
   SELECT 
     id,
     plan_id,
     status,
     total_amount,
     cancelled,
     cancel_at_period_end,
     current_period_end
   FROM subscriptions
   WHERE user_id = 'YOUR_USER_ID';
   ```
   - ✅ `cancelled = false` (toujours actif !)
   - ✅ `cancel_at_period_end = true` (planifié)
   - ✅ `status = 'active'` (continue de fonctionner)
   - ✅ `current_period_end` inchangé

7. **Vérifier Stripe Dashboard**
   - Aller sur [Stripe Dashboard → Subscriptions](https://dashboard.stripe.com/test/subscriptions)
   - Trouver la subscription
   - ✅ Status : "Active"
   - ✅ Badge : "Cancels on [DATE]"
   - ✅ Metadata contient :
     - `scheduled_plan_change: [mensuel_id]`
     - `scheduled_plan_name: Mensuel`
     - `scheduled_at: 2025-01-07T...`

8. **Simuler Fin de Période (Optionnel)**
   
   **Option A - Modifier manuellement la date** :
   ```sql
   UPDATE subscriptions
   SET current_period_end = NOW() - INTERVAL '1 hour'
   WHERE user_id = 'YOUR_USER_ID'
     AND cancel_at_period_end = TRUE;
   ```
   
   **Option B - Exécuter cron job manuellement** :
   ```sql
   SELECT process_scheduled_downgrades();
   ```

9. **Vérifier Traitement Automatique**
   ```sql
   -- Vérifier subscription marquée cancelled
   SELECT 
     id,
     cancelled,
     status,
     canceled_at
   FROM subscriptions
   WHERE user_id = 'YOUR_USER_ID';
   
   -- Vérifier audit log créé
   SELECT 
     action,
     old_status,
     new_status,
     notes,
     created_at
   FROM subscription_audit_log
   WHERE user_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - ✅ `cancelled = true`
   - ✅ `status = 'canceled'`
   - ✅ `canceled_at` = maintenant
   - ✅ Audit log action = `'scheduled_downgrade_processed'`

### ✅ Résultat Attendu

- Pas de checkout affiché (pas de paiement immédiat)
- Message clair sur planification
- Subscription reste active jusqu'à la fin
- Database : `cancel_at_period_end = true`
- Stripe metadata : infos sur changement planifié
- À la fin de période : cron job marque `cancelled = true`

---

## 🧪 Test 3 : Vérifier Cron Job

### Vérifier Cron Job Existe

```sql
-- Lister tous les cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  command
FROM cron.job
WHERE jobname = 'process-scheduled-downgrades';
```

**Résultat attendu** :
```
jobid | jobname                          | schedule   | command
------+----------------------------------+------------+---------------------------
123   | process-scheduled-downgrades     | 0 * * * *  | SELECT process_scheduled...
```

### Vérifier Historique Exécution

```sql
-- Dernières exécutions
SELECT 
  jobid,
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'process-scheduled-downgrades'
)
ORDER BY start_time DESC
LIMIT 10;
```

### Exécuter Manuellement

```sql
-- Forcer exécution immédiate (pour test)
SELECT process_scheduled_downgrades();
```

### Vérifier Résultats

```sql
-- Subscriptions traitées
SELECT COUNT(*) as processed_count
FROM subscription_audit_log
WHERE action = 'scheduled_downgrade_processed'
  AND created_at > NOW() - INTERVAL '1 hour';

-- Détails des traitements
SELECT 
  sal.created_at,
  sal.user_id,
  sal.old_status,
  sal.new_status,
  sal.notes,
  s.stripe_subscription_id
FROM subscription_audit_log sal
JOIN subscriptions s ON sal.subscription_id = s.id
WHERE sal.action = 'scheduled_downgrade_processed'
ORDER BY sal.created_at DESC
LIMIT 5;
```

---

## 📊 Checklist Complète

### Avant de Commencer
- [ ] Stripe CLI installé et authentifié
- [ ] `pnpm dev` démarre sans erreur
- [ ] `.env.local` a toutes les variables
- [ ] Compte Stripe en mode test

### Test Upgrade
- [ ] Création abonnement mensuel réussie
- [ ] Changement vers trimestriel affiche checkout
- [ ] Logs montrent "UPGRADE" + jours restants
- [ ] Paiement test complété
- [ ] Stripe Dashboard montre crédit prorata
- [ ] Database a 2 subscriptions (1 cancelled, 1 active)

### Test Downgrade
- [ ] Création abonnement trimestriel réussie
- [ ] Changement vers mensuel affiche MESSAGE (pas checkout)
- [ ] Logs montrent "DOWNGRADE" + date planifiée
- [ ] UI affiche date d'effet clairement
- [ ] Database : `cancel_at_period_end = true`, `cancelled = false`
- [ ] Stripe metadata contient `scheduled_plan_change`
- [ ] Cron job marque `cancelled = true` à la fin

### Test Cron Job
- [ ] Cron job existe dans `cron.job`
- [ ] Fonction `process_scheduled_downgrades()` créée
- [ ] Table `subscription_audit_log` existe
- [ ] Exécution manuelle fonctionne
- [ ] Audit logs créés correctement

### Vérification Finale
- [ ] Aucune erreur TypeScript
- [ ] Aucune erreur console
- [ ] Webhooks Stripe reçus et traités
- [ ] Database synchronisée
- [ ] UX claire et intuitive

---

## 🐛 Problèmes Courants

### "No signature provided"
**Cause** : Webhook secret manquant  
**Solution** : Vérifier `STRIPE_WEBHOOK_SECRET` dans `.env.local`

### "Invalid signature"
**Cause** : Stripe CLI pas connecté ou secret incorrect  
**Solution** : Relancer `stripe listen` et copier le nouveau secret

### Checkout ne charge pas
**Cause** : `client_secret` est null ou downgrade planifié  
**Solution** : 
- Upgrade : Vérifier logs server pour erreurs
- Downgrade : Normal, message doit s'afficher

### Cron job ne s'exécute pas
**Cause** : Extension `pg_cron` pas activée  
**Solution** : 
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Proration pas appliquée
**Cause** : Nouveau customer créé au lieu de réutiliser l'ancien  
**Solution** : Vérifier que `getOrCreateStripeCustomer()` réutilise bien le customer existant (fix précédent)

---

## 📝 Notes de Test

### Test Upgrade - [DATE]
- User ID : `___________`
- Old Sub ID : `___________`
- New Sub ID : `___________`
- Montant facturé : `___________€`
- Crédit prorata : `___________€`
- ✅ / ❌ : `___________`

### Test Downgrade - [DATE]
- User ID : `___________`
- Sub ID : `___________`
- Date planifiée : `___________`
- UI message OK : ✅ / ❌
- Stripe metadata OK : ✅ / ❌
- Cron traité OK : ✅ / ❌

---

## 🎯 Résumé

**Upgrade** :
- Annulation immédiate + nouveau checkout
- Proration automatique par Stripe
- Montant réduit facturé

**Downgrade** :
- Message planification (pas de checkout)
- Subscription reste active
- Cron job marque cancelled à la fin

**Points de Contrôle** :
1. Logs server clairs
2. Database synchronisée
3. Stripe Dashboard cohérent
4. UI intuitive
5. Audit trail complet

---

**Prêt à tester !** 🚀

Commencer par le **Test 1 (Upgrade)** car il est plus rapide et visuel (on voit le crédit prorata dans Stripe).
