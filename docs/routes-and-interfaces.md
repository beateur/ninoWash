# Documentation des Routes et Interfaces - Nino Wash

Cette documentation liste l'ensemble des routes, interfaces et conditions de routage de l'application Nino Wash.

## Table des Matières

1. [Routes Publiques](#routes-publiques)
2. [Routes Protégées (Authentification Requise)](#routes-protégées-authentification-requise)
3. [Routes Admin](#routes-admin)
4. [Routes API](#routes-api)
5. [Routes d'Authentification](#routes-dauthentification)
6. [Conditions de Routage et Redirections](#conditions-de-routage-et-redirections)
7. [Interfaces et Composants UI](#interfaces-et-composants-ui)

---

## Routes Publiques

Ces routes sont accessibles sans authentification.

### Pages Principales

| Route | Fichier | Description | Composants Principaux |
|-------|---------|-------------|----------------------|
| `/` | `app/page.tsx` | Page d'accueil | Hero, Services, HowItWorks, Testimonials, CTA |
| `/services` | `app/services/page.tsx` | Présentation des services et formules | Services, Pricing Cards |
| `/comment-ca-marche` | `app/comment-ca-marche/page.tsx` | Explication du processus | HowItWorks, Process Steps |
| `/reservation` | `app/reservation/page.tsx` | Réservation (invités autorisés pour service classique) | Multi-step booking form |

**Conditions spéciales :**
- `/reservation` : Accessible aux invités uniquement pour le service "classique"
- `/reservation?service=monthly` : Redirige vers `/auth/signin` si non connecté
- `/reservation?service=quarterly` : Redirige vers `/auth/signin` si non connecté

### Layouts

| Layout | Fichier | Description |
|--------|---------|-------------|
| Layout Principal | `app/layout.tsx` | Layout racine avec AuthProvider, ThemeProvider |
| Layout Main | `app/(main)/layout.tsx` | Layout pour les pages principales avec Header et Footer |

---

## Routes Protégées (Authentification Requise)

Ces routes nécessitent une authentification. Redirection vers `/auth/signin` si non connecté.

### Espace Utilisateur

| Route | Fichier | Protection | Description |
|-------|---------|-----------|-------------|
| `/dashboard` | `app/dashboard/page.tsx` | ✅ Server-side | Tableau de bord utilisateur avec statistiques + liste réservations |
| `/profile` | `app/profile/page.tsx` | ✅ Server-side | Profil et paramètres utilisateur |
| `/subscription` | `app/subscription/page.tsx` | ✅ Server-side | Gestion des abonnements |

**Note:** La route `/bookings` a été supprimée. Les réservations sont désormais affichées dans `/dashboard`.

**Méthode de protection :**
\`\`\`typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  redirect("/auth/signin")
}
\`\`\`

**Fallback :** Redirection vers `/auth/signin` avec paramètre `redirectTo` pour retour après connexion

---

## Routes Admin

Ces routes nécessitent une authentification ET le rôle "admin".

### Espace Administration

| Route | Fichier | Protection | Description |
|-------|---------|-----------|-------------|
| `/admin` | `app/admin/page.tsx` (Server) + `app/admin/dashboard-client.tsx` (Client) | ✅ Role-based (Server) | Dashboard admin avec statistiques globales |
| `/admin/bookings` | `app/admin/bookings/page.tsx` | ✅ Role-based | Gestion de toutes les réservations |
| `/database-viewer` | `app/database-viewer/page.tsx` | ⚠️ Dev only | Visualisation de la base de données |

**Layout Admin :** `app/admin/layout.tsx`

**Architecture Hybride Server/Client :**

Les pages admin utilisent un pattern hybride pour la sécurité et l'interactivité :

```typescript
// ✅ Server Component (page.tsx) - Vérifie les permissions
import { requireAdmin } from "@/lib/auth/route-guards"
import AdminDashboardClient from "./dashboard-client"

export default async function AdminDashboard() {
  // Vérification serveur (sécurisée)
  await requireAdmin()
  
  // Rend le composant client
  return <AdminDashboardClient />
}

// ✅ Client Component (dashboard-client.tsx) - UI interactive
"use client"
export default function AdminDashboardClient() {
  // Hooks React, état local, interactivité
  const [stats, setStats] = useState({...})
  useEffect(() => { fetchStats() }, [])
  return <div>...</div>
}
```

**Méthode de protection :**
```typescript
// lib/auth/route-guards.ts (Server-side)
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.user_metadata?.role !== "admin") {
    redirect("/")
  }
  
  return { user }
}
```

**Fallback :** Redirection vers `/` (page d'accueil) si non admin

**Composants spécifiques :**
- `AdminHeader` : En-tête avec recherche et profil admin
- `AdminSidebar` : Navigation latérale admin

---

## Routes API

Toutes les routes API sont préfixées par `/api`.

### API Publiques

| Route | Méthode | Fichier | Description |
|-------|---------|---------|-------------|
| `/api/services` | GET | `app/api/services/route.ts` | Liste des services disponibles |
| `/api/health` | GET | `app/api/health/route.ts` | Health check général |
| `/api/health/db` | GET | `app/api/health/db/route.ts` | Health check base de données |
| `/api/health/auth` | GET | `app/api/health/auth/route.ts` | Health check authentification |
| `/api/health/stripe` | GET | `app/api/health/stripe/route.ts` | Health check Stripe |

### API Protégées (Authentification Requise)

| Route | Méthode | Fichier | Protection | Description |
|-------|---------|---------|-----------|-------------|
| `/api/bookings` | GET, POST | `app/api/bookings/route.ts` | ✅ User auth | Gestion des réservations |
| `/api/addresses` | GET, POST, PUT, DELETE | `app/api/addresses/route.ts` | ✅ User auth | Gestion des adresses |
| `/api/payments/methods` | GET, POST, DELETE | `app/api/payments/methods/route.ts` | ✅ User auth | Méthodes de paiement |
| `/api/subscriptions` | GET, POST, PUT | `app/api/subscriptions/route.ts` | ✅ User auth | Gestion des abonnements |
| `/api/subscriptions/plans` | GET | `app/api/subscriptions/plans/route.ts` | ✅ User auth | Plans d'abonnement |

### API Admin

| Route | Méthode | Fichier | Protection | Description |
|-------|---------|---------|-----------|-------------|
| `/api/admin/stats` | GET | `app/api/admin/stats/route.ts` | ✅ Admin role | Statistiques globales |

**Méthode de protection API :**
\`\`\`typescript
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// Pour les routes admin
if (user.user_metadata?.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
\`\`\`

---

## Routes d'Authentification

### Pages d'Authentification

| Route | Fichier | Description | Accessible |
|-------|---------|-------------|-----------|
| `/auth/signin` | `app/auth/signin/page.tsx` | Connexion | Public |
| `/auth/signup` | `app/auth/signup/page.tsx` | Inscription | Public |
| `/auth/callback` | `app/auth/callback/page.tsx` | Callback OAuth/Email | Public |

### API d'Authentification

| Route | Méthode | Fichier | Description |
|-------|---------|---------|-------------|
| `/api/auth/signin` | POST | `app/api/auth/signin/route.ts` | Connexion utilisateur |
| `/api/auth/signup` | POST | `app/api/auth/signup/route.ts` | Inscription utilisateur |

**Paramètres de redirection :**
- `?redirectTo=/path` : Redirection après connexion réussie
- Exemple : `/auth/signin?redirectTo=/reservation?service=monthly`

---

## Conditions de Routage et Redirections

### Matrice de Protection des Routes

| Route | Non connecté | Utilisateur | Admin | Fallback |
|-------|-------------|-------------|-------|----------|
| `/` | ✅ | ✅ | ✅ | - |
| `/services` | ✅ | ✅ | ✅ | - |
| `/comment-ca-marche` | ✅ | ✅ | ✅ | - |
| `/reservation` (classic) | ✅ | ✅ | ✅ | - |
| `/reservation` (monthly/quarterly) | ❌ | ✅ | ✅ | `/auth/signin` |
| `/dashboard` | ❌ | ✅ | ✅ | `/auth/signin` |
| `/bookings` | ❌ | ✅ | ✅ | `/auth/signin` |
| `/profile` | ❌ | ✅ | ✅ | `/auth/signin` |
| `/subscription` | ❌ | ✅ | ✅ | `/auth/signin` |
| `/admin/*` | ❌ | ❌ | ✅ | `/` |

### Types de Protection

#### 1. Server-Side Protection (Recommandé)
Utilisé pour les pages principales protégées.

\`\`\`typescript
// Dans une Server Component
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  redirect("/auth/signin")
}
\`\`\`

**Avantages :**
- Sécurisé (vérification côté serveur)
- Pas de flash de contenu non autorisé
- SEO-friendly

**Utilisé dans :** `/dashboard`, `/bookings`, `/profile`, `/subscription`

#### 2. Client-Side Protection
Utilisé pour les layouts et pages avec logique conditionnelle complexe.

\`\`\`typescript
// Dans une Client Component
const { user, loading } = useAuth()
const router = useRouter()

useEffect(() => {
  if (!loading && !user) {
    router.push("/auth/signin")
  }
}, [user, loading, router])
\`\`\`

**Avantages :**
- Flexible pour logique conditionnelle
- Permet des états de chargement personnalisés

**Utilisé dans :** `/admin/layout.tsx`, `/reservation` (conditionnel)

#### 3. Role-Based Protection
Utilisé pour les routes admin.

\`\`\`typescript
// Vérification du rôle
if (!user || user.user_metadata?.role !== "admin") {
  router.push("/")
}
\`\`\`

**Utilisé dans :** Toutes les routes `/admin/*`

### Redirections Spéciales

#### Après Authentification
\`\`\`typescript
// Paramètre redirectTo dans l'URL
const redirectTo = searchParams.get("redirectTo") || "/dashboard"
router.push(redirectTo)
\`\`\`

#### Après Réservation
- **Utilisateur connecté** : Redirige vers `/bookings/${bookingId}?success=true`
- **Invité** : Redirige vers `/?booking_success=true&booking_number=${number}`

#### Callback OAuth
\`\`\`typescript
// app/auth/callback/page.tsx
// Gère les callbacks Supabase et redirige vers la destination appropriée
\`\`\`

### Middleware

Le middleware global (`middleware.ts`) applique uniquement des en-têtes de sécurité :

\`\`\`typescript
// Headers de sécurité
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
\`\`\`

**Note :** Le middleware ne gère PAS l'authentification. La protection est gérée au niveau des pages individuelles.

---

## Interfaces et Composants UI

### Architecture des Composants

\`\`\`
components/
├── layout/              # Composants de mise en page
│   ├── header.tsx       # En-tête principal
│   ├── footer.tsx       # Pied de page
│   └── mobile-nav.tsx   # Navigation mobile
├── mobile/              # Composants mobiles
│   └── bottom-nav.tsx   # Navigation inférieure mobile
├── admin/               # Composants admin
│   ├── header.tsx       # En-tête admin
│   └── sidebar.tsx      # Barre latérale admin
├── booking/             # Composants de réservation
│   ├── address-step.tsx
│   ├── services-step.tsx
│   ├── datetime-step.tsx
│   └── summary-step.tsx
├── forms/               # Formulaires
│   ├── auth-form.tsx    # Formulaire d'authentification
│   └── profile-form.tsx # Formulaire de profil
├── sections/            # Sections de page
│   ├── hero.tsx
│   ├── services.tsx
│   ├── how-it-works.tsx
│   └── testimonials.tsx
└── ui/                  # Composants UI de base (shadcn)
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── service-card.tsx
    └── ... (40+ composants)
\`\`\`

### Composants de Layout

#### Header (`components/layout/header.tsx`)
**Props :** Aucune (utilise `useAuth` en interne)

**Fonctionnalités :**
- Logo et navigation principale
- Menu utilisateur (connecté/déconnecté)
- Bouton CTA "Réserver maintenant"
- Navigation responsive avec menu mobile

**Navigation affichée :**
- **Non connecté :** Services, Tarifs, Comment ça marche, À propos, Contact
- **Connecté :** Réserver, Mes réservations, Abonnement, Profil

#### Footer (`components/layout/footer.tsx`)
**Sections :**
- Informations entreprise
- Liens de service
- Contact et réseaux sociaux
- Newsletter

#### MobileNav (`components/layout/mobile-nav.tsx`)
**Props :** Aucune (utilise `useAuth` en interne)

**Fonctionnalités :**
- Drawer de navigation mobile
- Navigation conditionnelle selon statut de connexion
- Boutons d'authentification

#### BottomNav (`components/mobile/bottom-nav.tsx`)
**Props :** Aucune (utilise `useAuth` en interne)

**Navigation fixe mobile :**
- Accueil
- Réserver
- Commandes (protégé)
- Abonnement (protégé)
- Profil (protégé)

### Composants de Réservation

#### AddressStep (`components/booking/address-step.tsx`)
**Props :**
\`\`\`typescript
{
  pickupAddressId: string
  deliveryAddressId: string
  pickupAddress: Address | null
  deliveryAddress: Address | null
  onUpdate: (data: Partial<BookingData>) => void
}
\`\`\`

**Fonctionnalités :**
- Sélection d'adresses existantes
- Création de nouvelles adresses
- Validation des adresses

#### ServicesStep (`components/booking/services-step.tsx`)
**Props :**
\`\`\`typescript
{
  items: BookingItem[]
  onUpdate: (data: Partial<BookingData>) => void
  serviceType: "classic" | "monthly" | "quarterly"
}
\`\`\`

**Fonctionnalités :**
- Recherche de services
- Filtrage par catégorie (nettoyage, repassage, spécial)
- Sélection de quantité
- Calcul du prix total
- Affichage "inclus" pour les abonnements

#### DateTimeStep (`components/booking/datetime-step.tsx`)
**Props :**
\`\`\`typescript
{
  pickupDate: string
  pickupTimeSlot: string
  onUpdate: (data: Partial<BookingData>) => void
}
\`\`\`

**Fonctionnalités :**
- Sélection de date (calendrier)
- Sélection de créneau horaire
- Validation des disponibilités

#### SummaryStep (`components/booking/summary-step.tsx`)
**Props :**
\`\`\`typescript
{
  bookingData: BookingData
  serviceType: "classic" | "monthly" | "quarterly"
}
\`\`\`

**Fonctionnalités :**
- Récapitulatif complet de la réservation
- Confirmation et soumission
- Gestion des erreurs
- Redirection conditionnelle après succès

### Composants de Formulaires

#### AuthForm (`components/forms/auth-form.tsx`)
**Props :**
\`\`\`typescript
{
  mode: "signin" | "signup"
  redirectTo?: string
}
\`\`\`

**Champs :**
- **Connexion :** email, password
- **Inscription :** email, password, firstName, lastName, phone, marketingConsent

**Validation :** Zod schemas (`lib/validations/auth.ts`)

#### ProfileForm (`components/forms/profile-form.tsx`)
**Props :**
\`\`\`typescript
{
  user: User
  profile: UserProfile | null
}
\`\`\`

**Champs :**
- Prénom, nom
- Email (lecture seule)
- Téléphone
- Préférences

### Composants UI Personnalisés

#### ServiceCard (`components/ui/service-card.tsx`)
**Props :**
\`\`\`typescript
{
  service: Service
  quantity: number
  onQuantityChange: (quantity: number) => void
  isSubscription?: boolean
}
\`\`\`

**Affichage :**
- Nom et description du service
- Catégorie (badge coloré)
- Prix ou "Inclus" (abonnements)
- Contrôles de quantité

### Types et Interfaces TypeScript

#### Types d'Authentification (`lib/validations/auth.ts`)
\`\`\`typescript
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().regex(/^[0-9]{10}$/),
  marketingConsent: z.boolean().optional()
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
\`\`\`

#### Types de Réservation (`lib/validations/booking.ts`)
\`\`\`typescript
export const addressInputSchema = z.object({
  type: z.enum(["pickup", "delivery"]),
  label: z.string().optional(),
  streetAddress: z.string().min(5),
  apartment: z.string().optional(),
  city: z.string().min(2),
  postalCode: z.string().regex(/^[0-9]{5}$/),
  instructions: z.string().optional()
})

export const bookingItemSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.number().int().positive(),
  specialInstructions: z.string().optional()
})

export const createBookingSchema = z.object({
  pickupAddressId: z.string().uuid(),
  deliveryAddressId: z.string().uuid(),
  pickupDate: z.string(),
  pickupTimeSlot: z.string(),
  items: z.array(bookingItemSchema).min(1),
  specialInstructions: z.string().optional(),
  // Pour les invités
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  guestFirstName: z.string().optional(),
  guestLastName: z.string().optional()
})

export type AddressInput = z.infer<typeof addressInputSchema>
export type BookingItem = z.infer<typeof bookingItemSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
\`\`\`

#### Types de Paiement (`lib/validations/payment.ts`)
\`\`\`typescript
export const paymentMethodSchema = z.object({
  type: z.enum(["card", "sepa_debit"]),
  provider: z.enum(["stripe"]),
  isDefault: z.boolean().optional()
})

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("eur"),
  paymentMethodId: z.string(),
  bookingId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional()
})

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
\`\`\`

### Hooks Personnalisés

#### useAuth (`lib/hooks/use-auth.tsx`)
\`\`\`typescript
interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

export function useAuth(): AuthContextType
\`\`\`

**Utilisation :**
\`\`\`typescript
const { user, loading, signOut } = useAuth()
\`\`\`

### États de Chargement

Tous les composants de page incluent des états de chargement :

\`\`\`typescript
if (loading) {
  return <LoadingSpinner />
}
\`\`\`

Fichiers de chargement Next.js :
- `app/loading.tsx` : Chargement global
- `app/reservation/loading.tsx` : Chargement réservation
- `app/admin/bookings/loading.tsx` : Chargement admin

---

## Résumé des Patterns de Routage

### Pattern 1 : Routes Publiques Simples
- Pas de protection
- Accessibles à tous
- Exemples : `/`, `/services`, `/comment-ca-marche`

### Pattern 2 : Routes Conditionnellement Protégées
- Protection basée sur des paramètres
- Exemple : `/reservation` (protégé seulement pour abonnements)

### Pattern 3 : Routes Protégées Standard
- Authentification requise
- Redirection vers `/auth/signin`
- Exemples : `/dashboard`, `/bookings`, `/profile`

### Pattern 4 : Routes Protégées par Rôle
- Authentification + rôle spécifique requis
- Redirection vers `/` si non autorisé
- Exemples : `/admin/*`

### Pattern 5 : API Protégées
- Vérification côté serveur
- Retour 401/403 si non autorisé
- Exemples : `/api/bookings`, `/api/admin/*`

---

## Notes Importantes

1. **Middleware** : Le middleware global ne gère PAS l'authentification, seulement les en-têtes de sécurité
2. **Protection Server-Side** : Préférée pour les pages protégées (plus sécurisé)
3. **Protection Client-Side** : Utilisée pour les layouts et logique conditionnelle
4. **Redirections** : Toujours inclure un paramètre `redirectTo` pour retour après connexion
5. **Invités** : Peuvent réserver uniquement le service "classique"
6. **Admin** : Rôle vérifié via `user.user_metadata?.role === "admin"`

---

**Dernière mise à jour :** 29 septembre 2025
**Version :** 1.0.0
