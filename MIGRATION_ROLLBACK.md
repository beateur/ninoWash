# 🔄 Plan de Rollback - Migration PKCE Officiel

## État actuel (avant migration)

### Flux authentification existants

1. **Signin classique**
   - Formulaire → `signInWithPassword()` → Redirect `/dashboard`
   - Pas de callback

2. **Signup avec confirmation email**
   - Formulaire → `signUp()` → Email envoyé
   - Clic lien email → `/auth/callback` (page) → `exchangeCodeForSession` → `/dashboard`

3. **Guest booking signup**
   - Réservation anonyme → Créer compte
   - Email confirmation → `/auth/callback?redirect=/booking/success`

4. **Reset password**
   - Formulaire → `resetPasswordForEmail()` → Email envoyé
   - Clic lien → `/auth/reset-password` (page)
   - Page détecte session via retry logic → Formulaire `updateUser()`

5. **Logout**
   - Bouton → `signOut()` + nettoyage localStorage/cookies manuel
   - Redirect `/`

### Fichiers clés

- `/app/auth/callback/page.tsx` - Page callback (Server Component)
- `/app/auth/reset-password/page.tsx` - Page reset avec retry logic
- `/lib/services/auth.service.client.ts` - Service auth client
- `/lib/supabase/client.ts` - Config PKCE (`flowType: 'pkce'`, `detectSessionInUrl: true`)
- `/middleware.ts` - Protection routes + cookieOptions
- `/lib/auth/route-guards.ts` - `requireAuth()` avec cookieOptions

## Procédure de rollback

### Si problème en Phase 2-3 (Route Handler reset password)

```bash
# Revenir sur main
git checkout main

# Supprimer branche migration
git branch -D feature/official-pkce-migration
```

### Si problème en Phase 4-6 (Signup/Booking)

```bash
# Réactiver callback page (si supprimée)
git checkout main -- app/auth/callback/page.tsx

# Rebuild
pnpm build

# Redeploy
git push origin main
```

### Si problème en production post-deploy

```bash
# Identifier commit avant migration
git log --oneline -10

# Revert vers commit stable
git revert <commit-hash-migration>
git push origin main

# Ou reset hard (DANGER)
git reset --hard <commit-hash-avant-migration>
git push --force origin main
```

## Checklist validation avant merge

- [ ] Reset password mobile Safari iOS fonctionne
- [ ] Signup email confirmation fonctionne
- [ ] Guest booking signup + redirect fonctionne
- [ ] Signin classique fonctionne
- [ ] Logout complet (cookies/localStorage supprimés)
- [ ] Middleware redirections (pas de boucles)
- [ ] Build production passe sans erreurs
- [ ] Tests E2E passent (si existants)

## Contacts urgence

- Développeur: [TON EMAIL]
- Supabase Support: support@supabase.com
- Vercel Support: vercel.com/support

## Logs de migration

**Date début**: 9 novembre 2025
**Branche**: `feature/official-pkce-migration`
**Base commit**: `763548f`

### Changements prévus

1. Création `/app/api/auth/callback/route.ts` (Route Handler)
2. Modification `resetPasswordForEmail` → `/api/auth/callback?type=recovery`
3. Simplification `/auth/reset-password` (retrait retry logic)
4. Modification `signUp` → `emailRedirectTo: /api/auth/callback?type=signup`
5. Conservation `{{ .ConfirmationURL }}` dans templates email
6. Suppression `/app/auth/callback/page.tsx` (legacy)

### Tests effectués

- [ ] Desktop Chrome - Reset password
- [ ] Desktop Safari - Reset password
- [ ] Mobile Safari iOS - Reset password ⚠️ PRIORITÉ
- [ ] Mobile Chrome Android - Reset password
- [ ] Desktop - Signup
- [ ] Mobile - Signup
- [ ] Desktop - Guest booking
- [ ] Mobile - Guest booking
- [ ] Desktop - Signin/Logout
- [ ] Mobile - Signin/Logout
