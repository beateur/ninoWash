# 🧪 Guide de Test - Flow de Paiement Stripe

**Date:** 20 octobre 2025  
**Objectif:** Tester le flow complet de réservation guest avec paiement en environnement de développement

---

## 📋 Environnements Configurés

### ✅ Production (ninowash.fr)
- **Clés Stripe:** LIVE (`pk_live_...`, `sk_live_...`)
- **Webhook:** https://ninowash.fr/api/webhooks/stripe
- **Cartes:** Cartes bancaires RÉELLES uniquement
- **Usage:** Clients finaux

### ✅ Preview (branches Git)
- **Clés Stripe:** TEST (`pk_test_...`, `sk_test_...`)
- **URL:** Généré automatiquement par Vercel (ex: `ninowash-abc123.vercel.app`)
- **Webhook:** Webhook de test automatique
- **Cartes:** Cartes de test Stripe
- **Usage:** Tests avant merge

### ✅ Development (localhost)
- **Clés Stripe:** TEST (`pk_test_...`, `sk_test_...`)
- **URL:** http://localhost:3000
- **Webhook:** Stripe CLI (`stripe listen`)
- **Cartes:** Cartes de test Stripe
- **Usage:** Développement local

---

## 🚀 Méthode 1: Test Local (Recommandé pour Debug)

### Étape 1: Démarrer Stripe CLI (Terminal 1)

```bash
# Installer Stripe CLI si pas déjà fait
brew install stripe/stripe-cli/stripe

# Se connecter à Stripe
stripe login

# Démarrer l'écoute des webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Sortie attendue:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Étape 2: Copier le Webhook Secret

```bash
# Le webhook secret temporaire sera affiché
# Exemple: whsec_abc123def456

# Mettre à jour .env.local avec ce secret
STRIPE_WEBHOOK_SECRET=whsec_abc123def456
```

### Étape 3: Démarrer l'Application (Terminal 2)

```bash
# Développement Next.js classique
npm run dev
```

**OU**

```bash
# Développement avec Vercel CLI (plus proche de la prod)
vercel dev
```

### Étape 4: Tester le Flow Complet

#### 4.1 Créer une Réservation Guest

1. Aller sur http://localhost:3000
2. Cliquer sur "Réserver"
3. Remplir le formulaire en mode **guest** (sans compte)
4. Soumettre la réservation

#### 4.2 Vérifier l'Email de Confirmation

**Option A: Email de dev (console)**
```bash
# Si tu utilises Resend en mode dev, vérifie la console
# L'email devrait s'afficher dans les logs
```

**Option B: Vérifier dans Resend Dashboard**
```
https://resend.com/emails
→ Chercher l'email de réservation
→ Copier le lien de paiement
```

#### 4.3 Effectuer le Paiement

1. Cliquer sur le lien de paiement dans l'email
2. Être redirigé vers Stripe Checkout
3. Utiliser une carte de test:

**Cartes de Test Stripe:**

| Carte | Numéro | Résultat |
|-------|--------|----------|
| **Succès** | 4242 4242 4242 4242 | Paiement réussi |
| **Échec** | 4000 0000 0000 0002 | Carte refusée |
| **3D Secure** | 4000 0025 0000 3155 | Authentification requise |
| **Insuffisant** | 4000 0000 0000 9995 | Fonds insuffisants |

- **Date d'expiration:** N'importe quelle date future (ex: 12/25)
- **CVC:** N'importe quel 3 chiffres (ex: 123)
- **Code postal:** N'importe quel code

#### 4.4 Vérifier le Webhook (Terminal 1)

**Dans le terminal avec `stripe listen`, tu devrais voir:**

```bash
2025-10-20 22:30:15   --> checkout.session.completed [evt_xxx]
2025-10-20 22:30:15   <-- [200] POST http://localhost:3000/api/webhooks/stripe
```

**Statut 200 = Webhook reçu et traité avec succès ✅**

#### 4.5 Vérifier la Base de Données

```bash
# Option 1: Supabase Dashboard
# https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm/editor

# Option 2: SQL direct
psql $DATABASE_URL
SELECT * FROM bookings WHERE stripe_payment_intent_id IS NOT NULL ORDER BY created_at DESC LIMIT 1;
```

**Vérifier:**
- ✅ `status` = 'confirmed' ou 'paid'
- ✅ `stripe_payment_intent_id` = 'pi_xxx'
- ✅ `stripe_session_id` = 'cs_xxx'

---

## 🌐 Méthode 2: Test sur Preview Deployment

### Étape 1: Créer une Branche de Test

```bash
# Créer une branche pour tester
git checkout -b test/stripe-payment-flow

# Faire un petit changement (pour déclencher le build)
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: stripe payment flow"

# Pousser la branche
git push origin test/stripe-payment-flow
```

### Étape 2: Attendre le Déploiement Vercel

Vercel va automatiquement:
1. Détecter la nouvelle branche
2. Créer un déploiement Preview
3. Utiliser les variables d'environnement **Preview** (clés TEST)

**URL Preview:**
```
https://ninowash-abc123-beateur.vercel.app
```

Tu recevras l'URL dans:
- GitHub (commentaire sur le commit)
- Email Vercel
- Dashboard Vercel

### Étape 3: Tester sur Preview

1. Aller sur l'URL Preview
2. Faire une réservation guest
3. Utiliser les cartes de test (4242...)
4. Vérifier le webhook sur Stripe Dashboard (mode TEST)

**Avantages de Preview:**
- ✅ Environnement identique à la production
- ✅ Webhooks configurés automatiquement
- ✅ Pas besoin de Stripe CLI
- ✅ Partage facile avec l'équipe

---

## 🐛 Debugging: Que Vérifier en Cas d'Erreur

### Erreur: "Paiement refusé"

**1. Vérifier les clés Stripe utilisées**
```bash
# En local
grep STRIPE .env.local

# Sur Preview/Prod
vercel env ls preview | grep STRIPE
```

**2. Vérifier la carte utilisée**
- Est-ce une carte de TEST (4242...) en dev/preview ?
- Est-ce une carte RÉELLE en production ?

**3. Vérifier les logs Stripe**
```bash
# Dashboard Stripe (mode TEST)
https://dashboard.stripe.com/test/payments

# Chercher le PaymentIntent
# Vérifier le statut et les erreurs
```

### Erreur: "Webhook non reçu"

**1. Vérifier que `stripe listen` tourne (local)**
```bash
# Le terminal doit afficher:
Ready! Your webhook signing secret is whsec_xxx
```

**2. Vérifier le webhook secret dans .env.local**
```bash
# Doit correspondre au secret de stripe listen
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**3. Vérifier les logs de l'API**
```bash
# Dans le terminal npm run dev, chercher:
POST /api/webhooks/stripe
```

### Erreur: "Email non reçu"

**1. Vérifier Resend Dashboard**
```bash
https://resend.com/emails
→ Chercher les emails récents
→ Vérifier le statut (delivered/failed)
```

**2. Vérifier la clé Resend**
```bash
# .env.local ou .env.deno
RESEND_API_KEY=re_cRWJSgNr_BqmiobCspRaSh3WDTjuhSDgs
```

**3. Vérifier les logs serveur**
```bash
# Chercher dans les logs:
"Sending email to: xxx@example.com"
```

### Erreur: "User non créé"

**1. Vérifier la base de données**
```sql
-- Supabase SQL Editor
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;
SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 5;
```

**2. Vérifier le trigger**
```sql
-- Le trigger doit être actif
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**3. Vérifier les logs Supabase**
```bash
# Dashboard Supabase → Logs → Auth
# Chercher les erreurs d'authentification
```

---

## 📊 Tableau Récapitulatif des Environnements

| Aspect | Local | Preview | Production |
|--------|-------|---------|------------|
| **URL** | localhost:3000 | *.vercel.app | ninowash.fr |
| **Clés Stripe** | TEST (pk_test) | TEST (pk_test) | LIVE (pk_live) |
| **Webhook** | stripe listen | Auto Vercel | Stripe prod |
| **Cartes** | 4242... | 4242... | Vraies cartes |
| **Database** | Prod Supabase | Prod Supabase | Prod Supabase |
| **Emails** | Resend (dev) | Resend (test) | Resend (prod) |
| **Commande** | `npm run dev` | `git push` | Merge to main |

---

## 🎯 Workflow Recommandé

### Pour Développer une Feature
```bash
1. npm run dev              # Démarrer en local
2. stripe listen            # Écouter les webhooks
3. Tester avec 4242...     # Cartes de test
4. Debugger avec console   # Chrome DevTools
5. Vérifier DB Supabase    # Dashboard
```

### Pour Valider Avant Prod
```bash
1. git checkout -b feature/xxx
2. git push origin feature/xxx
3. Tester sur Preview URL
4. Vérifier webhooks Stripe Dashboard
5. Merge si OK
```

### Pour Déployer en Prod
```bash
1. Merge vers main
2. Vercel déploie automatiquement
3. Tester sur ninowash.fr avec vraie carte
4. Monitorer Stripe Dashboard (LIVE)
```

---

## 🛠️ Outils de Debug

### Chrome DevTools
```javascript
// Console → Network
// Filtrer: "stripe"
// Vérifier les appels API

// Console → Application → Local Storage
// Vérifier: Stripe publishable key
```

### Stripe CLI
```bash
# Voir les événements en temps réel
stripe events list --limit 10

# Resend un événement spécifique
stripe events resend evt_xxx

# Tester un webhook
stripe trigger checkout.session.completed
```

### Logs Vercel
```bash
# En ligne de commande
vercel logs https://ninowash-abc123.vercel.app

# Ou dans le dashboard
https://vercel.com/beateur/ninowash/deployments
```

### Logs Supabase
```bash
# Dashboard Supabase
https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm/logs/explorer

# Filtrer par:
# - auth (authentification)
# - postgres (database)
# - edge-functions (si tu utilises)
```

---

## ✅ Checklist de Test Complète

### Test du Flow Guest Booking

- [ ] Page d'accueil charge correctement
- [ ] Formulaire de réservation accessible
- [ ] Réservation guest créée dans la DB
- [ ] User créé dans auth.users
- [ ] Profile créé dans user_profiles
- [ ] Email de confirmation envoyé
- [ ] Lien de paiement valide dans l'email
- [ ] Redirection vers Stripe Checkout
- [ ] Paiement avec 4242... réussit
- [ ] Webhook reçu (200)
- [ ] Booking status = 'confirmed'
- [ ] stripe_payment_intent_id rempli
- [ ] Email de confirmation de paiement envoyé

### Test des Cas d'Erreur

- [ ] Carte refusée (4000 0000 0000 0002)
- [ ] Webhook échoue (tester la résilience)
- [ ] Timeout Stripe
- [ ] Email non délivré (vérifier retry)
- [ ] User déjà existant
- [ ] Créneaux complets

---

## 📚 Ressources

**Stripe:**
- Cartes de test: https://stripe.com/docs/testing#cards
- Événements test: https://stripe.com/docs/cli/trigger
- Dashboard TEST: https://dashboard.stripe.com/test/payments

**Documentation locale:**
- Architecture: `docs/architecture.md`
- Booking workflow: `docs/booking-system-workflow.md`
- Webhook config: `docs/WEBHOOK_CONFIGURATION.md`

**Support:**
- Stripe Support: https://support.stripe.com
- Vercel Support: https://vercel.com/support
- Supabase Docs: https://supabase.com/docs

---

**Créé le:** 20 octobre 2025  
**Mis à jour:** 20 octobre 2025  
**Version:** 1.0
