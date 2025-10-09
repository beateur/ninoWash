# PRD - Page de Confirmation de Réservation

## 1. Context

### Problème
Actuellement, après avoir cliqué sur "Confirmer la réservation", les utilisateurs sont immédiatement redirigés vers le dashboard ou la homepage avec un simple message de succès. Cela ne communique pas clairement :
- Que la réservation n'est pas encore confirmée définitivement
- Qu'ils doivent attendre un lien de paiement par email
- Qu'ils recevront des notifications par email
- Que la réservation peut être refusée

### Objectif Business
Clarifier le processus de validation de réservation pour :
- Réduire l'anxiété client ("Ma réservation est-elle confirmée ?")
- Définir les attentes (délai, étapes suivantes)
- Réduire les appels/emails de support
- Améliorer la perception de professionnalisme

### User Journey Impacté
**Flux de réservation complet** (étape finale) :
1. Client remplit formulaire de réservation (4 étapes)
2. Client clique sur "Confirmer la réservation"
3. ✨ **NOUVELLE ÉTAPE** : Affichage de la page de confirmation
4. Email envoyé avec lien de paiement (à venir)
5. Client paie via Stripe
6. Réservation confirmée ou refusée

## 2. Goals (Success Criteria)

✅ **Must Have (MVP)**:
- [ ] Page de confirmation affichée après création de réservation réussie
- [ ] Message clair expliquant les 4 points clés :
  - Réservation en attente de validation
  - Lien de paiement envoyé par email
  - Email récapitulatif envoyé
  - Notification si refus
- [ ] Design cohérent avec la page de succès d'abonnement (référence fournie)
- [ ] CTA vers le dashboard (utilisateurs authentifiés) ou homepage (invités)
- [ ] Responsive mobile/desktop
- [ ] Affichage du numéro de réservation

🎯 **Nice to Have (Phase 2)**:
- [ ] Affichage du résumé de la réservation (date, adresses, items)
- [ ] Timeline visuelle du processus
- [ ] Estimation du délai de validation (ex: "sous 24h")
- [ ] Lien "Voir mes réservations"

## 3. Scope

### 3.1 Frontend

#### Composants à créer
1. **Page principale** : `/app/reservation/success/page.tsx`
   - Layout : Centré, card avec fond vert clair
   - Icône : `Clock` (horloge) ou `FileCheck` (lucide-react) pour "en attente"
   - Titre : "Réservation en attente de validation"
   - Sous-titre : "Nous avons bien reçu votre demande"
   - Contenu : Liste à puces des 4 points clés
   - Numéro de réservation affiché en évidence
   - Boutons CTA : "Accéder au tableau de bord" / "Retour à l'accueil"

#### UI States
- **Loading** : Non nécessaire (page statique après redirection)
- **Success** : État par défaut
- **Error** : Gestion via query params `?error=true`
- **Empty** : N/A

#### User Flows
**Utilisateur authentifié** :
```
Clic "Confirmer" → API POST /api/bookings → Success → Redirect /reservation/success?number=XXX → Affiche page → Clic "Dashboard" → /dashboard
```

**Utilisateur invité** :
```
Clic "Confirmer" → API POST /api/bookings → Success → Redirect /reservation/success?number=XXX → Affiche page → Clic "Accueil" → /
```

#### Responsive Behavior
- Desktop : Card max-width 2xl (768px)
- Mobile : Padding réduit, boutons full-width
- Icône : h-16 w-16 desktop, h-12 w-12 mobile

#### Accessibility
- Structure sémantique avec `<h1>`, `<h2>`, `<ul>`
- Aria labels sur les boutons
- Contraste de couleur WCAG AA (vert 600/700/900)
- Focus visible sur les CTA

### 3.2 Backend

#### API Routes à modifier
**Aucune nouvelle route** - Modification de redirection existante :
- `components/booking/summary-step.tsx` (ligne ~255-260)
- Changer : `router.push('/dashboard?success=true')`
- En : `router.push('/reservation/success?number=' + result.booking.booking_number)`

#### Business Logic
- Aucune logique métier supplémentaire
- Utilisation du numéro de réservation existant (`booking_number`)
- Pas de validation supplémentaire

### 3.3 Database

**Aucune modification requise** - Utilisation de la structure existante :
- Table `bookings` : colonne `booking_number` (déjà présente)
- Aucune migration nécessaire

### 3.4 Validation

**Aucune validation Zod supplémentaire** :
- Query param `number` : simple string (non validé côté serveur, affiché tel quel)
- Optionnel : Validation format numéro (ex: `BOOK-XXXXX`)

### 3.5 Security

#### Authentication
- **Route publique** : Accessible aux invités ET utilisateurs authentifiés
- Pas de `requireAuth()` nécessaire
- Information affichée : Numéro de réservation (non sensible, publique)

#### Authorization
- Aucune vérification de propriété (page informative uniquement)
- Pas d'accès aux données complètes de la réservation

#### RLS Policies
- N/A (pas d'accès direct à la DB depuis cette page)

#### Input Sanitization
- Query param `number` : Échappement HTML automatique par Next.js
- Pas d'injection XSS possible

### 3.6 DevOps

#### Environment Variables
- **Aucune variable requise** (pas d'appel API externe)

#### Supabase Functions
- N/A

#### Webhooks
- N/A

## 4. Technical Implementation Plan

### Step 1: Frontend Component Creation
- [ ] Créer `/app/reservation/success/page.tsx`
- [ ] Importer composants Shadcn/ui : `Card`, `Button`, icône Lucide
- [ ] Structure HTML/JSX avec les 4 points clés
- [ ] Styling Tailwind CSS (style cohérent avec `/subscription/success`)
- [ ] Query params : Récupération de `?number=XXX` via `useSearchParams()`
- [ ] Condition d'affichage : Si `number` présent, afficher ; sinon, message générique

### Step 2: Modification de la Redirection
- [ ] Ouvrir `components/booking/summary-step.tsx`
- [ ] Ligne ~255 : Modifier `router.push('/dashboard?success=true')`
- [ ] Ligne ~260 : Modifier `router.push('/?booking_success=true&...')`
- [ ] Nouvelle destination : `/reservation/success?number=${result.booking.booking_number}`
- [ ] Gestion des erreurs : Si pas de `booking_number`, fallback vers `/dashboard`

### Step 3: Responsive & Accessibility
- [ ] Tester sur mobile (< 640px) : Boutons full-width
- [ ] Tester sur tablet (640-1024px) : Spacing adapté
- [ ] Tester navigation clavier : Tab focus visible
- [ ] Valider contraste couleurs (outil Lighthouse)

### Step 4: Testing
- [ ] Test utilisateur authentifié : Créer réservation → Vérifier redirection → Clic "Dashboard"
- [ ] Test invité : Créer réservation → Vérifier redirection → Clic "Accueil"
- [ ] Test sans `number` : Accéder à `/reservation/success` directement → Message générique
- [ ] Test responsive : Chrome DevTools (iPhone, iPad, Desktop)

### Step 5: Documentation
- [ ] Mettre à jour `docs/booking-system-workflow.md` : Ajouter étape "Page de confirmation"
- [ ] Mettre à jour `docs/routes-and-interfaces.md` : Ajouter route `/reservation/success`

## 5. Data Flow

```
[Client] Clic "Confirmer"
    ↓
[Frontend] components/booking/summary-step.tsx → handleSubmit()
    ↓
[API] POST /api/bookings → Validation → Insert DB
    ↓
[Response] { booking: { booking_number: "BOOK-12345" }, ... }
    ↓
[Frontend] router.push('/reservation/success?number=BOOK-12345')
    ↓
[Page] /app/reservation/success/page.tsx
    ↓
[Display] Affiche message + numéro + CTA
    ↓
[User Action] Clic "Dashboard" ou "Accueil"
    ↓
[Redirect] /dashboard ou /
```

## 6. Error Scenarios

| Scénario | Comportement | User Feedback |
|----------|-------------|---------------|
| API POST échoue | Erreur affichée sur page réservation | Alert rouge : "Erreur lors de la création" |
| Pas de `booking_number` en response | Fallback vers `/dashboard` | Message succès générique |
| Accès direct à `/reservation/success` sans param | Affiche message générique | "Votre réservation a été enregistrée" (sans numéro) |
| Network timeout | Gère par fetch error | Alert : "Erreur réseau" |

## 7. Edge Cases

- **F5 / Refresh page** : Message reste affiché (stateless)
- **Copier/coller URL** : Fonctionne (URL contient numéro)
- **Bookmark** : Page accessible mais numéro peut être obsolète
- **SEO** : Ajouter `<meta name="robots" content="noindex">` (page temporaire)

## 8. Testing Strategy

### Unit Tests
- N/A (composant React simple, pas de logique métier)

### Integration Tests
- **Vitest** : Tester le composant avec différents query params
  ```typescript
  it('should display booking number when provided', () => {
    render(<Page />, { searchParams: { number: 'BOOK-123' } })
    expect(screen.getByText(/BOOK-123/)).toBeInTheDocument()
  })
  ```

### E2E Tests (Manual)
- [ ] Créer réservation de bout en bout (Playwright / manuel)
- [ ] Vérifier redirection vers `/reservation/success`
- [ ] Vérifier affichage du numéro
- [ ] Cliquer sur CTA et vérifier destination

### Performance
- Lighthouse audit : Temps de chargement < 1s (page statique)
- Core Web Vitals : LCP < 2.5s, FID < 100ms, CLS < 0.1

## 9. Rollout Plan

### Phase 1 : MVP (Cette itération)
- Créer page de base avec les 4 points clés
- Modifier redirections
- Tester manuellement
- Déployer en production

### Phase 2 : Enhancements (Post-MVP)
- Ajouter résumé de la réservation (date, adresses, items)
- Timeline visuelle (inspirée de Uber/Deliveroo)
- Estimation du délai de validation
- Tracking analytics (Google Analytics event "booking_pending_viewed")

### Monitoring
- **Logs** : Aucun log nécessaire (page statique)
- **Analytics** : Ajouter event GA "booking_confirmation_page_view"
- **Error Tracking** : Sentry (si erreur de render)

### Rollback Strategy
- Si bug critique : Remettre anciennes redirections (`/dashboard?success=true`)
- Pas de downtime (page nouvelle, aucune dépendance)

## 10. Out of Scope (Explicitly)

❌ **Non inclus dans cette itération** :
- Envoi d'email de confirmation (sera implémenté séparément)
- Affichage du résumé complet de la réservation (date, adresses, items)
- Timeline visuelle du processus de validation
- Notification push/SMS
- Modification de la réservation depuis cette page
- Annulation de la réservation depuis cette page
- Traduction i18n (uniquement français pour l'instant)
- Dark mode support (suit le thème global)

---

## Messages Clés à Afficher

### Titre Principal
**"Réservation en attente de validation"**

### Sous-titre
**"Nous avons bien reçu votre demande"**

### Points Clés (Liste à puces)
1. ✅ **Validation en cours** : Notre équipe va examiner votre demande et la valider sous peu
2. 💳 **Lien de paiement** : Vous recevrez un email avec un lien sécurisé pour régler la prestation et confirmer votre réservation
3. 📧 **Email récapitulatif** : Un email de confirmation avec tous les détails vous sera envoyé
4. 🔔 **Notification** : Si votre réservation ne peut être honorée, vous serez notifié par email immédiatement

### Numéro de Réservation
**"Numéro de réservation : #BOOK-12345"** (affiché en gras, couleur primaire)

### CTA (Buttons)
- **Utilisateur authentifié** : "Accéder au tableau de bord"
- **Invité** : "Retour à l'accueil"

---

## Wireframe ASCII

```
┌────────────────────────────────────────────┐
│          🕐 [Clock Icon - h-16]            │
│                                            │
│   Réservation en attente de validation     │ (h1 - 3xl)
│   Nous avons bien reçu votre demande       │ (text-muted - base)
│                                            │
├────────────────────────────────────────────┤
│  [Card blanc avec border]                  │
│                                            │
│  Prochaines étapes :                       │ (h2 - lg)
│                                            │
│  ✅ Validation en cours                    │
│     Notre équipe va examiner...            │
│                                            │
│  💳 Lien de paiement                       │
│     Vous recevrez un email...              │
│                                            │
│  📧 Email récapitulatif                    │
│     Un email de confirmation...            │
│                                            │
│  🔔 Notification                           │
│     Si votre réservation...                │
│                                            │
│  ─────────────────────────────────         │
│  Numéro de réservation : #BOOK-12345       │ (text-primary - semibold)
│                                            │
└────────────────────────────────────────────┘

   [Accéder au tableau de bord]  [Retour...]
   (Button primary - lg)         (outline)
```

---

## Checklist Pré-Déploiement

### Développement
- [ ] Créer `app/reservation/success/page.tsx`
- [ ] Modifier `components/booking/summary-step.tsx` (redirections)
- [ ] Tester responsive (mobile, tablet, desktop)
- [ ] Valider accessibilité (Lighthouse score > 90)
- [ ] TypeScript strict mode compliance (`pnpm tsc --noEmit`)

### Testing
- [ ] Test utilisateur authentifié (flow complet)
- [ ] Test invité (flow complet)
- [ ] Test sans query param
- [ ] Test avec numéro invalide
- [ ] Test navigation (boutons CTA)

### Documentation
- [ ] Mettre à jour `docs/booking-system-workflow.md`
- [ ] Mettre à jour `docs/routes-and-interfaces.md`
- [ ] Ajouter capture d'écran dans docs (optionnel)

### Code Quality
- [ ] ESLint pass (`pnpm lint`)
- [ ] Pas de console.log oublié
- [ ] Commentaires clairs sur code non-évident
- [ ] Imports organisés (Shadcn, Lucide, Next)

### Sécurité
- [ ] Query param échappé (auto par Next.js)
- [ ] Pas d'info sensible affichée
- [ ] Meta robots noindex ajouté

---

**Approuvé par** : [À remplir après review]
**Date de création** : 8 janvier 2025
**Version** : 1.0
