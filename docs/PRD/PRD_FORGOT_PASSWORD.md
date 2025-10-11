# PRD : Fonctionnalité "Mot de passe oublié"

## 1. Context

### Situation actuelle
Le projet dispose déjà d'une infrastructure backend complète pour la réinitialisation de mot de passe :
- ✅ **Service client** : `ClientAuthService.resetPassword()` dans `lib/services/auth.service.client.ts`
- ✅ **Validation Zod** : `resetPasswordSchema` dans `lib/validations/auth.ts`
- ✅ **Supabase Auth** : Utilise `supabase.auth.resetPasswordForEmail()` natif
- ✅ **Database** : Supabase gère nativement la table `auth.users` et les tokens de reset

### Problème
La page de connexion (`/auth/signin`) ne propose **aucun lien "Mot de passe oublié"** visible pour l'utilisateur. L'infrastructure backend existe mais n'est pas exposée dans l'interface utilisateur.

### User Journey Impacté
Un utilisateur qui a oublié son mot de passe :
1. Arrive sur `/auth/signin`
2. Ne peut pas se connecter (mot de passe oublié)
3. **Bloqué** : aucune option visible pour réinitialiser

## 2. Goals (Success Criteria)

- [ ] L'utilisateur peut cliquer sur "Mot de passe oublié ?" depuis la page de connexion
- [ ] L'utilisateur peut saisir son email et recevoir un lien de réinitialisation
- [ ] Le lien de réinitialisation redirige vers une page dédiée `/auth/reset-password`
- [ ] L'utilisateur peut définir un nouveau mot de passe
- [ ] Après reset, l'utilisateur est redirigé vers `/dashboard` avec une session active
- [ ] Tous les messages d'erreur/succès sont clairs et en français
- [ ] Aucun doublon avec l'existant (réutilisation de `ClientAuthService`)

## 3. Scope

### Frontend

#### Pages à créer
1. **`/auth/forgot-password`** (Nouvelle page)
   - Formulaire avec champ email
   - Bouton "Envoyer le lien de réinitialisation"
   - Message de succès : "Un email a été envoyé à [email]"
   - Gestion des erreurs (email non trouvé, erreur réseau, etc.)

2. **`/auth/reset-password`** (Nouvelle page)
   - Formulaire avec champ "Nouveau mot de passe" + "Confirmer le mot de passe"
   - Validation en temps réel (min 8 caractères)
   - Message de succès : "Mot de passe modifié avec succès"
   - Redirection automatique vers `/dashboard` après succès

#### Composants à modifier
1. **`components/forms/auth-form.tsx`**
   - Ajouter un lien "Mot de passe oublié ?" sous le champ password (mode signin uniquement)
   - Style : lien discret aligné à droite

2. **Optionnel : Créer un composant réutilisable**
   - `components/forms/forgot-password-form.tsx`
   - `components/forms/reset-password-form.tsx`

#### UI States
- **Loading** : Spinner pendant l'envoi de l'email ou la modification du mot de passe
- **Success** : Alert verte avec message de confirmation
- **Error** : Alert rouge avec message d'erreur explicite
- **Empty** : État initial avec champs vides

#### Responsive Behavior
- Mobile : Formulaire pleine largeur avec padding
- Desktop : Card centrée (max-w-md) comme pour signin/signup

#### Accessibility
- Labels ARIA sur tous les champs
- Focus visible sur les inputs
- Messages d'erreur liés aux champs via `aria-describedby`
- Navigation au clavier (Tab, Enter)

### Backend

**✅ DÉJÀ EXISTANT - AUCUNE MODIFICATION NÉCESSAIRE**

- **Service** : `ClientAuthService.resetPassword(email)` → Envoie l'email avec Supabase
- **Service** : `ClientAuthService.updatePassword(newPassword)` → Met à jour le mot de passe
- **Validation** : `resetPasswordSchema` → Valide l'email
- **Supabase** : Gère nativement :
  - Génération du token de reset
  - Envoi de l'email (si SMTP configuré dans Supabase)
  - Validation du token dans l'URL de callback
  - Mise à jour du mot de passe

### Database

**✅ AUCUNE MODIFICATION NÉCESSAIRE**

Supabase Auth gère nativement la table `auth.users` et les tokens de réinitialisation dans sa propre infrastructure.

### Validation

**✅ DÉJÀ EXISTANT**

```typescript
// lib/validations/auth.ts
export const resetPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
})

// Nouveau schéma pour la page reset-password (à créer si besoin)
export const newPasswordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string().min(8, "Confirmation requise"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})
```

### Security

#### Authentication
- **Page `/auth/forgot-password`** : Publique (accessible sans connexion)
- **Page `/auth/reset-password`** : Publique mais nécessite un token valide dans l'URL
- **Supabase callback** : Vérifie le token automatiquement

#### Authorization
- Aucune autorisation spécifique requise (opération publique)

#### RLS Policies
- **Aucune modification nécessaire** : Supabase Auth gère la sécurité en interne

#### Input Sanitization
- **Validation Zod** : Tous les inputs sont validés via Zod schemas
- **Supabase SDK** : Échappe automatiquement les valeurs SQL

### DevOps

#### Environment Variables
**✅ DÉJÀ CONFIGURÉ**

Supabase utilise les variables existantes :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Configuration Email (Supabase Dashboard)
**⚠️ À VÉRIFIER**

1. Aller dans **Supabase Dashboard → Authentication → Email Templates**
2. Personnaliser le template "Reset Password"
3. Configurer le SMTP (ou utiliser le service Supabase par défaut)
4. Template par défaut :
   ```html
   <h2>Reset Password</h2>
   <p>Follow this link to reset your password:</p>
   <a href="{{ .ConfirmationURL }}">Reset Password</a>
   ```

5. **URL de callback** : Doit pointer vers `https://app.domain/auth/reset-password`
   - Configuration dans Supabase Dashboard → Authentication → URL Configuration
   - Redirect URLs : `https://app.domain/auth/reset-password`

## 4. Technical Implementation Plan

### Step 1: Validation Schema (si nécessaire)
- [ ] Créer `newPasswordSchema` dans `lib/validations/auth.ts`
- [ ] Exporter le type TypeScript correspondant

### Step 2: Pages Frontend
- [ ] Créer `app/auth/forgot-password/page.tsx`
  - Formulaire avec email
  - Appel à `clientAuth.resetPassword(email)`
  - Message de succès + lien retour vers signin
  
- [ ] Créer `app/auth/reset-password/page.tsx`
  - Formulaire avec password + confirmPassword
  - Extraction du token depuis l'URL (géré par Supabase callback)
  - Appel à `clientAuth.updatePassword(newPassword)`
  - Redirection vers `/dashboard` après succès

### Step 3: Modifier Auth Form
- [ ] Ajouter lien "Mot de passe oublié ?" dans `components/forms/auth-form.tsx`
- [ ] Positionner sous le champ password (mode signin uniquement)

### Step 4: Configuration Supabase
- [ ] Vérifier la configuration SMTP dans Supabase Dashboard
- [ ] Personnaliser le template d'email "Reset Password"
- [ ] Ajouter `https://app.domain/auth/reset-password` dans les Redirect URLs

### Step 5: Testing
- [ ] Test end-to-end : Cliquer sur "Mot de passe oublié" → Recevoir email → Cliquer sur lien → Modifier password → Connexion
- [ ] Test erreur : Email invalide
- [ ] Test erreur : Token expiré
- [ ] Test erreur : Passwords non identiques
- [ ] Test responsive : Mobile + Desktop

### Step 6: Documentation
- [ ] Mettre à jour `docs/architecture.md` avec les nouvelles routes
- [ ] Mettre à jour `docs/routes-and-interfaces.md` avec les pages ajoutées

## 5. Data Flow

### Flow 1: Demande de réinitialisation

```
User Action → /auth/forgot-password → Form Submit → 
clientAuth.resetPassword(email) → 
supabase.auth.resetPasswordForEmail(email, {redirectTo: '/auth/reset-password'}) → 
Supabase Backend (génère token + envoie email) → 
User receives email with link
```

### Flow 2: Réinitialisation effective

```
User clicks link in email → 
Supabase validates token → 
Redirect to /auth/reset-password?token=xyz → 
User enters new password → 
clientAuth.updatePassword(newPassword) → 
supabase.auth.updateUser({ password: newPassword }) → 
Supabase updates auth.users → 
Frontend redirects to /dashboard
```

## 6. Error Scenarios

| Scénario | Comportement attendu |
|----------|---------------------|
| Email non existant | Message : "Si cet email existe, un lien a été envoyé" (sécurité : ne pas révéler l'existence du compte) |
| Token expiré | Message : "Le lien a expiré. Veuillez demander un nouveau lien" + bouton vers `/auth/forgot-password` |
| Token invalide | Message : "Lien invalide. Veuillez demander un nouveau lien" |
| Passwords non identiques | Message : "Les mots de passe ne correspondent pas" (validation Zod) |
| Password trop court | Message : "Le mot de passe doit contenir au moins 8 caractères" (validation Zod) |
| Erreur réseau | Message : "Erreur de connexion. Veuillez réessayer" |

## 7. Edge Cases

- **Token expiré** : Supabase expire les tokens après 1 heure par défaut
  - Solution : Afficher message clair + lien pour redemander un email
  
- **Utilisateur déjà connecté** : Si un utilisateur connecté accède à `/auth/forgot-password`
  - Solution : Rediriger vers `/dashboard` (middleware déjà en place ?)
  
- **Email SMTP non configuré** : Supabase utilise un service par défaut (limité)
  - Solution : Documenter la configuration SMTP pour production
  
- **Multiples demandes** : Utilisateur clique plusieurs fois sur "Envoyer"
  - Solution : Désactiver le bouton pendant le loading + cooldown côté Supabase

## 8. Testing Strategy

### Unit Tests
- Test `resetPasswordSchema` validation
- Test `newPasswordSchema` validation
- Test `clientAuth.resetPassword()` mock
- Test `clientAuth.updatePassword()` mock

### Integration Tests
- Test API Supabase : `resetPasswordForEmail()` avec email valide
- Test API Supabase : `updateUser()` avec nouveau password

### E2E Tests (Manual)
1. Happy path complet : forgot → email → reset → login
2. Email invalide
3. Token expiré
4. Passwords non identiques
5. Responsive mobile

## 9. Rollout Plan

### Phase 1 : Development (Local)
- [ ] Implémenter les 2 pages
- [ ] Modifier le formulaire de connexion
- [ ] Tester localement

### Phase 2 : Staging
- [ ] Configurer SMTP Supabase (ou service par défaut)
- [ ] Tester avec des emails réels
- [ ] Valider les templates d'email

### Phase 3 : Production
- [ ] Déployer sur Vercel
- [ ] Monitorer les logs Supabase (succès/échecs d'envoi d'email)
- [ ] Collecter feedback utilisateurs

### Monitoring
- Dashboard Supabase : Suivi des emails envoyés
- Logs : Erreurs `resetPasswordForEmail()` et `updateUser()`
- Metrics : Taux de succès des réinitialisations

## 10. Out of Scope (Explicitly)

- ❌ **Modification du backend** : Aucune API route personnalisée (Supabase gère tout)
- ❌ **Création de tables** : Aucune table nécessaire (Supabase Auth interne)
- ❌ **Service email custom** : On utilise le service Supabase (pas de SendGrid/Mailgun pour le moment)
- ❌ **Vérification 2FA** : Hors scope (fonctionnalité future potentielle)
- ❌ **Rate limiting** : Géré par Supabase (pas d'implémentation custom)

## 11. Existing Infrastructure Summary

### ✅ Ce qui existe déjà

| Composant | Fichier | Status |
|-----------|---------|--------|
| Service reset password | `lib/services/auth.service.client.ts` | ✅ Complet |
| Service update password | `lib/services/auth.service.client.ts` | ✅ Complet |
| Validation email | `lib/validations/auth.ts` | ✅ Complet |
| Supabase Auth | Configuration Dashboard | ✅ Actif |
| Database auth.users | Supabase managed | ✅ Géré nativement |

### ❌ Ce qui manque (à créer)

| Composant | Fichier | Action |
|-----------|---------|--------|
| Page forgot password | `app/auth/forgot-password/page.tsx` | 🆕 Créer |
| Page reset password | `app/auth/reset-password/page.tsx` | 🆕 Créer |
| Validation confirmPassword | `lib/validations/auth.ts` | 🆕 Ajouter schéma |
| Lien dans auth-form | `components/forms/auth-form.tsx` | ✏️ Modifier |
| Config email Supabase | Supabase Dashboard | ⚙️ Configurer |

## 12. Risks & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| SMTP non configuré | Utilisateurs ne reçoivent pas l'email | Configurer SMTP dans Supabase Dashboard avant déploiement |
| Token expiré (1h) | Utilisateur frustré | Message clair + possibilité de redemander un email |
| Email en spam | Email non reçu | Configurer SPF/DKIM + utiliser domaine personnalisé |
| Pas de retour utilisateur | Confusion | Messages de succès/erreur clairs et visibles |

## 13. Success Metrics

- **Objectif** : 80% des demandes de reset aboutissent à un changement de mot de passe
- **Metrics à suivre** :
  - Nombre de clics sur "Mot de passe oublié ?"
  - Nombre d'emails envoyés (Supabase Dashboard)
  - Nombre de réinitialisations réussies
  - Taux d'erreur (token expiré, etc.)

## 14. References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
