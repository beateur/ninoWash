# Index de la Documentation - Nino Wash

Guide de navigation dans la documentation du projet Nino Wash.

---

## 🚀 Pour Commencer

| Document | Public | Description |
|----------|--------|-------------|
| **[README.md](../README.md)** | Tous | Vue d'ensemble du projet, installation, features |
| **[QUICK_START.md](QUICK_START.md)** | Développeurs | Guide de démarrage rapide (5 min) |
| **[SETUP_LOCAL.md](../SETUP_LOCAL.md)** | Développeurs | Configuration environnement local détaillée |

---

## 📐 Architecture & Design

| Document | Public | Description |
|----------|--------|-------------|
| **[architecture.md](architecture.md)** | Développeurs | Architecture complète, stack technique, patterns |
| **[routes-and-interfaces.md](routes-and-interfaces.md)** | Développeurs/Design | Liste des routes, permissions, UI |
| **[booking-system-workflow.md](booking-system-workflow.md)** | Tous | Workflow du système de réservation |

---

## 🗄️ Base de Données

| Document | Public | Description |
|----------|--------|-------------|
| **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** | Développeurs/DBA | Schéma complet (48 tables) |
| **[database-schema-documentation.md](database-schema-documentation.md)** | Développeurs | Documentation détaillée des tables |
| **[database-schema-overview.md](database-schema-overview.md)** | Product | Vue d'ensemble du schéma |
| **[SCHEMA_FIX_README.md](../SCHEMA_FIX_README.md)** | Développeurs | Log des corrections de schéma |

---

## 🔌 API & Intégrations

| Document | Public | Description |
|----------|--------|-------------|
| **[api-integration-guide.md](api-integration-guide.md)** | Développeurs | Guide d'intégration API complète |
| **[services-documentation.md](services-documentation.md)** | Développeurs | Documentation des services métier |

---

## 🔐 Sécurité

| Document | Public | Description |
|----------|--------|-------------|
| **[SECURITY_P0_CHECKLIST.md](SECURITY_P0_CHECKLIST.md)** | DevOps/Lead | Checklist de sécurité prioritaire |
| **[KEY_ROTATION_PROCEDURE.md](KEY_ROTATION_PROCEDURE.md)** | DevOps | Procédure de rotation des clés API |
| **[PROJECT_AUDIT_REPORT.md](PROJECT_AUDIT_REPORT.md)** | Lead/Product | Rapport d'audit du projet |

---

## 🛠️ Développement

| Document | Public | Description |
|----------|--------|-------------|
| **[TECHNICAL_CHANGELOG.md](TECHNICAL_CHANGELOG.md)** | Développeurs | Historique des changements techniques |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Contributeurs | Conventions de code, workflow Git |
| **[DOCUMENTATION_AUDIT_REPORT.md](DOCUMENTATION_AUDIT_REPORT.md)** | Lead/Docs | Audit complet de la documentation |
| **[SCRIPTS_EXECUTION_GUIDE.md](../SCRIPTS_EXECUTION_GUIDE.md)** | Développeurs | Guide d'exécution des scripts SQL/JS |

---

## 🚢 Déploiement

| Document | Public | Description |
|----------|--------|-------------|
| **[DEPLOYMENT.md](../DEPLOYMENT.md)** | DevOps | Guide de déploiement complet |
| **[CRON_JOB_DEPLOYMENT_GUIDE.md](CRON_JOB_DEPLOYMENT_GUIDE.md)** | DevOps/Dev | Déploiement Edge Function + Cron Job crédits |
| **[SUBSCRIPTION_RESOLUTION_LOG.md](SUBSCRIPTION_RESOLUTION_LOG.md)** | Support/Dev | Log résolution problèmes abonnements |

---

## 📍 Navigation Rapide par Rôle

### 👨‍💻 Nouveau Développeur
1. [QUICK_START.md](QUICK_START.md) - Installation en 5 minutes
2. [architecture.md](architecture.md) - Comprendre l'architecture
3. [TECHNICAL_CHANGELOG.md](TECHNICAL_CHANGELOG.md) - Derniers changements
4. [CONTRIBUTING.md](CONTRIBUTING.md) - Conventions de code

### 🏗️ Architecte / Lead Dev
1. [architecture.md](architecture.md) - Architecture complète
2. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Schéma BDD
3. [api-integration-guide.md](api-integration-guide.md) - APIs
4. [PROJECT_AUDIT_REPORT.md](PROJECT_AUDIT_REPORT.md) - Audit

### 🔒 DevOps / SRE
1. [DEPLOYMENT.md](../DEPLOYMENT.md) - Déploiement
2. [SECURITY_P0_CHECKLIST.md](SECURITY_P0_CHECKLIST.md) - Sécurité
3. [KEY_ROTATION_PROCEDURE.md](KEY_ROTATION_PROCEDURE.md) - Rotation clés
4. [SCRIPTS_EXECUTION_GUIDE.md](../SCRIPTS_EXECUTION_GUIDE.md) - Scripts

### 📊 Product Manager
1. [README.md](../README.md) - Vue d'ensemble
2. [routes-and-interfaces.md](routes-and-interfaces.md) - Routes & UI
3. [booking-system-workflow.md](booking-system-workflow.md) - Workflow
4. [database-schema-overview.md](database-schema-overview.md) - Données

### 🎨 Designer / UX
1. [routes-and-interfaces.md](routes-and-interfaces.md) - Routes & interfaces
2. [booking-system-workflow.md](booking-system-workflow.md) - Parcours utilisateur
3. [README.md](../README.md) - Fonctionnalités

---

## 🔍 Recherche par Sujet

### Authentification
- [architecture.md](architecture.md) - Section "Authentification (Supabase Auth)"
- [TECHNICAL_CHANGELOG.md](TECHNICAL_CHANGELOG.md) - Migration client/server
- [routes-and-interfaces.md](routes-and-interfaces.md) - Routes protégées

### Réservations (Bookings)
- [booking-system-workflow.md](booking-system-workflow.md) - Workflow complet
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Tables `bookings`, `booking_items`
- [api-integration-guide.md](api-integration-guide.md) - API `/api/bookings`

### Abonnements (Subscriptions)
- **🎯 [TECHNICAL_SOLUTION_SUBSCRIPTION_CREDITS.md](TECHNICAL_SOLUTION_SUBSCRIPTION_CREDITS.md)** - **SOLUTION TECHNIQUE** - Système de crédits implémenté
- **� [PRD/PRD_SUBSCRIPTION_CREDITS_SYSTEM.md](PRD/PRD_SUBSCRIPTION_CREDITS_SYSTEM.md)** - PRD complet du système de crédits
- **�🚨 [EXECUTIVE_SUMMARY_SUBSCRIPTION_ISSUE.md](EXECUTIVE_SUMMARY_SUBSCRIPTION_ISSUE.md)** - Synthèse décision business (problème identifié)
- **[QUICK_ANSWERS_SUBSCRIPTION_BOOKING.md](QUICK_ANSWERS_SUBSCRIPTION_BOOKING.md)** - Réponses rapides questions clés
- **[SUBSCRIPTION_REALITY_CHECK.md](SUBSCRIPTION_REALITY_CHECK.md)** - État des lieux marketing vs implémentation
- **[ANALYSIS_SUBSCRIPTION_BOOKING_RELATIONSHIP.md](ANALYSIS_SUBSCRIPTION_BOOKING_RELATIONSHIP.md)** - Analyse technique complète
- [services-documentation.md](services-documentation.md) - Service abonnements
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Tables `subscriptions`, `subscription_plans`
- [SUBSCRIPTION_RESOLUTION_LOG.md](SUBSCRIPTION_RESOLUTION_LOG.md) - Troubleshooting

### Paiements (Stripe)
- [api-integration-guide.md](api-integration-guide.md) - Intégration Stripe
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Tables `payments`, `payment_methods`
- [services-documentation.md](services-documentation.md) - Service paiements

### Admin Dashboard
- [routes-and-interfaces.md](routes-and-interfaces.md) - Routes admin
- [TECHNICAL_CHANGELOG.md](TECHNICAL_CHANGELOG.md) - Architecture hybride admin
- [architecture.md](architecture.md) - Pattern page admin

### Performances
- [architecture.md](architecture.md) - Section "Performance"
- [README.md](../README.md) - Scripts d'audit
- [PROJECT_AUDIT_REPORT.md](PROJECT_AUDIT_REPORT.md) - Rapport complet

---

## 📝 Conventions de Nommage des Documents

- **ALL_CAPS.md** : Guides opérationnels (DEPLOYMENT, SETUP, etc.)
- **kebab-case.md** : Documentation technique (architecture, api-integration, etc.)
- **PascalCase.md** : Logs et rapports (ProjectAudit, etc.)

---

## 🔄 Mise à Jour de la Documentation

**Dernière mise à jour générale :** 3 octobre 2025

**Changements récents :**
- ✅ Ajout `TECHNICAL_SOLUTION_SUBSCRIPTION_CREDITS.md` (solution complète système de crédits)
- ✅ Ajout `PRD/PRD_SUBSCRIPTION_CREDITS_SYSTEM.md` (PRD complet avec implémentation)
- ✅ Ajout analyse complète abonnements (4 documents : EXECUTIVE_SUMMARY, QUICK_ANSWERS, REALITY_CHECK, ANALYSIS)
- ✅ Ajout `TECHNICAL_CHANGELOG.md` (migration client/server)
- ✅ Ajout `QUICK_START.md` (guide démarrage rapide)
- ✅ Ajout `DOCUMENTATION_AUDIT_REPORT.md` (audit complet)
- ✅ Mise à jour `architecture.md` (patterns et bonnes pratiques)
- ✅ Mise à jour `routes-and-interfaces.md` (architecture hybride admin)
- ✅ Mise à jour `CONTRIBUTING.md` (architecture Next.js 14)
- ✅ Mise à jour `SECURITY_P0_CHECKLIST.md` (tests validés)
- ✅ Mise à jour `SETUP_LOCAL.md` (cohérence stack, pnpm)
- ✅ Mise à jour `DEPLOYMENT.md` (architecture SSR)
- ✅ Archivage `SCHEMA_FIX_README.md` (problème résolu)

**Fréquence de mise à jour :**
- `TECHNICAL_CHANGELOG.md` : À chaque changement architectural majeur
- `architecture.md` : Mensuellement ou après refactoring majeur
- `DATABASE_SCHEMA.md` : Après chaque migration de schéma
- `README.md` : À chaque release majeure
- `DOCUMENTATION_AUDIT_REPORT.md` : Trimestriellement ou après changements majeurs

---

## 📮 Contribution à la Documentation

Pour améliorer la documentation :

1. Vérifier qu'aucun document existant ne couvre déjà le sujet
2. Suivre les conventions de nommage
3. Ajouter le document à cet index
4. Créer une PR avec label `documentation`

---

**Navigation :** [Retour au README principal](../README.md)
