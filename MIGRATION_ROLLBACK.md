# ✅ Migration PKCE Officiel - COMPLÉTÉE

**Date de migration:** 9 Novembre 2025  
**Status:** ✅ Terminée et déployée en production  
**Commit final:** Voir `git log --oneline -1`

---

## 🎯 Résumé de la migration

### Objectif
Migrer de l'auto-détection PKCE client-side vers la méthode officielle Route Handler server-side selon documentation Supabase 2025.

### Problème résolu
- **Mobile Safari iOS** : "Email link is invalid or has expired" sur reset password
- **Root cause** : Retry logic client-side trop lent sur 3G/4G (timeout PKCE)
- **Solution** : `exchangeCodeForSession()` server-side dans Route Handler (pas de dépendance réseau mobile)

---

## 📋 Changements implémentés

### 1. Route Handler créé
**Fichier:** `/app/api/auth/callback/route.ts` (nouveau)
- Gère PKCE code exchange server-side
- Support `type=recovery` et `type=signup`
- Support `redirect` query param (guest booking)
- Vérifie session existante (évite double-exchange)

### 2. Reset Password simplifié
**Fichier:** `/app/auth/reset-password/page.tsx`
- **Supprimé:** Retry logic (6 attempts, exponential backoff)
- **Nouveau:** Single `getSession()` check (session déjà créée par Route Handler)

### 3. Service Auth mis à jour
**Fichier:** `/lib/services/auth.service.client.ts`
- `resetPasswordForEmail()` → `redirectTo: /api/auth/callback?type=recovery`
- `signUp()` → `emailRedirectTo: /api/auth/callback?type=signup`

### 4. API Route legacy mise à jour
**Fichier:** `/app/api/auth/signup/route.ts`
- `emailRedirectTo` → `/api/auth/callback?type=signup` (cohérence)

### 5. Code legacy supprimé
**Supprimé:** `/app/auth/callback/page.tsx` (135 lignes)
- Remplacé par Route Handler API

---

## ✅ Tests de validation passés

### Test 1: Reset Password Mobile Safari iOS ✅
- iPhone Safari → Reset password request
- Clic lien email (Safari natif, pas WebView)
- ✅ Formulaire affiché immédiatement (pas de timeout)

### Test 2: Signup Email Confirmation ✅
- Création compte → Email reçu
- Clic lien confirmation
- ✅ Redirect /dashboard avec session active

### Test 3: Guest Booking Signup ✅
- Réservation sans compte
- Signup avec `redirect=/booking/success`
- ✅ Redirect correct après confirmation email

### Test 4: Desktop Reset Password ✅
- Desktop Chrome → Reset password
- ✅ Formulaire affiché instantanément

---

## 🔄 Procédure de rollback (si besoin)

### Commit de référence
```bash
# Identifier le commit avant migration
git log --oneline | grep "TESTS PRODUCTION"
# → commit_id affiché (ex: 763548f)
```

### Rollback complet
```bash
# Revenir au commit avant migration
git reset --hard <commit_id>

# Force push production (⚠️ perte modifications postérieures)
git push --force origin main

# Re-deploy Vercel (automatique sur push)
```

### Fichiers à restaurer manuellement (si rollback partiel)
```bash
git checkout <commit_id> -- app/auth/callback/page.tsx
git checkout <commit_id> -- app/auth/reset-password/page.tsx
git checkout <commit_id> -- lib/services/auth.service.client.ts
```

---

## État actuel (après migration)

### Flux authentification finaux

1. **Signin classique**
   - Formulaire → `signInWithPassword()` → Redirect `/dashboard`
   - ✅ Pas de changement

2. **Signup avec confirmation email**
   - Formulaire → `signUp({ emailRedirectTo: /api/auth/callback?type=signup })`
   - Email reçu → Clic lien → `/api/auth/callback` (Route Handler)
   - Route Handler → `exchangeCodeForSession()` → Redirect `/dashboard`

3. **Guest booking signup**
   - Réservation → Signup modal
   - Confirmation email → `/api/auth/callback?type=signup&redirect=/booking/success`
   - Route Handler → Redirect custom `/booking/success`

4. **Reset password**
   - Formulaire → `resetPasswordForEmail({ redirectTo: /api/auth/callback?type=recovery })`
   - Email reçu → Clic lien → `/api/auth/callback` (Route Handler)
   - Route Handler → `exchangeCodeForSession()` → Redirect `/auth/reset-password` (avec session)
   - Page reset → Simple `getSession()` check (pas de retry) → Formulaire `updateUser()`

5. **Logout**
   - Bouton → `signOut()` + nettoyage localStorage/cookies manuel
   - ✅ Pas de changement

---

## 📁 Fichiers clés (après migration)

### Créés
- ✅ `/app/api/auth/callback/route.ts` - Route Handler PKCE officiel

### Modifiés
- ✅ `/app/auth/reset-password/page.tsx` - Retry logic supprimée
- ✅ `/lib/services/auth.service.client.ts` - redirectTo mis à jour
- ✅ `/app/api/auth/signup/route.ts` - emailRedirectTo mis à jour

### Supprimés
- ❌ `/app/auth/callback/page.tsx` - Remplacé par Route Handler

### Inchangés
- `/lib/supabase/client.ts` - PKCE config (`flowType: 'pkce'`)
- `/middleware.ts` - Protection routes + cookieOptions
- `/lib/auth/route-guards.ts` - `requireAuth()` avec cookieOptions

---

## 🔧 Configuration requise

### Supabase Dashboard - URL Configuration

**Redirect URLs (whitelist):**
```
https://www.ninowash.fr/api/auth/callback
https://ninowash.fr/api/auth/callback
http://localhost:3000/api/auth/callback
```

**Site URL:**
```
https://www.ninowash.fr
```

### Email Templates
```html
<!-- Reset Password -->
<a href="{{ .ConfirmationURL }}">Reset Password</a>

<!-- Signup Confirmation -->
<a href="{{ .ConfirmationURL }}">Confirm Email</a>
```

⚠️ **Ne PAS modifier manuellement** - `{{ .ConfirmationURL }}` inclut le `redirectTo` automatiquement.

### Vercel Environment Variables
```bash
NEXT_PUBLIC_APP_URL=https://www.ninowash.fr
NEXT_PUBLIC_DOMAIN=ninowash.fr
```

---

## 🐛 Troubleshooting connu

### Problème: "otp_expired" sur mobile

**Cause:** WebView Gmail/Outlook ouvre le lien (PKCE `code_verifier` manquant)

**Solution:** 
- Long-press lien → "Ouvrir dans Safari"
- OU configurer app email pour ouvrir liens dans navigateur par défaut

### Problème: Redirect vers `/` au lieu de `/api/auth/callback`

**Cause:** `redirectTo` ignoré par Supabase (whitelist ou template email)

**Checklist:**
- [ ] `/api/auth/callback` dans Redirect URLs Supabase
- [ ] Template email utilise `{{ .ConfirmationURL }}`
- [ ] `NEXT_PUBLIC_APP_URL` défini sur Vercel

---

## 📚 Documentation associée

- **Architecture migration:** `FIX_AUTH_REDIRECTS.md`
- **Supabase PKCE docs:** https://supabase.com/docs/guides/auth/server-side/nextjs
- **Next.js Route Handlers:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

**Date de completion:** 9 Novembre 2025  
**Déployé en production:** ✅ Oui  
**Tests mobiles validés:** ✅ Safari iOS reset password OK
