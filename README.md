# Nino Wash - Service de Pressing à Domicile

## 🚀 Aperçu du Projet

Nino Wash est une plateforme moderne de pressing à domicile qui permet aux utilisateurs de réserver facilement des services de nettoyage et repassage avec collecte et livraison à domicile.

## ✨ Fonctionnalités Principales

### Pour les Clients
- 🔐 **Authentification sécurisée** avec Supabase Auth
- 👤 **Réservations invités** sans création de compte
- 📅 **Réservation en ligne** avec sélection de créneaux
- 🏠 **Gestion d'adresses multiples** pour collecte/livraison
- 💳 **Paiements sécurisés** avec Stripe
- 📱 **Interface mobile optimisée** (PWA)
- 💰 **Système d'abonnements** avec tarifs dégressifs (Classique, Mensuel, Trimestriel)
- 🔄 **Synchronisation automatique** des abonnements Stripe
- 📊 **Suivi des commandes** en temps réel
- 📄 **Pages informatives** (Comment ça marche, Services, Tarifs, À propos)

### Pour les Administrateurs
- 📈 **Dashboard analytique** avec KPIs et statistiques intégrées
- 🗓️ **Gestion des réservations** et planification
- 👥 **Gestion des clients** et historique
- 💼 **Gestion des services** et tarification
- 📊 **Statistiques détaillées** (revenus, clients, réservations)
- 🔍 **Visualiseur de base de données** pour le debug
- 📱 **Interface mobile responsive**

### Outils de Monitoring
- 🏥 **Health Checks API** pour surveiller l'état de l'application
- 🔄 **Synchronisation manuelle** des abonnements Stripe
- 📊 **Database Viewer** pour inspecter les données

## 🛠️ Stack Technique

### Frontend
- **Next.js 14.2.25** (App Router)
- **React 19** avec React DOM 19
- **TypeScript 5** pour la sécurité des types
- **Tailwind CSS 4.1.9** + **Shadcn/ui** pour le design
- **React Hook Form 7.60.0** + **Zod 3.25.67** pour les formulaires
- **Lucide React 0.454.0** pour les icônes
- **Geist 1.3.1** pour la typographie
- **PWA** avec service worker

### Backend & Base de Données
- **Supabase 2.58.0** (PostgreSQL + Auth + Real-time)
- **@supabase/ssr 0.7.0** pour l'authentification SSR
- **API Routes Next.js** pour la logique métier
- **Stripe 18.5.0** pour les paiements et abonnements

### UI Components
- **Radix UI** (Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, Label, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Switch, Tabs, Toast, Tooltip, etc.)
- **Recharts 2.15.4** pour les graphiques
- **Sonner 1.7.4** pour les notifications toast
- **Date-fns 4.1.0** pour la gestion des dates
- **Embla Carousel 8.5.1** pour les carrousels
- **Vaul 0.9.9** pour les drawers mobiles

### DevOps & Déploiement
- **Vercel** pour l'hébergement
- **Vercel Analytics 1.3.1** pour les performances
- **Vitest 3.2.4** pour les tests unitaires
- **@testing-library/react 16.3.0** pour les tests de composants
- **Lighthouse 11.4.0** pour les audits de performance
- **@next/bundle-analyzer** pour l'analyse de bundle

## 🚀 Installation et Développement

### Prérequis
- Node.js 20+
- npm ou yarn
- Compte Supabase
- Compte Stripe (pour les paiements)

### Installation

1. **Cloner le repository**
\`\`\`bash
git clone https://github.com/ninoWash/nino-wash.git
cd nino-wash
\`\`\`

2. **Installer les dépendances**
\`\`\`bash
npm install
\`\`\`

3. **Configuration des variables d'environnement**
\`\`\`bash
cp .env.example .env.local
\`\`\`

Remplir les variables dans `.env.local` :
\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
\`\`\`

4. **Initialiser la base de données**

Exécutez les scripts SQL dans l'ordre depuis le dossier `scripts/` via l'interface Supabase SQL Editor ou utilisez les scripts Node.js :

\`\`\`bash
npm run db:migrate
npm run db:seed
\`\`\`

5. **Lancer le serveur de développement**
\`\`\`bash
npm run dev
\`\`\`

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🧪 Tests

### Tests Unitaires
\`\`\`bash
npm run test              # Lancer les tests
npm run test:ui           # Interface graphique
npm run test:coverage     # Avec couverture de code
\`\`\`

### Audits et Performance
\`\`\`bash
npm run performance:audit  # Audit Lighthouse
npm run security:audit     # Audit de sécurité npm
npm run build:analyze      # Analyse du bundle
\`\`\`

## 📦 Scripts Disponibles

\`\`\`bash
# Développement
npm run dev                # Serveur de développement
npm run build              # Build de production
npm run start              # Démarrer le serveur de production
npm run lint               # Linter ESLint

# Tests
npm run test               # Tests unitaires Vitest
npm run test:ui            # Interface graphique des tests
npm run test:coverage      # Tests avec couverture de code

# Base de données
npm run db:migrate         # Exécuter les migrations
npm run db:seed            # Peupler la base de données
npm run db:backup          # Sauvegarder la base de données
npm run db:restore         # Restaurer la base de données

# Déploiement
npm run deploy:staging     # Déployer sur staging
npm run deploy:prod        # Déployer en production

# Monitoring et Audits
npm run health-check       # Vérifier la santé de l'application
npm run performance:audit  # Audit Lighthouse
npm run security:audit     # Audit de sécurité npm
npm run build:analyze      # Analyser la taille du bundle
\`\`\`

## 📦 Déploiement

### Staging
\`\`\`bash
npm run deploy:staging
\`\`\`

### Production
\`\`\`bash
npm run deploy:prod
\`\`\`

Le déploiement automatique est configuré via GitHub Actions :
- **Staging** : Push sur `develop`
- **Production** : Push sur `main`

## 📁 Structure du Projet

\`\`\`
nino-wash/
├── app/                    # Pages et API routes (App Router)
│   ├── (main)/            # Routes principales (page d'accueil)
│   ├── a-propos/          # Page À propos
│   ├── admin/             # Interface administrateur
│   │   ├── bookings/      # Gestion des réservations
│   │   └── page.tsx       # Dashboard avec statistiques intégrées
│   ├── api/               # API endpoints
│   │   ├── addresses/     # Gestion des adresses utilisateur
│   │   ├── auth/          # Endpoints d'authentification
│   │   ├── bookings/      # Gestion des réservations
│   │   ├── health/        # Health checks (app, db, auth, stripe)
│   │   ├── payments/      # Intégration Stripe
│   │   │   └── methods/   # Méthodes de paiement
│   │   ├── services/      # Gestion des services
│   │   ├── subscriptions/ # Gestion des abonnements
│   │   │   └── sync/      # Synchronisation Stripe
│   │   └── webhooks/      # Webhooks Stripe
│   ├── auth/              # Pages d'authentification
│   │   ├── callback/      # Callback OAuth
│   │   ├── login/         # Connexion
│   │   └── signup/        # Inscription
│   ├── bookings/          # Historique des réservations
│   ├── comment-ca-marche/ # Page "Comment ça marche"
│   ├── dashboard/         # Dashboard utilisateur
│   ├── database-viewer/   # Visualiseur de base de données (debug)
│   ├── profile/           # Profil utilisateur
│   ├── reservation/       # Processus de réservation
│   ├── services/          # Page des services
│   ├── subscription/      # Gestion des abonnements
│   │   ├── checkout/      # Processus de paiement
│   │   ├── error/         # Page d'erreur
│   │   ├── manage/        # Gestion de l'abonnement
│   │   └── success/       # Confirmation de paiement
│   ├── actions/           # Server Actions
│   │   └── stripe.ts      # Actions Stripe
│   └── layout.tsx         # Layout principal
├── components/            # Composants React réutilisables
│   ├── admin/             # Composants admin (header, stats cards)
│   ├── booking/           # Composants de réservation (steps, forms)
│   ├── forms/             # Formulaires (auth, booking, profile)
│   ├── layout/            # Composants de layout (header, footer, nav)
│   ├── mobile/            # Composants mobiles (bottom nav)
│   ├── sections/          # Sections de pages
│   │   ├── hero-section.tsx          # Section héros
│   │   ├── services-section.tsx      # Section services
│   │   ├── how-it-works-section.tsx  # Section comment ça marche
│   │   ├── testimonials-section.tsx  # Section témoignages
│   │   └── cta-section.tsx           # Section appel à l'action
│   ├── subscription/      # Composants d'abonnement
│   │   ├── plan-card.tsx  # Carte de plan d'abonnement
│   │   ├── subscription-status.tsx # Statut de l'abonnement
│   │   └── manage-subscription.tsx # Gestion de l'abonnement
│   └── ui/                # Composants UI de base (shadcn/ui)
├── hooks/                 # Hooks React personnalisés
│   ├── use-auth.ts        # Hook d'authentification
│   ├── use-mobile.tsx     # Hook de détection mobile
│   └── use-toast.ts       # Hook de notifications
├── lib/                   # Utilitaires et configurations
│   ├── supabase/          # Configuration Supabase (client, middleware)
│   ├── validations/       # Schémas Zod (auth, booking, payment)
│   └── utils.ts           # Fonctions utilitaires
├── scripts/               # Scripts de base de données et maintenance
│   ├── 001_core_user_management.sql
│   ├── 001_allow_guest_bookings.sql
│   ├── 002_subscription_billing.sql
│   ├── 003_team_organization.sql
│   ├── 004_analytics_tracking.sql
│   ├── 005_audit_security.sql
│   ├── 006_update_subscription_plans.sql
│   ├── 009_fix_booking_items_service_reference.sql
│   ├── 01-create-database-schema.sql
│   ├── 02-seed-initial-data.sql
│   ├── 03-add-payments-subscriptions.sql
│   ├── 03-create-database-schema-fixed.sql
│   ├── 04-seed-initial-data-fixed.sql
│   ├── 04-seed-subscription-plans.sql
│   ├── 05-smart-database-setup.sql
│   ├── 06-seed-corrected-data.sql
│   ├── 07-update-pricing-data.sql
│   ├── 07-update-services-real-offer.sql
│   ├── 08-fix-pricing-and-tables.sql
│   ├── 10-consolidation-and-cleanup.sql
│   ├── 11-rapport-complet-database.sql
│   ├── backup-database.js # Sauvegarde de la BDD
│   ├── deploy.js          # Script de déploiement
│   ├── health-check.js    # Vérification de santé
│   ├── migrate.js         # Script de migration
│   ├── performance-audit.js # Audit de performance
│   ├── restore-database.js # Restauration de la BDD
│   ├── security-scan.js   # Scan de sécurité
│   └── seed.js            # Script de seed
├── __tests__/             # Tests unitaires
├── docs/                  # Documentation
│   ├── CONTRIBUTING.md    # Guide de contribution
│   ├── SUBSCRIPTION_RESOLUTION_LOG.md # Log de résolution des abonnements
│   ├── api-integration-guide.md
│   ├── architecture.md
│   ├── booking-system-workflow.md
│   ├── database-schema-documentation.md
│   ├── routes-and-interfaces.md
│   └── services-documentation.md
└── public/                # Assets statiques
\`\`\`

## 🔧 Configuration Avancée

### Base de Données
Les migrations et seeds sont dans le dossier `scripts/`. Les scripts principaux incluent :
- Scripts de schéma de base de données (001-011)
- Scripts de migration et seed (migrate.js, seed.js)
- Scripts de maintenance (backup-database.js, restore-database.js)
- Scripts d'audit (performance-audit.js, security-scan.js)

Pour plus de détails sur l'exécution des scripts, consultez `SCRIPTS_EXECUTION_GUIDE.md`.

### Authentification
L'authentification utilise Supabase Auth avec :
- Email/mot de passe
- Réservations invités (sans compte)
- Vérification email
- Reset de mot de passe
- Sessions sécurisées avec JWT
- Middleware SSR pour la protection des routes

### Paiements et Abonnements
Intégration Stripe complète :
- Paiements one-time pour les réservations
- Abonnements récurrents (Classique, Mensuel, Trimestriel)
- Webhooks pour synchronisation automatique
- Synchronisation manuelle via `/api/subscriptions/sync`
- Gestion des échecs de paiement
- Interface de gestion d'abonnement pour les utilisateurs

### Health Checks
L'application expose plusieurs endpoints de monitoring :
- `/api/health` - Santé globale de l'application
- `/api/health/db` - État de la base de données
- `/api/health/auth` - État de l'authentification
- `/api/health/stripe` - État de l'intégration Stripe

### Database Viewer
Un outil de visualisation de base de données est disponible à `/database-viewer` pour inspecter les données en développement.

### Routes et Navigation
Pour une documentation complète des routes, interfaces et conditions de routage, consultez :
- `docs/routes-and-interfaces.md` : Liste exhaustive des routes publiques et protégées
- `docs/architecture.md` : Architecture de l'application
- `docs/booking-system-workflow.md` : Workflow du système de réservation
- `docs/services-documentation.md` : Documentation des services

## 📊 Monitoring et Analytics

- **Vercel Analytics** pour les performances
- **Health Checks API** pour surveiller l'état de l'application
- **Lighthouse** pour les audits de performance
- **Supabase Dashboard** pour les métriques base de données
- **Bundle Analyzer** pour l'optimisation du bundle

## 🤝 Contribution

Pour contribuer au projet, veuillez consulter le guide de contribution :
- `docs/CONTRIBUTING.md` : Conventions de code et workflow de contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📚 Documentation Supplémentaire

- `DEPLOYMENT.md` : Guide de déploiement détaillé
- `SCHEMA_FIX_README.md` : Documentation sur les corrections de schéma
- `SCRIPTS_EXECUTION_GUIDE.md` : Guide d'exécution des scripts
- `docs/SUBSCRIPTION_RESOLUTION_LOG.md` : Log de résolution des problèmes d'abonnement

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- 📧 Email : support@ninowash.fr
- 📖 Documentation : Consultez le dossier `docs/` pour la documentation complète

---

**Développé avec ❤️ par l'équipe Nino Wash**
