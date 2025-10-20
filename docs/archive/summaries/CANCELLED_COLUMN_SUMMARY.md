# Résumé des Modifications - Colonne "cancelled" (Soft Delete)

## 📝 Changements Appliqués

Tous les fichiers ont été modifiés pour utiliser la colonne `cancelled` au lieu de supprimer les lignes. Cette approche "soft delete" conserve l'historique complet des abonnements.

---

## 🎯 Fichiers Modifiés et Emplacements des Écritures DB

### 1. **`app/actions/stripe.ts`** (Ligne 62-88)
- **Action**: Changement d'abonnement côté serveur
- **Écriture DB**: `UPDATE subscriptions SET cancelled = true, status = 'canceled', canceled_at = NOW() WHERE id = existingSubscription.id`
- **Contexte**: Quand l'utilisateur change de plan (mensuel → trimestriel), l'ancien abonnement est marqué `cancelled = true` au lieu d'être supprimé

### 2. **`app/api/webhooks/stripe/route.ts`** (Ligne 65-87)
- **Action**: Webhook `checkout.session.completed` - Gestion des anciens abonnements
- **Écriture DB**: `UPDATE subscriptions SET cancelled = true, status = 'canceled', canceled_at = NOW() WHERE user_id = ... AND cancelled = false`
- **Contexte**: Lorsque Stripe confirme le paiement, tous les anciens abonnements actifs sont marqués comme `cancelled = true`

### 3. **`app/api/webhooks/stripe/route.ts`** (Ligne 89-105)
- **Action**: Webhook `checkout.session.completed` - Création du nouvel abonnement
- **Écriture DB**: `INSERT INTO subscriptions (..., cancelled = false) VALUES (...)`
- **Contexte**: Le nouvel abonnement est inséré avec `cancelled = false` (actif par défaut)

### 4. **`app/api/webhooks/stripe/route.ts`** (Ligne 143-155)
- **Action**: Webhook `customer.subscription.deleted` - Annulation définitive
- **Écriture DB**: `UPDATE subscriptions SET cancelled = true, status = 'canceled', canceled_at = NOW() WHERE stripe_subscription_id = ...`
- **Contexte**: Lorsque Stripe supprime un abonnement, il est marqué `cancelled = true` (pas supprimé de la DB)

### 5. **`scripts/fix-duplicate-stripe-customer.sql`** (Ligne 14-22, 56-60)
- **Action**: Script SQL de nettoyage manuel
- **Écriture DB**: 
  - `UPDATE subscriptions SET cancelled = true WHERE stripe_subscription_id = 'sub_OLD'`
  - `INSERT INTO subscriptions (..., cancelled = false) VALUES (...)`
- **Contexte**: Script one-shot pour corriger la situation actuelle

---

## 🔍 Requêtes Modifiées

### Recherche d'abonnements actifs
**Avant**: `WHERE status = 'active'`  
**Après**: `WHERE cancelled = false`

### Marquage comme inactif
**Avant**: `UPDATE ... SET status = 'canceled'`  
**Après**: `UPDATE ... SET cancelled = true, status = 'canceled', canceled_at = NOW()`

### Création d'un nouvel abonnement
**Avant**: `INSERT INTO subscriptions (...) VALUES (...)`  
**Après**: `INSERT INTO subscriptions (..., cancelled) VALUES (..., false)`

---

## ✅ Avantages du Soft Delete

1. **Historique complet**: Tous les abonnements passés restent visibles
2. **Analytics**: Possibilité d'analyser les changements de plans
3. **Audit trail**: Traçabilité complète des actions utilisateur
4. **Rollback facile**: Possibilité de réactiver un abonnement en changeant `cancelled = false`
5. **Requêtes simples**: `WHERE cancelled = false` pour filtrer les actifs

---

## 🚨 Points d'Attention

- **Indexes**: Ajouter un index sur `cancelled` pour optimiser les requêtes `WHERE cancelled = false`
- **Nettoyage**: Prévoir un script de purge des abonnements `cancelled = true` de plus de X mois (si nécessaire)
- **Frontend**: Mettre à jour les requêtes UI pour filtrer sur `cancelled = false` au lieu de `status = 'active'`
