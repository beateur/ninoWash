# 🔒 Séparation Auth Marketing/App - Guide de Test

**Branche:** `fix/marketing-auth-separation`  
**Date:** 4 octobre 2025  
**Objectif:** Séparation stricte entre domaine marketing (public) et domaine authentifié

---

## 🎯 Problème Résolu

### Avant
- ❌ Header marketing affichait icône de notification
- ❌ Header marketing affichait avatar utilisateur
- ❌ Header marketing faisait des appels à `useAuth()` pour vérifier la session
- ❌ Pas de séparation claire entre pages publiques et authentifiées

### Après
- ✅ Header marketing : ZÉRO accès auth, juste bouton "Se connecter"
- ✅ Header authentifié : Notifs + Avatar + Dropdown utilisateur
- ✅ Séparation stricte : `(main)` = marketing, `(authenticated)` = app
- ✅ Pas d'appels auth sur les pages publiques

---

## 📁 Structure des Fichiers

### Nouveaux Composants

#### Marketing (Domaine Public - www)
- `components/layout/header.tsx` - Header marketing simplifié
- `components/layout/mobile-nav.tsx` - Navigation mobile marketing

#### Authentifié (Domaine App)
- ❌ ~~`components/layout/authenticated-header.tsx`~~ - **SUPPRIMÉ** (dead code - jamais rendu)
- ❌ ~~`components/layout/mobile-auth-nav.tsx`~~ - **SUPPRIMÉ** (intégré dans DashboardSidebar)
- `components/layout/dashboard-sidebar.tsx` - **Navigation complète** (desktop + mobile) pour pages authentifiées
- `app/(authenticated)/layout.tsx` - Layout pour pages authentifiées (NO header/footer)

**🚨 Règle Architecture** : Les pages authentifiées n'ont **NI header NI footer**, uniquement DashboardSidebar

### Pages Réorganisées

Toutes les pages nécessitant authentification sont maintenant dans `app/(authenticated)/` :
- `dashboard/` - Dashboard utilisateur
- `profile/` - Profil utilisateur
- `bookings/` - Mes réservations
- `subscription/` - Gestion abonnement

---

## 🧪 Tests à Effectuer

### Test 1: Header Marketing (Pages Publiques)

#### Pages à tester:
- `/` (Accueil)
- `/services`
- `/comment-ca-marche`
- `/a-propos`
- `/contact`

#### Vérifications Desktop:
- [ ] Logo "Nino Wash" visible
- [ ] Navigation : Services, Comment ça marche, À propos, Contact
- [ ] Bouton "Se connecter" (texte)
- [ ] Bouton "S'inscrire" (avec fond)
- [ ] Bouton "Réserver maintenant" (secondaire)
- [ ] **AUCUNE** icône de notification
- [ ] **AUCUN** avatar utilisateur
- [ ] **AUCUNE** indication de connexion

#### Vérifications Mobile:
- [ ] Logo "Nino Wash" visible
- [ ] Bouton menu burger (hamburger)
- [ ] **AUCUNE** icône de notification
- [ ] **AUCUN** avatar utilisateur

#### Menu mobile doit afficher:
- [ ] Navigation : Accueil, Services, Comment ça marche, À propos, Contact
- [ ] Bouton "Se connecter" (outline)
- [ ] Bouton "S'inscrire" (avec fond)
- [ ] Bouton "Réserver maintenant" (secondaire)

---

### Test 2: Pages d'Authentification

#### Pages à tester:
- `/auth/signin` (Connexion)
- `/auth/signup` (Inscription)

#### Vérifications:
- [ ] Page propre sans header/footer
- [ ] Formulaire centré sur fond dégradé
- [ ] Pas de détection de session avant soumission
- [ ] Après connexion : redirection vers `/dashboard`

---

### Test 3: Header Authentifié (Pages App)

#### Pages à tester (nécessite connexion):
- `/dashboard`
- `/profile`
- `/bookings`
- `/subscription`

#### Vérifications Desktop:
- [ ] Logo "Nino Wash" visible (lien vers /dashboard)
- [ ] Navigation : Accueil, Réserver, Mes réservations, S'abonner
- [ ] **ICÔNE DE NOTIFICATION** visible (cloche)
- [ ] **AVATAR UTILISATEUR** visible (initiale)
- [ ] Dropdown utilisateur fonctionnel

#### Menu dropdown doit afficher:
- [ ] Nom complet de l'utilisateur
- [ ] Email de l'utilisateur
- [ ] Liens : Dashboard, S'abonner, Mes réservations, Profil
- [ ] Bouton "Se déconnecter"

#### Vérifications Mobile:
- [ ] Logo "Nino Wash" visible
- [ ] **ICÔNE DE NOTIFICATION** visible
- [ ] Bouton menu burger (hamburger)

#### Menu mobile doit afficher:
- [ ] Infos utilisateur (nom + email) en haut
- [ ] Navigation : Accueil, Dashboard, Réserver, Mes réservations, Abonnement, Profil
- [ ] Bouton "Se déconnecter" en bas

---

### Test 4: Flow Complet

#### Scénario: Utilisateur non connecté

1. **Page d'accueil** (`/`)
   - [ ] Header marketing visible (pas de notif, pas d'avatar)
   - [ ] Clic "Se connecter" → Redirige vers `/auth/signin`

2. **Page de connexion** (`/auth/signin`)
   - [ ] Pas de header/footer
   - [ ] Formulaire de connexion visible
   - [ ] Saisir email/password → Soumettre

3. **Après connexion**
   - [ ] Redirection automatique vers `/dashboard`
   - [ ] Header authentifié visible (avec notif + avatar)
   - [ ] Dashboard s'affiche correctement

4. **Navigation**
   - [ ] Clic sur "Accueil" (header) → Va sur `/` avec header marketing
   - [ ] Retour sur `/dashboard` → Header authentifié réapparaît

5. **Déconnexion**
   - [ ] Clic avatar → Dropdown → "Se déconnecter"
   - [ ] Redirection vers `/auth/signin`
   - [ ] Header marketing sur page d'accueil

---

## 🔍 Points d'Attention

### Console Browser
- [ ] **AUCUNE** erreur de type `useAuth()` sur pages marketing
- [ ] **AUCUNE** erreur de module manquant
- [ ] **AUCUNE** erreur de rendu hydration

### Network Tab
- [ ] Pages marketing : **AUCUN** appel vers `/api/auth/` ou Supabase Auth
- [ ] Pages authentifiées : Appels auth uniquement si user connecté

### Performance
- [ ] Pages marketing : Chargement rapide (pas de vérification auth)
- [ ] Pas de flash de contenu (FOUC) sur pages marketing

---

## 🐛 Bugs Possibles à Vérifier

### Si Header Marketing Affiche Avatar/Notifs
- **Cause:** Mauvais import (ancien Header au lieu de nouveau)
- **Solution:** Vérifier `app/(main)/layout.tsx` importe bien `@/components/layout/header`

### Si Pages Auth Ont Header
- **Cause:** Layout parent appliqué
- **Solution:** Pages auth (`/auth/signin`, `/auth/signup`) ne doivent PAS être dans `(main)` ou `(authenticated)`

### Si Erreur "Module not found: mobile-auth-nav"
- **Cause:** Cache TypeScript
- **Solution:** 
  ```bash
  rm -rf .next
  pnpm dev
  ```

### Si Redirection Infinie
- **Cause:** Middleware détecte user et redirige en boucle
- **Solution:** Vérifier que middleware n'affecte PAS `/auth/*`

---

## ✅ Checklist de Validation Finale

Avant de merger dans `dev`:

- [ ] Tous les tests desktop passent
- [ ] Tous les tests mobile passent
- [ ] Flow complet fonctionne (non connecté → connexion → déconnexion)
- [ ] Aucune erreur console
- [ ] Aucun appel auth inutile sur pages marketing
- [ ] Performance OK (pages marketing rapides)
- [ ] Build Next.js réussit (`pnpm build`)
- [ ] TypeScript compile sans erreur (`pnpm tsc --noEmit`)

---

## 📝 Notes pour le Développeur

### Architecture Établie

**Domaine Marketing (www):**
- Layout: `app/(main)/layout.tsx`
- Header: `components/layout/header.tsx` (simplifié)
- Mobile Nav: `components/layout/mobile-nav.tsx` (simplifié)
- Règle: **ZÉRO** accès auth

**Domaine Authentifié (app):**
- Layout: `app/(authenticated)/layout.tsx` (NO header/footer)
- Navigation: `components/layout/dashboard-sidebar.tsx` (desktop + mobile overlay)
- Règle: **TOUJOURS** vérifier auth
- Architecture: DashboardSidebar gère TOUTE la navigation (pas de header séparé)

**🚨 Composants Supprimés (Dead Code)** :
- ❌ `components/layout/authenticated-header.tsx` (jamais rendu dans layout JSX)
- ❌ `components/layout/mobile-auth-nav.tsx` (logique intégrée dans DashboardSidebar)

### Règles de Séparation

1. **Import d'Auth:**
   - Marketing: ❌ Jamais `useAuth()` ou `createClient()`
   - App: ✅ Autorisé

2. **Composants:**
   - Marketing: Statiques, pas de vérification user
   - App: Dynamiques, avec vérification user

3. **Redirections:**
   - Marketing → Auth: Via bouton "Se connecter"
   - Auth → App: Après login réussi
   - App → Marketing: Via lien "Accueil" dans header auth

---

**Auteur:** GitHub Copilot + Développeur  
**Status:** ✅ Prêt pour testing  
**Branch:** `fix/marketing-auth-separation`
