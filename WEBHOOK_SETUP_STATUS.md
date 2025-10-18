📋 # STRIPE WEBHOOK SETUP - CHECKLIST

## ✅ Ce qui est FAIT (Prêt)

### 1. Configuration Locale (.env.local)
```bash
✅ STRIPE_SECRET_KEY = sk_test_...       (Clé test Stripe)
✅ STRIPE_PUBLISHABLE_KEY = pk_test_...  (Clé publique test)
✅ STRIPE_WEBHOOK_SECRET = whsec_...     (Secret webhook Stripe CLI)
✅ NEXT_PUBLIC_SUPABASE_URL              (Supabase configuré)
✅ SUPABASE_SERVICE_ROLE_KEY             (Pour Edge Functions)
```

### 2. Edge Functions
```bash
✅ send-booking-payment-email          DEPLOYED on Supabase
✅ send-booking-confirmation-email     DEPLOYED on Supabase
✅ Deno tests                           6/6 PASSING ✅
```

### 3. API Webhook Endpoint
```bash
✅ app/api/webhooks/stripe/route.ts    Created & tested
✅ Webhook signature verification      Implemented
✅ Event handling (invoice, charge)    Ready
```

### 4. Documentation
```bash
✅ docs/WEBHOOK_CONFIGURATION.md       Complete guide (CLI + Dashboard)
✅ .env.production.example             Production template
✅ start-stripe-webhook.sh             Local testing script
✅ LISEZMOI.md & QUICK_START.md        Updated with CLI option
```

### 5. Database
```bash
✅ Migrations prepared                 supabase/migrations/*.sql
⏳ Awaiting execution                  (Ready to apply)
```

---

## 🎯 PROCHAINE ÉTAPE : Test Local avec Stripe CLI

### Option 1: Démarrer les webhooks (RECOMMANDÉ)

```bash
# Terminal 1: Next.js dev server
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
pnpm dev
# Accès: http://localhost:3000

# Terminal 2: Stripe webhook listener
chmod +x start-stripe-webhook.sh
./start-stripe-webhook.sh

# OU directement:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Résultat attendu:
```
✓ Webhook signing secret: whsec_test_1234...
✓ Ready! Your webhook is evt_...
```

### Option 2: Copier le secret webhook

```bash
# Voir dans le terminal Stripe CLI: whsec_test_...
# Copier dans .env.local:

STRIPE_WEBHOOK_SECRET=whsec_test_1234...

# Redémarrer Next.js (Ctrl+C puis pnpm dev)
```

---

## 🧪 Tester les Webhooks

### Avec Stripe CLI (Terminal 3):

```bash
# Test 1: Créer une facture
stripe trigger invoice.created

# Test 2: Mettre à jour un abonnement
stripe trigger customer.subscription.updated

# Test 3: Simuler un paiement
stripe trigger charge.succeeded
```

### Vérifier dans les logs:

**Stripe CLI (Terminal 2):**
```
2025-10-18 14:32:15  ▶ invoice.created [evt_test_...]
✓ [200] sent successfully to http://localhost:3000/api/webhooks/stripe
```

**Next.js Dev (Terminal 1):**
```
[v0] Webhook received: invoice.created
[v0] Processing event...
[v0] Sending email via Edge Function...
```

---

## 📊 Prochaine Phase: Database Migration

Quand vous êtes prêt à tester l'intégration complète:

```bash
# 1. Appliquer la migration Supabase
supabase db push

# Ou manuellement:
supabase sql supabase/migrations/20251017_add_payment_fields_to_bookings.sql

# 2. Tester booking E2E
# - Créer une réservation
# - Recevoir l'email de paiement
# - Completer le paiement
# - Recevoir la confirmation
```

---

## ✅ Checklist Avant Production

- [ ] Stripe CLI fonctionne localement
- [ ] Webhooks reçus avec succès
- [ ] Emails envoyés via Edge Functions
- [ ] Database migration appliquée
- [ ] E2E booking test réussi
- [ ] Clés production Stripe obtenues (live keys)
- [ ] Webhook endpoint créé en production Dashboard
- [ ] Secret webhook production configuré
- [ ] Déploiement production planifié

---

## 🎯 État Actuel

```
Phase 5: Edge Functions     ✅ COMPLETE (Both deployed)
Webhooks: Local Testing     🚀 READY TO START
Webhooks: Configuration     📝 DOCUMENTED
Database Migration          ⏳ AWAITING EXECUTION
Production Deployment       🎬 NEXT
```

---

## 📞 Besoin d'aide ?

### Problèmes courants:

**Stripe CLI se termine immédiatement ?**
```bash
# Essayer:
stripe logout
stripe login
```

**Webhooks non reçus ?**
```bash
# Vérifier:
curl http://localhost:3000/api/webhooks/stripe  # Doit retourner 400, pas 404
ps aux | grep "node\|next"  # Next.js est en cours d'exécution ?
```

**Email non envoyé ?**
```bash
# Vérifier les logs Edge Function:
supabase functions logs send-booking-payment-email

# Vérifier les variables d'env:
supabase secrets list
```

---

## 📚 Documentation Complète

- `docs/WEBHOOK_CONFIGURATION.md` - Guide détaillé local + production
- `QUICK_START.md` - Configuration rapide (anglais)
- `LISEZMOI.md` - Configuration rapide (français)
- `.env.production.example` - Template production
- `start-stripe-webhook.sh` - Script automatisé

---

## 🚀 Vous êtes prêt !

Lancez les webhooks et testez ! 💪

```bash
./start-stripe-webhook.sh
```
