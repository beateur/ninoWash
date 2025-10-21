# ✅ Fix Auth Email - Plan de test

**Date:** 21 octobre 2025  
**Fix appliqué:** Utilisation de `auth.admin.getUserById()` au lieu de `.from('auth.users')`  
**Fichier modifié:** `app/api/bookings/[id]/create-payment-intent/route.ts`

---

## 📝 Changement appliqué

### Avant (❌ Code défectueux)
```typescript
// ❌ Tentative d'accès à auth.users via PostgREST
const { data: authUsers, error: authError } = await adminClient
  .from('auth.users')  // ERREUR PGRST205
  .select('email')
  .eq('id', booking.user_id)
  .single()

if (authUsers?.email) {
  customerEmail = authUsers.email
}
```

**Erreur retournée :**
```
code: 'PGRST205'
message: "Could not find the table 'public.auth.users' in the schema cache"
```

### Après (✅ Code corrigé)
```typescript
// ✅ Utilisation de l'API Auth Admin officielle
const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(
  booking.user_id
)

if (authUser?.user?.email) {
  customerEmail = authUser.user.email
  console.log("[v0] Found email from auth.admin.getUserById:", customerEmail)
}
```

---

## 🧪 Plan de test

### ✅ Test 1 : Parcours authentifié avec paiement (FIX PRINCIPAL)

**Objectif :** Vérifier que le paiement fonctionne pour un utilisateur authentifié

**Steps :**
1. **Se connecter** avec un compte existant (email: test@ninowash.com)
2. Aller sur `/reservation`
3. **Étape 1** : Sélectionner adresses de collecte/livraison
4. **Étape 2** : Sélectionner "Pressing Classique" (29€)
5. Optionnel : Ajouter +2kg (39€ total)
6. **Étape 3** : Sélectionner date et créneaux horaires
7. **Étape 4** : Vérifier le récapitulatif et cliquer "Confirmer la réservation"
8. Réservation créée → Redirection vers `/booking/[id]/pay`
9. **Cliquer sur "Payer maintenant"**
10. Vérifier les logs dans le terminal

**Résultat attendu :**
```bash
✅ [v0] Creating payment intent for booking: xxx
✅ [v0] Booking user_id: 43848809-7df7-43f9-a834-843dde1c8794
✅ [v0] Booking metadata: null
✅ [v0] No metadata email, fetching from auth.admin for user_id: 43848809...
✅ [v0] Found email from auth.admin.getUserById: test@ninowash.com
✅ [v0] ✅ Customer email found: test@ninowash.com
✅ [v0] Checkout session created: cs_test_...
✅ POST /api/bookings/xxx/create-payment-intent 200 in XXXms
```

**Comportement attendu :**
- ✅ Pas d'erreur PGRST205
- ✅ Email récupéré depuis auth.admin
- ✅ Session Stripe créée avec succès
- ✅ Redirection vers Stripe Checkout
- ✅ Paiement possible

---

### ✅ Test 2 : Parcours invité (NON-RÉGRESSION)

**Objectif :** Vérifier que le parcours invité fonctionne toujours

**Steps :**
1. **NE PAS se connecter**
2. Aller sur `/reservation/guest`
3. **Étape 0** : Remplir informations de contact
   - Email : guest@test.com
   - Nom : Test Guest
   - Téléphone : 0612345678
4. **Étape 1** : Remplir adresses pickup/delivery
5. **Étape 2** : Sélectionner service
6. **Étape 3** : Sélectionner date/time
7. **Étape 4** : Vérifier récapitulatif et créer réservation
8. **Payer** avec carte de test Stripe
9. Vérifier les logs

**Résultat attendu :**
```bash
✅ [v0] Creating payment intent for booking: xxx
✅ [v0] Booking user_id: null  (ou un ID auto-créé)
✅ [v0] Booking metadata: { guest_contact: { email: "guest@test.com", ... } }
✅ [v0] Found email from metadata.guest_contact: guest@test.com
✅ [v0] ✅ Customer email found: guest@test.com
✅ [v0] Checkout session created: cs_test_...
```

**Comportement attendu :**
- ✅ Email récupéré depuis metadata (priorité 1)
- ✅ Pas d'appel à auth.admin (car email déjà dans metadata)
- ✅ Paiement fonctionne normalement

---

### ✅ Test 3 : Vérifier Stripe reçoit le bon montant

**Objectif :** Valider que le fix du pricing (session précédente) + le fix de l'email fonctionnent ensemble

**Steps :**
1. Se connecter comme utilisateur authentifié
2. Créer une réservation avec **+2kg** (39€ total au lieu de 29€)
3. Aller sur la page de paiement
4. Cliquer sur "Payer maintenant"
5. **Vérifier la session Stripe** dans les logs

**Résultat attendu :**
```bash
✅ Email récupéré : test@ninowash.com
✅ Line items créés avec unit_amount: 3900 (39.00€ en centimes)
✅ Session Stripe :
   - customer_email: "test@ninowash.com"
   - amount_total: 3900
   - currency: "eur"
```

**Comportement attendu :**
- ✅ Email correct
- ✅ Montant correct (39€ avec kg supplémentaires)
- ✅ Double fix validé (pricing + email)

---

### ✅ Test 4 : Edge case - Utilisateur sans email (rare)

**Objectif :** Vérifier le comportement si `auth.users.email = null`

**Steps :**
1. Cas théorique (très rare dans Supabase)
2. Si possible, créer un utilisateur test sans email via admin
3. Tenter de créer une réservation
4. Vérifier l'erreur

**Résultat attendu :**
```bash
❌ [v0] User exists but no email found
❌ [v0] ❌ No email found for booking
❌ POST /api/bookings/xxx/create-payment-intent 400
```

**Comportement attendu :**
- ✅ Erreur 400 retournée (comportement déjà géré)
- ✅ Message clair pour l'utilisateur
- ✅ Pas de crash serveur

---

### ✅ Test 5 : Test de performance (optionnel)

**Objectif :** Comparer les performances

**Méthode :**
- Ancien code : `.from('auth.users')` → **ÉCHEC** (donc pas de baseline)
- Nouveau code : `auth.admin.getUserById()` → **SUCCÈS**

**Résultat attendu :**
```bash
✅ Temps de réponse : < 500ms
✅ Pas de timeout
✅ Performant et fiable
```

---

## 📊 Checklist de validation

### Avant de merger
- [ ] Test 1 passé : Parcours authentifié ✅
- [ ] Test 2 passé : Parcours invité (non-régression) ✅
- [ ] Test 3 passé : Montant Stripe correct ✅
- [ ] Pas d'erreurs TypeScript ✅
- [ ] Build production réussit (`pnpm run build`)
- [ ] Logs clairs et informatifs ✅
- [ ] Documentation à jour (ANALYSIS doc créé) ✅

### Logs à surveiller
```bash
# Terminal serveur Next.js
pnpm run dev

# Chercher ces patterns :
✅ "[v0] Found email from auth.admin.getUserById"
❌ "Error fetching from auth.users" (ne devrait plus apparaître)
❌ "PGRST205" (ne devrait plus apparaître)
✅ "[v0] Checkout session created"
```

### Terminal Stripe (optionnel)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Vérifier les events :
✅ checkout.session.completed
✅ payment_intent.succeeded
```

---

## 🐛 Problèmes potentiels et solutions

### Problème 1 : Erreur "Missing SUPABASE_SERVICE_ROLE_KEY"
**Symptôme :**
```
Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables
```

**Solution :**
Vérifier `.env.local` :
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # Doit être présent
```

### Problème 2 : auth.admin.getUserById retourne null
**Symptôme :**
```
[v0] User exists but no email found
```

**Cause possible :**
- L'utilisateur a été supprimé entre la création de la réservation et le paiement
- L'ID utilisateur est invalide

**Solution :**
- Vérifier que `booking.user_id` correspond à un utilisateur existant
- Vérifier dans Supabase Auth Dashboard

### Problème 3 : Rate limiting (peu probable)
**Symptôme :**
```
[v0] Error fetching user by ID: { message: "Too many requests" }
```

**Solution :**
- `getUserById()` est bien plus performant que `listUsers()`
- Risque très faible avec l'API Admin
- Si nécessaire : ajouter un cache court (30s)

---

## 📚 Références

### Code pattern similaire dans le projet
- ✅ `app/api/bookings/guest/check-email/route.ts` (ligne 33)
  ```typescript
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  ```
  
- ✅ `app/api/bookings/guest/route.ts` (ligne 110)
  ```typescript
  const initialResult = await supabase.auth.admin.createUser({...})
  ```

- ✅ `app/api/bookings/route.ts` (ligne 362)
  ```typescript
  const { data: createUserData, error } = await adminClient.auth.admin.createUser({...})
  ```

### Documentation Supabase
- [Admin API - getUserById](https://supabase.com/docs/reference/javascript/auth-admin-getuserbyid)
- [Service Role Key](https://supabase.com/docs/guides/api/using-service-role-key)

---

## ✅ Résultat attendu après validation

### État final attendu
- ✅ **Parcours authentifié** : Paiement fonctionne
- ✅ **Parcours invité** : Paiement fonctionne (déjà OK)
- ✅ **Email** : Récupéré via API officielle
- ✅ **Pricing** : Montant correct avec kg supplémentaires
- ✅ **Logs** : Clairs et informatifs
- ✅ **Erreurs** : Bien gérées

### Métriques de succès
- ✅ 0 erreur PGRST205
- ✅ 100% de réussite sur parcours authentifié
- ✅ Temps de réponse < 500ms
- ✅ Aucune régression sur parcours invité

---

**Status:** ✅ Fix implémenté - En attente de tests  
**Auteur:** Assistant AI  
**Reviewer:** @beateur  
**Next:** Exécuter les tests 1-5 ci-dessus
