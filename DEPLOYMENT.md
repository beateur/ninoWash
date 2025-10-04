# Guide de Déploiement - Nino Wash

> 📚 **Voir aussi :** [`docs/architecture.md`](docs/architecture.md) pour l'architecture complète

---

## 🚀 Déploiement sur Vercel

### Prérequis
- Repository GitHub connecté
- Compte Vercel
- Variables d'environnement configurées (voir ci-dessous)

### Configuration Initiale

1. **Connecter le repository GitHub à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Importer le projet depuis GitHub
   - Configurer les variables d'environnement

2. **Variables d'environnement requises**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

### Déploiement Automatique

Le déploiement est automatisé via GitHub :

- **Staging** : Déploiement automatique sur push vers `develop`
- **Production** : Déploiement automatique sur push vers `main`

### ⚠️ Note sur l'Architecture

Ce projet utilise **Next.js 14 App Router** avec Server et Client Components.

**Important pour le déploiement :**
- Server Components utilisent `@/lib/supabase/server`
- Client Components utilisent `@/lib/supabase/client`
- Les variables `SUPABASE_SERVICE_ROLE_KEY` ne sont jamais exposées au client

📖 **Plus de détails :** [`docs/architecture.md`](docs/architecture.md)

### Configuration DNS

1. **Domaine personnalisé**
   - Ajouter le domaine dans Vercel
   - Configurer les enregistrements DNS :
     \`\`\`
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     
     Type: A
     Name: @
     Value: 76.76.19.61
     \`\`\`

2. **SSL/TLS**
   - Certificat automatique via Let's Encrypt
   - Redirection HTTPS forcée

## 🗄️ Base de Données

### Migration Production

1. **Backup de sécurité**
\`\`\`bash
# Backup automatique Supabase activé
# Retention : 7 jours (plan gratuit)
\`\`\`

2. **Exécution des migrations**
```bash
# Via l'interface Supabase SQL Editor
# Ou utiliser pnpm pour les scripts automatisés
pnpm db:migrate
```

### Monitoring Base de Données

- **Métriques** : Dashboard Supabase
- **Alertes** : Configuration via Supabase
- **Backup** : Automatique quotidien

---

## 💳 Configuration Stripe

### Webhooks Production

1. **Endpoint webhook**
   ```
   URL: https://votre-domaine.com/api/webhooks/stripe
   Events: payment_intent.succeeded, subscription.updated, etc.
   ```

2. **Clés API**
   - Utiliser les clés de production Stripe
   - Configurer les variables d'environnement

## 📱 PWA Configuration

### Service Worker

- Mise en cache automatique des assets
- Fonctionnement offline partiel
- Notifications push (si configurées)

### Installation App

- Prompt d'installation automatique
- Icônes optimisées pour tous les appareils
- Manifest.json configuré

## 🔒 Sécurité Production

### Headers de Sécurité

Configuration dans `next.config.mjs` :
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin
- Permissions-Policy configurée

### Rate Limiting

- Implémenté au niveau API
- Protection contre les attaques DDoS
- Limitation par IP et utilisateur

## 📊 Monitoring

### Analytics

- **Vercel Analytics** : Performances et Core Web Vitals
- **Google Analytics 4** : Comportement utilisateur
- **Supabase Analytics** : Métriques base de données

### Alertes

Configuration recommandée :
- Erreurs 5xx > 1%
- Temps de réponse > 2s
- Utilisation base de données > 80%

## 🔄 Rollback

### Procédure de Rollback

1. **Via Vercel Dashboard**
   - Aller dans l'onglet "Deployments"
   - Cliquer sur "Promote to Production" sur la version précédente

2. **Via CLI**
\`\`\`bash
vercel rollback [deployment-url] --prod
\`\`\`

### Rollback Base de Données

\`\`\`sql
-- Exemple de rollback migration
-- À adapter selon les changements
BEGIN;
-- Commandes de rollback
COMMIT;
\`\`\`

## 🧪 Tests en Production

### Health Checks

Endpoints de vérification :
- `/api/health` : Status général
- `/api/health/db` : Connexion base de données
- `/api/health/stripe` : Connexion Stripe

### Tests de Fumée

Tests automatiques post-déploiement :
```bash
# Tests critiques uniquement
pnpm test:smoke
```

---

## 📈 Optimisations Performance

### CDN Configuration

- Assets statiques via Vercel CDN
- Images optimisées automatiquement (Next.js Image)
- Compression gzip/brotli automatique

### Cache Strategy

- Pages statiques : Cache long terme
- API responses : Cache court terme
- Images : Cache très long terme

### SSR et Hydration

- Server Components pour performances optimales
- Client Components uniquement où nécessaire
- Architecture hybride pour pages admin

📖 **Plus de détails :** [`docs/architecture.md`](docs/architecture.md) - Section "Performance"

---

## 🆘 Procédures d'Urgence

### Maintenance Mode

1. **Activer le mode maintenance**
```bash
# Déployer une page de maintenance via Vercel
vercel --prod --env MAINTENANCE_MODE=true
```

2. **Communication**
   - Status page (à configurer)
   - Notifications utilisateurs
   - Réseaux sociaux

### Incident Response

1. **Détection** : Alertes automatiques
2. **Investigation** : Logs Vercel + Supabase
3. **Résolution** : Rollback ou hotfix
4. **Communication** : Mise à jour status
5. **Post-mortem** : Analyse et améliorations

---

## 📚 Ressources Supplémentaires

- [`docs/architecture.md`](docs/architecture.md) - Architecture complète
- [`docs/SECURITY_P0_CHECKLIST.md`](docs/SECURITY_P0_CHECKLIST.md) - Sécurité
- [`SETUP_LOCAL.md`](SETUP_LOCAL.md) - Setup local

---

**⚠️ Important** : Toujours tester les déploiements sur staging avant production !

**Dernière mise à jour :** 3 octobre 2025
