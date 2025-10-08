# Migration `/profile#payment-methods` → `/payment-methods`

## 📋 Résumé

Migration d'une référence morte (`/profile#payment-methods`) vers une **page indépendante `/payment-methods`** pour la gestion des moyens de paiement (cartes bancaires), suivant le même principe appliqué pour `/addresses`.

**Date** : 6 octobre 2025  
**Type** : Architecture - Séparation des préoccupations  
**Impact** : Frontend + Routing + API  
**Breaking Changes** : Aucun (l'ancien lien était déjà non fonctionnel)

---

## 🎯 Objectifs

### Avant
- Lien dans la sidebar pointait vers `/profile#payment-methods` (ancre morte)
- Aucune UI existante pour gérer les cartes bancaires
- API backend présente (`/api/payments/methods`) mais non utilisée
- Intégration Stripe limitée au flux d'abonnement uniquement

### Après
- Page indépendante `/payment-methods` avec UI complète
- CRUD complet : Afficher, Ajouter, Définir par défaut, Supprimer
- Réutilisation de l'API existante + nouvelles routes (PATCH/DELETE)
- Architecture modulaire alignée avec `/addresses`

---

## 🔄 Démarche (4 Étapes)

### 1. Architecture - Nouveau Dossier `components/payment-methods/`

**Fichiers créés** :
```
components/payment-methods/
├── README.md                              # Documentation du module
├── payment-method-card.tsx                # Carte visuelle (brand, last 4, expiration)
├── payment-method-delete-confirm.tsx      # Dialog de confirmation suppression
└── payment-methods-list.tsx               # Container avec CRUD (fetch, actions, états)
```

**Principes** :
- **Presentational** : `payment-method-card.tsx` (affichage pur)
- **Container** : `payment-methods-list.tsx` (logique API + state management)
- **Modal** : Dialog réutilisable pour confirmation

---

### 2. Backend - Nouvelles Routes API

**Routes créées** :
- ✅ `PATCH /api/payments/methods/[id]` : Mettre à jour (ex: définir par défaut)
- ✅ `DELETE /api/payments/methods/[id]` : Supprimer (soft delete via `is_active = false`)

**Routes existantes** (réutilisées) :
- `GET /api/payments/methods` : Liste des cartes
- `POST /api/payments/methods` : Ajouter une carte

**Sécurité** :
- Protection via `apiRequireAuth()` (comme `/addresses`)
- Vérification ownership : `eq("user_id", user.id)`
- RLS policies Supabase (isolation par utilisateur)

**Fichier** : `app/api/payments/methods/[id]/route.ts`

---

### 3. Routing - Nouvelle Page `/payment-methods`

**Page créée** :
```typescript
// app/(authenticated)/payment-methods/page.tsx

import { requireAuth } from "@/lib/auth/route-guards"
import { PaymentMethodsList } from "@/components/payment-methods/payment-methods-list"

export default async function PaymentMethodsPage() {
  await requireAuth() // Protection server-side
  
  return (
    <div>
      <h1>Moyens de paiement</h1>
      <PaymentMethodsList />
    </div>
  )
}
```

**Protection Middleware** :
```typescript
// middleware.ts
const PROTECTED_ROUTES = {
  auth: [
    "/dashboard", 
    "/profile", 
    "/addresses", 
    "/payment-methods", // ✅ AJOUTÉ
    "/reservation", 
    "/subscription/manage"
  ],
  ...
}
```

---

### 4. Navigation - Mise à Jour Sidebar

**Fichier** : `components/layout/dashboard-sidebar.tsx`

**Changement** (2 occurrences - mobile + desktop) :
```diff
- <Link href="/profile#payment-methods">
+ <Link href="/payment-methods">
    <CreditCard className="mr-2 h-4 w-4" />
    Modes de paiement
  </Link>
```

---

## 📦 Composants Créés

### 1. `payment-method-card.tsx` (Presentational)

**Rôle** : Affichage d'une carte bancaire avec actions

**Props** :
```typescript
{
  paymentMethod: {
    id: string
    brand: string (visa, mastercard, amex, etc.)
    last_four: string (ex: "4242")
    exp_month: number (1-12)
    exp_year: number (ex: 2025)
    is_default: boolean
  }
  onSetDefault: (id: string) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}
```

**Features** :
- Badge "Par défaut" si `is_default = true`
- Badge "Expirée" si date passée
- Logo coloré selon brand (Visa = bleu, Mastercard = rouge, etc.)
- Dropdown menu : "Définir par défaut" / "Supprimer"

---

### 2. `payment-methods-list.tsx` (Container)

**Rôle** : Fetch API + gestion état + orchestration actions

**États UI** :
- ⏳ **Loading** : Skeleton avec spinner
- 🚫 **Empty** : Message + CTA "Ajouter une carte"
- ❌ **Error** : Alert avec bouton "Réessayer"
- ✅ **Success** : Grid de cartes (responsive 1-2 colonnes)

**Actions CRUD** :
- `fetchPaymentMethods()` : GET `/api/payments/methods`
- `handleSetDefault(id)` : PATCH `/api/payments/methods/[id]`
- `handleDelete(id)` : DELETE `/api/payments/methods/[id]` (avec confirmation)

**Feedback** :
- Toasts via `useToast()` pour succès/erreurs
- Loading state par carte (`actionLoading`)
- Optimistic UI (pas encore implémenté - future iteration)

---

### 3. `payment-method-delete-confirm.tsx` (Modal)

**Rôle** : Dialog de confirmation avant suppression

**Props** :
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading?: boolean
  paymentMethodInfo?: {
    brand: string
    lastFour: string
  }
}
```

**UX** :
- Affiche les détails de la carte (brand + last 4)
- Message clair : "Action irréversible"
- Bouton rouge "Supprimer" + "Annuler"

---

## 🗄️ Base de Données

**Table** : `payment_methods` (déjà existante)

**Colonnes utilisées** :
```sql
id                          UUID PRIMARY KEY
user_id                     UUID REFERENCES users(id)
type                        TEXT (card, paypal, etc.)
provider                    TEXT (stripe)
provider_payment_method_id  TEXT (ID Stripe)
last_four                   TEXT (4 derniers chiffres)
brand                       TEXT (visa, mastercard, etc.)
exp_month                   INTEGER (1-12)
exp_year                    INTEGER (2024+)
is_default                  BOOLEAN
is_active                   BOOLEAN (soft delete)
created_at                  TIMESTAMPTZ
updated_at                  TIMESTAMPTZ
```

**RLS Policies** (à vérifier) :
- ✅ User peut lire ses propres cartes : `SELECT WHERE user_id = auth.uid()`
- ✅ User peut créer ses propres cartes : `INSERT WHERE user_id = auth.uid()`
- ✅ User peut modifier ses propres cartes : `UPDATE WHERE user_id = auth.uid()`
- ✅ User peut supprimer ses propres cartes : `DELETE WHERE user_id = auth.uid()`

---

## 🔐 Sécurité

### Backend Protection
- `apiRequireAuth()` sur toutes les routes
- Vérification `user_id` dans chaque opération
- RLS Supabase (isolation par utilisateur)

### Stripe Security
- **Pas de clé secrète côté client** (uniquement `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- **Setup Intent** pour collecte de carte (pas de paiement immédiat)
- **Token éphémère** : carte tokenisée par Stripe.js, jamais en clair
- **Confirmation server-side** : Validation via `STRIPE_SECRET_KEY`

### PCI Compliance
- ❌ **Aucune donnée sensible stockée** (pas de numéro complet, CVV, etc.)
- ✅ **Seulement metadata** : brand, last 4, expiration
- ✅ **Tokenization** : Stripe gère toute la partie sensible

---

## 🚀 Data Flow

### Affichage des cartes
```
User → /payment-methods
  → requireAuth() (SSR)
  → <PaymentMethodsList /> mounts
  → useEffect: GET /api/payments/methods
    → apiRequireAuth(request)
    → Supabase query (RLS filter)
    → Return JSON { paymentMethods: [...] }
  → Render <PaymentMethodCard /> for each
```

### Définir carte par défaut
```
User clicks "Définir par défaut"
  → PATCH /api/payments/methods/[id] { isDefault: true }
    → Verify ownership (user_id)
    → UPDATE payment_methods SET is_default = false WHERE user_id = X AND id != Y
    → UPDATE payment_methods SET is_default = true WHERE id = Y
    → Return success
  → Refresh list
  → Toast success
```

### Supprimer une carte
```
User clicks "Supprimer"
  → Open PaymentMethodDeleteConfirm dialog
  → User confirms
  → DELETE /api/payments/methods/[id]
    → Verify ownership
    → UPDATE payment_methods SET is_active = false WHERE id = X (soft delete)
    → (Optionnel) Stripe: detach payment method
    → Return success
  → Remove from UI
  → Toast success
```

---

## ⚠️ Limitations Actuelles (Out of Scope MVP)

### Non implémenté dans cette version :
- ❌ **Ajout de carte via Stripe Elements** : Bouton "Ajouter" présent mais pas de dialog Stripe (TODO)
- ❌ **Édition de carte** : Stripe ne permet pas de modifier une carte existante
- ❌ **Wallets** (Apple Pay, Google Pay) : Nécessite Payment Request Button
- ❌ **Historique transactions** : Feature séparée (future page `/transactions`)
- ❌ **Detach Stripe payment method** : Commenté dans le DELETE (TODO)
- ❌ **Optimistic UI** : Pas de rollback automatique en cas d'erreur réseau

### À ajouter en priorité (Phase 2) :
1. **Dialog Stripe Elements** : Composant `add-payment-method-dialog.tsx`
2. **Setup Intent creation** : Action server `app/actions/stripe.ts` → `createSetupIntent()`
3. **Intégration Stripe.js** : `@stripe/react-stripe-js` (déjà installé)

---

## 📊 Comparaison avec `/addresses`

| Aspect | `/addresses` | `/payment-methods` |
|--------|--------------|-------------------|
| Ancien chemin | `/profile#addresses` | `/profile#payment-methods` |
| Nouveau chemin | `/addresses` | `/payment-methods` |
| Composants folder | `components/addresses/` | `components/payment-methods/` |
| API routes | `/api/addresses` | `/api/payments/methods` |
| CRUD complet | ✅ | ✅ (partiellement - add TODO) |
| Protection auth | `requireAuth()` | `requireAuth()` |
| RLS policies | ✅ | ✅ |
| Soft delete | ❌ (hard delete) | ✅ (`is_active = false`) |
| External API | ❌ | ✅ (Stripe) |

---

## ✅ Checklist Migration

- [x] **Architecture**
  - [x] Créer `components/payment-methods/`
  - [x] README.md dans le nouveau dossier
  - [x] 3 composants créés (card, list, delete-confirm)

- [x] **Backend API**
  - [x] PATCH `/api/payments/methods/[id]` (set default)
  - [x] DELETE `/api/payments/methods/[id]` (soft delete)
  - [ ] ⚠️ TODO: Action `createSetupIntent()` pour ajouter carte

- [x] **Routing**
  - [x] Page `app/(authenticated)/payment-methods/page.tsx`
  - [x] Protection dans `middleware.ts`

- [x] **Navigation**
  - [x] Mise à jour sidebar (2 occurrences)
  - [x] Liens pointent vers `/payment-methods`

- [ ] **Intégration Stripe** (TODO Phase 2)
  - [ ] Dialog `add-payment-method-dialog.tsx`
  - [ ] Setup Intent creation
  - [ ] CardElement integration

- [ ] **Tests** (TODO)
  - [ ] Test manuel : affichage liste
  - [ ] Test manuel : définir par défaut
  - [ ] Test manuel : supprimer
  - [ ] Test avec carte expirée
  - [ ] Test edge cases (RLS, ownership)

- [x] **Documentation**
  - [x] PRD complet (`docs/PRD/PRD_PAYMENT_METHODS_PAGE.md`)
  - [x] README composants
  - [x] Migration log (ce fichier)

---

## 🚧 TODO (Next Steps)

### Phase 2 - Ajouter une carte (Priorité Haute)
1. Créer `components/payment-methods/add-payment-method-dialog.tsx`
2. Ajouter action `createSetupIntent()` dans `app/actions/stripe.ts`
3. Intégrer Stripe CardElement (`@stripe/react-stripe-js`)
4. Tester avec carte test Stripe (4242 4242 4242 4242)

### Phase 3 - Améliorations UX
- Optimistic UI (mise à jour instantanée avant confirmation API)
- Skeleton loading (au lieu du spinner central)
- Animation transitions (carte supprimée slide out)
- Logos de marque réels (via CDN ou icons)

### Phase 4 - Avancé
- Détection automatique carte expirée + CTA "Mettre à jour"
- Support Apple Pay / Google Pay
- Export PDF des moyens de paiement
- Historique des transactions par carte

---

## 📈 Impact Utilisateur

### Avant
- ❌ Lien mort dans la sidebar
- ❌ Aucun moyen de gérer ses cartes dans l'app
- ❌ Dépendance au Stripe Portal (hors app)

### Après
- ✅ Page dédiée accessible depuis la sidebar
- ✅ Liste des cartes avec détails clairs
- ✅ Actions directes (définir par défaut, supprimer)
- ✅ UX cohérente avec le reste de l'app (même pattern que `/addresses`)

---

## 🔗 Fichiers Modifiés

### Créés
```
components/payment-methods/
├── README.md
├── payment-method-card.tsx
├── payment-method-delete-confirm.tsx
└── payment-methods-list.tsx

app/(authenticated)/payment-methods/
└── page.tsx

app/api/payments/methods/[id]/
└── route.ts (PATCH + DELETE)

docs/PRD/
└── PRD_PAYMENT_METHODS_PAGE.md
```

### Modifiés
```
middleware.ts (ligne 23 - ajout "/payment-methods" dans PROTECTED_ROUTES.auth)
components/layout/dashboard-sidebar.tsx (lignes 245 + 535 - liens sidebar)
```

---

## 🎓 Leçons Apprises

### Architecture
- **Séparation des préoccupations** : Features complexes méritent leur propre page
- **Composants réutilisables** : Modals et cartes peuvent servir ailleurs (ex: checkout)
- **Container/Presentational** : Pattern efficace pour tester et maintenir

### Backend
- **Soft delete > Hard delete** : Traçabilité et possibilité de restauration
- **RLS policies** : Sécurité au niveau base de données = moins de bugs
- **API ownership checks** : Toujours vérifier `user_id` avant toute opération

### UX
- **Empty states** : Guider l'utilisateur quand aucune donnée
- **Loading states** : Toujours afficher un feedback pendant les requêtes
- **Confirmations** : Actions destructives nécessitent un dialog

---

## 🐛 Bugs Connus

- ⚠️ **Bouton "Ajouter une carte" non fonctionnel** : Dialog Stripe pas encore implémenté
- ⚠️ **Soft delete uniquement** : Carte pas réellement détachée de Stripe (ligne commentée)

---

## 📞 Support

En cas de problème avec cette migration :
1. Vérifier les logs console : `[v0]` prefix
2. Checker les RLS policies Supabase
3. Valider env vars : `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Consulter PRD : `docs/PRD/PRD_PAYMENT_METHODS_PAGE.md`

---

**Date de migration** : 6 octobre 2025  
**Statut** : ✅ Partielle (UI + API ready, Stripe integration TODO)  
**Next milestone** : Implémenter dialog ajout carte (Stripe Elements)
