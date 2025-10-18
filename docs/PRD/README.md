# Product Requirements Documents (PRD)

Ce dossier contient tous les Product Requirements Documents du projet ninoWash.

---

## 📂 Structure

\`\`\`
docs/PRD/
├── README.md (ce fichier)
│
├── ✅ ACTIFS - Features à implémenter
│   ├── PRD_BOOKING_CANCELLATION.md
│   ├── PRD_BOOKING_MODIFICATION.md (NOUVEAU)
│   ├── PRD_PROFILE_ADDRESSES.md
│   ├── PRD_PROFILE_PAYMENT_METHODS.md
│   └── PRD_SUBSCRIPTION_CREDITS_SYSTEM.md
│
├── ❌ DEPRECATED - Composants jamais rendus (dead code)
│   ├── AUDIT_MOBILE_NAVIGATION_REDESIGN.md
│   ├── IMPLEMENTATION_MOBILE_NAVIGATION.md
│   └── SUMMARY_MOBILE_NAVIGATION.md
│
└── 📚 GUIDES
    ├── TESTING_GUIDE.md
    └── IMPLEMENTATION_SUMMARY.md
\`\`\`

---

## ✅ PRD Actifs

### 1. PRD_BOOKING_CANCELLATION.md

**Status** : ✅ Implémenté (annulation + signalement)

**Feature** : Annulation et signalement de problème sur réservations

**Implémentation** :
- ✅ API Routes : POST /api/bookings/[id]/cancel, /report
- ✅ Validation : Zod schemas (cancelBookingSchema, reportProblemSchema)
- ✅ Frontend : Composants (CancelBookingForm, ReportProblemForm)
- ✅ Database : Migration appliquée
- ✅ Integration dans booking-card.tsx

**Note** : La partie "modification" a été extraite dans un PRD séparé (voir PRD_BOOKING_MODIFICATION.md)

---

### 2. PRD_BOOKING_MODIFICATION.md ⭐ NOUVEAU

**Status** : ⏳ 10% implémenté - Bouton seulement

**Feature** : Modification de réservations futures (date, créneau, adresses)

**Implémentation Actuelle** :
- ✅ Bouton "Modifier" dans booking-card.tsx
- ✅ Redirection vers `/reservation?modify={bookingId}`
- ✅ Règles métier: canModify (date future + statut pending/confirmed)
- ❌ Parcours de modification (préchargement formulaire)
- ❌ API route PATCH /api/bookings/[id]
- ❌ Validation côté serveur

**Stratégie** : Réutiliser le parcours de réservation existant en mode "modification"
- Server Component détecte `?modify=` et précharge les données
- Client Component reçoit `existingBooking` en props
- Services en read-only (non modifiables)
- PATCH API au lieu de POST

**Estimation** : 3-4 jours développement + 1 jour tests

**Priorité** : 🟡 MEDIUM (améliore UX, évite annulation+recréation)

---

### 3. PRD_PROFILE_ADDRESSES.md

**Status** : 📋 Prêt à implémenter

**Feature** : Gestion des adresses utilisateur (CRUD complet)

**Scope** :
- Frontend : AddressesSection, AddressCard, AddressFormDialog
- Backend : API routes déjà existants (GET/POST/PUT/DELETE /api/addresses)
- Database : Schema déjà existant (table `addresses`)
- Validation : addressSchema (Zod)

**Estimation** : 2-3 jours développement + 1 jour tests

**Priorité** : 🟢 LOW (feature secondaire)

---

### 4. PRD_PROFILE_PAYMENT_METHODS.md

**Status** : 📋 Prêt à implémenter

**Feature** : Gestion des moyens de paiement (cartes bancaires via Stripe)

**Scope** :
- Frontend : PaymentMethodsSection, PaymentMethodCard, AddPaymentMethodDialog
- Backend : API routes à créer (GET/POST/PUT/DELETE /api/payments/methods)
- Database : Migration nécessaire (colonne `stripe_customer_id`)
- Stripe : Intégration Payment Element (@stripe/react-stripe-js)

**Estimation** : 3-4 jours développement + 1 jour tests

**Priorité** : 🟢 LOW (feature secondaire)

---

## ❌ PRD Deprecated (Dead Code)

### Contexte : Mobile Navigation Redesign Error

**Date** : 5 octobre 2025  
**Problème découvert** : Composants implémentés mais **jamais rendus** dans le layout JSX

**Impact** : ~4 heures de développement résultant en 0 fonctionnalité visible pour l'utilisateur

### Root Cause

1. `AuthenticatedHeader` importé dans `app/(authenticated)/layout.tsx` mais **PAS utilisé** dans le JSX return
2. `MobileAuthNav` appelé uniquement par `AuthenticatedHeader` (qui n'était jamais rendu)
3. Aucun test manuel dans le navigateur pour vérifier le rendering
4. Grep incomplet : recherche de `import.*Component` mais pas de `<Component` (JSX usage)

### Leçons Apprises

Voir `docs/DEVELOPMENT_CHECKLIST.md` (10-point error prevention guide)

**Principes clés** :
- ✅ **Import ≠ Utilization** : Grep pour `<ComponentName` pas juste imports
- ✅ **Manual Testing** : 15-20 min browser verification obligatoire
- ✅ **JSX Verification** : Check return() statement, not just imports
- ✅ **Code > Comments** : Documentation peut mentir, le code ne ment jamais

### Vraie Solution

**Règle architecture** : "No Header/Footer When Authenticated"

Pages authentifiées utilisent **UNIQUEMENT** `DashboardSidebar` (desktop + mobile), sans header séparé.

Voir `docs/architecture.md` section "No Header/Footer When Authenticated"

---

### Documents DEPRECATED

#### 1. AUDIT_MOBILE_NAVIGATION_REDESIGN.md ❌

**Status** : DEPRECATED  
**Contenu utile** : Section POSTMORTEM (root cause analysis)  
**Raison deprecation** : AuthenticatedHeader jamais rendu → composants dead code

**À consulter pour** : Analyse d'erreur, timeline, leçons apprises

---

#### 2. IMPLEMENTATION_MOBILE_NAVIGATION.md ❌

**Status** : DEPRECATED  
**Contenu** : Détails implémentation (MobileAuthNav enhancements, Sheet overlay)  
**Raison deprecation** : Code techniquement correct mais jamais exécuté

**À consulter pour** : Pattern Sheet sidebar overlay (peut servir pour DashboardSidebar mobile)

---

#### 3. SUMMARY_MOBILE_NAVIGATION.md ❌

**Status** : DEPRECATED  
**Contenu** : Résumé changements, statistiques, validation  
**Raison deprecation** : Status "TERMINÉ" faux (composants jamais visibles)

**À consulter pour** : Checklist validation (à adapter avec tests manuels)

---

## 📚 Guides

### TESTING_GUIDE.md

Guide complet pour tester les fonctionnalités du projet.

**Sections** :
- Tests unitaires (Vitest + @testing-library/react)
- Tests d'intégration (API routes + Database)
- Tests E2E (user flows critiques)
- Tests manuels (browser verification)

---

### IMPLEMENTATION_SUMMARY.md

Résumé des implémentations récentes et guidelines.

---

## 🎯 Workflow Recommandé

### Pour Créer un Nouveau PRD

1. **Consulter Documentation**
   - `docs/architecture.md` - Patterns architecturaux
   - `docs/DATABASE_SCHEMA.md` - Structure database
   - `docs/api-integration-guide.md` - Patterns API

2. **Créer PRD Complet** (voir `.github/copilot-instructions.md`)
   - Context : Pourquoi cette feature ? User pain point ?
   - Goals : Success criteria end-to-end
   - Scope : Frontend + Backend + Database + DevOps
   - Technical Stack : Components, API routes, migrations, validation
   - Data Flow : Request → Validation → DB → Response → UI
   - Security : Auth, RLS policies, input sanitization
   - Testing : Unit, integration, E2E

3. **Valider Avant Implémentation**
   - Code existant qui peut être réutilisé ?
   - Dépendances à installer ?
   - Conflits avec features existantes ?

4. **Implémenter Couche par Couche**
   - Database (migrations + RLS policies)
   - Validation (Zod schemas)
   - API Routes (backend logic)
   - Frontend (components + UI)
   - Tests (au moins happy path)

5. **Vérifier End-to-End**
   - ✅ Grep JSX usage `grep -r "<ComponentName"`
   - ✅ TypeScript compile `pnpm tsc --noEmit`
   - ✅ Manual browser testing (15-20 min)
   - ✅ Database queries work (Supabase Studio)

### Checklist Validation (CRITIQUE)

Voir `docs/DEVELOPMENT_CHECKLIST.md` pour la checklist complète (10 points)

**Points essentiels** :
1. Grep usage real (pas juste imports)
2. Verify component hierarchy (parent renders child?)
3. Manual browser testing (localhost:3000)
4. JSX vs Imports validation
5. Multi-level grep (imports + JSX + function calls)

---

## 📊 Statistiques PRD

| Métrique | Valeur |
|----------|--------|
| **Total PRD** | 6 |
| **Actifs** | 3 (Booking Cancellation, Addresses, Payment Methods) |
| **Deprecated** | 3 (Mobile Navigation - dead code) |
| **Implémentés** | 0 (Booking Cancellation à 85%) |
| **Prêts à implémenter** | 2 (Addresses, Payment Methods) |

---

## 🚀 Prochaines Features (Roadmap)

### Q4 2025 (Priorités)

1. **Booking Cancellation** 🔴 HIGH - Finir migration DB (15 min)
2. **Mobile Navigation** 🔴 HIGH - DashboardSidebar responsive (4-6h)
3. **Profile Addresses** 🟡 MEDIUM - CRUD addresses (2-3 days)
4. **Payment Methods** 🟡 MEDIUM - Stripe integration (3-4 days)

### Backlog

- Notifications système (emails transactionnels)
- Chat support (Crisp ou Intercom)
- Programme fidélité / parrainage
- Dashboard analytics (graphiques revenus)

---

## 📖 Références

- **Architecture** : `docs/architecture.md`
- **Database Schema** : `docs/DATABASE_SCHEMA.md`
- **API Integration** : `docs/api-integration-guide.md`
- **Development Checklist** : `docs/DEVELOPMENT_CHECKLIST.md`
- **Cleanup Report** : `docs/CLEANUP_NO_HEADER_WHEN_AUTHENTICATED.md`

---

**Dernière mise à jour** : 5 octobre 2025  
**Auteur** : Bilel Hattay + GitHub Copilot
