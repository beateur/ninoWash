# 🔐 Auth PKCE - Problèmes & Solutions

**Date:** 7 Novembre 2025  
**Status:** 🔴 Bugs Critiques Identifiés + Nouveaux Problèmes Redirection

---

## 🎯 Résumé Exécutif

### ✅ Objectif Atteint
- Safari iOS reset password fonctionne (migration PKCE)

### 🔴 Problèmes Actuels

#### 1. Redirections Dashboard Broken (NOUVEAU - 7 Nov)
**Symptômes:**
- ✅ Connexion réussie (message affiché)
- ❌ Pas de redirection automatique vers /dashboard
- ❌ Déconnexion ne fonctionne pas (reconnexion automatique)
- ❌ Signup ne redirige pas vers /dashboard

**Impact:** UX catastrophique - users bloqués après login

#### 2. Double Échange PKCE (SignUp)
**Impact:** ~20% échecs signup potentiels  
**Cause:** Auto-détection + échange manuel  
**Symptôme:** "Code already used"

#### 3. Reset Password Timeout
**Impact:** ~15% échecs connexions lentes  
**Cause:** Retry 3s trop court  
**Symptôme:** "Session expirée"

---

## 🚀 Solutions (Par Priorité)

### PRIORITÉ 1: Fixes Redirection Dashboard 🔴

#### Fix 1.1: AuthForm - Attendre Session + Window Location

**Fichier:** `components/forms/auth-form.tsx`

**Ligne ~68 (dans onSubmit):**

Remplacer:
```typescript
} else {
  onSuccess?.()
  router.push("/dashboard")
  router.refresh()
}
```

Par:
```typescript
} else {
  // ✅ FIX: Attendre que la session soit bien établie
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // ✅ Callback custom si fourni (ex: post-booking)
  if (onSuccess) {
    onSuccess()
  } else {
    // ✅ Utiliser window.location pour forcer full reload
    window.location.href = "/dashboard"
  }
}
```

---

#### Fix 1.2: Callback Page - Check Session Existante

**Fichier:** `app/auth/callback/page.tsx`

Remplacer TOUT le contenu par:
```typescript
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string; type?: string; redirect?: string }
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            console.log('Cookies will be set after redirect')
          }
        },
      },
    },
  )

  // Gérer les erreurs
  if (searchParams.error) {
    if (searchParams.type === "recovery") {
      redirect("/auth/reset-password?error=" + encodeURIComponent(searchParams.error))
    }
    redirect("/auth/signin?error=" + encodeURIComponent(searchParams.error))
  }

  if (searchParams.code) {
    // ✅ FIX: Vérifier si session existe déjà (auto-détection PKCE)
    const { data: existingSessionData } = await supabase.auth.getSession()
    
    let sessionUser = existingSessionData?.session?.user

    if (!sessionUser) {
      // Pas de session auto-détectée, faire échange manuel
      const { data, error } = await supabase.auth.exchangeCodeForSession(searchParams.code)

      if (error) {
        if (searchParams.type === "recovery") {
          redirect("/auth/reset-password?error=" + encodeURIComponent(error.message))
        }
        redirect("/auth/signin?error=" + encodeURIComponent(error.message))
      }

      sessionUser = data?.user
    }

    // Détecter type de recovery
    const isPasswordRecovery = sessionUser?.user_metadata?.iss?.includes('recovery') || 
                               searchParams.type === "recovery"

    if (isPasswordRecovery) {
      redirect("/auth/reset-password")
    }

    // ✅ FIX: Gérer redirect custom (post-booking)
    const redirectTo = searchParams.redirect || "/dashboard"
    redirect(redirectTo)
  }

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
// ✅ Attendre que Supabase détecte et échange le code PKCE depuis l'URL
// Retry avec exponential backoff pour supporter connexions lentes
const MAX_RETRIES = 6
const BASE_DELAY = 500

let session = null
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionData?.session) {
    session = sessionData.session
    console.log(`[Reset Password] Session détectée (tentative ${attempt + 1})`)
    break
  }
  
  if (attempt < MAX_RETRIES - 1) {
    const delay = BASE_DELAY * Math.pow(2, attempt)
    console.log(`[Reset Password] Tentative ${attempt + 1}/${MAX_RETRIES}, attente ${delay}ms`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

if (!session) {
  setTokenError(true)
  setError("Votre session a expiré. Veuillez demander un nouveau lien de réinitialisation.")
}
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
