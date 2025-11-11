# 🔐 Auth PKCE - Migration Officielle Complète

**Date:** 9 Novembre 2025  
**Status:** ✅ Migration PKCE Officielle Terminée

---

## 🎯 Résumé Exécutif

### ✅ Migration Complétée
- **Route Handler officiel** `/api/auth/callback` implémenté selon docs Supabase 2025
- **Safari iOS reset password** fonctionne (fix mobile PKCE timeout)
- **Tous les flows auth** migrés vers méthode officielle
- **Code legacy** supprimé (`/app/auth/callback/page.tsx`)

### 🏗️ Architecture Finale

```
┌─────────────────────────────────────────────────────┐
│ CLIENT-SIDE                                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ resetPasswordForEmail() / signUp()                  │
│     ↓                                               │
│ emailRedirectTo: /api/auth/callback?type=recovery  │
│                                                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ Email link click
                       ↓
┌─────────────────────────────────────────────────────┐
│ SERVER-SIDE                                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ GET /api/auth/callback?code=xxx&type=recovery      │
│     ↓                                               │
│ exchangeCodeForSession(code)                        │
│     ↓                                               │
│ redirect(/auth/reset-password) with session         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Changements Implémentés

### 1. Route Handler Officiel (Nouveau)

**Fichier:** `/app/api/auth/callback/route.ts`

- Gère PKCE code exchange server-side
- Support `type=recovery` et `type=signup`
- Support `redirect` query param pour post-booking
- Vérifie session existante avant exchange (évite double-exchange)
- Logs détaillés pour debugging mobile

  redirect("/dashboard")
}
```

---

#### Fix 1.3: Reset Password - Redirect Dashboard

**Fichier:** `app/auth/reset-password/page.tsx`

**Ligne ~117:**

Remplacer:
```typescript
setTimeout(() => {
  router.push("/dashboard")
}, 2000)
```

Par:
```typescript
setTimeout(() => {
  window.location.href = "/dashboard"
}, 1500)
```

---

#### Fix 1.4: SignOut - Forcer Refresh Complet

**Fichier:** `lib/services/auth.service.client.ts`

**Ligne ~110-125 (méthode signOut):**

Remplacer:
```typescript
async signOut(): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      message: "Déconnexion réussie",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la déconnexion",
    }
  }
}
```

Par:
```typescript
async signOut(): Promise<AuthResult> {
  try {
    const supabase = createBrowserClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // ✅ FIX: Forcer reload complet pour clear toutes les sessions
    window.location.href = "/"

    return {
      success: true,
      message: "Déconnexion réussie",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la déconnexion",
    }
  }
}
```

---

### PRIORITÉ 2: Améliorer Retry Reset Password 🟡

**Fichier:** `app/auth/reset-password/page.tsx`

**Ligne ~55-75 (dans useEffect checkSession):**

Remplacer:
```typescript
// ✅ Attendre que Supabase détecte et échange le code PKCE depuis l'URL
// Avec flowType: 'pkce' et detectSessionInUrl: true, Supabase fait ça automatiquement
await new Promise(resolve => setTimeout(resolve, 1000)) // Petit délai pour laisser Supabase s'initialiser

// Vérifier la session (doit exister après PKCE automatique)
const { data: { session }, error: sessionError } = await supabase.auth.getSession()

if (sessionError || !session) {
  // Réessayer une fois après 2 secondes (au cas où le PKCE prend du temps)
  await new Promise(resolve => setTimeout(resolve, 2000))
  const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession()
  
  if (retryError || !retrySession) {
    setTokenError(true)
    setError("Votre session a expiré. Veuillez demander un nouveau lien de réinitialisation.")
  }
}
```

Par:
```typescript


### 2. Reset Password - Simplification Retry

**Fichier:** `/app/auth/reset-password/page.tsx`

**AVANT:** 6 retries avec exponential backoff (500ms → 16s)
```typescript
const MAX_RETRIES = 6
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  const { data } = await supabase.auth.getSession()
  if (data?.session) break
  await sleep(BASE_DELAY * Math.pow(2, attempt))
}
```

**APRÈS:** Single check (Route Handler crée session avant redirect)
```typescript
const { data } = await supabase.auth.getSession()
if (!data?.session) {
  setError("Session expirée")
}
```

**Raison:** Route Handler échange le code PKCE server-side, session déjà créée quand user arrive sur page.

---

### 3. SignUp - Migration emailRedirectTo

**Fichier:** `/lib/services/auth.service.client.ts`

**AVANT:** `emailRedirectTo: /auth/callback`  
**APRÈS:** `emailRedirectTo: /api/auth/callback?type=signup`

**Impact:** Signup confirmation emails pointent vers Route Handler.

---

### 4. API Route Legacy - Mise à jour

**Fichier:** `/app/api/auth/signup/route.ts`

Mis à jour `emailRedirectTo` pour cohérence (utilisé par tests).

---

### 5. Suppression Code Legacy

**Supprimé:** `/app/auth/callback/page.tsx` (135 lignes)

Page Server Component remplacée par Route Handler API.

---

## 🧪 Tests de Validation

### ✅ Test 1: Reset Password Mobile Safari iOS
1. iPhone Safari → https://www.ninowash.fr/auth/forgot-password
2. Saisir email → Recevoir email
3. **Cliquer lien depuis Safari** (pas WebView Gmail)
4. ✅ Formulaire reset password s'affiche immédiatement
5. Changer mot de passe → ✅ Redirect /dashboard

**Résultat:** ✅ PASSÉ (fix mobile PKCE timeout)

---

### ✅ Test 2: Signup Email Confirmation
1. Créer compte → Recevoir email confirmation
2. Cliquer lien
3. ✅ Redirect /dashboard avec session active

**Résultat:** ✅ PASSÉ

---

### ✅ Test 3: Guest Booking Signup
1. Réserver sans compte → Signup modal
2. Créer compte avec `redirect=/booking/success`
3. Confirmer email → ✅ Redirect `/booking/success`

**Résultat:** ✅ PASSÉ (inherit signup emailRedirectTo)

---

### ✅ Test 4: Desktop Reset Password
1. Desktop Chrome → Reset password
2. Cliquer lien email
3. ✅ Formulaire affiché instantanément

**Résultat:** ✅ PASSÉ

---

## 🔧 Configuration Requise

### Supabase Dashboard

**Authentication → URL Configuration:**

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

**Email Templates:**
```html
<!-- Reset Password Template -->
<a href="{{ .ConfirmationURL }}">Reset Password</a>

<!-- Signup Confirmation Template -->
<a href="{{ .ConfirmationURL }}">Confirm Email</a>
```

⚠️ **Ne PAS modifier les templates** - `{{ .ConfirmationURL }}` inclut automatiquement le `redirectTo`.

---

### Vercel Environment Variables

```bash
NEXT_PUBLIC_APP_URL=https://www.ninowash.fr
NEXT_PUBLIC_DOMAIN=ninowash.fr
```

---

## 🐛 Troubleshooting

### Problème: "Email link is invalid or has expired"

**Symptôme:** Lien email redirige vers `/?error=otp_expired`

**Causes possibles:**

1. **WebView Gmail/Outlook** (mobile)
   - PKCE `code_verifier` manquant (stocké dans navigateur différent)
   - **Solution:** Ouvrir lien dans Safari/Chrome natif

2. **Redirect URL non whitelisté**
   - Supabase ignore `redirectTo` → utilise Site URL
   - **Solution:** Ajouter `/api/auth/callback` dans Redirect URLs

3. **Template email modifié**
   - Lien hardcodé au lieu de `{{ .ConfirmationURL }}`
   - **Solution:** Restaurer template par défaut

4. **Variables env manquantes**
   - `NEXT_PUBLIC_APP_URL` undefined → `redirectTo` incorrect
   - **Solution:** Vérifier Vercel env vars

---

### Problème: Redirect vers `/` au lieu de `/api/auth/callback`

**Cause:** `redirectTo` pas pris en compte par Supabase.

**Checklist:**
- [ ] `/api/auth/callback` dans Redirect URLs whitelist
- [ ] Template email utilise `{{ .ConfirmationURL }}`
- [ ] `NEXT_PUBLIC_APP_URL` défini sur Vercel
- [ ] Tester en copiant URL email (vérifier structure)

---

## 📚 Références

- [Supabase PKCE Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr Best Practices](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 📝 Changelog

### 9 Novembre 2025 - Migration PKCE Officielle
- ✅ Route Handler `/api/auth/callback` créé
- ✅ Reset password migré (suppression retry logic)
- ✅ Signup migré (emailRedirectTo updated)
- ✅ Legacy callback page supprimée
- ✅ Tests production validés (Safari iOS fix)

### 7 Novembre 2025 - Analyse Initiale
- 🔍 Problème mobile Safari identifié
- 📋 Plan migration 27 tasks créé
- 📖 Documentation rollback créée

---



**Status Final:** ✅ Migration Complète - Production Ready
```

---

### PRIORITÉ 3: Env Var Domain 🟡

**Fichier:** `lib/services/auth.service.client.ts`

**Ligne ~201:**

Remplacer:
```typescript
redirectTo: process.env.NODE_ENV === 'production' 
  ? 'https://www.ninowash.fr/auth/reset-password'
  : `${window.location.origin}/auth/reset-password`,
```

Par:
```typescript
redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/reset-password`,
```

**`.env.production`** :
```bash
NEXT_PUBLIC_APP_URL=https://www.ninowash.fr
```

**`.env.local`** :
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Créer/Modifier `.env.production`:**
```bash
NEXT_PUBLIC_SITE_URL=https://www.ninowash.fr
```

**Vérifier `.env.local`:**
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🧪 Tests Obligatoires

### Test 1: Login Direct
```
1. /auth/signin
2. Entrer credentials valides
3. Click "Se connecter"
4. ✅ Message "Connexion réussie"
5. ✅ REDIRECT AUTO vers /dashboard en 1s
```

### Test 2: Logout puis Login
```
1. Depuis /dashboard → Click "Se déconnecter"
2. ✅ REDIRECT vers /
3. Aller sur /auth/signin
4. ✅ Formulaire vide (pas auto-login)
5. Entrer credentials
6. ✅ REDIRECT /dashboard
```

### Test 3: SignUp
```
1. /auth/signup → Créer compte
2. ✅ Message confirmation
3. Ouvrir email → Click lien
4. ✅ REDIRECT /dashboard
```

### Test 4: Reset Password
```
1. /auth/forgot-password
2. Demander reset → Ouvrir email
3. Click lien (iPhone Safari si possible)
4. ✅ Formulaire reset affiché (max 30s wait)
5. Changer mot de passe
6. ✅ REDIRECT /dashboard en 1.5s
```

---

## ⏱️ Timeline d'Implémentation

```
Phase 1: Fixes Redirection    [30 min]
  ├─ Fix 1.1: AuthForm         [10 min]
  ├─ Fix 1.2: Callback         [10 min]
  ├─ Fix 1.3: Reset redirect   [5 min]
  └─ Fix 1.4: SignOut          [5 min]

Phase 2: Tests Locaux         [15 min]
  ├─ Login/logout              [5 min]
  ├─ SignUp                    [5 min]
  └─ Reset password            [5 min]

Phase 3: Retry Amélioration   [10 min]
  └─ Reset password retry      [10 min]

Phase 4: Env Var              [5 min]
  └─ Config domain             [5 min]

TOTAL: ~60 minutes
```

---

## 📝 Checklist Déploiement

### Pre-Deploy
- [ ] Fix 1.1 appliqué (AuthForm - ligne 68)
- [ ] Fix 1.2 appliqué (Callback - tout le fichier)
- [ ] Fix 1.3 appliqué (Reset redirect - ligne 117)
- [ ] Fix 1.4 appliqué (SignOut - ligne 110-125)
- [ ] Fix 2 appliqué (Retry - ligne 55-75)
- [ ] Fix 3 appliqué (Env var - ligne 201 + .env)
- [ ] `pnpm build` réussi
- [ ] Aucune erreur TypeScript

### Tests Locaux
- [ ] Test 1: Login → dashboard ✅
- [ ] Test 2: Logout → home → login ✅
- [ ] Test 3: SignUp → dashboard ✅
- [ ] Test 4: Reset → dashboard ✅

### Deploy
- [ ] Push dev branch
- [ ] Vercel deploy dev OK
- [ ] Tests dev environment
- [ ] Merge main
- [ ] Vercel deploy prod OK

### Post-Deploy
- [ ] Monitoring 1h
- [ ] Vérifier logs errors
- [ ] Tests utilisateurs réels

---

## 🎯 Métriques Cibles

| Flow | Avant Fix | Après Fix |
|------|-----------|-----------|
| Login redirect | ❌ 0% | ✅ 100% |
| Logout proper | ❌ 0% | ✅ 100% |
| SignUp redirect | ❌ 0% | ✅ 100% |
| Reset redirect | ❌ 0% | ✅ 100% |
| Reset timeout | 🟡 85% | ✅ 98% |

---

## 🆘 Rollback

Si problèmes:
```bash
git revert HEAD
git push origin dev
```

Ou Vercel Dashboard > Deployments > Previous > Promote

---

**Dernière MAJ:** 7 Novembre 2025  
**Action:** Appliquer Fixes Priorité 1 (30 min) puis Tests (15 min)
