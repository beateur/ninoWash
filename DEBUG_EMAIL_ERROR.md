# 🐛 Guide de Debugging - Erreur "Email introuvable"

**Erreur rencontrée:** `Email introuvable pour cette réservation`  
**Fichier:** `app/api/bookings/[id]/create-payment-intent/route.ts`  
**Date:** 20 octobre 2025

---

## 🔍 Analyse du Problème

### L'Erreur

```javascript
[Error] [v0] Payment error: – "Email introuvable pour cette réservation"
```

Cette erreur se produit quand l'API ne trouve pas l'email du client pour créer la session Stripe Checkout.

### Causes Possibles

1. **User booking sans email dans auth.users**
   - `booking.user_id` existe
   - Mais `auth.users.email` est NULL ou manquant

2. **Guest booking sans metadata**
   - `booking.user_id` est NULL (guest)
   - Mais `booking.metadata.guest_contact.email` est absent

3. **Metadata mal structuré**
   - `metadata` existe mais structure différente
   - `guest_contact` mal typé ou manquant

4. **Problème de synchronisation**
   - User créé mais email pas encore propagé
   - Race condition entre création user et booking

---

## 🛠️ Comment Debugger

### Étape 1: Vérifier les Logs Vercel (Preview/Prod)

```bash
# Pour Preview
vercel logs <url-preview>

# Pour Production
vercel logs https://ninowash.org

# Chercher les logs [v0]
# Ils montrent maintenant:
# - booking.user_id
# - booking.metadata (JSON complet)
# - Tentatives de récupération d'email
# - Structure de debug si email non trouvé
```

**Nouveaux logs ajoutés:**
```javascript
[v0] Booking user_id: abc-123 (ou null)
[v0] Booking metadata: { ... structure complète ... }
[v0] Fetching email for user_id: abc-123
[v0] Found email from auth.users: user@example.com
// OU
[v0] Guest booking detected (no user_id)
[v0] Found email from metadata.guest_contact: guest@example.com
// OU
[v0] ❌ No email found for booking
[v0] Debug info: { bookingId, hasUserId, hasMetadata, ... }
```

### Étape 2: Vérifier la Base de Données

```sql
-- Exécuter dans Supabase SQL Editor
-- https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm/editor

-- Trouver la réservation problématique (dernière créée)
SELECT 
  id,
  user_id,
  status,
  payment_status,
  metadata,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 1;

-- Vérifier l'email de l'utilisateur associé
SELECT 
  b.id as booking_id,
  b.user_id,
  au.email as auth_email,
  b.metadata->'guest_contact'->>'email' as metadata_email,
  b.created_at
FROM bookings b
LEFT JOIN auth.users au ON b.user_id = au.id
WHERE b.id = '<BOOKING_ID_FROM_ABOVE>';

-- Vérifier la structure metadata pour les guests
SELECT 
  id,
  user_id,
  metadata->'guest_contact' as guest_contact_full,
  metadata->'guest_contact'->>'email' as guest_email,
  metadata->'guest_contact'->>'name' as guest_name,
  metadata->'guest_contact'->>'phone' as guest_phone
FROM bookings
WHERE id = '<BOOKING_ID>';
```

### Étape 3: Vérifier en Local avec Chrome DevTools

**Console → Network:**
1. Filtrer par `create-payment-intent`
2. Regarder la requête qui échoue (400)
3. Voir la réponse JSON

**Si NODE_ENV=development, la réponse contient maintenant:**
```json
{
  "error": "Email introuvable pour cette réservation",
  "debug": {
    "bookingId": "abc-123",
    "hasUserId": false,
    "hasMetadata": true,
    "hasGuestContact": false
  }
}
```

Cela te dit **exactement** où chercher !

---

## 🔧 Solutions par Cas

### Cas 1: User Booking mais Email Manquant

**Symptôme:**
```json
{
  "hasUserId": true,
  "hasMetadata": ...,
  "hasGuestContact": ...
}
```

**Logs attendus:**
```
[v0] Fetching email for user_id: xxx
[v0] User exists but no email found in auth.users
```

**Solution:**
```sql
-- Vérifier si l'email existe
SELECT id, email FROM auth.users WHERE id = '<USER_ID>';

-- Si email NULL, c'est un problème de création
-- Vérifier le code de signup/guest booking
```

**Fix potentiel:**
```typescript
// Dans app/api/bookings/guest/route.ts
// S'assurer que createUser() inclut l'email
const { data: authData } = await supabase.auth.admin.createUser({
  email: guestEmail, // ← Vérifier que c'est présent
  password: randomPassword,
  email_confirm: true,
});
```

---

### Cas 2: Guest Booking mais Metadata Manquant

**Symptôme:**
```json
{
  "hasUserId": false,
  "hasMetadata": true,
  "hasGuestContact": false
}
```

**Logs attendus:**
```
[v0] Guest booking detected (no user_id)
[v0] No guest_contact.email in metadata
[v0] Metadata structure: { ... autre structure ... }
```

**Solution:**
```sql
-- Vérifier la structure metadata
SELECT 
  id,
  metadata,
  jsonb_pretty(metadata) as metadata_formatted
FROM bookings
WHERE id = '<BOOKING_ID>';
```

**Si metadata a une structure différente:**
```typescript
// Adapter le code pour supporter l'ancienne structure
if (booking.metadata?.guest_contact?.email) {
  customerEmail = booking.metadata.guest_contact.email
} else if (booking.metadata?.guestEmail) {  // ← Ancienne structure?
  customerEmail = booking.metadata.guestEmail
} else if (booking.metadata?.email) {  // ← Autre variante?
  customerEmail = booking.metadata.email
}
```

---

### Cas 3: Metadata NULL

**Symptôme:**
```json
{
  "hasUserId": false,
  "hasMetadata": false,
  "hasGuestContact": false
}
```

**C'est un bug sérieux** - une réservation guest DOIT avoir metadata.

**Solution:**
1. Vérifier le code de création booking guest
2. S'assurer que `metadata` est bien passé:

```typescript
// Dans app/api/bookings/guest/route.ts
const { data: booking } = await supabase
  .from("bookings")
  .insert({
    user_id: authData.user.id,
    // ...
    metadata: guestMetadata, // ← Vérifier que c'est présent
  })
  .select()
  .single();
```

---

### Cas 4: User_id Existe mais User Supprimé

**Symptôme:**
```
[v0] Error fetching user: User not found
```

**Solution:**
```sql
-- Vérifier si l'utilisateur existe
SELECT id, email, deleted_at 
FROM auth.users 
WHERE id = '<USER_ID>';

-- Si deleted_at IS NOT NULL, l'user a été supprimé
-- Il faut soit:
-- 1. Empêcher la suppression des users avec bookings
-- 2. Gérer le cas dans le code
```

**Fix:**
```typescript
// Fallback sur metadata si user supprimé
if (booking.user_id) {
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(booking.user_id)
  
  if (userData?.user?.email) {
    customerEmail = userData.user.email
  } else if (userError || !userData) {
    // User supprimé - fallback sur metadata
    console.warn("[v0] User not found, trying metadata fallback")
    if (booking.metadata?.guest_contact?.email) {
      customerEmail = booking.metadata.guest_contact.email
    }
  }
}
```

---

## 📊 Workflow de Debug Complet

### En Preview (ton cas actuel)

```bash
# 1. Récupérer l'URL de ta Preview
# Exemple: https://ninowash-abc123.vercel.app

# 2. Voir les logs en temps réel
vercel logs https://ninowash-abc123.vercel.app --follow

# 3. Dans un autre terminal, refaire le test
# Aller sur Preview URL → Créer booking → Tenter paiement

# 4. Observer les logs
# Chercher [v0] dans la sortie
# Noter le bookingId et les infos de debug

# 5. Vérifier la DB
# Ouvrir Supabase SQL Editor
# Copier le bookingId des logs
# Exécuter le debug SQL ci-dessus
```

### En Local

```bash
# 1. Démarrer en dev
npm run dev

# 2. Dans le terminal, les logs apparaîtront directement
# Format:
# POST /api/bookings/[id]/create-payment-intent
# [v0] Creating payment intent for booking: abc-123
# [v0] Booking user_id: null
# [v0] Booking metadata: { ... }
# ...

# 3. Si erreur, copier le bookingId
# 4. Vérifier dans Supabase SQL Editor
```

### En Production

**⚠️ IMPORTANT:** En production, le `debug` object n'est PAS retourné (sécurité).

Seuls les logs Vercel sont disponibles:
```bash
vercel logs https://ninowash.org --follow
```

---

## 🎯 Checklist de Résolution

- [ ] Récupérer les logs Vercel/Console
- [ ] Identifier le `bookingId` problématique
- [ ] Vérifier `booking.user_id` (NULL = guest, sinon = user)
- [ ] Si user: vérifier `auth.users.email`
- [ ] Si guest: vérifier `booking.metadata.guest_contact.email`
- [ ] Vérifier la structure JSON de `metadata`
- [ ] Comparer avec d'autres bookings qui fonctionnent
- [ ] Identifier la différence
- [ ] Corriger le code de création (guest ou user)
- [ ] Tester à nouveau

---

## 🚀 Test Après Fix

### Créer un Booking Test

```bash
# En local
npm run dev

# Créer une réservation guest avec:
# Email: test-debug@example.com
# Nom: Test Debug
# Phone: +33 6 12 34 56 78

# Vérifier les logs:
# [v0] Creating booking for guest: test-debug@example.com
# [v0] Guest metadata: { guest_contact: { email: "test-debug@example.com", ... }}

# Tenter le paiement
# Vérifier les logs:
# [v0] Found email from metadata.guest_contact: test-debug@example.com
# [v0] ✅ Customer email found: test-debug@example.com
# [v0] Checkout session created: cs_xxx
```

---

## 📚 Fichiers à Vérifier

Si le problème persiste, vérifier ces fichiers:

1. **Création Booking Guest:**
   - `app/api/bookings/guest/route.ts` (ligne ~290)
   - Chercher `guest_contact`
   - Vérifier que `email`, `name`, `phone` sont bien passés

2. **Création User Guest:**
   - `app/api/bookings/guest/route.ts` (ligne ~180-200)
   - Vérifier `auth.admin.createUser({ email: ... })`

3. **Payment Intent:**
   - `app/api/bookings/[id]/create-payment-intent/route.ts` (ligne 50-95)
   - Maintenant avec logs détaillés

---

## 🔗 Ressources

- **Logs Vercel:** https://vercel.com/beateur/ninowash/logs
- **Supabase SQL Editor:** https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm/editor
- **Script SQL Debug:** `debug-booking-email.sql`

---

**Créé le:** 20 octobre 2025  
**Mis à jour:** 20 octobre 2025  
**Status:** En attente de tests avec logs améliorés
