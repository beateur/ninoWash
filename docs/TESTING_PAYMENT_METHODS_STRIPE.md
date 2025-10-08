# Guide de Test - Intégration Stripe Payment Methods

## 🎯 Objectif
Tester l'ajout de cartes bancaires via Stripe Elements sur la page `/payment-methods`.

---

## 📋 Prérequis

### 1. Variables d'environnement
Vérifier `.env.local` :
```bash
# Stripe Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Optionnel pour payment methods
```

### 2. Stripe CLI (Optionnel mais recommandé)
Pour tester les webhooks en local :
```bash
# Installation (macOS)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks vers localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Note** : Les webhooks Stripe ne sont **pas nécessaires** pour l'ajout de cartes (Setup Intent), mais utiles pour les abonnements.

---

## 🚀 Démarrage

### 1. Lancer le serveur de développement
```bash
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
pnpm dev
```

### 2. Accéder à la page
1. Se connecter à l'application (créer un compte si nécessaire)
2. Naviguer vers `/payment-methods` ou via la sidebar : **Menu utilisateur → Modes de paiement**

---

## 🧪 Scénarios de Test

### Scénario 1 : Ajouter une carte (succès)

**Étapes** :
1. Cliquer sur **"Ajouter une carte"**
2. Dans le dialog, remplir les champs Stripe Elements :
   - **Numéro de carte** : `4242 4242 4242 4242` (Visa test)
   - **Expiration** : `12/25` (ou toute date future)
   - **CVC** : `123`
   - **Code postal** : `75001` (ou tout code valide)
3. Cliquer sur **"Ajouter la carte"**

**Résultat attendu** :
- ✅ Dialog se ferme
- ✅ Toast de succès : "Carte ajoutée avec succès"
- ✅ Nouvelle carte apparaît dans la liste avec :
  - Brand : Visa
  - Last 4 : 4242
  - Expiration : 12/25
  - Actions : Définir par défaut, Supprimer

**Vérification DB** (optionnel) :
```sql
SELECT * FROM payment_methods WHERE user_id = 'votre_user_id' ORDER BY created_at DESC LIMIT 1;
```

---

### Scénario 2 : Carte invalide (erreur Stripe)

**Étapes** :
1. Cliquer sur **"Ajouter une carte"**
2. Numéro de carte : `4000 0000 0000 0002` (carte déclinée)
3. Remplir les autres champs
4. Soumettre

**Résultat attendu** :
- ❌ Erreur affichée dans le dialog
- ❌ Toast d'erreur : "Your card was declined"
- ⏸️ Dialog reste ouvert pour permettre une nouvelle tentative

---

### Scénario 3 : Définir une carte par défaut

**Étapes** :
1. Avoir au moins 2 cartes enregistrées
2. Sur une carte NON par défaut, cliquer sur le menu (3 points)
3. Sélectionner **"Définir par défaut"**

**Résultat attendu** :
- ✅ Badge "Par défaut" apparaît sur la carte sélectionnée
- ✅ Badge disparaît de l'ancienne carte par défaut
- ✅ Toast de succès

---

### Scénario 4 : Supprimer une carte

**Étapes** :
1. Cliquer sur le menu d'une carte → **"Supprimer"**
2. Confirmer dans le dialog

**Résultat attendu** :
- ✅ Dialog de confirmation avec détails de la carte
- ✅ Carte disparaît de la liste après confirmation
- ✅ Toast de succès : "Moyen de paiement supprimé"

**Note** : La suppression est un **soft delete** (`is_active = false`), la carte reste en DB.

---

### Scénario 5 : Erreur réseau (API down)

**Simulation** :
1. Couper le serveur (`Ctrl+C` sur `pnpm dev`)
2. Tenter d'ajouter une carte

**Résultat attendu** :
- ❌ Toast d'erreur : "Erreur serveur"
- ⚠️ Gestion gracieuse de l'erreur

---

## 🃏 Cartes de Test Stripe

### Succès
| Numéro | Type | Utilisation |
|--------|------|-------------|
| `4242 4242 4242 4242` | Visa | Succès standard |
| `5555 5555 5555 4444` | Mastercard | Succès standard |
| `3782 822463 10005` | Amex | Succès (CVC 4 chiffres) |

### Erreurs
| Numéro | Erreur |
|--------|--------|
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Expired card |
| `4000 0000 0000 0127` | Incorrect CVC |

Plus de cartes : [Stripe Test Cards](https://stripe.com/docs/testing#cards)

---

## 🔍 Debugging

### 1. Logs Frontend (Console Browser)
Préfixe : `[v0]`
```javascript
// Exemples de logs attendus :
[v0] Error creating setup intent: ...
[v0] Error adding payment method: ...
```

### 2. Logs Backend (Terminal pnpm dev)
```bash
[v0] Payment method creation error: ...
[v0] Error fetching payment method from Stripe: ...
```

### 3. Stripe Dashboard
- **Test Mode** : [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)
- Vérifier les **Setup Intents** créés
- Vérifier les **Payment Methods** attachés

### 4. Supabase Dashboard
- Table `payment_methods` : Vérifier les insertions
- Table `users` : Vérifier `stripe_customer_id` créé

---

## ⚠️ Problèmes Courants

### Problème 1 : "STRIPE_SECRET_KEY is not set"
**Solution** : Vérifier `.env.local` et redémarrer le serveur.

### Problème 2 : Dialog ne s'ouvre pas
**Solution** : 
- Vérifier `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` dans `.env.local`
- Vérifier console browser pour erreurs Stripe.js

### Problème 3 : Erreur "Customer not found"
**Solution** : 
- Première utilisation : un `stripe_customer_id` sera créé automatiquement
- Vérifier logs backend pour erreurs Stripe API

### Problème 4 : Carte ajoutée mais pas visible dans la liste
**Solution** :
- Vérifier RLS policies sur `payment_methods`
- Query directe DB pour confirmer insertion

---

## 🎯 Checklist de Test Complet

- [ ] Serveur de dev lancé (`pnpm dev`)
- [ ] Authentifié sur l'app
- [ ] Page `/payment-methods` accessible
- [ ] Bouton "Ajouter une carte" ouvre le dialog
- [ ] Stripe Elements visible dans le dialog
- [ ] Carte test (4242...) ajoutée avec succès
- [ ] Carte visible dans la liste avec détails corrects
- [ ] Définir carte par défaut fonctionne
- [ ] Supprimer carte avec confirmation fonctionne
- [ ] Toast de feedback affichés (succès + erreurs)
- [ ] Carte déclinée (4000 0000 0000 0002) gérée correctement
- [ ] Responsive mobile : dialog s'affiche correctement

---

## 📊 Flux Technique

### Ajout d'une carte (Setup Intent)
```
1. User clicks "Ajouter une carte"
   → createSetupIntent() (server action)
     → Stripe.setupIntents.create({ customer })
     → Return clientSecret

2. Dialog opens with Stripe Elements
   → <PaymentElement /> loads with clientSecret

3. User enters card details
   → Stripe.js validates in real-time

4. User submits
   → stripe.confirmSetup({ elements })
     → Stripe tokenizes card + attaches to customer
     → Return setupIntent.payment_method (ID)

5. POST /api/payments/methods
   → Body: { providerPaymentMethodId: "pm_xxx" }
   → Backend: stripe.paymentMethods.retrieve(pm_xxx)
   → Extract: last4, brand, exp_month, exp_year
   → Insert into payment_methods table
   → Return saved payment method

6. Frontend: Refresh list + toast success
```

---

## 🔐 Sécurité

- ✅ **Aucune donnée sensible stockée** : Seulement last 4 digits, brand, expiration
- ✅ **Tokenization Stripe** : Numéro de carte jamais envoyé à notre backend
- ✅ **RLS Policies** : User ne voit que ses propres cartes
- ✅ **API Protection** : `apiRequireAuth()` sur toutes les routes
- ✅ **HTTPS Required** : Stripe Elements nécessite HTTPS (OK en localhost)

---

## 📚 Ressources

- [Stripe Setup Intents](https://stripe.com/docs/payments/setup-intents)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

**Dernière mise à jour** : 6 octobre 2025  
**Status** : ✅ Intégration complète et testable
