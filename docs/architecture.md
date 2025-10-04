# Architecture Nino Wash

## Vue d'ensemble

Nino Wash est une application web moderne de pressing à domicile construite avec Next.js 14 (App Router), TypeScript, Supabase et Stripe. L'architecture suit les principes de séparation des préoccupations, de modularité et de scalabilité.

## Stack Technique

### Frontend
- **Framework**: Next.js 14.2.25 avec App Router
- **Langage**: TypeScript 5
- **UI**: React 19 + Tailwind CSS 4.1.9 + Shadcn/ui
- **Gestion de formulaires**: React Hook Form 7.60.0 + Zod 3.25.67
- **Icônes**: Lucide React 0.454.0
- **Typographie**: Geist (Inter + Playfair Display)
- **Notifications**: Sonner 1.7.4
- **Graphiques**: Recharts 2.15.4

### Backend
- **Base de données**: PostgreSQL via Supabase 2.58.0
- **Authentification**: Supabase Auth avec @supabase/ssr 0.7.0
- **Paiements**: Stripe 18.5.0
- **API**: Next.js API Routes (App Router)

### DevOps
- **Hébergement**: Vercel
- **Analytics**: Vercel Analytics 1.3.1
- **Tests**: Vitest 3.2.4 + @testing-library/react 16.3.0
- **Performance**: Lighthouse 11.4.0

## Architecture de l'Application

### Structure des Dossiers

\`\`\`
nino-wash/
├── app/                          # Next.js App Router
│   ├── (main)/                   # Groupe de routes principales
│   │   ├── bookings/             # Historique des réservations
│   │   ├── layout.tsx            # Layout principal avec header/footer
│   │   └── page.tsx              # Page d'accueil
│   ├── admin/                    # Interface administrateur
│   │   ├── bookings/             # Gestion des réservations
│   │   ├── layout.tsx            # Layout admin avec sidebar
│   │   └── page.tsx              # Dashboard admin
│   ├── api/                      # API Routes
│   │   ├── addresses/            # Gestion des adresses
│   │   ├── admin/                # Endpoints admin
│   │   ├── auth/                 # Authentification
│   │   ├── bookings/             # Réservations
│   │   ├── health/               # Health checks
│   │   ├── payments/             # Paiements Stripe
│   │   ├── services/             # Services disponibles
│   │   └── subscriptions/        # Abonnements
│   ├── auth/                     # Pages d'authentification
│   │   ├── callback/             # Callback Supabase
│   │   ├── signin/               # Connexion
│   │   └── signup/               # Inscription
│   ├── bookings/                 # Historique utilisateur
│   ├── comment-ca-marche/        # Page informative
│   ├── dashboard/                # Dashboard utilisateur
│   ├── profile/                  # Profil utilisateur
│   ├── reservation/              # Processus de réservation
│   ├── services/                 # Page des services
│   ├── subscription/             # Gestion abonnements
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Styles globaux
├── components/                   # Composants React
│   ├── admin/                    # Composants admin
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   ├── booking/                  # Étapes de réservation
│   │   ├── address-step.tsx
│   │   ├── datetime-step.tsx
│   │   ├── services-step.tsx
│   │   └── summary-step.tsx
│   ├── forms/                    # Formulaires
│   │   ├── address-form.tsx
│   │   ├── auth-form.tsx
│   │   └── profile-form.tsx
│   ├── layout/                   # Composants de layout
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   └── mobile-nav.tsx
│   ├── mobile/                   # Navigation mobile
│   │   └── bottom-nav.tsx
│   ├── sections/                 # Sections de pages
│   │   ├── hero-section.tsx              # Ajout du suffixe -section
│   │   ├── how-it-works-section.tsx      # Ajout du suffixe -section
│   │   ├── services-section.tsx          # Ajout du suffixe -section
│   │   ├── testimonials-section.tsx      # Ajout du suffixe -section
│   │   └── cta-section.tsx               # Ajout du suffixe -section
│   └── ui/                       # Composants UI (shadcn/ui)
├── lib/                          # Utilitaires et configurations
│   ├── hooks/                    # Hooks personnalisés
│   │   ├── use-auth.tsx          # Authentification
│   │   └── use-notifications.tsx # Notifications
│   ├── supabase/                 # Configuration Supabase
│   │   ├── client.ts             # Client browser
│   │   ├── middleware.ts         # Middleware SSR
│   │   └── server.ts             # Client serveur
│   ├── validations/              # Schémas Zod
│   │   ├── auth.ts
│   │   ├── booking.ts
│   │   └── payment.ts
│   ├── monitoring.ts             # Monitoring
│   ├── performance.ts            # Performance
│   ├── security.ts               # Sécurité
│   └── utils.ts                  # Utilitaires
├── scripts/                      # Scripts de maintenance
│   ├── 01-create-database-schema.sql
│   ├── 02-seed-initial-data.sql
│   ├── 03-add-payments-subscriptions.sql
│   ├── migrate.js
│   ├── seed.js
│   ├── backup-database.js
│   └── health-check.js
├── __tests__/                    # Tests unitaires
└── docs/                         # Documentation
\`\`\`

## Patterns Architecturaux

### 1. App Router (Next.js 14)

L'application utilise le nouveau App Router de Next.js avec les conventions suivantes :

#### Route Groups
- `(main)` : Routes publiques avec layout principal (header + footer)
- `admin` : Routes protégées avec layout admin (sidebar + header)

#### Layouts Imbriqués
\`\`\`
app/layout.tsx (Root)
├── app/(main)/layout.tsx (Public)
│   ├── app/(main)/page.tsx (Accueil)
│   └── app/(main)/bookings/page.tsx (Historique)
└── app/admin/layout.tsx (Admin)
    ├── app/admin/page.tsx (Dashboard)
    └── app/admin/bookings/page.tsx (Gestion)
\`\`\`

#### Server Components par Défaut
- Tous les composants sont Server Components sauf indication contraire (`"use client"`)
- Les Server Components sont utilisés pour :
  - Récupération de données côté serveur
  - Accès direct à la base de données
  - SEO et performance

#### Client Components
- Utilisés uniquement quand nécessaire :
  - Interactivité (useState, useEffect)
  - Event handlers
  - Hooks personnalisés (useAuth, useToast)
  - Contextes React

### 2. Authentification (Supabase Auth)

#### Architecture SSR
\`\`\`typescript
#### Architecture SSR

**⚠️ IMPORTANT : Séparation Client/Server Stricte**

Next.js App Router impose une séparation stricte entre Server et Client Components. Les Server Components peuvent utiliser `next/headers` (cookies, headers) mais les Client Components ne le peuvent pas.

```typescript
// ✅ Client Browser (Client Components uniquement)
// Utiliser pour : composants avec "use client", hooks React, interactivité
import { createClient } from "@/lib/supabase/client"

// ✅ Server Components (Server Components uniquement)
// Utiliser pour : pages server, API routes, authentification serveur
import { createClient } from "@/lib/supabase/server"

// ✅ Middleware (Edge Runtime)
// Utiliser pour : protection des routes, session refresh
import { updateSession } from "@/lib/supabase/middleware"
```

**Règles de séparation :**
- ❌ Ne jamais importer `lib/supabase/server.ts` dans un Client Component
- ❌ Ne jamais utiliser `next/headers` dans un Client Component
- ✅ Les Server Components peuvent être async et utiliser await
- ✅ Les Client Components utilisent les hooks React (useState, useEffect, etc.)
\`\`\`

#### Flow d'Authentification

**Architecture Hybride Server/Client**

L'authentification suit un pattern hybride pour maximiser la sécurité et les performances :

1. **Inscription** : `app/auth/signup/page.tsx`
   - Server Component : Vérifie la session existante
   - Client Component (`AuthForm`) : Gère le formulaire interactif
   - Validation Zod côté client et serveur
   - Appel direct à `supabase.auth.signUp()` depuis le client
   - Envoi email de vérification automatique
   - Redirection vers `/auth/callback` après confirmation

2. **Connexion** : `app/auth/signin/page.tsx`
   - Server Component : Vérifie la session existante
   - Client Component (`AuthForm`) : Gère le formulaire interactif
   - Appel direct à `supabase.auth.signInWithPassword()` depuis le client
   - Création de session Supabase avec cookies
   - Redirection vers `/dashboard` après succès

3. **Réservations Invités**
   - Pas de compte requis pour service "classique"
   - `user_id` nullable dans la table `bookings`
   - Email de confirmation envoyé
   - Option de créer un compte après réservation

**Exemple d'implémentation :**
```typescript
// ✅ Bon : Server Component wrapper + Client Component pour l'UI
// app/auth/signin/page.tsx (Server Component)
export default async function SignInPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Redirection si déjà connecté
  if (user) redirect('/dashboard')
  
  // Rend le formulaire client
  return <AuthForm mode="signin" />
}

// components/forms/auth-form.tsx (Client Component)
"use client"
export function AuthForm({ mode }) {
  const supabase = createClient() // Client Supabase
  const handleSubmit = async (data) => {
    const { error } = await supabase.auth.signInWithPassword(data)
    // ...
  }
}
```

#### Protection des Routes

**Architecture Hybride pour les Routes Admin**

Les pages admin utilisent une architecture hybride pour combiner sécurité serveur et interactivité client :

```typescript
// ✅ Pattern Recommandé : Server Component pour auth + Client Component pour UI
// app/admin/page.tsx (Server Component)
import { requireAdmin } from "@/lib/auth/route-guards"
import AdminDashboardClient from "./dashboard-client"

export default async function AdminDashboard() {
  // Vérification serveur (sécurisé, ne peut pas être contournée)
  await requireAdmin()
  
  // Délègue l'UI au composant client
  return <AdminDashboardClient />
}

// app/admin/dashboard-client.tsx (Client Component)
"use client"
export default function AdminDashboardClient() {
  const [stats, setStats] = useState({...})
  useEffect(() => { /* fetch data */ }, [])
  // Toute l'interactivité ici
}
```

**Middleware pour routes protégées :**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Refresh session automatiquement
  await updateSession(request)
  
  // Redirection vers /auth/signin si non authentifié
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    // Vérification de session
  }
}

// Matcher pour routes protégées
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/profile/:path*', '/bookings/:path*']
}
\`\`\`

### 3. Gestion d'État

#### Contextes React
- **AuthProvider** (`lib/hooks/use-auth.tsx`)
  - ⚠️ **Client Component uniquement**
  - Gestion de l'utilisateur connecté
  - Utilise `createClient()` de `@/lib/supabase/client`
  - État : `user`, `loading`, `session`
  - **Ne contient plus** de logique serveur (cookies, headers)
  
**Migration récente :**
```typescript
// ❌ Ancien (causait des erreurs) :
import { clientAuth } from "@/lib/services/auth.service"
await clientAuth.signOut()

// ✅ Nouveau (correct) :
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
await supabase.auth.signOut()
```

#### Hooks Personnalisés
- **useAuth** : Accès au contexte d'authentification
- **useToast** : Notifications toast (Sonner)
- **useNotifications** : Centre de notifications

#### State Management Local
- `useState` pour l'état local des composants
- `useReducer` pour la logique complexe (formulaires multi-étapes)
- Pas de Redux/Zustand (simplicité)

### 4. Validation des Données (Zod)

#### Schémas de Validation
\`\`\`typescript
// lib/validations/booking.ts
export const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  pickupDate: z.date(),
  pickupTimeSlot: z.string(),
  // ...
})

// Utilisation dans les formulaires
const form = useForm<BookingFormData>({
  resolver: zodResolver(bookingSchema)
})
\`\`\`

#### Validation Côté Serveur
\`\`\`typescript
// app/api/bookings/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  const validated = bookingSchema.parse(body) // Throw si invalide
  // ...
}
\`\`\`

### 5. API Routes

#### Structure RESTful
\`\`\`
GET    /api/bookings          # Liste des réservations
POST   /api/bookings          # Créer une réservation
GET    /api/bookings/[id]     # Détails d'une réservation
PATCH  /api/bookings/[id]     # Mettre à jour
DELETE /api/bookings/[id]     # Annuler

GET    /api/services          # Liste des services
GET    /api/subscriptions     # Abonnements utilisateur
POST   /api/payments/methods  # Ajouter un moyen de paiement
\`\`\`

#### Gestion des Erreurs
\`\`\`typescript
try {
  // Logique métier
  return NextResponse.json({ data }, { status: 200 })
} catch (error) {
  console.error('[API Error]', error)
  return NextResponse.json(
    { error: 'Message utilisateur' },
    { status: 500 }
  )
}
\`\`\`

### 6. Base de Données (Supabase/PostgreSQL)

#### Accès Direct (Server Components)
\`\`\`typescript
import { createClient } from "@/lib/supabase/server"

export default async function BookingsPage() {
  const supabase = createClient()
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
  
  return <BookingsList bookings={bookings} />
}
\`\`\`

#### Accès via API (Client Components)
\`\`\`typescript
"use client"

export function BookingForm() {
  const handleSubmit = async (data: BookingFormData) => {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    // ...
  }
}
\`\`\`

#### Row Level Security (RLS)
- Politiques de sécurité au niveau base de données
- Les utilisateurs ne peuvent voir que leurs propres données
- Les admins ont accès complet

### 7. Paiements (Stripe)

#### Intégration
\`\`\`typescript
// app/api/payments/route.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { amount, paymentMethodId } = await request.json()
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    payment_method: paymentMethodId,
    confirm: true
  })
  
  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
\`\`\`

#### Webhooks
\`\`\`typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Mettre à jour le statut de la réservation
      break
    case 'payment_intent.payment_failed':
      // Notifier l'utilisateur
      break
  }
}
\`\`\`

## Flux de Données

### Processus de Réservation

\`\`\`
1. Utilisateur → Page Réservation (/reservation)
   ↓
2. Sélection Service (services-step.tsx)  # Ajout du suffixe -step
   ↓
3. Sélection Date/Heure (datetime-step.tsx)  # Ajout du suffixe -step
   ↓
4. Adresse Collecte/Livraison (address-step.tsx)  # Ajout du suffixe -step
   ↓
5. Récapitulatif (summary-step.tsx)  # Ajout du suffixe -step
   ↓
6. POST /api/bookings
   ↓
7. Création dans Supabase (table bookings)
   ↓
8. Génération numéro de réservation (NW-YYYY-XXXXXX)
   ↓
9. Redirection vers page de paiement
   ↓
10. Stripe Payment Intent
    ↓
11. Webhook Stripe → Mise à jour statut
    ↓
12. Email de confirmation
    ↓
13. Redirection vers page d'accueil avec message de succès
\`\`\`

### Dashboard Admin

\`\`\`
1. Admin → /admin
   ↓
2. Vérification authentification (middleware)
   ↓
3. Vérification rôle admin (Server Component)
   ↓
4. Récupération statistiques (GET /api/admin/stats)
   ↓
5. Affichage KPIs :
   - Revenus du mois
   - Nombre de réservations
   - Nouveaux clients
   - Taux de satisfaction
   ↓
6. Liste des réservations récentes
   ↓
7. Actions possibles :
   - Voir détails
   - Changer statut
   - Assigner chauffeur
   - Annuler
\`\`\`

## Sécurité

### Headers de Sécurité
\`\`\`typescript
// middleware.ts
response.headers.set('X-Frame-Options', 'DENY')
response.headers.set('X-Content-Type-Options', 'nosniff')
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
\`\`\`

### Variables d'Environnement
- Toutes les clés sensibles dans `.env.local`
- Préfixe `NEXT_PUBLIC_` pour les variables client
- Jamais de secrets dans le code

### Validation
- Validation côté client (React Hook Form + Zod)
- Validation côté serveur (API Routes + Zod)
- Sanitization des inputs

### Authentification
- Sessions sécurisées avec JWT (Supabase)
- Refresh tokens automatiques
- Protection CSRF

## Performance

### Optimisations
- **Server Components** : Rendu côté serveur par défaut
- **Code Splitting** : Chargement lazy des composants
- **Image Optimization** : Next.js Image component
- **Caching** : Stratégies de cache Next.js
- **Bundle Analysis** : `npm run build:analyze`

### Monitoring
- Vercel Analytics pour les métriques
- Lighthouse pour les audits
- Health checks (`/api/health`)

## Tests

### Tests Unitaires (Vitest)
\`\`\`bash
npm run test              # Lancer les tests
npm run test:coverage     # Avec couverture
\`\`\`

### Tests de Composants (@testing-library/react)
\`\`\`typescript
// __tests__/components/service-card.test.tsx
import { render, screen } from '@testing-library/react'
import { ServiceCard } from '@/components/ui/service-card'

test('renders service card', () => {
  render(<ServiceCard name="Service Classique" price={3.00} />)
  expect(screen.getByText('Service Classique')).toBeInTheDocument()
})
\`\`\`

### Tests d'API
\`\`\`typescript
// __tests__/api/bookings.test.ts
import { POST } from '@/app/api/bookings/route'

test('creates booking', async () => {
  const request = new Request('http://localhost:3000/api/bookings', {
    method: 'POST',
    body: JSON.stringify({ /* data */ })
  })
  const response = await POST(request)
  expect(response.status).toBe(201)
})
\`\`\`

---

## Patterns Courants et Bonnes Pratiques

### ✅ Pattern : Page Admin Sécurisée avec Interactivité

**Problème :** Les pages admin nécessitent vérification serveur ET interactivité client.

**Solution :**
\`\`\`typescript
// app/admin/ma-page/page.tsx (Server Component)
import { requireAdmin } from "@/lib/auth/route-guards"
import MaPageClient from "./page-client"

export default async function MaPage() {
  // Vérification serveur (sécurisée)
  const { user } = await requireAdmin()
  
  // Fetch données serveur (optionnel)
  const data = await fetchServerData()
  
  // Passe les données au client
  return <MaPageClient user={user} initialData={data} />
}

// app/admin/ma-page/page-client.tsx (Client Component)
"use client"
import { useState, useEffect } from "react"

export default function MaPageClient({ user, initialData }) {
  const [data, setData] = useState(initialData)
  
  useEffect(() => {
    // Logique client
  }, [])
  
  return <div>...</div>
}
\`\`\`

### ✅ Pattern : Formulaire d'Authentification

\`\`\`typescript
// components/forms/auth-form.tsx
"use client"
import { createClient } from "@/lib/supabase/client"

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const supabase = createClient() // Client uniquement
  
  const handleSubmit = async (data) => {
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { first_name: data.firstName, last_name: data.lastName }
        }
      })
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
\`\`\`

### ✅ Pattern : Bouton de Déconnexion

\`\`\`typescript
// components/auth/logout-button.tsx
"use client"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push("/auth/signin")
      router.refresh()
    }
  }
  
  return <Button onClick={handleLogout}>Déconnexion</Button>
}
\`\`\`

### ❌ Pièges à Éviter

#### 1. Mélanger Client et Server dans un même composant
\`\`\`typescript
// ❌ MAUVAIS
"use client"
import { requireAdmin } from "@/lib/auth/route-guards"

export default async function AdminPage() {
  await requireAdmin() // ❌ Erreur : requireAdmin() utilise cookies()
  const [data, setData] = useState() // Hooks React
}

// ✅ BON : Séparer en 2 composants
\`\`\`

#### 2. Importer du code serveur dans un Client Component
\`\`\`typescript
// ❌ MAUVAIS
"use client"
import { createClient } from "@/lib/supabase/server" // ❌ Utilise next/headers

// ✅ BON
"use client"
import { createClient } from "@/lib/supabase/client" // ✅ Client uniquement
\`\`\`

#### 3. Utiliser des services intermédiaires qui mélangent client/server
\`\`\`typescript
// ❌ MAUVAIS : auth.service.ts qui importe server.ts
import { clientAuth } from "@/lib/services/auth.service"

// ✅ BON : Appels directs Supabase
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
\`\`\`

### 🔍 Debugging : Erreurs Courantes

#### Erreur : "You're importing a component that needs next/headers"

**Cause :** Un Client Component importe du code qui utilise `next/headers`.

**Solution :**
1. Vérifier la trace d'import dans l'erreur
2. Identifier le fichier qui importe `next/headers`
3. Remplacer l'import par la version client

**Exemple :**
\`\`\`bash
Import trace:
./lib/supabase/server.ts      ← Utilise next/headers
./lib/services/auth.service.ts ← Importe server.ts
./components/auth/logout-button.tsx ← Client Component

# Solution : logout-button.tsx doit importer @/lib/supabase/client
\`\`\`

#### Erreur : "Function components cannot be given refs"

**Cause :** Composants UI (Input, Textarea) sans `forwardRef` utilisés avec react-hook-form.

**Solution :**
\`\`\`typescript
// ✅ Ajouter forwardRef
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return <input ref={ref} type={type} className={className} {...props} />
  }
)
Input.displayName = "Input"
\`\`\`

---

## Déploiement

### Environnements
- **Development** : `npm run dev` (localhost:3000)
- **Staging** : Déploiement automatique sur push `develop`
- **Production** : Déploiement automatique sur push `main`

### CI/CD (GitHub Actions)
\`\`\`yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: npm run test
      - uses: vercel/action@v1
\`\`\`

### Health Checks
\`\`\`bash
# Vérifier la santé de l'application
npm run health-check

# Endpoints disponibles
GET /api/health          # Santé globale
GET /api/health/db       # Base de données
GET /api/health/auth     # Authentification
GET /api/health/stripe   # Paiements
\`\`\`

## Évolutions Futures

### Fonctionnalités Prévues
1. **Notifications Push** : Service Worker + Web Push API
2. **Chat en Direct** : Support client en temps réel
3. **Application Mobile** : React Native ou PWA améliorée
4. **IA pour Tarification** : Estimation automatique basée sur photos
5. **Système de Fidélité** : Points et récompenses

### Améliorations Techniques
1. **Internationalisation** : Support multi-langues (i18n)
2. **Optimistic Updates** : Mises à jour optimistes pour meilleure UX
3. **Offline Mode** : Fonctionnement hors ligne avec sync
4. **GraphQL** : Migration vers GraphQL pour API plus flexible
5. **Microservices** : Séparation des services (notifications, paiements)

## Ressources

### Documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Stripe Integration](https://stripe.com/docs/payments)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)

### Guides Internes
- [Database Schema](./database-schema-documentation.md)
- [API Integration](./api-integration-guide.md)
- [Routes & Interfaces](./routes-and-interfaces.md)
- [Contribution Guide](./CONTRIBUTING.md)
