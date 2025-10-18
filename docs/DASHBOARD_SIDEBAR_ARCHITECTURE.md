# Dashboard UI - Architecture Sidebar (Style ChatGPT)

## 🎯 Vue d'ensemble

Refonte complète du dashboard avec une interface moderne inspirée de ChatGPT, featuring:
- Sidebar latérale persistante (desktop)
- Navigation mobile bottom-bar (responsive)
- Liste de réservations sélectionnables
- Panneau de détails avec actions contextuelles

---

## 📁 Structure des fichiers

\`\`\`
app/(authenticated)/
├── layout.tsx                          # Layout avec sidebar (sans header/footer)
└── dashboard/
    └── page.tsx                        # Server Component (data fetching)

components/
├── layout/
│   ├── dashboard-sidebar.tsx          # Sidebar navigation (desktop)
│   └── mobile-auth-nav.tsx            # Bottom navigation (mobile)
├── dashboard/
│   └── dashboard-client.tsx           # Client Component principal
└── booking/
    └── booking-card.tsx               # Card + Detail Panel
\`\`\`

---

## 🎨 Composants créés

### 1. **DashboardSidebar** (`components/layout/dashboard-sidebar.tsx`)

**Type**: Client Component  
**Objectif**: Navigation latérale persistante style ChatGPT

**Features**:
- Logo + Brand en haut
- Bouton "Nouvelle réservation" prominent avec icône `+`
- Navigation principale (Dashboard, Réservations, Abonnement)
- Menu utilisateur en bas avec :
  - Avatar + nom/email
  - Dropdown menu :
    - ✅ Profil
    - ✅ Gérer l'abonnement
    - ✅ Modes de paiement
    - ✅ Mes adresses
    - ✅ Se déconnecter

**Props**:
\`\`\`typescript
interface DashboardSidebarProps {
  user: SupabaseUser            // User Supabase
  hasActiveSubscription?: boolean // Badge abonnement
}
\`\`\`

**Design**:
- Largeur fixe: `w-64` (256px)
- Border right pour séparation
- Items actifs: `bg-primary` + `text-primary-foreground`
- Items inactifs: `text-muted-foreground` + hover

---

### 2. **BookingCard** (`components/booking/booking-card.tsx`)

**Type**: Client Component  
**Objectif**: Afficher une réservation en card cliquable

**Features**:
- Badge de statut coloré
- ID court de la réservation
- Date de création
- Informations collecte (date, horaire, adresse)
- Informations livraison (si applicable)
- Montant total
- Indicateur visuel de sélection (`ring-2 ring-primary`)
- Icône ChevronRight pour indiquer cliquable

**Props**:
\`\`\`typescript
interface BookingCardProps {
  booking: BookingWithAddresses
  isSelected?: boolean
  onClick?: () => void
}
\`\`\`

**Statuts supportés**:
| Status | Label | Couleur |
|--------|-------|---------|
| `pending` | En attente | Gray |
| `confirmed` | Confirmée | Blue |
| `picked_up` | Collectée | Yellow |
| `in_progress` | En cours | Purple |
| `ready` | Prête | Green |
| `delivered` | Livrée | Green (dark) |
| `cancelled` | Annulée | Red |

---

### 3. **BookingDetailPanel** (`components/booking/booking-card.tsx`)

**Type**: Client Component  
**Objectif**: Panneau de détails avec résumé complet et actions

**Features**:
- **Header**:
  - Titre "Détails de la réservation"
  - Badge statut
  - ID complet
  - Bouton fermeture (×)

- **Sections**:
  1. **Informations générales**
     - Date de création
     - Montant total (gros et bold)
  
  2. **Collecte**
     - Date (format: "Lundi 4 octobre 2025")
     - Créneau horaire
     - Adresse complète (dans box grise)
  
  3. **Livraison**
     - Date
     - Créneau
     - Adresse complète

- **Actions**:
  - ✅ Bouton "Signaler un problème" (AlertCircle icon)
  - ✅ Bouton "Modifier les réservations futures" (Edit icon)

**Props**:
\`\`\`typescript
interface BookingDetailPanelProps {
  booking: BookingWithAddresses
  onClose: () => void
}
\`\`\`

**État des formulaires**:
- `showProblemForm`: Placeholder pour signalement
- `showModifyForm`: Placeholder pour modification futures

---

### 4. **DashboardClient** (`components/dashboard/dashboard-client.tsx`)

**Type**: Client Component  
**Objectif**: Interface principale du dashboard avec gestion d'état

**Features**:
- **Layout flex**:
  - Zone principale (flex-1)
  - Panneau détails (400-500px) à droite

- **Header**:
  - Salutation personnalisée ("Bonjour {prénom}")
  - Description

- **Quick Actions**:
  - Bouton "Nouvelle réservation" (taille large)

- **KPIs (3 cards)**:
  1. **Réservations actives**
     - Count des réservations avec statut actif
     - Total des réservations
  
  2. **Adresses enregistrées**
     - Count des adresses
     - Link vers gestion adresses
  
  3. **Prochaine collecte**
     - "Planifiée" ou "Aucune"
     - Date si applicable

- **Liste réservations**:
  - Titre "Mes réservations"
  - Bouton "Voir tout" si > 5 réservations
  - Empty state si aucune réservation
  - Mapping des 5 premières réservations en `BookingCard`

- **Panneau détails**:
  - Affiché quand `selectedBooking` !== null
  - Position: fixe mobile, relative desktop
  - Z-index élevé pour mobile overlay

**Props**:
\`\`\`typescript
interface DashboardClientProps {
  user: User
  bookings: BookingWithAddresses[]
  addressCount: number
  hasActiveSubscription: boolean
}
\`\`\`

**État local**:
\`\`\`typescript
const [selectedBooking, setSelectedBooking] = useState<BookingWithAddresses | null>(null)
\`\`\`

---

## 🔄 Flux de données

### Server → Client

\`\`\`
app/(authenticated)/dashboard/page.tsx (Server Component)
         │
         ├─ requireAuth() → user, supabase
         ├─ Fetch bookings from database
         ├─ Fetch addresses for enrichment
         ├─ Enrich bookings with address data
         ├─ Count user addresses
         ├─ Check active subscription
         │
         └─→ <DashboardClient {...props} />
                    │
                    ├─ KPIs calculation
                    ├─ Bookings list rendering
                    └─ Selection state management
\`\`\`

### User Interaction Flow

\`\`\`
1. User clicks on BookingCard
   └─→ setSelectedBooking(booking)
        └─→ BookingDetailPanel opens (right side)
             │
             ├─ User clicks "Signaler un problème"
             │   └─→ setShowProblemForm(true)
             │        └─→ Problem form displayed
             │
             ├─ User clicks "Modifier réservations futures"
             │   └─→ setShowModifyForm(true)
             │        └─→ Modify form displayed
             │
             └─ User clicks close button
                 └─→ setSelectedBooking(null)
                      └─→ Panel closes
\`\`\`

---

## 🎨 Design System

### Couleurs des statuts

\`\`\`typescript
const statusColors = {
  pending: "bg-gray-100 text-gray-800",
  confirmed: "bg-blue-100 text-blue-800",
  picked_up: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-purple-100 text-purple-800",
  ready: "bg-green-100 text-green-800",
  delivered: "bg-green-600 text-white",
  cancelled: "bg-red-100 text-red-800"
}
\`\`\`

### Spacing

- Sidebar width: `w-64` (256px)
- Panel width: `lg:w-[400px] xl:w-[500px]`
- Padding conteneur: `p-6 lg:p-8`
- Gap entre cards: `space-y-4`
- Gap entre KPIs: `gap-6`

### Responsive

| Breakpoint | Layout |
|------------|--------|
| Mobile (<768px) | Full width + bottom nav + panel overlay |
| Tablet/Desktop (≥768px) | Sidebar + content + panel side-by-side |

---

## 🚀 Features à développer

### Phase 2 (Formulaires)

1. **Signaler un problème**
   \`\`\`typescript
   // components/booking/report-problem-form.tsx
   - Sélection type de problème (dropdown)
   - Description (textarea)
   - Upload photos (optionnel)
   - Bouton submit → API /api/bookings/{id}/report
   \`\`\`

2. **Modifier réservations futures**
   \`\`\`typescript
   // components/booking/modify-future-bookings-form.tsx
   - Explication du changement
   - Nouvelle adresse (sélection)
   - Nouveaux créneaux (si applicable)
   - Confirmation
   - Bouton submit → API /api/bookings/modify-future
   \`\`\`

### Phase 3 (Gestion paiements & adresses)

3. **Page Modes de paiement**
   \`\`\`
   /profile#payment-methods
   - Liste des cartes enregistrées
   - Ajouter nouvelle carte
   - Définir carte par défaut
   - Supprimer carte
   \`\`\`

4. **Page Gestion adresses**
   \`\`\`
   /profile#addresses
   - Liste des adresses
   - Ajouter nouvelle adresse
   - Modifier adresse existante
   - Définir adresse par défaut
   - Supprimer adresse
   \`\`\`

---

## 📊 API Routes nécessaires

\`\`\`typescript
// À créer

POST /api/bookings/[id]/report
  - Body: { type, description, photos? }
  - Return: { success, reportId }

POST /api/bookings/modify-future
  - Body: { bookingId, changes: { address?, timeSlot? } }
  - Return: { success, affectedBookings }

GET /api/payment-methods
  - Return: { methods: PaymentMethod[] }

POST /api/payment-methods
  - Body: { stripePaymentMethodId }
  - Return: { success, methodId }

DELETE /api/payment-methods/[id]
  - Return: { success }
\`\`\`

---

## ✅ Checklist d'implémentation

### Phase 1 - UI Structure ✅
- [x] Créer `DashboardSidebar` component
- [x] Créer `BookingCard` component
- [x] Créer `BookingDetailPanel` component
- [x] Créer `DashboardClient` component
- [x] Mettre à jour `(authenticated)/layout.tsx`
- [x] Mettre à jour `dashboard/page.tsx`
- [x] Tester responsive design
- [x] Commit + push sur `feature/dashboard-sidebar-ui`

### Phase 2 - Formulaires Actions 🔄
- [ ] Créer `ReportProblemForm` component
- [ ] Créer `ModifyFutureBookingsForm` component
- [ ] Créer API route `/api/bookings/[id]/report`
- [ ] Créer API route `/api/bookings/modify-future`
- [ ] Intégrer formulaires dans `BookingDetailPanel`
- [ ] Validation Zod pour les formulaires
- [ ] Gestion erreurs + loading states

### Phase 3 - Gestion Compte 🔜
- [ ] Page `/profile` avec sections
- [ ] Section Modes de paiement
- [ ] Section Gestion adresses
- [ ] Intégration Stripe pour paiements
- [ ] API routes paiements/adresses

---

## 🧪 Tests suggérés

\`\`\`typescript
// Tests à implémenter

describe("DashboardSidebar", () => {
  it("should display user info in bottom menu")
  it("should highlight active navigation item")
  it("should open dropdown menu on avatar click")
  it("should sign out when clicking logout")
})

describe("BookingCard", () => {
  it("should display booking status badge")
  it("should show pickup and delivery info")
  it("should call onClick when clicked")
  it("should show selected state with ring")
})

describe("BookingDetailPanel", () => {
  it("should display full booking details")
  it("should show problem report form")
  it("should show modify future form")
  it("should close when clicking X button")
})

describe("DashboardClient", () => {
  it("should display KPIs correctly")
  it("should render bookings list")
  it("should open detail panel on booking click")
  it("should show empty state when no bookings")
})
\`\`\`

---

## 📝 Notes de développement

### Performance
- **Server Components** pour data fetching (dashboard/page.tsx)
- **Client Components** pour interactivité (sidebar, cards, panels)
- Pagination recommandée si > 50 réservations

### Accessibilité
- Utiliser `aria-label` sur les icônes sans texte
- Keyboard navigation sur les cards
- Focus trap dans les modals/panels
- Screen reader friendly status badges

### Mobile UX
- Panneau détails en overlay fullscreen (mobile)
- Swipe-to-close sur le panneau (feature future)
- Bottom nav persistante
- Touch-friendly tap targets (min 44px)

---

## 🔗 Liens utiles

- [Shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/sidebar)
- [Radix UI Dropdown Menu](https://www.radix-ui.com/docs/primitives/components/dropdown-menu)
- [date-fns Format](https://date-fns.org/docs/format)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Dernière mise à jour**: 4 octobre 2025  
**Branche**: `feature/dashboard-sidebar-ui`  
**Statut**: Phase 1 ✅ Complete | Phase 2 🔄 En cours
