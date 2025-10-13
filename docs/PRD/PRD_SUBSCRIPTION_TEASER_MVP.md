# PRD: Teaser Abonnements (MVP) - Feature Flag System

## 1. Context

**Why?**
- Lancer le site avec uniquement le **Service Classique** activé
- Afficher les abonnements en **teaser** pour créer de l'anticipation
- Permettre une **activation rapide** via feature flag (pas de redéploiement code)

**Which user journey?**
- Visiteur voit 3 cartes : Classic (actionnable) + 2 abonnements (locked avec blur)
- Tentative d'accès direct URL → redirection automatique
- Quand flag activé → comportement normal immédiat

**Business value**
- Launch rapide avec service principal validé
- Teasing marketing pour abonnements (génère intérêt)
- Sécurité : impossible d'accéder aux abonnements côté serveur

---

## 2. Goals (Success Criteria)

- [x] Carte Classic 100% fonctionnelle et inchangée
- [x] Cartes Abonnement non-cliquables quand flag OFF (pas de href dans DOM)
- [x] Overlay flou uniquement sur features (pas sur titre/prix)
- [x] Badge "Bientôt disponible" avec icône Lock
- [x] Feature flag TypeScript strict (`NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED`)
- [x] Garde côté serveur (page `/reservation`)
- [x] Middleware de sécurité (redirection automatique)
- [x] Activation simple : `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=true` → tout fonctionne
- [x] TypeScript 0 erreur, accessibilité (aria-disabled)

---

## 3. Scope

### Frontend

**Components to create/modify**:
- ✅ `components/sections/services-section.tsx` - Refactor avec teaser logic
- ✅ `lib/flags.ts` - Feature flag typé

**Pages affected**:
- ✅ `app/reservation/page.tsx` - Garde serveur
- ✅ `middleware.ts` - Redirection automatique

**UI States**:
- Classic : toujours actionnable
- Abonnements (flag OFF) : 
  - CTA disabled (no href, aria-disabled, cursor-not-allowed)
  - Overlay blur sur features uniquement
  - Badge "Bientôt disponible"
- Abonnements (flag ON) : comportement normal

**User flows**:
1. Visiteur clique "S'abonner" (flag OFF) → rien ne se passe (button disabled)
2. Visiteur tape URL `/reservation?service=monthly` → Redirection `/pricing?locked=1`
3. Admin active flag → Redéploie → Abonnements fonctionnels

**Responsive behavior**: Identique au code actuel (grid responsive)

**Accessibility**:
- `aria-disabled="true"` sur boutons désactivés
- `aria-label="Bientôt disponible"` sur overlay
- Focus non-actionnable (tabindex -1)

### Backend

**API Routes**: Aucune modification nécessaire (garde déjà présente dans `/api/bookings`)

**Business logic**:
- Flag OFF → Seul `service=classic` accepté
- Flag ON → Tous services accessibles

### Database

**Schema changes**: Aucune (utilise structure existante)

### Validation

**Input validation**: 
- Zod schema existant suffit
- Validation supplémentaire via middleware

### Security

**Authentication**: Inchangé (abonnements nécessitent auth)

**Authorization**:
- Middleware bloque accès URL abonnements si flag OFF
- Page serveur refuse rendering si service non-classic et flag OFF

**RLS Policies**: Aucune modification

### DevOps

**Environment variables**:
```bash
# .env.local / .env.production
NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=false  # MVP launch
# NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=true  # Production finale
```

---

## 4. Technical Implementation Plan

### Step 1: Feature Flag System
- [x] Créer `lib/flags.ts` avec export typé
- [x] Créer `env.d.ts` pour typage ENV

### Step 2: Component Refactor
- [x] Modifier `services-section.tsx` :
  - Importer flag + Lock icon
  - Conditionnel sur rendering CTA (Link vs Button disabled)
  - Overlay blur sur features avec position absolute
  - Badge "Bientôt" si subscription + flag OFF

### Step 3: Server Guards
- [x] Modifier `app/reservation/page.tsx` :
  - Vérifier searchParams.service
  - Redirect si subscription + flag OFF
- [x] Modifier `middleware.ts` :
  - Ajouter check subscription URLs
  - Redirection automatique

### Step 4: Testing
- [x] Test flag OFF : cartes locked, URLs bloquées
- [x] Test flag ON : tout fonctionne normalement
- [x] Test accessibilité (keyboard nav, screen reader)

### Step 5: Documentation
- [x] README avec instructions activation
- [x] Commentaires dans code pour suppression facile

---

## 5. Data Flow

```
User Action → Frontend Component → Feature Flag Check → Rendering Logic

Scenario 1 (Flag OFF):
Click "S'abonner" → Button disabled (no href) → preventDefault() → Nothing happens

Scenario 2 (Direct URL, Flag OFF):
URL /reservation?service=monthly → Middleware intercept → Redirect /pricing?locked=1

Scenario 3 (Flag ON):
Click "S'abonner" → Link normal → Navigation /reservation?service=monthly
```

---

## 6. Error Scenarios

- User tente URL abonnement (flag OFF) → Redirection silencieuse
- User désactive JS → Bouton reste disabled (SSR)
- Flag mal configuré (typo) → Default false (sécurité)

---

## 7. Edge Cases

- SEO : Features restent dans DOM sous overlay (indexables)
- Crawler bots : Voient contenu complet mais CTA disabled
- Cache CDN : Flag PUBLIC donc invalidé au redéploiement

---

## 8. Testing Strategy

**Unit tests**:
- Flag resolution correcte
- Component rendering conditionnel

**Integration tests**:
- Middleware redirection
- Page guard fonctionnel

**E2E tests**:
- Click disabled button ne navigue pas
- Direct URL bloquée
- Flag ON active tout

**Manual testing**:
- Keyboard navigation
- Screen reader (NVDA/JAWS)
- Mobile responsive

---

## 9. Rollout Plan

**Phase 1 (MVP Launch)**:
- `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=false`
- Deploy avec teaser visible

**Phase 2 (Activation abonnements)**:
- Passer flag à `true`
- Redeploy (Vercel auto-rebuild)
- Monitoring : analytics sur conversions abonnements

**Rollback strategy**:
- Repasser flag à `false` si problème
- Pas de modification code nécessaire

**Performance metrics**:
- Clicks sur boutons disabled (analytics event "subscription_teaser_click")
- Conversions après activation

---

## 10. Out of Scope (Explicitly)

- ❌ Formulaire d'inscription "early access"
- ❌ Email notifications quand abonnements disponibles
- ❌ A/B testing de différents wording teaser
- ❌ Backend API changes
- ❌ Database migrations
- ❌ Stripe subscription logic (déjà implémenté)

---

## Code Architecture

**Layer separation**:
```
Frontend (Public)
├── services-section.tsx (UI rendering + teaser logic)
├── lib/flags.ts (feature flag)
└── Types: env.d.ts

Server (Protected)
├── app/reservation/page.tsx (page guard)
├── middleware.ts (URL guard)
└── Existing: API routes already check service validity
```

**Removal strategy** (when going live):
1. Set `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=true`
2. Deploy
3. **Optional cleanup**: Remove teaser code blocks (marked with `// TEASER LAYER`)

---

## Acceptance Testing Checklist

**Visual**:
- [ ] Classic card unchanged (no blur, CTA works)
- [ ] Subscription cards have blur overlay on features only
- [ ] "Bientôt disponible" badge visible
- [ ] "Plus populaire" badge still visible on monthly

**Functional**:
- [ ] Click "S'abonner" (flag OFF) → No navigation
- [ ] URL `/reservation?service=monthly` → Redirects to `/pricing?locked=1`
- [ ] URL `/reservation?service=classic` → Works normally
- [ ] Set flag true → All subscriptions work

**Technical**:
- [ ] TypeScript compilation: 0 errors
- [ ] No console warnings
- [ ] Lighthouse: Accessibility score unchanged
- [ ] Bundle size: <2KB increase

**Security**:
- [ ] No subscription href in DOM when flag OFF
- [ ] Server refuses rendering subscription pages
- [ ] Middleware blocks direct URL access
