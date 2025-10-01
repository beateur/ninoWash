# Guide de Configuration Locale - Nino Wash

## 📥 Télécharger le Projet

### Option 1 : Via GitHub (Recommandé)
1. Cliquez sur l'icône GitHub en haut à droite de v0
2. Poussez le code vers votre repository GitHub
3. Clonez le repository sur votre machine :
\`\`\`bash
git clone <votre-repo-url>
cd nino-wash
\`\`\`

### Option 2 : Téléchargement ZIP
1. Cliquez sur les trois points (...) en haut à droite
2. Sélectionnez "Download ZIP"
3. Extrayez le fichier et ouvrez-le dans votre IDE

## 📦 Installation des Dépendances

\`\`\`bash
npm install
# ou
pnpm install
# ou
yarn install
\`\`\`

## 🔐 Configuration des Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

### Variables Essentielles

\`\`\`env
# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Base de données et Authentification)
NEXT_PUBLIC_SUPABASE_URL=votre_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_supabase_service_role_key
SUPABASE_JWT_SECRET=votre_supabase_jwt_secret

# Redirection pour l'authentification en développement
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Neon Database (Alternative/Backup)
NEON_NEON_DATABASE_URL=votre_neon_database_url
NEON_POSTGRES_URL=votre_neon_postgres_url

# Stripe (Paiements)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=votre_stripe_publishable_key
STRIPE_SECRET_KEY=votre_stripe_secret_key
STRIPE_WEBHOOK_SECRET=votre_stripe_webhook_secret

# Rate Limiting (Optionnel)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_REQUESTS_PER_MINUTE=10
\`\`\`

## 🔑 Obtenir les Clés d'API

### Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet ou utilisez un existant
3. Allez dans **Settings** → **API**
4. Copiez :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
5. Allez dans **Settings** → **API** → **JWT Settings**
   - Copiez `JWT Secret` → `SUPABASE_JWT_SECRET`

### Neon (Optionnel si vous utilisez Supabase)
1. Allez sur [neon.tech](https://neon.tech)
2. Créez un nouveau projet
3. Copiez la connection string → `NEON_DATABASE_URL`

### Stripe
1. Allez sur [stripe.com](https://stripe.com)
2. Créez un compte ou connectez-vous
3. Allez dans **Developers** → **API keys**
4. Copiez :
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`
5. Pour le webhook secret :
   - Installez Stripe CLI : `brew install stripe/stripe-cli/stripe` (Mac) ou téléchargez depuis [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   - Lancez : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Copiez le webhook secret affiché

## 🗄️ Configuration de la Base de Données

### Avec Supabase

1. **Exécuter les migrations SQL** :
   - Allez dans votre projet Supabase
   - Ouvrez **SQL Editor**
   - Copiez et exécutez le contenu des fichiers dans `/scripts` (si présents)
   - Ou utilisez les scripts de migration fournis

2. **Activer Row Level Security (RLS)** :
   - Les politiques RLS sont incluses dans les scripts SQL
   - Vérifiez qu'elles sont bien activées dans **Authentication** → **Policies**

3. **Configurer l'authentification** :
   - Allez dans **Authentication** → **Providers**
   - Activez **Email** provider
   - Configurez les URLs de redirection :
     - `http://localhost:3000/**` (développement)
     - Votre URL de production (quand vous déployez)

### Avec Neon

Si vous préférez utiliser Neon :
1. Créez les tables en utilisant les scripts SQL fournis
2. Mettez à jour les imports dans le code pour utiliser Neon au lieu de Supabase

## 🚀 Lancer le Projet

\`\`\`bash
npm run dev
\`\`\`

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🧪 Tests (Optionnel)

\`\`\`bash
# Lancer les tests
npm test

# Lancer les tests en mode watch
npm test -- --watch

# Lancer les tests avec couverture
npm test -- --coverage
\`\`\`

## 📝 Structure des Variables par Fonctionnalité

### Authentification
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`

### Base de Données
- `NEON_DATABASE_URL` (si vous utilisez Neon)
- Ou les variables Supabase ci-dessus

### Paiements
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Configuration Générale
- `NEXT_PUBLIC_APP_URL`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_REQUESTS_PER_MINUTE`

## ⚠️ Notes Importantes

1. **Ne commitez JAMAIS le fichier `.env.local`** - Il est déjà dans `.gitignore`
2. **Utilisez des clés de test Stripe** en développement (commencent par `pk_test_` et `sk_test_`)
3. **Les variables `NEXT_PUBLIC_*`** sont exposées au client - ne mettez jamais de secrets dedans
4. **Pour la production**, configurez ces variables dans Vercel ou votre plateforme de déploiement

## 🔧 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que vos URLs Supabase/Neon sont correctes
- Vérifiez que votre projet Supabase/Neon est actif

### Erreur d'authentification
- Vérifiez que `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` est bien configuré
- Vérifiez que les URLs de redirection sont configurées dans Supabase

### Erreur Stripe
- Vérifiez que vous utilisez les bonnes clés (test vs production)
- Assurez-vous que Stripe CLI est en cours d'exécution pour les webhooks

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation Neon](https://neon.tech/docs)

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :
1. Vérifiez que toutes les variables d'environnement sont correctement configurées
2. Vérifiez les logs de la console pour des erreurs spécifiques
3. Assurez-vous que toutes les dépendances sont installées (`npm install`)
4. Essayez de supprimer `node_modules` et `.next` puis réinstallez : `rm -rf node_modules .next && npm install`
\`\`\`

```env file="" isHidden
