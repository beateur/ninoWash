# 🚀 Configuration Webhooks Stripe - Nino Wash

## 📋 Vue d'ensemble

Ce guide couvre la configuration des webhooks Stripe pour votre application Nino Wash, avec deux scénarios :
1. **Développement local** : Stripe CLI → localhost:3000
2. **Production** : Stripe Dashboard → app.ninowash.com

---

## 🔧 Développement Local avec Stripe CLI

### ✅ Prérequis

```bash
# 1. Vérifier Stripe CLI est installé
stripe --version

# 2. Verifier Next.js tourne sur localhost:3000
curl http://localhost:3000

# 3. Verifier .env.local contient les clés Stripe test
echo $STRIPE_SECRET_KEY  # Doit afficher sk_test_...
echo $STRIPE_WEBHOOK_SECRET  # Doit afficher whsec_...
```

### 🎯 Étape 1 : Démarrer Stripe Listener

```bash
# Option A: Utiliser le script fourni
chmod +x start-stripe-webhook.sh
./start-stripe-webhook.sh

# Option B: Directement avec Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### Résultat attendu :
```
⠋ Setting up listener
✓ Webhook signing secret: whsec_test_1234567890
✓ Ready! Your webhook signing secret is whsec_test_1234567890 and your webhook is eventsub_test_1234567890
✓ Installing packages
✓ Listening for events on account [Your Stripe Account]
```

### 🔑 Étape 2 : Copier le Webhook Secret

1. Dans le terminal, vous verrez : `whsec_test_1234567890`
2. Copier cette valeur dans `.env.local` :

```bash
# .env.local
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890  # ← Coller ici
```

3. **Redémarrer** Next.js pour charger la nouvelle clé :

```bash
# Arrêter: Ctrl+C dans le terminal pnpm dev
# Redémarrer:
pnpm dev
```

### 🧪 Étape 3 : Tester les Webhooks

**Garder le terminal `stripe listen` actif**, puis dans un autre terminal :

```bash
# Test 1: Déclencher un événement de paiement
stripe trigger invoice.created

# Test 2: Déclencher une mise à jour d'abonnement
stripe trigger customer.subscription.updated

# Test 3: Déclencher une facture payée
stripe trigger charge.succeeded
```

### 📊 Vérifier les Événements Reçus

Dans le terminal Stripe CLI, vous verrez :
```
2025-10-18 14:32:15  ▶ invoice.created [evt_test_...]
2025-10-18 14:32:16  ▶ charge.succeeded [evt_test_...]
```

Dans les logs Next.js (terminal `pnpm dev`), vous verrez :
```
[v0] Webhook received: invoice.created
[v0] Processing invoice...
[v0] Sending payment email via Edge Function
```

---

## 🌐 Production sur Stripe Dashboard

### ✅ Prérequis

- Compte Stripe avec mode **Live** activé
- Application deployée sur `app.ninowash.com` (ou votre domaine)
- Clés Stripe **live** (pk_live_*, sk_live_*) configurées
- Accès au Stripe Dashboard

### 🎯 Étape 1 : Accéder au Stripe Dashboard

```
https://dashboard.stripe.com/webhooks
```

### 🎯 Étape 2 : Créer un Endpoint

1. Cliquer sur **"Add endpoint"**
2. Entrer l'URL complète :
   ```
   https://app.ninowash.com/api/webhooks/stripe
   ```
3. **Sélectionner les événements** (Events to send) :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.created`
   - `invoice.paid`
   - `charge.succeeded`
   - `charge.failed`

4. Cliquer **"Add endpoint"**

### 🎯 Étape 3 : Copier le Signing Secret

1. L'endpoint est créé, cliquer dessus
2. Voir le **Signing secret** : `whsec_live_1234567890`
3. Copier et ajouter à `.env.production` :

```bash
# .env.production
STRIPE_WEBHOOK_SECRET=whsec_live_1234567890
```

4. Déployer l'application avec ce secret

### 🔄 Étape 4 : Tester en Production

Une fois déployé, Stripe enverra automatiquement les événements. Vous pouvez les tester via le Stripe Dashboard :

1. Dashboard → Webhooks → Votre endpoint
2. Cliquer **"Send test event"**
3. Sélectionner un événement test
4. Vérifier que votre endpoint reçoit l'événement

Vous verrez :
```
Status: Successful
Response: 200 OK
```

---

## 📝 Référence des Événements

| Événement | Déclenche | Fonction Edge |
|-----------|-----------|---------------|
| `invoice.created` | Création de facture | send-booking-payment-email |
| `charge.succeeded` | Paiement réussi | - |
| `customer.subscription.updated` | Mise à jour abonnement | - |
| `customer.subscription.created` | Nouvel abonnement | - |

---

## 🐛 Dépannage

### ❌ "Webhook signature verification failed"

**Cause** : STRIPE_WEBHOOK_SECRET incorrect ou non défini

**Solution** :
```bash
# Vérifier la variable d'env
echo $STRIPE_WEBHOOK_SECRET

# Mettre à jour et redémarrer
# .env.local ou .env.production
STRIPE_WEBHOOK_SECRET=whsec_...  # Copier depuis Stripe CLI ou Dashboard

# Redémarrer l'app
pnpm dev  # ou redéployer en production
```

### ❌ "Connection refused localhost:3000"

**Cause** : Next.js n'est pas en cours d'exécution

**Solution** :
```bash
pnpm dev  # Dans un autre terminal
```

### ❌ "Webhook endpoint not responding"

**Cause** : L'URL n'est pas accessible ou l'app est down

**Solution** :
```bash
# Vérifier que l'app répond
curl -v https://app.ninowash.com/api/webhooks/stripe

# Doit afficher 400 (pas de body) au lieu de 404 ou 500
```

### ⚠️ Webhooks not appearing in Stripe Dashboard

**Cause** : Endpoint pas encore créé ou événements non sélectionnés

**Solution** :
- Vérifier l'endpoint est visible dans Dashboard → Webhooks
- Vérifier les "Events to send" incluent les événements que vous testez

---

## 🔐 Sécurité

### ✅ Checklist

- [ ] STRIPE_WEBHOOK_SECRET **jamais** commité en git
- [ ] Secret différent en dev (whsec_test_*) et prod (whsec_live_*)
- [ ] Vérification signature webhook à chaque appel
- [ ] STRIPE_SECRET_KEY **jamais** exposé au client
- [ ] Logs webhook limités aux données non-sensibles

### 📄 Code de vérification (déjà implémenté)

```typescript
// app/api/webhooks/stripe/route.ts
const sig = request.headers.get("stripe-signature")
const event = stripe.webhooks.constructEvent(
  body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET  // ← Secret utilisé
)
```

---

## 📞 Support

### Erreur encore présente ?

Vérifier les logs :

```bash
# Logs Next.js dev
pnpm dev  # Voir console

# Logs Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe  # Terminal actif

# Logs Supabase (Edge Functions)
supabase functions list
supabase functions logs send-booking-payment-email
```

### Ressources

- Stripe CLI: https://stripe.com/docs/stripe-cli
- Webhook Testing: https://stripe.com/docs/webhooks/test
- Event Types: https://stripe.com/docs/api/events
