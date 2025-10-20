# 📜 Scripts de Configuration - Guide d'Utilisation

Ce dossier contient tous les scripts nécessaires pour configurer et tester l'application NinoWash.

---

## 🚀 Scripts de Démarrage Rapide

### `start-dev.sh` - Démarrage Développement

**Usage:**
```bash
./start-dev.sh
```

**Ce qu'il fait:**
- ✅ Vérifie et installe Stripe CLI si nécessaire
- ✅ Démarre `stripe listen` pour les webhooks
- ✅ Démarre l'application (`npm run dev` ou `vercel dev`)
- ✅ Affiche le webhook secret temporaire

**Idéal pour:** Démarrage quotidien en développement

---

## ⚙️ Scripts de Configuration Stripe

### `configure-stripe-prod.sh` - Configuration Production

**Usage:**
```bash
./configure-stripe-prod.sh
```

**Ce qu'il fait:**
- Demande les clés Stripe LIVE (pk_live_, sk_live_)
- Demande le webhook secret production (whsec_)
- Configure UNIQUEMENT l'environnement **Production** sur Vercel
- Laisse les environnements dev/preview inchangés

**À utiliser quand:**
- Premier déploiement en production
- Rotation des clés Stripe
- Mise à jour du webhook secret

**Variables configurées:**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (Production)
STRIPE_SECRET_KEY (Production)
STRIPE_WEBHOOK_SECRET (Production)
```

---

### `configure-stripe-dev.sh` - Configuration Dev/Preview

**Usage:**
```bash
./configure-stripe-dev.sh
```

**Ce qu'il fait:**
- Lit les clés Stripe TEST depuis `.env.local`
- Configure les environnements **Development** et **Preview** sur Vercel
- Laisse l'environnement production inchangé

**À utiliser quand:**
- Première configuration du projet
- Mise à jour des clés de test
- Ajout d'un nouveau développeur

**Variables configurées:**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (Development + Preview)
STRIPE_SECRET_KEY (Development + Preview)
STRIPE_WEBHOOK_SECRET (Development + Preview)
```

---

### `configure-vercel-env.sh` - Configuration Complète

**Usage:**
```bash
./configure-vercel-env.sh
```

**Ce qu'il fait:**
- Configure TOUTES les variables d'environnement
- Demande les valeurs manquantes de manière interactive
- Configure tous les environnements (Dev, Preview, Production)

**À utiliser quand:**
- Nouvelle installation complète
- Reconfiguration totale du projet
- Migration vers nouveau projet Vercel

**Variables configurées:**
```bash
# Application
NEXT_PUBLIC_APP_URL
NODE_ENV

# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Email
RESEND_API_KEY
FROM_EMAIL

# Feature Flags
NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED
NEXT_PUBLIC_BOOKINGS_ENABLED
MAINTENANCE_MODE

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE
RATE_LIMIT_WINDOW_MS

# File Upload
MAX_FILE_SIZE
ALLOWED_FILE_TYPES

# Logging
LOG_LEVEL
ENABLE_REQUEST_LOGGING
```

---

## 📊 Comparaison des Scripts Stripe

| Aspect | `configure-stripe-prod.sh` | `configure-stripe-dev.sh` | `configure-vercel-env.sh` |
|--------|----------------------------|---------------------------|---------------------------|
| **Clés Stripe** | LIVE (pk_live) | TEST (pk_test) | Les deux |
| **Environnements** | Production uniquement | Dev + Preview | Tous |
| **Interactif** | Oui (demande clés) | Non (lit .env.local) | Oui (demande tout) |
| **Autres variables** | Non | Non | Oui (Supabase, Email, etc.) |
| **Durée** | ~2 min | ~30 sec | ~5 min |
| **Usage** | Déploiement prod | Setup dev | Setup complet |

---

## 🎯 Workflow Recommandé

### Nouveau Projet / Nouveau Développeur

```bash
# 1. Cloner le repo
git clone https://github.com/beateur/ninoWash.git
cd ninoWash

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement dev/preview
./configure-stripe-dev.sh

# 4. Démarrer en dev
./start-dev.sh
```

### Premier Déploiement Production

```bash
# 1. S'assurer que dev fonctionne
./start-dev.sh
# Tester avec 4242...

# 2. Configurer la production
./configure-stripe-prod.sh
# Entrer les clés LIVE de Stripe

# 3. Déployer
git push origin main
# Vercel déploie automatiquement

# 4. Tester la production
# Utiliser une vraie carte
# Vérifier Stripe Dashboard (LIVE)
```

### Développement Quotidien

```bash
# Simple et rapide
./start-dev.sh
```

### Rotation des Clés (Sécurité)

```bash
# Production
./configure-stripe-prod.sh

# Dev/Preview
./configure-stripe-dev.sh

# Forcer un nouveau déploiement
vercel --prod --force
```

---

## 🔧 Scripts SQL

### `scripts/MIGRATION_TO_SUPABASE_AUTH.sql`

**Description:** Migration complète vers Supabase Auth native

**Ce qu'il fait:**
- Migre les données de `public.users` vers `auth.users`
- Crée les profils dans `user_profiles`
- Fixe toutes les contraintes FK
- Archive `public.users` en `users_deprecated`
- Crée une vue `public.users` pour compatibilité

**Status:** ✅ Exécuté en production le 20 oct 2025

**Ne PAS réexécuter** (déjà fait)

### `scripts/verify-supabase-auth.sh`

**Usage:**
```bash
bash scripts/verify-supabase-auth.sh
```

**Ce qu'il fait:**
- Vérifie l'architecture Supabase Auth
- Compte les users et profiles
- Vérifie les contraintes FK
- Vérifie les triggers
- Génère un rapport complet

**À utiliser:**
- Après la migration
- En cas de doute sur l'intégrité des données
- Avant un gros déploiement

---

## 🛠️ Commandes Utiles

### Vérifier les Variables Configurées

```bash
# Toutes les variables
vercel env ls

# Variables Stripe uniquement
vercel env ls | grep STRIPE

# Variables par environnement
vercel env ls production
vercel env ls preview
vercel env ls development
```

### Mettre à Jour une Variable

```bash
# Supprimer l'ancienne
vercel env rm STRIPE_SECRET_KEY production

# Ajouter la nouvelle
vercel env add STRIPE_SECRET_KEY production
# Entrer la valeur quand demandé
```

### Tester les Webhooks Localement

```bash
# Démarrer l'écoute
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Dans un autre terminal, trigger un événement
stripe trigger checkout.session.completed

# Voir les logs en temps réel
tail -f /tmp/stripe-listen.log
```

---

## ⚠️ Précautions

### ❌ À NE PAS FAIRE

1. **Ne jamais commit les fichiers .env**
   ```bash
   # Vérifier que .gitignore contient:
   .env.local
   .env.deno
   .env*.local
   ```

2. **Ne pas utiliser les clés LIVE en dev**
   ```bash
   # .env.local doit avoir pk_test et sk_test
   # PAS pk_live ou sk_live
   ```

3. **Ne pas partager les clés secrètes**
   ```bash
   # Les clés sont chiffrées sur Vercel
   # Ne les copier/coller nulle part
   ```

### ✅ Bonnes Pratiques

1. **Séparer les environnements**
   - Dev/Preview → Clés TEST
   - Production → Clés LIVE

2. **Vérifier avant de déployer**
   ```bash
   npm run build  # Doit réussir
   vercel env ls production  # Vérifier les clés
   ```

3. **Tester d'abord en Preview**
   ```bash
   git checkout -b test/my-feature
   git push origin test/my-feature
   # Tester sur l'URL Preview
   # Merger si OK
   ```

4. **Monitorer après déploiement**
   - Stripe Dashboard (paiements)
   - Vercel Logs (erreurs)
   - Supabase Dashboard (données)

---

## 📚 Documentation Associée

| Document | Description |
|----------|-------------|
| `TESTING_GUIDE.md` | Guide complet de test du flow de paiement |
| `STRIPE_PRODUCTION_SETUP.md` | Configuration production Stripe |
| `ENVIRONMENT_SETUP_SUMMARY.md` | Résumé de tous les environnements |
| `DEPLOYMENT_SUCCESS.md` | Rapport de déploiement |
| `docs/WEBHOOK_CONFIGURATION.md` | Configuration des webhooks |

---

## 🆘 En Cas de Problème

### Script ne démarre pas

```bash
# Vérifier les permissions
ls -l *.sh

# Rendre exécutable
chmod +x configure-stripe-prod.sh
chmod +x configure-stripe-dev.sh
chmod +x start-dev.sh
```

### Vercel CLI non installé

```bash
npm install -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link
```

### Stripe CLI non installé

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login
```

### Variables non prises en compte

```bash
# Forcer un nouveau déploiement
vercel --prod --force

# Vérifier les variables
vercel env ls production
```

---

**Créé le:** 20 octobre 2025  
**Version:** 1.0  
**Auteur:** Configuration automatique NinoWash
