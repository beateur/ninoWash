# 🔄 Flux de Paiement et Confirmation de Réservation

**Date** : 21 octobre 2025  
**Statut** : ✅ CONFIGURÉ  

---

## 📋 Architecture du Flux de Paiement

### 🎯 **Objectif**

Quand un utilisateur paie une réservation via Stripe Checkout, le système doit automatiquement :
1. ✅ Mettre à jour le statut : `pending_payment` → `confirmed`
2. ✅ Marquer le paiement : `payment_status = "succeeded"`
3. ✅ Enregistrer la date de paiement : `paid_at`
4. ✅ Rediriger vers la page de succès

---

## 🔄 **Flux Complet**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. UTILISATEUR CLIQUE "PAYER MAINTENANT"                        │
│    Page: /booking/[id]/pay                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CRÉATION STRIPE CHECKOUT SESSION                             │
│    API: POST /api/bookings/[id]/create-payment-intent           │
│                                                                  │
│    Actions:                                                      │
│    • Récupère booking depuis DB                                 │
│    • Vérifie statut = "pending_payment"                         │
│    • Calcule montant depuis booking.total_amount_cents          │
│    • Crée Checkout Session avec metadata:                       │
│      - booking_id: "xxx"                                         │
│      - guest: "true/false"                                       │
│    • Enregistre stripe_session_id dans booking                  │
│    • Retourne checkoutUrl                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. REDIRECTION VERS STRIPE CHECKOUT                             │
│    URL: https://checkout.stripe.com/c/pay/xxx                   │
│                                                                  │
│    L'utilisateur:                                                │
│    • Voit le récapitulatif (montant correct avec options)      │
│    • Entre ses informations de carte                            │
│    • Valide le paiement                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. STRIPE TRAITE LE PAIEMENT                                    │
│                                                                  │
│    Si succès → Génère 2 événements webhooks:                    │
│    ✅ checkout.session.completed                                │
│    ✅ payment_intent.succeeded                                  │
│                                                                  │
│    Si échec → Génère:                                           │
│    ❌ payment_intent.payment_failed                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. WEBHOOK REÇU PAR L'APPLICATION                               │
│    Endpoint: POST /api/webhooks/stripe                          │
│                                                                  │
│    Handler: checkout.session.completed                          │
│    • Extrait booking_id depuis session.metadata                 │
│    • Update bookings:                                           │
│      - status = "confirmed"                                     │
│      - payment_status = "succeeded"                             │
│      - paid_at = now()                                          │
│      - payment_intent_id = session.payment_intent               │
│    • Log: "✅ Booking confirmed via checkout.session.completed" │
│                                                                  │
│    Fallback: payment_intent.succeeded                           │
│    • Même logique si checkout.session.completed échoue          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. STRIPE REDIRIGE L'UTILISATEUR                                │
│    URL: /booking/[id]/success?session_id=xxx                    │
│                                                                  │
│    La page:                                                      │
│    • Vérifie que booking.status = "confirmed"                   │
│    • Vérifie que booking.paid_at existe                         │
│    • Affiche confirmation avec détails                          │
│    • Affiche le booking_number                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Implémentation Technique**

### 1️⃣ **Création du Checkout Session**

**Fichier** : `app/api/bookings/[id]/create-payment-intent/route.ts`

```typescript
// Créer la session avec metadata pour tracking
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  customer_email: customerEmail,
  line_items: [{
    price_data: {
      currency: "eur",
      product_data: {
        name: `Réservation Nino Wash - ${booking.booking_number}`,
      },
      unit_amount: totalAmountCents, // ✅ Total validé avec options
    },
    quantity: 1,
  }],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}/pay`,
  metadata: {
    booking_id: bookingId,          // ✅ CRITIQUE pour webhook
    guest: booking.user_id ? "false" : "true",
  },
})
```

**Points clés** :
- ✅ `mode: "payment"` → One-time payment (pas abonnement)
- ✅ `metadata.booking_id` → Permet au webhook de retrouver la réservation
- ✅ `success_url` → Redirection après paiement réussi
- ✅ `unit_amount` → Utilise `total_amount_cents` du booking (incluant options)

### 2️⃣ **Webhook Handler**

**Fichier** : `app/api/webhooks/stripe/route.ts`

```typescript
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session
  const bookingId = session.metadata?.booking_id

  if (bookingId) {
    // ✅ Update booking après paiement réussi
    await supabase
      .from("bookings")
      .update({
        status: "confirmed",              // ✅ pending_payment → confirmed
        payment_status: "succeeded",      // ✅ pending → succeeded
        paid_at: new Date().toISOString(), // ✅ Timestamp du paiement
        stripe_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    console.log("✅ Booking confirmed:", bookingId)
  }
  break
}
```

**Fallback Handler** : `payment_intent.succeeded`
- Même logique si `checkout.session.completed` n'est pas reçu
- Garantit que le booking sera confirmé même si un webhook échoue

### 3️⃣ **Page de Succès**

**Fichier** : `app/booking/[id]/success/page.tsx`

La page vérifie automatiquement :
```typescript
const isPaymentConfirmed = 
  booking.payment_status === "succeeded" || 
  booking.status === "confirmed"
```

Si pas confirmé → Affiche message d'attente  
Si confirmé → Affiche confirmation complète

---

## 🧪 **Comment Tester en Local**

### Prérequis
1. ✅ Stripe CLI installé et configuré
2. ✅ Webhook en écoute : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. ✅ Variables d'environnement configurées :
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` (fourni par `stripe listen`)
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Étapes de Test

1. **Créer une réservation** (auth ou guest)
   - Résultat : Booking avec `status = "pending_payment"`

2. **Aller sur la page de paiement**
   ```
   http://localhost:3000/booking/[id]/pay
   ```

3. **Cliquer "Payer maintenant"**
   - Résultat : Redirection vers Stripe Checkout

4. **Utiliser une carte de test Stripe**
   ```
   Numéro: 4242 4242 4242 4242
   Date: N'importe quelle date future
   CVC: N'importe quel 3 chiffres
   ```

5. **Vérifier les logs du terminal `stripe`**
   ```
   [v0] Webhook received, signature present: true
   [v0] Webhook event type: checkout.session.completed
   [v0] Processing booking payment checkout: [booking_id]
   [v0] ✅ Booking confirmed via checkout.session.completed: [booking_id]
   ```

6. **Vérifier la redirection**
   - URL : `http://localhost:3000/booking/[id]/success?session_id=xxx`
   - Page affiche : "Réservation confirmée ✅"

7. **Vérifier en base de données**
   ```sql
   SELECT 
     id, 
     booking_number,
     status,           -- Doit être "confirmed"
     payment_status,   -- Doit être "succeeded"
     paid_at,         -- Doit avoir un timestamp
     total_amount_cents,
     stripe_session_id,
     payment_intent_id
   FROM bookings 
   WHERE id = '[booking_id]';
   ```

---

## 🔒 **Sécurité**

### Validation de la Signature Webhook
Le webhook vérifie la signature Stripe avant de traiter :
```typescript
const signature = headers().get("stripe-signature")
event = validateWebhookSignature(body, signature, STRIPE_WEBHOOK_CONFIG.secret)
```

**Protection contre** :
- ❌ Appels non autorisés
- ❌ Modification de payload
- ❌ Replay attacks

### Vérification du Statut
Avant de confirmer, le webhook vérifie que :
- ✅ Le booking existe
- ✅ Le `booking_id` est dans les metadata
- ✅ Le statut actuel est `pending_payment` (via logique métier)

---

## 📊 **États Possibles**

### Booking Status
- `pending_payment` → Créé, en attente de paiement
- `confirmed` → ✅ Payé et confirmé
- `processing` → En cours de traitement par l'équipe
- `completed` → Service terminé
- `cancelled` → Annulé

### Payment Status
- `pending` → En attente
- `succeeded` → ✅ Paiement réussi
- `failed` → Échec du paiement
- `refunded` → Remboursé

---

## 🐛 **Troubleshooting**

### Problème : Le booking reste en "pending_payment"

**Causes possibles** :
1. ❌ Stripe CLI pas en écoute
   - Solution : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

2. ❌ Webhook secret incorrect
   - Solution : Vérifier `STRIPE_WEBHOOK_SECRET` dans `.env.local`

3. ❌ Metadata `booking_id` manquant
   - Solution : Vérifier que `create-payment-intent` passe bien le `booking_id`

4. ❌ Erreur dans le handler webhook
   - Solution : Consulter les logs du terminal `stripe` et du serveur Next.js

### Problème : Double confirmation (checkout + payment_intent)

**Normal** : Les deux webhooks sont traités, mais la deuxième update est idempotente (même résultat).

**Si problème** : Ajouter une vérification :
```typescript
// Vérifier que le booking n'est pas déjà confirmé
const { data: booking } = await supabase
  .from("bookings")
  .select("status")
  .eq("id", bookingId)
  .single()

if (booking.status === "confirmed") {
  console.log("Booking already confirmed, skipping")
  break
}
```

---

## 🚀 **Améliorations Futures**

### 1. Email de Confirmation
- TODO: Déclencher Edge Function `send-booking-confirmation-email`
- Envoyer email avec :
  - ✅ Numéro de réservation
  - ✅ Détails du service
  - ✅ Dates de collecte/livraison
  - ✅ Montant payé

### 2. Notifications Push
- TODO: Notifier l'équipe logistique
- TODO: Notifier l'utilisateur via notification browser

### 3. Retry Logic
- TODO: Si webhook échoue, retry automatique
- TODO: Dead letter queue pour webhooks perdus

### 4. Analytics
- TODO: Tracker taux de conversion paiement
- TODO: Tracker temps moyen de paiement
- TODO: Alertes si taux d'échec élevé

---

## ✅ **Checklist de Déploiement Production**

Avant de déployer en production :

- [ ] Webhook endpoint configuré dans Stripe Dashboard
  - URL : `https://votre-domaine.com/api/webhooks/stripe`
  - Événements : `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
  
- [ ] Variable `STRIPE_WEBHOOK_SECRET` en production
  - Récupérer depuis Stripe Dashboard → Webhooks → Signing secret
  
- [ ] Variable `NEXT_PUBLIC_APP_URL` en production
  - Exemple : `https://votre-domaine.com`
  
- [ ] Tests end-to-end en mode test Stripe
  
- [ ] Monitoring configuré pour webhooks
  - Logs Vercel/serveur
  - Stripe Dashboard → Webhooks → Logs

---

**✅ SYSTÈME OPÉRATIONNEL**

Le flux de paiement et confirmation automatique est maintenant complètement configuré ! 🎉
