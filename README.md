# Nino Wash - Service de Pressing à Domicile

## 🚀 Aperçu du Projet

Nino Wash est une plateforme moderne de pressing à domicile qui permet aux utilisateurs de réserver facilement des services de nettoyage et repassage avec collecte et livraison à domicile.

## ✨ Fonctionnalités Principales

### Pour les Clients
- 🔐 **Authentification sécurisée** avec Supabase Auth
- 📅 **Réservation en ligne** avec sélection de créneaux
- 🏠 **Gestion d'adresses multiples** pour collecte/livraison
- 💳 **Paiements sécurisés** avec Stripe
- 📱 **Interface mobile optimisée** (PWA)
- 🔔 **Notifications en temps réel** (email, SMS, push)
- 💰 **Système d'abonnements** avec tarifs dégressifs
- 📊 **Suivi des commandes** en temps réel

### Pour les Administrateurs
- 📈 **Dashboard analytique** avec KPIs
- 🗓️ **Gestion des tournées** et planification
- 👥 **Gestion des clients** et historique
- 💼 **Gestion des services** et tarification
- 📧 **Centre de notifications** intégré
- 📱 **Interface mobile responsive**

## 🛠️ Stack Technique

### Frontend
- **Next.js 15** (App Router)
- **TypeScript** pour la sécurité des types
- **Tailwind CSS** + **Shadcn/ui** pour le design
- **React Hook Form** + **Zod** pour les formulaires
- **Framer Motion** pour les animations
- **PWA** avec service worker

### Backend & Base de Données
- **Supabase** (PostgreSQL + Auth + Real-time)
- **API Routes Next.js** pour la logique métier
- **Stripe** pour les paiements
- **Resend** pour les emails

### DevOps & Déploiement
- **Vercel** pour l'hébergement
- **GitHub Actions** pour CI/CD
- **Playwright** pour les tests E2E
- **Vitest** pour les tests unitaires

## 🚀 Installation et Développement

### Prérequis
- Node.js 20+
- npm ou yarn
- Compte Supabase
- Compte Stripe (pour les paiements)

### Installation

1. **Cloner le repository**
\`\`\`bash
git clone https://github.com/votre-username/nino-wash.git
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

### Tests E2E
\`\`\`bash
npm run test:e2e          # Tests Playwright
npm run test:e2e:ui       # Interface graphique
\`\`\`

### Tous les tests
\`\`\`bash
npm run test:all
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
│   ├── (main)/            # Routes principales
│   ├── admin/             # Interface administrateur
│   ├── api/               # API endpoints
│   └── auth/              # Pages d'authentification
├── components/            # Composants React réutilisables
│   ├── forms/             # Formulaires
│   ├── layout/            # Composants de layout
│   ├── ui/                # Composants UI de base
│   └── admin/             # Composants admin
├── lib/                   # Utilitaires et configurations
│   ├── supabase/          # Configuration Supabase
│   ├── validations/       # Schémas Zod
│   └── utils/             # Fonctions utilitaires
├── scripts/               # Scripts de base de données
├── __tests__/             # Tests unitaires
├── e2e/                   # Tests E2E Playwright
└── public/                # Assets statiques
\`\`\`

## 🔧 Configuration Avancée

### Base de Données
Les migrations et seeds sont dans le dossier `scripts/` :
- `01-create-database-schema.sql` : Schéma initial
- `02-seed-initial-data.sql` : Données de test
- `03-add-payments-subscriptions.sql` : Tables paiements
- `04-seed-subscription-plans.sql` : Plans d'abonnement

### Authentification
L'authentification utilise Supabase Auth avec :
- Email/mot de passe
- Vérification email
- Reset de mot de passe
- Sessions sécurisées avec JWT

### Paiements
Intégration Stripe complète :
- Paiements one-time
- Abonnements récurrents
- Webhooks pour synchronisation
- Gestion des échecs de paiement

## 📊 Monitoring et Analytics

- **Vercel Analytics** pour les performances
- **Sentry** pour le monitoring d'erreurs (à configurer)
- **Supabase Dashboard** pour les métriques base de données

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- 📧 Email : support@ninowash.fr
- 💬 Discord : [Lien vers le serveur]
- 📖 Documentation : [Lien vers la doc complète]

---

**Développé avec ❤️ par l'équipe Nino Wash**
