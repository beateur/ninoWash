# Guide d'Exécution des Scripts SQL - Nino Wash

> 📚 **Voir aussi :** [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) pour le schéma complet

---

## 📊 État Actuel

Votre base de données Supabase contient **48 tables** déjà créées et fonctionnelles.

**Package manager :** Ce projet utilise `pnpm` pour toutes les commandes.

--- ✅ Script à Exécuter

### Script Recommandé: `10-consolidation-and-cleanup.sql`

Ce script unique et sécurisé va:
- ✅ Permettre les réservations invités (rend `user_id` nullable)
- ✅ Corriger la référence `service_id` dans `booking_items`
- ✅ Insérer les 4 services réels de Nino Wash (si pas déjà présents)
- ✅ Générer un rapport de l'état de la base de données

**Protection**: Toutes les opérations vérifient l'existence avant modification (pas de doublon, pas d'écrasement).

## ❌ Scripts à NE PAS Exécuter

Ces scripts sont **obsolètes** ou **dangereux** car ils créeraient des doublons:

### Scripts de Création Initiale (Déjà Fait)
- ❌ `01-create-database-schema.sql` - Tables déjà créées
- ❌ `02-seed-initial-data.sql` - Données déjà insérées
- ❌ `03-create-database-schema-fixed.sql` - Version fixée obsolète
- ❌ `04-seed-initial-data-fixed.sql` - Version fixée obsolète

### Scripts de Fonctionnalités (Déjà Intégrés)
- ❌ `03-add-payments-subscriptions.sql` - Tables paiements déjà créées
- ❌ `04-seed-subscription-plans.sql` - Plans déjà insérés
- ❌ `002_subscription_billing.sql` - Facturation déjà configurée
- ❌ `003_team_organization.sql` - Tables équipes déjà créées
- ❌ `004_analytics_tracking.sql` - Analytics déjà configuré
- ❌ `005_audit_security.sql` - Audit déjà en place

### Scripts Partiellement Appliqués
- ⚠️ `05-smart-database-setup.sql` - Partiellement appliqué (tables supplémentaires créées)
- ⚠️ `001_core_user_management.sql` - Partiellement appliqué (user profiles créés)

### Scripts de Correction (Intégrés dans le Script de Consolidation)
- ✅ `001_allow_guest_bookings.sql` - Intégré dans `10-consolidation-and-cleanup.sql`
- ✅ `009_fix_booking_items_service_reference.sql` - Intégré dans `10-consolidation-and-cleanup.sql`
- ✅ `07-update-services-real-offer.sql` - Intégré dans `10-consolidation-and-cleanup.sql`

### Scripts de Mise à Jour de Prix (Obsolètes)
- ❌ `07-update-pricing-data.sql` - Remplacé par le script de consolidation
- ❌ `08-fix-pricing-and-tables.sql` - Remplacé par le script de consolidation

## 🎯 Plan d'Action Recommandé

### Étape 1: Exécuter le Script de Consolidation
\`\`\`bash
# Dans l'interface v0, cliquez sur "Run" pour:
scripts/10-consolidation-and-cleanup.sql
\`\`\`

### Étape 2: Vérifier le Rapport
Le script affichera un rapport avec:
- Nombre de services actifs
- Nombre de réservations
- Nombre d'utilisateurs
- État de chaque modification

### Étape 3: Nettoyer les Scripts Obsolètes (Optionnel)
Vous pouvez supprimer les scripts obsolètes pour garder le projet propre:
- Tous les scripts listés dans "❌ Scripts à NE PAS Exécuter"

## 📋 Tables Existantes dans Votre Base

### Tables Principales
- ✅ `users` - Utilisateurs
- ✅ `user_addresses` - Adresses utilisateurs
- ✅ `user_profiles` - Profils utilisateurs
- ✅ `services` - Services de lavage
- ✅ `bookings` - Réservations
- ✅ `booking_items` - Items de réservation

### Tables de Paiement
- ✅ `subscriptions` - Abonnements
- ✅ `subscription_plans` - Plans d'abonnement
- ✅ `invoices` - Factures
- ✅ `payment_methods` - Méthodes de paiement
- ✅ `payment_transactions` - Transactions

### Tables de Livraison
- ✅ `delivery_drivers` - Chauffeurs
- ✅ `delivery_assignments` - Affectations de livraison

### Tables SaaS
- ✅ `organizations` - Organisations
- ✅ `teams` - Équipes
- ✅ `workspaces` - Espaces de travail

### Tables Analytics
- ✅ `events` - Événements
- ✅ `activities` - Activités
- ✅ `error_logs` - Logs d'erreurs
- ✅ `page_views` - Vues de pages

## 🔒 Sécurité

Le script de consolidation est **100% sécurisé**:
- ✅ Vérifie l'existence avant toute modification
- ✅ Utilise `IF NOT EXISTS` pour les créations
- ✅ Utilise `DO $$` pour les vérifications conditionnelles
- ✅ Ne supprime aucune donnée existante
- ✅ Génère des messages informatifs à chaque étape

## 🆘 Support

Pour toute question ou problème :
- 📖 Documentation : Consultez le dossier `docs/` pour la documentation complète
- 📋 Schema : Voir [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md)
- 🚀 Démarrage : Voir [`docs/QUICK_START.md`](docs/QUICK_START.md)

---

**Dernière mise à jour :** 3 octobre 2025  
**Version du script :** 10-consolidation-and-cleanup.sql v1.0
