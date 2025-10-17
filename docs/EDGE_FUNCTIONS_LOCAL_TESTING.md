# Guide Local Testing - Edge Functions Deno

## 🎯 Objectif

Ce guide explique comment tester localement les Edge Functions (payment + confirmation emails) avant deployment à Supabase.

## 📋 Prérequis

- **Deno v1.40+** installé ([deno.land](https://deno.land))
- **pnpm** pour Next.js dev
- **Accès à Supabase** (API keys et URL)
- **Clés Resend API** pour envoi d'emails
- **Stripe Test Keys** (pour E2E testing)

## 🚀 Setup Rapide

### 1. Installer Deno

```bash
# macOS avec Homebrew
brew install deno

# Vérifier l'installation
deno --version
```

### 2. Configurer l'environnement local

```bash
# Exécuter le script de setup
chmod +x setup-deno-functions.sh
./setup-deno-functions.sh

# Le script crée :
# - .env.deno (template pour les variables d'env)
# - deno.json (configuration Deno avec tasks)
```

### 3. Remplir les credentials

Éditer `.env.deno` avec vos vraies valeurs :

```env
# Get from https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Get from Supabase Project Settings → API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Main app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **IMPORTANT**: `.env.deno` est dans `.gitignore` - ne pas commiter les credentials !

## 🧪 Tester les Edge Functions

### Phase 1: Tests Unitaires (Deno testing)

```bash
# Lancer les tests
deno test -A --env supabase/functions/**/*.test.ts

# Ou spécifiquement pour payment email
deno test -A --env supabase/functions/send-booking-payment-email/index.test.ts
```

**Résultat attendu** :

```
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

Les tests incluent :
- ✅ CORS headers response
- ✅ Invalid payload handling
- ✅ Guest booking email send
- ✅ Missing email validation
- ✅ Missing API key handling
- ✅ Zero amount booking

### Phase 2: Serveur Local Dev

```bash
# Lancer le serveur avec watch mode
deno task dev

# Ou manuellement
deno run -A --env --watch supabase/functions/send-booking-payment-email/index.ts
```

**Résultat attendu** :

```
✅ Listening on http://localhost:8000
👀 Watching for file changes...
```

### Phase 3: Tester avec cURL

Dans un autre terminal :

```bash
# Test 1: Payment Email - Guest Booking
curl -X POST http://localhost:8000 \
  -H 'Content-Type: application/json' \
  -d '{
    "type":"INSERT",
    "record":{
      "id":"550e8400-e29b-41d4-a716-446655440000",
      "booking_number":"BK-20250115-0001",
      "user_id":null,
      "status":"pending_payment",
      "total_amount_cents":5000,
      "metadata":{
        "guest_contact":{
          "email":"john@example.com",
          "first_name":"John",
          "last_name":"Doe"
        }
      }
    }
  }'

# Résultat attendu:
# {
#   "success": true,
#   "messageId": "550e8400-e29b-41d4-a716-446655440000",
#   "email": "john@example.com"
# }
```

```bash
# Test 2: Confirmation Email - Authenticated Booking
curl -X POST http://localhost:8000 \
  -H 'Content-Type: application/json' \
  -d '{
    "bookingId":"550e8400-e29b-41d4-a716-446655440001",
    "bookingNumber":"BK-20250115-0002",
    "email":"jane@example.com",
    "totalAmount":"50.00",
    "paymentIntentId":"pi_3Mj0z5R0R0R0R0R0R0R0R0R"
  }'

# Résultat attendu:
# {
#   "success": true,
#   "email": "jane@example.com"
# }
```

### Phase 4: Vérifier les Logs

Le serveur Deno affiche les logs :

```bash
# Dans le terminal du serveur
[PAYMENT_EMAIL] Processing booking: 550e8400-e29b-41d4-a716-446655440000
[PAYMENT_EMAIL] Guest booking detected, email: john@example.com
[PAYMENT_EMAIL] Sending email to Resend API
[PAYMENT_EMAIL] Email sent successfully: 550e8400-e29b-41d4-a716-446655440000
```

## 📊 Résumé des Payloads

### Webhook Payload (Database trigger)

```json
{
  "type": "INSERT",
  "schema": "public",
  "table": "bookings",
  "record": {
    "id": "uuid",
    "booking_number": "BK-YYYYMMDD-XXXX",
    "user_id": "uuid or null",
    "status": "pending_payment",
    "total_amount_cents": 5000,
    "metadata": {
      "guest_contact": {
        "email": "email@example.com",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  }
}
```

### Confirmation Email Payload

```json
{
  "bookingId": "uuid",
  "bookingNumber": "BK-YYYYMMDD-XXXX",
  "email": "email@example.com",
  "totalAmount": "50.00",
  "paymentIntentId": "pi_xxxxx"
}
```

## 🔍 Dépannage

### Erreur: `Deno command not found`

```bash
# Installer Deno
brew install deno

# Vérifier
deno --version
```

### Erreur: `RESEND_API_KEY not set`

```bash
# Vérifier que .env.deno existe
ls -la .env.deno

# Tester les variables d'env
deno run -A --env test_env.ts
```

### Erreur: `Port 8000 already in use`

```bash
# Trouver le processus
lsof -i :8000

# Tuer le processus (remplacer PID)
kill -9 <PID>

# Ou utiliser un autre port
deno run -A --env --watch supabase/functions/send-booking-payment-email/index.ts --port 8001
```

### Les tests échouent avec `Connection refused`

```bash
# Assurez-vous que Supabase credentials sont corrects dans .env.deno
# Le test mock la requête Resend, donc la connexion Supabase n'est pas testée
```

## 📱 Testing avec le Flow Complet

### Scenario 1: Guest Booking → Payment → Confirmation

1. **Démarrer dev Next.js** :
   ```bash
   pnpm dev
   ```

2. **Démarrer Deno server** (dans autre terminal) :
   ```bash
   deno task dev
   ```

3. **Créer une réservation guest** :
   - Aller à `http://localhost:3000/reservation/guest`
   - Remplir le formulaire
   - Cliquer "Réserver et payer"
   - ✅ Payment email devrait être reçu

4. **Compléter le paiement** :
   - Cliquer le lien dans l'email
   - Utiliser test Stripe card: `4242 4242 4242 4242`
   - Date: `12/25`
   - CVC: `123`
   - ✅ Confirmation email devrait être reçu

5. **Vérifier les logs** :
   - Terminal Next.js: Webhook reçu
   - Terminal Deno: Email envoyé
   - Supabase Dashboard: Booking status = `completed`

## 🚀 Prochaines Étapes

Après validation locale :

1. **Déployer à Supabase** :
   ```bash
   supabase functions deploy send-booking-payment-email --no-verify-jwt
   supabase functions deploy send-booking-confirmation-email --no-verify-jwt
   ```

2. **Configurer les triggers DB** :
   ```sql
   -- Voir: docs/PAYMENT_SYSTEM_MIGRATION.md pour le SQL complet
   ```

3. **Tester avec Stripe Live Mode** :
   - Basculer les clés Stripe en production
   - Créer une vraie réservation
   - Compléter le paiement

4. **Monitoring** :
   - Supabase Functions dashboard
   - Stripe webhook logs
   - Email delivery logs (Resend)

## 📚 Ressources

- [Deno Documentation](https://deno.land/manual)
- [Deno Testing](https://docs.deno.com/runtime/manual/basics/testing/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend Email API](https://resend.com/docs)
- [Stripe Payments](https://stripe.com/docs/payments)

## 💡 Tips & Tricks

### Déboguer avec Deno Inspect

```bash
deno run --inspect-brk -A --env supabase/functions/send-booking-payment-email/index.ts
# Ouvrir chrome://inspect pour le debugger
```

### Exécuter un test spécifique

```bash
deno test -A --env supabase/functions/send-booking-payment-email/index.test.ts --filter "payment email"
```

### Vérifier la couverture de tests

```bash
deno test -A --env supabase/functions/**/*.test.ts --coverage=coverage/
deno coverage coverage/ --lcov --output=coverage.lcov
```

### Formater le code

```bash
deno fmt supabase/functions/
```

### Linter

```bash
deno lint supabase/functions/
```

---

**Last Updated**: January 2025
**Status**: Ready for production deployment
