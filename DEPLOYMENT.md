# Guide de Déploiement - Nino Wash

## 🚀 Déploiement sur Vercel

### Configuration Initiale

1. **Connecter le repository GitHub à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Importer le projet depuis GitHub
   - Configurer les variables d'environnement

2. **Variables d'environnement requises**
\`\`\`env
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
\`\`\`

### Déploiement Automatique

Le déploiement est automatisé via GitHub Actions :

- **Staging** : Déploiement automatique sur push vers `develop`
- **Production** : Déploiement automatique sur push vers `main`

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
\`\`\`bash
# Via l'interface Supabase ou scripts
npm run db:migrate
\`\`\`

### Monitoring Base de Données

- **Métriques** : Dashboard Supabase
- **Alertes** : Configuration via Supabase
- **Backup** : Automatique quotidien

## 📧 Configuration Email

### Resend Setup

1. **Domaine vérifié**
   - Ajouter le domaine dans Resend
   - Configurer les enregistrements DNS :
     \`\`\`
     Type: TXT
     Name: _resend
     Value: [clé fournie par Resend]
     \`\`\`

2. **Templates email**
   - Templates stockés dans `/lib/email-templates/`
   - Personnalisation via variables

## 💳 Configuration Stripe

### Webhooks Production

1. **Endpoint webhook**
   \`\`\`
   URL: https://votre-domaine.com/api/webhooks/stripe
   Events: payment_intent.succeeded, subscription.updated, etc.
   \`\`\`

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
\`\`\`bash
# Tests critiques uniquement
npm run test:smoke
\`\`\`

## 📈 Optimisations Performance

### CDN Configuration

- Assets statiques via Vercel CDN
- Images optimisées automatiquement
- Compression gzip/brotli

### Cache Strategy

- Pages statiques : Cache long terme
- API responses : Cache court terme
- Images : Cache très long terme

## 🆘 Procédures d'Urgence

### Maintenance Mode

1. **Activer le mode maintenance**
\`\`\`bash
# Déployer une page de maintenance
vercel --prod --env MAINTENANCE_MODE=true
\`\`\`

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

**⚠️ Important** : Toujours tester les déploiements sur staging avant production !
