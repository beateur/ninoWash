# Guide de Configuration Locale - Nino Wash

> 💡 **Pour un démarrage ultra-rapide** : Consultez [`docs/QUICK_START.md`](docs/QUICK_START.md) (5 minutes)

---

## 📥 Télécharger le Projet

### Option 1 : Via GitHub (Recommandé)
1. Clonez le repository sur votre machine :
\`\`\`bash
git clone https://github.com/beateur/ninoWash.git
cd ninoWash
\`\`\`

### Option 2 : Téléchargement ZIP
1. Téléchargez le ZIP depuis GitHub
2. Extrayez le fichier et ouvrez-le dans votre IDE

---

## 📦 Installation des Dépendances

**⚠️ Important :** Ce projet utilise **pnpm** comme package manager.

\`\`\`bash
# Installer pnpm si nécessaire
npm install -g pnpm

# Installer les dépendances
pnpm install
\`\`\`

---

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

# Stripe (Paiements)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=votre_stripe_publishable_key
STRIPE_SECRET_KEY=votre_stripe_secret_key
STRIPE_WEBHOOK_SECRET=votre_stripe_webhook_secret
\`\`\`

> 📝 **Note :** Le projet utilise exclusivement **Supabase** pour la base de données.

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
pnpm dev
\`\`\`

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## ⚠️ Architecture Next.js 14 - Important

Ce projet utilise **Next.js 14 App Router** avec une séparation stricte **Client/Server Components**.

### Règles Essentielles

\`\`\`typescript
// ✅ Client Component (interactivité, hooks)
"use client"
import { createClient } from "@/lib/supabase/client"

// ✅ Server Component (auth, données)
import { createClient } from "@/lib/supabase/server"
\`\`\`

**❌ Ne jamais faire :**
- Importer `@/lib/supabase/server` dans un Client Component
- Utiliser `next/headers` dans un Client Component

📖 **Plus de détails :** Consultez [`docs/architecture.md`](docs/architecture.md) - Section "Patterns Courants"

---

## 🧪 Tests (Optionnel)

\`\`\`bash
# Lancer les tests
pnpm test

# Lancer les tests en mode watch
pnpm test -- --watch

# Lancer les tests avec couverture
pnpm test -- --coverage
\`\`\`

---

## 📝 Structure des Variables par Fonctionnalité

### Authentification & Base de Données
- `NEXT_PUBLIC_SUPABASE_URL` - URL projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé publique Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé secrète admin (serveur uniquement)

### Paiements
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Clé publique Stripe
- `STRIPE_SECRET_KEY` - Clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` - Secret pour webhooks

### Configuration Générale
- `NEXT_PUBLIC_APP_URL` - URL de l'application

## ⚠️ Notes Importantes

1. **Ne commitez JAMAIS le fichier `.env.local`** - Il est déjà dans `.gitignore`
2. **Utilisez des clés de test Stripe** en développement (commencent par `pk_test_` et `sk_test_`)
3. **Les variables `NEXT_PUBLIC_*`** sont exposées au client - ne mettez jamais de secrets dedans
4. **Pour la production**, configurez ces variables dans Vercel (voir [`DEPLOYMENT.md`](DEPLOYMENT.md))
5. **Package manager** : Utilisez toujours `pnpm` pour la cohérence du projet

---

## 🔧 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que vos URLs Supabase sont correctes
- Vérifiez que votre projet Supabase est actif
- Consultez le dashboard Supabase pour les logs

### Erreur d'authentification
- Vérifiez que les URLs de redirection sont configurées dans Supabase (Settings → Auth → URL Configuration)
- Ajoutez `http://localhost:3000/**` dans les Site URLs

### Erreur Stripe
- Vérifiez que vous utilisez les bonnes clés (test vs production)
- Pour les webhooks locaux, utilisez Stripe CLI :
  \`\`\`bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  \`\`\`

### Erreur "You're importing a component that needs next/headers"
- **Cause :** Client Component importe du code serveur
- **Solution :** Voir [`docs/TECHNICAL_CHANGELOG.md`](docs/TECHNICAL_CHANGELOG.md) et [`docs/architecture.md`](docs/architecture.md)

### Port 3000 déjà utilisé
\`\`\`bash
# Trouver et tuer le processus
lsof -ti:3000 | xargs kill -9

# Ou utiliser un autre port
pnpm dev --port 3001
\`\`\`

---

## 📚 Ressources

### Documentation Projet
- 🚀 **[QUICK_START.md](docs/QUICK_START.md)** - Démarrage en 5 minutes
- 📐 **[architecture.md](docs/architecture.md)** - Architecture complète
- 🔧 **[TECHNICAL_CHANGELOG.md](docs/TECHNICAL_CHANGELOG.md)** - Changements récents
- 📖 **[INDEX.md](docs/INDEX.md)** - Index de toute la documentation

### Documentation Externe
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. **Vérifications de base :**
   - Toutes les variables d'environnement sont configurées
   - Dépendances installées avec `pnpm install`
   - Cache Next.js nettoyé : `rm -rf .next && pnpm dev`

2. **Documentation :**
   - Consultez [`docs/QUICK_START.md`](docs/QUICK_START.md) pour le troubleshooting
   - Voir [`docs/INDEX.md`](docs/INDEX.md) pour la navigation complète

3. **Logs :**
   - Vérifiez les logs dans le terminal
   - Inspectez la console du navigateur (F12)
   - Consultez les logs Supabase (Dashboard → Logs)

---

**Dernière mise à jour :** 3 octobre 2025  
**Version :** 2.0 (architecture client/server)
