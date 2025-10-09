# Stripe Payment Testing Guide - Phase 2 Day 1-2

**Quick Start Guide pour tester l'intégration Stripe Payment Intents**

---

## 🔑 Setup (Prérequis)

### 1. Variables d'Environnement

Ajouter dans `.env.local` (créer le fichier si nécessaire) :

```bash
# Stripe Test Keys (Dashboard → Developers → API Keys)
STRIPE_SECRET_KEY=sk_test_51... # ⚠️ SERVER-ONLY (never commit)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51... # ✅ Public (safe for client)

# Supabase (déjà configuré normalement)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Où trouver les clés Stripe** :
1. Aller sur https://dashboard.stripe.com/test/apikeys
2. Copier "Publishable key" (commence par `pk_test_`)
3. Copier "Secret key" (commence par `sk_test_`)
4. **IMPORTANT** : Utiliser les clés **TEST** (pas LIVE)

### 2. Démarrer le serveur

```bash
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
pnpm dev
```

Le serveur démarre sur http://localhost:3000

---

## 🧪 Test Scenarios

### Scénario 1 : Paiement Réussi (Happy Path)

**Étapes** :
1. Ouvrir http://localhost:3000/reservation/guest
2. **Step 0 (Contact)** :
   - Email: `test@example.com`
   - Prénom: `John`
   - Nom: `Doe`
   - Téléphone: `+33612345678`
   - Cocher RGPD
   - Cliquer "Continuer"

3. **Step 1 (Services)** :
   - Sélectionner au moins 1 service (par exemple "Repassage" quantity = 1)
   - Cliquer "Continuer"

4. **Step 2 (Adresses)** :
   - Pickup Address:
     - Rue: `123 Rue de Test`
     - Ville: `Paris`
     - Code postal: `75001`
   - Cocher "Utiliser la même adresse pour la livraison"
   - Cliquer "Continuer"

5. **Step 3 (Date & Heure)** :
   - Sélectionner une date future (demain minimum)
   - Choisir un créneau horaire (10:00-12:00)
   - Cliquer "Continuer"

6. **Step 4 (Summary & Payment)** :
   - Vérifier le récapitulatif
   - ✅ **Vérifier que le bouton "Procéder au paiement" est désactivé pendant 1-2 secondes** (fetch services)
   - Cliquer "Procéder au paiement"
   - ✅ **Vérifier que Stripe Elements s'affiche** (champ carte bancaire)

7. **Stripe Elements** :
   - Numéro de carte : `4242 4242 4242 4242`
   - Date d'expiration : `12/34` (n'importe quelle date future)
   - CVC : `123` (n'importe quel 3 chiffres)
   - Code postal : `75001`
   - Cliquer "Confirmer le paiement €XX.XX"

8. **Résultat attendu** :
   - ✅ Loading spinner pendant ~2 secondes
   - ✅ Toast "Paiement réussi!"
   - ✅ Redirection vers étape suivante (Step 5 - Confirmation)
   - ✅ Console log : `[v0] Payment success: pi_xxxxxxxxxxxxx`

---

### Scénario 2 : Carte Déclinée

**Carte test** : `4000 0000 0000 0002`

**Étapes** :
- Suivre les mêmes étapes que Scénario 1
- À l'étape Stripe Elements, utiliser la carte `4000 0000 0000 0002`

**Résultat attendu** :
- ❌ Erreur : "Votre carte a été déclinée"
- ❌ `paymentError` affiché sous le bouton "Procéder au paiement"
- ❌ Retour au bouton (Stripe Elements masqué)
- ❌ Console log : `[v0] Payment error: Your card was declined`

---

### Scénario 3 : Carte avec 3D Secure

**Carte test** : `4000 0025 0000 3155`

**Étapes** :
- Suivre les mêmes étapes que Scénario 1
- À l'étape Stripe Elements, utiliser la carte `4000 0025 0000 3155`

**Résultat attendu** :
- 🔒 Modal 3D Secure s'ouvre (simulation Stripe)
- 🔒 Options : "Complete" (succès) ou "Fail" (échec)
- 🔒 Cliquer "Complete"
- ✅ Paiement réussi (même résultat que Scénario 1)

---

### Scénario 4 : Carte Invalide (Checksum Fail)

**Carte test** : `4242 4242 4242 4241` (dernier chiffre incorrect)

**Étapes** :
- Suivre les mêmes étapes que Scénario 1
- À l'étape Stripe Elements, utiliser la carte `4242 4242 4242 4241`

**Résultat attendu** :
- ❌ Erreur inline dans Stripe Elements (avant même de soumettre)
- ❌ Message : "Votre numéro de carte est invalide"
- ❌ Bouton "Confirmer le paiement" reste désactivé

---

### Scénario 5 : Paiement Incomplet (CVC Manquant)

**Étapes** :
- Suivre les mêmes étapes que Scénario 1
- À l'étape Stripe Elements, renseigner uniquement le numéro de carte (pas de CVC)
- Cliquer "Confirmer le paiement"

**Résultat attendu** :
- ❌ Erreur inline dans Stripe Elements : "Le code CVC est incomplet"
- ❌ Bouton reste cliquable mais le paiement ne se soumet pas

---

## 🔍 Vérification dans Stripe Dashboard

### Voir les paiements test

1. Aller sur https://dashboard.stripe.com/test/payments
2. **Filtrer par statut** :
   - `Succeeded` : Paiements réussis (Scénario 1, Scénario 3)
   - `Canceled` : Paiements échoués (Scénario 2)

3. **Cliquer sur un paiement** pour voir les détails :
   - Amount : Montant en centimes (ex: 2500 = 25.00 €)
   - Currency : EUR
   - Status : succeeded / canceled / requires_action
   - **Metadata** : Toutes les données de réservation (guestEmail, services, addresses, etc.)
   - **Timeline** : Création Payment Intent → Confirmation → Succès/Échec

---

## 🛠️ Debugging

### Logs Backend (Terminal)

```bash
# Démarrer le serveur en mode verbose
pnpm dev

# Logs à surveiller :
# [v0] Payment Intent created: { clientSecret: "pi_...", amount: 2500 }
# [v0] Payment Intent API called with: { guestEmail: "...", services: [...] }
# [v0] Stripe error: { message: "...", type: "card_error" }
```

### Logs Frontend (Console Browser)

Ouvrir DevTools (F12) → Console :

```javascript
// Logs à surveiller :
[v0] Payment success: pi_xxxxxxxxxxxxx
[v0] Payment error: Your card was declined
[v0] Creating payment intent...
[v0] Confirming payment...
```

### Network Tab (DevTools)

1. Ouvrir DevTools → Network
2. Filtrer par "Fetch/XHR"
3. Chercher :
   - **POST** `/api/bookings/guest/create-payment-intent`
     - Request Body : Données de réservation
     - Response : `{ clientSecret: "pi_..." }`
   - **POST** `https://api.stripe.com/v1/payment_intents/.../confirm`
     - Request : Stripe SDK (automatique)
     - Response : Payment Intent status

---

## 🐛 Problèmes Courants & Solutions

### Erreur : "STRIPE_SECRET_KEY is not set"

**Cause** : Variable d'environnement manquante

**Solution** :
1. Vérifier `.env.local` contient `STRIPE_SECRET_KEY=sk_test_...`
2. Redémarrer le serveur : `pnpm dev`
3. Vérifier que le fichier `.env.local` est à la racine du projet

---

### Erreur : "No such payment_intent: pi_xxxxx"

**Cause** : Payment Intent créé en mode TEST mais clé LIVE utilisée (ou inverse)

**Solution** :
1. Vérifier que `STRIPE_SECRET_KEY` commence par `sk_test_` (pas `sk_live_`)
2. Vérifier que `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` commence par `pk_test_` (pas `pk_live_`)
3. Les deux clés doivent être du **même mode** (TEST ou LIVE)

---

### Erreur : "Property 'services' is missing"

**Cause** : Services non chargés depuis Supabase

**Solution** :
1. Vérifier que Supabase est démarré (local ou cloud)
2. Vérifier la connexion réseau (pas de firewall bloquant Supabase)
3. Ouvrir DevTools → Network → Chercher `services` query
4. Si erreur 401 : Session expirée, recharger la page

---

### Stripe Elements ne s'affiche pas

**Cause** : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` manquante ou invalide

**Solution** :
1. Vérifier `.env.local` contient `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
2. Redémarrer le serveur : `pnpm dev`
3. Hard refresh du navigateur : Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
4. Vérifier Console Browser : Chercher erreurs Stripe

---

### Loading infini (services fetch)

**Cause** : Supabase query échoue silencieusement

**Solution** :
1. Ouvrir Console Browser → Chercher erreur `[v0] Failed to fetch services`
2. Vérifier que la table `services` existe dans Supabase
3. Vérifier que la table contient au moins 1 service
4. Vérifier RLS policies (Row Level Security) permettent lecture anonyme :
   ```sql
   -- Dans Supabase SQL Editor
   CREATE POLICY "Allow anonymous read on services"
   ON services FOR SELECT
   TO anon
   USING (true);
   ```

---

## 📊 Test Checklist

Utiliser cette checklist pour valider Phase 2 Day 1-2 :

### Payment Intent API
- [ ] POST `/api/bookings/guest/create-payment-intent` returns `clientSecret`
- [ ] Validation Zod rejette les données invalides (400 error)
- [ ] Erreur Stripe (clé invalide) retourne 500 avec message
- [ ] Métadonnées Stripe contiennent toutes les données de réservation
- [ ] Amount calculé correctement en centimes (ex: 25.00 € → 2500)

### Stripe Payment Component
- [ ] Stripe Elements s'affiche correctement (champ carte visible)
- [ ] Messages d'erreur en français
- [ ] Loading state pendant création Payment Intent (~2s)
- [ ] Loading state pendant confirmation paiement (~2-3s)
- [ ] Success callback appelé avec `paymentIntentId` correct
- [ ] Error callback appelé avec message d'erreur français
- [ ] Bouton désactivé pendant traitement (`isProcessing`)

### Summary Step Integration
- [ ] Services fetch depuis Supabase réussit (1-2s)
- [ ] Bouton "Procéder au paiement" désactivé pendant fetch
- [ ] Spinner Loader2 visible pendant fetch
- [ ] Stripe Elements ne s'affiche pas pendant `loadingServices`
- [ ] Data transformation correcte (GuestBookingState → StripePaymentProps)
- [ ] Contact : `firstName + lastName` → `fullName`
- [ ] Addresses : `pickupAddress` + `deliveryAddress` mappés correctement
- [ ] Services : Array avec `id`, `name`, `base_price` complets
- [ ] Total amount passé correctement (cents)

### Error Handling
- [ ] Carte déclinée : Erreur affichée sous le bouton
- [ ] Carte invalide : Erreur inline dans Stripe Elements
- [ ] Network error : Toast error + paymentError
- [ ] Supabase error (services fetch) : Toast error visible
- [ ] Retry possible après erreur (clic bouton → retry)

### UX/UI
- [ ] Responsive : Mobile + Desktop
- [ ] Icons visibles : CreditCard, Lock, Loader2
- [ ] Toast notifications : Success + Error
- [ ] Transitions smooth (button → Stripe Elements → success)
- [ ] Pas de flash content (loading states propres)
- [ ] Console logs utiles (`[v0]` prefix)

---

## 🎯 Next Steps (Après Tests)

Une fois tous les tests validés :

1. **Commit des tests** (si modifications nécessaires)
2. **Phase 2 Day 3-4** : Backend orchestration
   - Create `/api/bookings/guest` endpoint
   - Verify payment succeeded (retrieve Payment Intent)
   - Create user account with retry logic
   - Create booking with retry logic
   - Save addresses
   - Send welcome email

3. **Phase 2 Day 5** : Success page + Email templates
   - Create `app/reservation/success/page.tsx`
   - Email templates (welcome + password reset)
   - Test end-to-end flow

---

## 📚 Références Utiles

- **Stripe Test Cards** : https://stripe.com/docs/testing#cards
- **Payment Intents API** : https://stripe.com/docs/api/payment_intents
- **Stripe Dashboard (Test Mode)** : https://dashboard.stripe.com/test
- **Supabase Dashboard** : https://supabase.com/dashboard

---

**Auteur** : GitHub Copilot  
**Date** : 2025-01-13  
**Version** : 1.0.0
