# PRD - Migration Payment Methods Page

## 1. Context
Actuellement, la gestion des moyens de paiement est référencée via un lien ancre `/profile#payment-methods` dans la sidebar, mais **aucune section dédiée n'existe dans la page profil**. Seule l'API backend est implémentée (`/api/payments/methods`).

L'objectif est de créer une **page indépendante `/payment-methods`** pour centraliser la gestion des cartes bancaires, conformément au principe de séparation des préoccupations déjà appliqué pour `/addresses`.

### Problèmes actuels
- Lien mort : `/profile#payment-methods` ne mène nulle part
- Aucun UI existant pour afficher/gérer les moyens de paiement
- L'intégration Stripe existe mais n'est utilisée que dans le flux d'abonnement
- Pas de CRUD utilisateur pour ses cartes enregistrées

### Business Value
- Autonomie utilisateur : gérer ses cartes sans passer par Stripe Portal
- UX cohérente : même pattern que la gestion d'adresses
- Réutilisation : cartes disponibles pour bookings futurs (réservations ponctuelles)

---

## 2. Goals (Success Criteria)

- [ ] L'utilisateur peut accéder à `/payment-methods` depuis la sidebar
- [ ] La page affiche toutes les cartes enregistrées (via `/api/payments/methods`)
- [ ] L'utilisateur peut voir : brand, last 4 digits, expiration, carte par défaut
- [ ] L'utilisateur peut ajouter une nouvelle carte (Stripe Elements)
- [ ] L'utilisateur peut définir une carte par défaut
- [ ] L'utilisateur peut supprimer une carte (avec confirmation)
- [ ] La page est protégée par authentification
- [ ] Les données sont synchronisées avec Stripe via API

---

## 3. Scope

### Frontend
**Composants à créer** (dans `components/payment-methods/`) :
1. **`payment-method-card.tsx`** : Carte visuelle pour afficher une méthode de paiement (brand logo, last 4, expiration, badge "Par défaut")
2. **`payment-methods-list.tsx`** : Liste des cartes + état vide + loading
3. **`add-payment-method-dialog.tsx`** : Modal avec Stripe Elements pour ajouter une carte
4. **`payment-method-delete-confirm.tsx`** : Dialog de confirmation de suppression
5. **`README.md`** : Documentation du module

**Page à créer** :
- `app/(authenticated)/payment-methods/page.tsx` : Page principale avec protection auth

**UI States** :
- Loading (skeleton cards)
- Empty state (aucune carte enregistrée)
- List state (affichage des cartes)
- Error state (échec API)

**Responsive** :
- Desktop : Grid 2-3 colonnes
- Mobile : Stack vertical avec cards full-width

**Accessibility** :
- ARIA labels sur tous les boutons d'action
- Navigation clavier dans les dialogs
- Annonces screen reader pour actions async

---

### Backend
**API Routes existantes** (AUCUNE MODIFICATION) :
- `GET /api/payments/methods` : Liste des cartes
- `POST /api/payments/methods` : Ajouter une carte
- `PATCH /api/payments/methods/[id]` : Mettre à jour (ex: set default)
- `DELETE /api/payments/methods/[id]` : Supprimer

**Actions Stripe** :
Réutiliser les helpers Stripe existants ou en créer si nécessaire :
- `app/actions/stripe.ts` : Helper pour créer un Setup Intent (collecte carte sans paiement immédiat)

---

### Database
**Tables existantes** (AUCUNE MODIFICATION) :
- `payment_methods` : Déjà présente avec colonnes :
  - `id`, `user_id`, `type`, `provider`, `provider_payment_method_id`
  - `last_four`, `brand`, `exp_month`, `exp_year`, `is_default`, `is_active`
  - `created_at`, `updated_at`

**RLS Policies** (à vérifier) :
- User peut lire ses propres cartes
- User peut créer/modifier/supprimer ses propres cartes
- Admin peut tout voir (si besoin)

---

### Validation
**Zod Schemas existants** (dans `lib/validations/payment.ts`) :
- `paymentMethodSchema` : Déjà utilisé par l'API

**Validation côté client** :
- Stripe Elements gère la validation de la carte (numéro, CVV, expiration)
- Validation uniquement des champs meta (ex: is_default)

---

### Security
**Authentication** :
- Page protégée via `requireAuth()` (comme `/addresses`)
- Route ajoutée dans `PROTECTED_ROUTES.auth` du middleware

**Authorization** :
- RLS garantit que user ne voit QUE ses cartes
- API vérifie `user_id` dans chaque opération

**Stripe Security** :
- Utilisation de Setup Intents (pas d'exposition de secrets)
- Token éphémère côté client
- Confirmation server-side via `STRIPE_SECRET_KEY`

---

### DevOps
**Environment Variables** (déjà configurées) :
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` : Client-side (Stripe.js)
- `STRIPE_SECRET_KEY` : Server-side (API calls)

**Dépendances** (déjà installées) :
- `@stripe/stripe-js` : Client
- `@stripe/react-stripe-js` : React components (Elements)
- `stripe` : Server SDK

**Webhooks** :
- Pas de webhook spécifique pour payment methods
- Sync via API POST lors de l'ajout

---

## 4. Technical Implementation Plan

### Step 1: Architecture - Créer le dossier `components/payment-methods/`
- [ ] Créer `components/payment-methods/README.md`
- [ ] Créer la structure pour les 4 composants principaux

### Step 2: Composants UI de base
- [ ] `payment-method-card.tsx` : Affichage d'une carte (read-only)
- [ ] `payment-method-delete-confirm.tsx` : Dialog de confirmation

### Step 3: Liste et états
- [ ] `payment-methods-list.tsx` : Fetch API + affichage + loading/empty states
- [ ] Gestion du state avec `useState` + `useEffect` (ou React Query si déjà utilisé)

### Step 4: Ajout de carte (Stripe Elements)
- [ ] Créer `app/actions/stripe.ts` → `createSetupIntent()` si n'existe pas
- [ ] `add-payment-method-dialog.tsx` :
  - Stripe CardElement
  - Submit → confirm Setup Intent → POST `/api/payments/methods`
  - Refresh liste après succès

### Step 5: Actions CRUD
- [ ] Définir carte par défaut (PATCH `/api/payments/methods/[id]`)
- [ ] Supprimer carte (DELETE `/api/payments/methods/[id]`)
- [ ] Toasts de feedback (succès/erreur)

### Step 6: Page principale
- [ ] Créer `app/(authenticated)/payment-methods/page.tsx`
- [ ] Protection avec `requireAuth()`
- [ ] Import `<PaymentMethodsList />`

### Step 7: Routing et Navigation
- [ ] Ajouter `/payment-methods` dans `middleware.ts` (PROTECTED_ROUTES)
- [ ] Mettre à jour les liens dans `components/layout/dashboard-sidebar.tsx` :
  - Remplacer `/profile#payment-methods` par `/payment-methods`

### Step 8: Testing
- [ ] Test manuel : affichage, ajout, suppression, default
- [ ] Test edge cases : carte expirée, erreur Stripe, RLS
- [ ] Test responsive (mobile + desktop)

### Step 9: Documentation
- [ ] Mettre à jour `docs/architecture.md` si nouveau pattern
- [ ] Compléter `components/payment-methods/README.md`

---

## 5. Data Flow

### Affichage des cartes
```
User loads /payment-methods
  → requireAuth() (SSR)
  → Component mounts
  → useEffect: GET /api/payments/methods
  → apiRequireAuth (middleware)
  → Supabase query payment_methods table (RLS filter)
  → Return JSON { paymentMethods: [...] }
  → Render <PaymentMethodCard /> for each
```

### Ajout d'une carte
```
User clicks "Ajouter une carte"
  → Open dialog with Stripe CardElement
  → User enters card details
  → Submit form
  → Client: stripe.confirmSetup(setupIntent)
  → Stripe returns paymentMethod.id
  → POST /api/payments/methods { providerPaymentMethodId, last4, brand, exp }
  → Server: Insert into payment_methods table
  → Return success
  → Client: Close dialog + refresh list + toast success
```

### Définir carte par défaut
```
User clicks "Définir par défaut"
  → PATCH /api/payments/methods/[id] { isDefault: true }
  → Server: UPDATE payment_methods SET is_default = false WHERE user_id = X
  → Server: UPDATE payment_methods SET is_default = true WHERE id = Y
  → Return success
  → Client: Refresh list + toast
```

### Supprimer une carte
```
User clicks "Supprimer"
  → Open confirmation dialog
  → User confirms
  → DELETE /api/payments/methods/[id]
  → Server: Soft delete (is_active = false) OR hard delete
  → Stripe: Detach payment method via API
  → Return success
  → Client: Remove from UI + toast
```

---

## 6. Error Scenarios

| Scenario | Handling |
|----------|----------|
| API fetch échoue | Afficher message d'erreur + bouton "Réessayer" |
| Stripe Setup Intent échoue | Toast erreur + log Stripe error message |
| Carte invalide (Stripe validation) | Afficher erreur inline sous le champ |
| Suppression carte défaut | Backend refuse ou set next card as default automatiquement |
| Aucune carte enregistrée | Empty state avec CTA "Ajouter votre première carte" |
| Session expirée pendant action | Redirect vers `/auth/signin` |
| Rate limiting Stripe | Toast "Trop de tentatives, réessayez dans quelques minutes" |

---

## 7. Edge Cases

- **Carte expirée** : Afficher badge "Expirée" + CTA "Mettre à jour"
- **Carte par défaut supprimée** : Auto-promouvoir la carte la plus récente
- **Concurrent updates** : Optimistic UI + rollback si erreur
- **Large datasets** : Pagination si > 10 cartes (peu probable)
- **Stripe down** : Fallback message "Service de paiement temporairement indisponible"
- **Browser incompatible** : Stripe Elements fallback automatique

---

## 8. Testing Strategy

### Unit Tests
- Validation schemas (Zod)
- Helper functions (ex: formatCardBrand)

### Integration Tests
- API routes avec mock Supabase
- Stripe Setup Intent creation

### E2E Tests (Playwright/Cypress)
- Flow complet : ajouter → définir par défaut → supprimer
- Gestion des erreurs (carte invalide)

### Manual Testing
- Test avec carte de test Stripe (4242 4242 4242 4242)
- Vérifier RLS policies (user ne voit que ses cartes)
- Test mobile (responsive + touch)

---

## 9. Rollout Plan

### Phase 1 : Développement (local)
- Implémentation complète en local
- Tests manuels avec Stripe test mode

### Phase 2 : Staging
- Déploiement sur environnement de pré-production
- Tests E2E automatisés
- Validation UX avec stakeholders

### Phase 3 : Production
- Feature flag (optionnel) : afficher lien seulement si activé
- Monitoring Sentry/Vercel pour erreurs Stripe
- Rollback plan : cacher lien `/payment-methods` si bugs critiques

### Monitoring
- Logs API : erreurs Stripe
- Metrics : nombre de cartes ajoutées/supprimées par jour
- Alerts : taux d'erreur > 5%

---

## 10. Out of Scope (Explicitly)

### Non inclus dans cette itération :
- ❌ **Édition de carte** : Stripe ne permet pas de modifier une carte existante (seulement add/delete)
- ❌ **Gestion des wallets** (Apple Pay, Google Pay) : Nécessite Stripe Payment Request Button (future iteration)
- ❌ **Historique des transactions** : Feature séparée (future page `/transactions`)
- ❌ **Cartes d'entreprise/facturation** : Hors scope MVP
- ❌ **Multi-currency** : Seulement EUR pour le moment
- ❌ **Webhooks Stripe pour card updates** : Pas nécessaire (user-driven actions uniquement)
- ❌ **Tests A/B** : Direct rollout sans variants

---

## 11. Migration Checklist (Similarities with `/addresses`)

| Aspect | `/addresses` | `/payment-methods` |
|--------|--------------|-------------------|
| Ancien chemin | `/profile#addresses` | `/profile#payment-methods` ✅ |
| Nouveau chemin | `/addresses` | `/payment-methods` ✅ |
| Composants folder | `components/addresses/` | `components/payment-methods/` ✅ |
| Page route | `app/(authenticated)/addresses/` | `app/(authenticated)/payment-methods/` ✅ |
| Protection | `requireAuth()` | `requireAuth()` ✅ |
| Middleware | `PROTECTED_ROUTES.auth` | `PROTECTED_ROUTES.auth` ✅ |
| API routes | `/api/addresses` (exists) | `/api/payments/methods` (exists) ✅ |
| Database | `addresses` table (exists) | `payment_methods` table (exists) ✅ |
| RLS policies | ✅ | ✅ (à vérifier) |
| Sidebar links | Updated | To update ✅ |

---

## 12. Success Metrics

### Week 1 Post-Launch
- [ ] 0 erreurs 500 sur `/api/payments/methods`
- [ ] > 50% utilisateurs actifs visitent la page
- [ ] Temps moyen ajout carte < 60s

### Month 1
- [ ] Taux d'abandon ajout carte < 20%
- [ ] Support tickets "comment ajouter carte" → 0
- [ ] NPS score page > 8/10

---

## 13. Dependencies

### Bloqueurs
- ⚠️ Vérifier que `STRIPE_SECRET_KEY` est configuré en production
- ⚠️ Confirmer que les RLS policies existent sur `payment_methods` table

### Nice-to-have
- React Query (pour caching/optimistic updates) - optionnel
- Sentry (pour tracking erreurs Stripe) - déjà configuré ?

---

## Conclusion

Cette migration transforme un lien mort en une **feature autonome et complète**, alignée sur le pattern `/addresses`. Elle exploite l'infrastructure Stripe existante tout en créant une UX cohérente pour la gestion des moyens de paiement.

**Effort estimé** : 8-12h développement + 2h tests + 1h documentation = ~2 jours
