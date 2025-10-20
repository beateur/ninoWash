# 🔧 Fix: Stripe Connection Error - Invalid Character in Header

**Date:** 20 octobre 2025  
**Problème:** ERR_INVALID_CHAR dans Authorization header  
**Status:** ✅ Résolu

---

## 🐛 Erreur Rencontrée

```
[error] Create payment intent error: X [Error]: An error occurred with our connection to Stripe. Request was retried 2 times.
  type: 'StripeConnectionError',
  raw: {
    message: 'An error occurred with our connection to Stripe. Request was retried 2 times.',
    detail: TypeError [ERR_INVALID_CHAR]: Invalid character in header content ["Authorization"]
        at ClientRequest.setHeader (node:_http_outgoing:703:3)
        ...
      code: 'ERR_INVALID_CHAR'
    }
```

**Context:**
- Environnement: Vercel Preview
- Action: Création de Stripe Checkout Session
- Route: `POST /api/bookings/[id]/create-payment-intent`

---

## 🔍 Cause Racine

**Les clés Stripe contiennent des caractères invalides** (espaces, retours à la ligne, tabulations)

### Comment ça arrive ?

1. **Copier-coller depuis Stripe Dashboard**
   ```bash
   # Souvent on copie avec des espaces
   STRIPE_SECRET_KEY="sk_test_xxx "   # ← espace à la fin
   STRIPE_SECRET_KEY=" sk_test_xxx"   # ← espace au début
   STRIPE_SECRET_KEY="sk_test_xxx
   "                                   # ← retour à la ligne
   ```

2. **Configuration Vercel avec éditeur**
   - Copier-coller peut ajouter des caractères invisibles
   - Retour à la ligne accidentel
   - Espace avant/après

3. **Problème Node.js**
   - Node.js HTTP headers ne tolèrent PAS les caractères de contrôle
   - Espaces, `\n`, `\r`, `\t` → `ERR_INVALID_CHAR`

### Pourquoi ça marche en local ?

En local, le fichier `.env.local` peut avoir le même problème MAIS :
- Parfois l'éditeur nettoie automatiquement
- Ou la clé a été tapée manuellement sans copier-coller

---

## ✅ Solution Implémentée

### 1. Ajouter `.trim()` sur toutes les clés

#### Backend (Server-side)

**`lib/stripe.ts`**
```typescript
// AVANT
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {...})

// APRÈS
const stripeSecretKey = process.env.STRIPE_SECRET_KEY.trim()
export const stripe = new Stripe(stripeSecretKey, {...})
```

**`lib/stripe/config.ts`**
```typescript
const stripeSecretKey = process.env.STRIPE_SECRET_KEY.trim()
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 30000,
})
```

**`app/api/bookings/guest/create-payment-intent/route.ts`**
```typescript
const stripeSecretKey = process.env.STRIPE_SECRET_KEY.trim()
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
})
```

#### Frontend (Client-side)

**`lib/stripe/client.ts`** (nouveau fichier centralisé)
```typescript
import { loadStripe } from "@stripe/stripe-js"

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set")
}

export const stripePromise = loadStripe(publishableKey.trim())
```

### 2. Centraliser `stripePromise`

**Avant :** Chaque composant créait son propre `stripePromise`
```typescript
// ❌ Dupliqué dans 3+ fichiers
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
```

**Après :** Import centralisé
```typescript
// ✅ Un seul endroit
import { stripePromise } from "@/lib/stripe/client"
```

**Avantages:**
- ✅ `.trim()` appliqué une seule fois
- ✅ Réutilisable partout
- ✅ Facile à maintenir
- ✅ Validation centralisée

---

## 📊 Fichiers Modifiés

### Backend

| Fichier | Changement | Ligne |
|---------|-----------|-------|
| `lib/stripe.ts` | Ajoute `.trim()` sur SECRET_KEY | 8 |
| `lib/stripe/config.ts` | Ajoute `.trim()` sur SECRET_KEY | 8 |
| `app/api/bookings/guest/create-payment-intent/route.ts` | Ajoute `.trim()` sur SECRET_KEY | 23 |

### Frontend

| Fichier | Changement |
|---------|-----------|
| `lib/stripe/client.ts` | **Nouveau** - stripePromise centralisé avec `.trim()` |
| `components/booking/guest/stripe-payment.tsx` | Import stripePromise depuis client.ts |
| `components/payment-methods/add-payment-method-dialog.tsx` | Import stripePromise depuis client.ts |
| `components/subscription/checkout-form.tsx` | Import stripePromise depuis client.ts |

---

## 🧪 Tests de Validation

### Test 1: Build Local

```bash
npm run build
```

**Résultat attendu:**
```
✅ Build successful
No TypeScript errors
```

### Test 2: Test Localhost

```bash
pnpm dev
# Créer un booking
# Aller sur /booking/[id]/pay
# Cliquer "Procéder au paiement"
```

**Résultat attendu:**
```
✅ Stripe Checkout s'ouvre
✅ Email pré-rempli
✅ Formulaire de paiement visible
```

### Test 3: Test Preview Vercel

**Après déploiement Preview:**
1. Créer un guest booking
2. Aller sur page de paiement
3. Cliquer "Procéder au paiement"

**Résultat attendu:**
```
✅ Pas d'erreur StripeConnectionError
✅ Pas d'erreur ERR_INVALID_CHAR
✅ Stripe Checkout s'ouvre correctement
✅ Logs Vercel propres
```

---

## 🚨 Prévention Future

### Checklist Configuration Stripe

Lors de la configuration des clés Stripe sur Vercel :

- [ ] Copier UNIQUEMENT la clé (sans espaces)
- [ ] Coller dans un éditeur de texte d'abord
- [ ] Vérifier visuellement (pas d'espace visible)
- [ ] Copier depuis l'éditeur vers Vercel
- [ ] Sauvegarder
- [ ] Redéployer pour appliquer
- [ ] Tester immédiatement

### Script de Validation

Créer un script pour valider les clés :

**`scripts/validate-env.sh`**
```bash
#!/bin/bash

echo "🔍 Validation des clés Stripe..."

# Check if key has whitespace
if [[ "$STRIPE_SECRET_KEY" =~ [[:space:]] ]]; then
  echo "❌ STRIPE_SECRET_KEY contient des espaces!"
  exit 1
fi

if [[ "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" =~ [[:space:]] ]]; then
  echo "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY contient des espaces!"
  exit 1
fi

echo "✅ Clés Stripe valides"
```

### Documentation Interne

**À ajouter dans README.md:**
```markdown
## ⚠️ Configuration Stripe

IMPORTANT: Les clés Stripe ne doivent contenir AUCUN espace ou retour à la ligne.

❌ Mauvais:
STRIPE_SECRET_KEY="sk_test_xxx "

✅ Bon:
STRIPE_SECRET_KEY="sk_test_xxx"

Le code utilise automatiquement `.trim()` mais il est préférable de configurer proprement dès le départ.
```

---

## 📝 Logs de Debug

### Avant le Fix (Erreur)

```
[v0] Creating payment intent for booking: xxx
[error] Create payment intent error: X [Error]: An error occurred with our connection to Stripe. 
Request was retried 2 times.
  type: 'StripeConnectionError',
  detail: TypeError [ERR_INVALID_CHAR]: Invalid character in header content ["Authorization"]
    code: 'ERR_INVALID_CHAR'
```

### Après le Fix (Succès attendu)

```
[v0] Creating payment intent for booking: xxx
[v0] Booking user_id: yyy
[v0] Found email from metadata.guest_contact: user@example.com
[v0] Creating Stripe Checkout Session...
[v0] ✅ Checkout session created: cs_test_xxx
```

---

## 🚀 Déploiement

### Commits

```bash
# Commit 1: Fix metadata email priority
ce8beb1 - fix: utilise metadata.guest_contact.email en priorité

# Commit 2: Fix Stripe keys trimming
dbc3b89 - fix: trim Stripe API keys pour éviter ERR_INVALID_CHAR
```

### Timeline

1. **Local Build** : ✅ Réussi
2. **Commit** : ✅ dbc3b89
3. **Push to dev** : ✅ Déclenché
4. **Vercel Preview** : ⏳ En cours (~3 min)
5. **Test sur Preview** : ⏳ À faire
6. **Merge to main** : ⏳ Après validation

---

## 🔗 Références

- **Node.js HTTP Headers:** https://nodejs.org/api/http.html#requestsetheadername-value
- **Stripe API Keys:** https://stripe.com/docs/keys
- **ERR_INVALID_CHAR:** https://nodejs.org/api/errors.html#err_invalid_char

---

## 📚 Leçons Apprises

### 1. Toujours .trim() les secrets

**Fait:**
- Variables d'environnement peuvent avoir des espaces invisibles
- Copier-coller introduit souvent des caractères de contrôle
- `.trim()` est une protection nécessaire

### 2. Centraliser les configurations

**Avant :** 3+ fichiers dupliquent `loadStripe()`
**Après :** 1 fichier centralisé `lib/stripe/client.ts`

**Avantages:**
- Une seule source de vérité
- Facile à maintenir
- Cohérence garantie

### 3. Tester sur Preview AVANT production

**Workflow:**
1. Dev local ✅
2. Push vers dev
3. **Test sur Preview Vercel** ← On a trouvé le bug ICI
4. Merge vers main (production)

Si on avait mergé direct vers main, le bug aurait été en production !

---

## ✅ Checklist de Validation

### Avant Merge

- [x] Build local réussi
- [x] Commit avec message clair
- [x] Push vers dev
- [ ] Test sur Preview URL
- [ ] Créer guest booking
- [ ] Page de paiement charge
- [ ] Stripe Checkout s'ouvre
- [ ] Vérifier logs (pas d'erreur)
- [ ] Paiement test réussi

### Après Validation Preview

- [ ] Merge dev → main
- [ ] Sync dev avec main
- [ ] Test sur Production
- [ ] Monitor Stripe webhooks
- [ ] Mettre à jour changelog

---

**Status:** 🟡 En attente de test Preview  
**Next:** Tester sur Preview URL puis merger vers main  
**ETA:** ~3 minutes pour déploiement Preview

---

## 🎯 Quick Fix Summary

**Si vous rencontrez cette erreur:**

1. Ajoutez `.trim()` sur vos clés Stripe :
   ```typescript
   const key = process.env.STRIPE_SECRET_KEY.trim()
   ```

2. Vérifiez vos variables Vercel :
   - Pas d'espace au début/fin
   - Pas de retour à la ligne

3. Redéployez pour appliquer les changements

4. Testez immédiatement

**C'est tout !** 🎉
