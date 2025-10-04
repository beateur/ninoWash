# Guide de Contribution - Nino Wash

Merci de votre intérêt pour contribuer à Nino Wash ! Ce guide vous aidera à comprendre nos conventions de code et notre workflow de développement.

> 📚 **Lectures recommandées avant de commencer :**
> - [`QUICK_START.md`](QUICK_START.md) - Installation en 5 minutes
> - [`architecture.md`](architecture.md) - Architecture du projet
> - [`TECHNICAL_CHANGELOG.md`](TECHNICAL_CHANGELOG.md) - Changements récents

---

## Table des Matières

1. [Prérequis](#prérequis)
2. [Architecture Next.js 14](#architecture-nextjs-14)
3. [Conventions de Code](#conventions-de-code)
4. [Structure des Fichiers](#structure-des-fichiers)
5. [Workflow Git](#workflow-git)
6. [Standards de Développement](#standards-de-développement)
7. [Tests](#tests)
8. [Documentation](#documentation)
9. [Revue de Code](#revue-de-code)

---

## Prérequis

### Outils Requis
- **Node.js** 18+ 
- **pnpm** (package manager du projet)
- **Git**
- **VS Code** (recommandé) avec extensions :
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

### Installation pnpm
```bash
npm install -g pnpm
```

### Connaissance Requise
- TypeScript
- React 19
- Next.js 14 App Router
- Supabase (authentification et base de données)

---

## Architecture Next.js 14

### ⚠️ RÈGLE CRITIQUE : Séparation Client/Server

Next.js 14 App Router impose une **séparation stricte** entre Server et Client Components.

#### Server Components (par défaut)
```typescript
// Peuvent utiliser next/headers, cookies, etc.
import { createClient } from "@/lib/supabase/server"

export default async function MyPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('table').select()
  return <div>{data}</div>
}
```

#### Client Components (avec "use client")
```typescript
"use client"
// NE PEUVENT PAS utiliser next/headers
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"

export function MyComponent() {
  const [data, setData] = useState([])
  const supabase = createClient()
  // ...
}
```

### ❌ Ne Jamais Faire
- Importer `@/lib/supabase/server` dans un Client Component
- Utiliser `next/headers` dans un Client Component
- Mélanger `"use client"` + code serveur (cookies, headers)

### ✅ Pattern Recommandé : Pages Admin
```typescript
// app/admin/my-page/page.tsx (Server Component)
import { requireAdmin } from "@/lib/auth/route-guards"
import MyPageClient from "./page-client"

export default async function MyPage() {
  await requireAdmin() // Vérification serveur
  return <MyPageClient />
}

// app/admin/my-page/page-client.tsx (Client Component)
"use client"
export default function MyPageClient() {
  // Hooks React, interactivité
}
```

📖 **Plus de détails :** [`architecture.md`](architecture.md) - Section "Patterns Courants"

--- Conventions de Code

### Nommage

#### Variables et Fonctions
- **camelCase** pour les variables et fonctions
- Noms descriptifs et explicites
- Pas d'abréviations sauf si évidentes

\`\`\`typescript
// BON
const userBookings = []
const fetchUserData = async () => {}
const isAuthenticated = true

// MAUVAIS
const ub = []
const fetchUD = async () => {}
const auth = true
\`\`\`

#### Composants React
- **PascalCase** pour les composants
- Nom du fichier = Nom du composant

\`\`\`typescript
// BON
export function BookingForm() {}
// Fichier: booking-form.tsx

export function ServiceCard() {}
// Fichier: service-card.tsx

// MAUVAIS
export function bookingform() {}
export function servicecard() {}
\`\`\`

#### Fichiers
- **kebab-case** pour tous les fichiers
- Extensions : `.tsx` pour composants React, `.ts` pour utilitaires

\`\`\`
// BON
booking-form.tsx
use-auth.tsx
validation.ts
api-client.ts

// MAUVAIS
BookingForm.tsx
useAuth.tsx
Validation.ts
apiClient.ts
\`\`\`

#### Constantes
- **UPPER_SNAKE_CASE** pour les constantes globales
- **camelCase** pour les constantes locales

\`\`\`typescript
// BON
const MAX_BOOKING_ITEMS = 50
const API_BASE_URL = "https://api.ninowash.fr"

function calculatePrice() {
  const basePrice = 24.99
  const vatRate = 0.20
}

// MAUVAIS
const maxBookingItems = 50
const apiBaseUrl = "https://api.ninowash.fr"
\`\`\`

#### Types et Interfaces
- **PascalCase** pour les types et interfaces
- Préfixe `I` pour les interfaces (optionnel)
- Suffixe descriptif : `Props`, `Input`, `Response`, `Data`

\`\`\`typescript
// BON
interface BookingFormProps {
  onSubmit: (data: BookingData) => void
}

type CreateBookingInput = {
  pickupDate: string
  items: BookingItem[]
}

type ApiResponse<T> = {
  data: T
  error?: string
}

// MAUVAIS
interface bookingformprops {}
type createbookinginput = {}
\`\`\`

### Formatage

#### Indentation
- **2 espaces** (pas de tabs)
- Configuré dans `.editorconfig` et `prettier.config.js`

#### Longueur des Lignes
- Maximum **120 caractères**
- Retour à la ligne pour les longues chaînes

\`\`\`typescript
// BON
const message = 
  "Votre réservation a été confirmée. " +
  "Nous vous contacterons bientôt pour les détails."

// MAUVAIS
const message = "Votre réservation a été confirmée. Nous vous contacterons bientôt pour les détails de la collecte et de la livraison."
\`\`\`

#### Guillemets
- **Doubles guillemets** `"` pour les chaînes
- **Backticks** `` ` `` pour les template strings

\`\`\`typescript
// BON
const name = "Nino Wash"
const greeting = `Bonjour ${name}`

// MAUVAIS
const name = 'Nino Wash'
const greeting = "Bonjour " + name
\`\`\`

#### Point-virgules
- **Toujours** utiliser des point-virgules
- Configuré dans ESLint

\`\`\`typescript
// BON
const user = await getUser();
return user;

// MAUVAIS
const user = await getUser()
return user
\`\`\`

### Organisation des Imports

#### Ordre des Imports
1. Imports React
2. Imports Next.js
3. Imports de bibliothèques tierces
4. Imports de composants locaux
5. Imports d'utilitaires
6. Imports de types
7. Imports de styles

\`\`\`typescript
// BON
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import type { BookingData } from "@/lib/validations/booking"
import "./styles.css"

// MAUVAIS (ordre aléatoire)
import { Button } from "@/components/ui/button"
import { useState } from "react"
import type { BookingData } from "@/lib/validations/booking"
import { z } from "zod"
\`\`\`

#### Alias de Chemin
- Utiliser `@/` pour les imports absolus
- Configuré dans `tsconfig.json`

\`\`\`typescript
// BON
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"

// MAUVAIS
import { Button } from "../../components/ui/button"
import { useAuth } from "../../../lib/hooks/use-auth"
\`\`\`

### Structure des Composants

#### Ordre des Éléments
1. Imports
2. Types/Interfaces
3. Constantes
4. Composant principal
5. Composants auxiliaires (si petits)
6. Export

\`\`\`typescript
// BON
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface BookingFormProps {
  onSubmit: (data: BookingData) => void
  initialValues?: Partial<BookingData>
}

const STEPS = ["Adresses", "Services", "Date", "Récapitulatif"]

export function BookingForm({ onSubmit, initialValues }: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  
  // Logique du composant
  
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

// Composant auxiliaire si nécessaire
function StepIndicator({ step }: { step: number }) {
  return <div>{step}</div>
}
\`\`\`

#### Hooks
- Déclarer tous les hooks au début du composant
- Ordre : useState, useEffect, useRef, hooks personnalisés

\`\`\`typescript
export function BookingForm() {
  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs
  const formRef = useRef<HTMLFormElement>(null)
  
  // Custom hooks
  const { user } = useAuth()
  const router = useRouter()
  
  // Effects
  useEffect(() => {
    // Logic
  }, [])
  
  // Event handlers
  const handleSubmit = async () => {
    // Logic
  }
  
  return (/* JSX */)
}
\`\`\`

#### Props Destructuring
- Toujours destructurer les props dans la signature
- Valeurs par défaut dans la destructuration

\`\`\`typescript
// BON
export function ServiceCard({ 
  service, 
  quantity = 0, 
  onQuantityChange 
}: ServiceCardProps) {
  return <div>{service.name}</div>
}

// MAUVAIS
export function ServiceCard(props: ServiceCardProps) {
  return <div>{props.service.name}</div>
}
\`\`\`

### Gestion d'État

#### useState
- Un état par préoccupation
- Noms descriptifs

\`\`\`typescript
// BON
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [bookings, setBookings] = useState<Booking[]>([])

// MAUVAIS
const [state, setState] = useState({ loading: false, error: null, data: [] })
\`\`\`

#### useEffect
- Un effet par préoccupation
- Toujours spécifier les dépendances
- Cleanup si nécessaire

\`\`\`typescript
// BON
useEffect(() => {
  fetchBookings()
}, [userId])

useEffect(() => {
  const interval = setInterval(() => {
    checkStatus()
  }, 5000)
  
  return () => clearInterval(interval)
}, [bookingId])

// MAUVAIS
useEffect(() => {
  fetchBookings()
  checkStatus()
  updateUI()
}) // Pas de dépendances = exécution à chaque render
\`\`\`

### Gestion des Erreurs

#### Try-Catch
- Toujours wrapper les appels API
- Logs avec préfixe `[v0]` pour le debugging
- Messages d'erreur utilisateur clairs

\`\`\`typescript
// BON
const handleSubmit = async (data: BookingData) => {
  try {
    setIsLoading(true)
    const response = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Erreur lors de la création')
    }
    
    const result = await response.json()
    toast.success('Réservation créée avec succès')
    router.push(`/bookings/${result.booking.id}`)
  } catch (error) {
    console.error('[v0] Booking creation error:', error)
    toast.error('Erreur lors de la création de la réservation')
  } finally {
    setIsLoading(false)
  }
}

// MAUVAIS
const handleSubmit = async (data: BookingData) => {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  const result = await response.json()
  router.push(`/bookings/${result.booking.id}`)
}
\`\`\`

#### Validation
- Validation côté client ET serveur
- Utiliser Zod pour les schémas
- Messages d'erreur en français

\`\`\`typescript
// BON
const bookingSchema = z.object({
  pickupDate: z.string().refine(
    (date) => new Date(date) > new Date(),
    "La date doit être dans le futur"
  ),
  items: z.array(bookingItemSchema).min(1, "Au moins un article requis")
})

// MAUVAIS
const bookingSchema = z.object({
  pickupDate: z.string(), // Pas de validation
  items: z.array(bookingItemSchema) // Pas de minimum
})
\`\`\`

### Styling (Tailwind CSS)

#### Classes Tailwind
- Utiliser les classes utilitaires
- Ordre : layout → spacing → sizing → colors → typography → effects
- Utiliser `cn()` pour les classes conditionnelles

\`\`\`typescript
// BON
<Button 
  className={cn(
    "flex items-center justify-center",
    "px-4 py-2",
    "w-full",
    "bg-primary text-primary-foreground",
    "text-sm font-medium",
    "rounded-lg shadow-sm",
    "hover:bg-primary/90",
    isLoading && "opacity-50 cursor-not-allowed"
  )}
>
  Confirmer
</Button>

// MAUVAIS
<Button className="bg-primary text-sm px-4 hover:bg-primary/90 py-2 rounded-lg w-full">
  Confirmer
</Button>
\`\`\`

#### Responsive Design
- Mobile-first
- Breakpoints : `sm:`, `md:`, `lg:`, `xl:`

\`\`\`typescript
// BON
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// MAUVAIS
<div className="grid grid-cols-3 sm:grid-cols-1">
  {/* Content */}
</div>
\`\`\`

#### Design Tokens
- Utiliser les tokens sémantiques
- Éviter les valeurs arbitraires

\`\`\`typescript
// BON
<div className="bg-background text-foreground border-border">
  <h1 className="text-primary">Titre</h1>
</div>

// MAUVAIS
<div className="bg-white text-black border-gray-200">
  <h1 className="text-blue-600">Titre</h1>
</div>
\`\`\`

## Structure des Fichiers

### Composants

#### Composants UI (shadcn/ui)
- Emplacement : `components/ui/`
- Générés via CLI shadcn
- Ne pas modifier directement (sauf personnalisation nécessaire)

#### Composants Métier
- Emplacement selon la fonctionnalité :
  - `components/booking/` : Réservations
  - `components/forms/` : Formulaires
  - `components/layout/` : Layout (header, footer)
  - `components/sections/` : Sections de pages
  - `components/admin/` : Interface admin

#### Règles
- Un composant par fichier
- Nom du fichier = Nom du composant (kebab-case)
- Export nommé (pas de default export)

\`\`\`typescript
// components/booking/services-step.tsx
export function ServicesStep({ items, onUpdate }: ServicesStepProps) {
  // ...
}
\`\`\`

### Hooks Personnalisés

#### Emplacement
- `lib/hooks/` pour les hooks globaux
- `hooks/` pour les hooks shadcn/ui

#### Nommage
- Préfixe `use-`
- Fichier : `use-auth.tsx`, `use-toast.ts`

\`\`\`typescript
// lib/hooks/use-auth.tsx
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
\`\`\`

### Utilitaires

#### Emplacement
- `lib/utils.ts` : Utilitaires généraux
- `lib/validations/` : Schémas Zod
- `lib/supabase/` : Configuration Supabase

#### Fonctions Utilitaires
- Fonctions pures
- Bien typées
- Testables

\`\`\`typescript
// lib/utils.ts
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long'
  }).format(date)
}
\`\`\`

## Workflow Git

### Branches

#### Branches Principales
- `main` : Production (protégée)
- `develop` : Développement (protégée)

#### Branches de Fonctionnalités
- Format : `feature/nom-de-la-fonctionnalite`
- Exemples :
  - `feature/guest-booking`
  - `feature/subscription-management`
  - `feature/admin-dashboard`

#### Branches de Correction
- Format : `fix/nom-du-bug`
- Exemples :
  - `fix/booking-validation`
  - `fix/payment-error`

#### Branches de Hotfix
- Format : `hotfix/nom-du-probleme`
- Pour corrections urgentes en production

### Commits

#### Format des Messages
\`\`\`
type(scope): description courte

Description détaillée (optionnelle)

Refs: #123
\`\`\`

#### Types
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage (pas de changement de code)
- `refactor`: Refactoring
- `test`: Ajout/modification de tests
- `chore`: Tâches de maintenance

#### Exemples
\`\`\`bash
feat(booking): add guest booking support

Allow users to book without authentication for classic service.
Guest information stored in booking metadata.

Refs: #45

---

fix(validation): correct postal code regex

Fix regex to accept all valid French postal codes.

Refs: #67

---

docs(api): update booking endpoint documentation

Add examples for guest booking requests.
\`\`\`

### Pull Requests

#### Titre
- Format : `[Type] Description courte`
- Exemples :
  - `[Feature] Add guest booking support`
  - `[Fix] Correct booking validation`
  - `[Docs] Update API documentation`

#### Description
\`\`\`markdown
## Description
Brève description des changements

## Type de changement
- [ ] Nouvelle fonctionnalité
- [ ] Correction de bug
- [ ] Documentation
- [ ] Refactoring

## Checklist
- [ ] Code testé localement
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Pas de warnings ESLint
- [ ] Build réussi

## Screenshots (si applicable)
[Ajouter des captures d'écran]

## Références
Closes #123
\`\`\`

#### Revue
- Au moins 1 approbation requise
- Tous les commentaires résolus
- CI/CD passé (tests, lint, build)

## Standards de Développement

### TypeScript

#### Types Stricts
- `strict: true` dans `tsconfig.json`
- Pas de `any` (utiliser `unknown` si nécessaire)
- Typer tous les paramètres et retours de fonction

\`\`\`typescript
// BON
function calculateTotal(items: BookingItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// MAUVAIS
function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.price, 0)
}
\`\`\`

#### Interfaces vs Types
- **Interfaces** pour les objets et classes
- **Types** pour les unions, intersections, utilitaires

\`\`\`typescript
// BON
interface User {
  id: string
  email: string
  role: UserRole
}

type UserRole = "customer" | "admin" | "driver"
type ApiResponse<T> = { data: T } | { error: string }

// MAUVAIS
type User = {
  id: string
  email: string
}

interface UserRole extends String {} // Pas pour les unions
\`\`\`

### API Routes

#### Structure
\`\`\`typescript
// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { bookingSchema } from "@/lib/validations/booking"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Vérification authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }
    
    // Logique métier
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
    
    if (error) {
      console.error('[v0] Bookings fetch error:', error)
      return NextResponse.json(
        { error: "Erreur lors de la récupération" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ bookings: data })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    const validated = bookingSchema.parse(body)
    
    // Logique métier
    // ...
    
    return NextResponse.json({ booking: result }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('[v0] API error:', error)
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    )
  }
}
\`\`\`

#### Codes de Statut HTTP
- `200` : Succès (GET, PATCH)
- `201` : Créé (POST)
- `204` : Pas de contenu (DELETE)
- `400` : Requête invalide
- `401` : Non authentifié
- `403` : Non autorisé
- `404` : Non trouvé
- `500` : Erreur serveur

### Base de Données

#### Requêtes Supabase
- Toujours spécifier les colonnes avec `select()`
- Utiliser les relations pour les jointures
- Gérer les erreurs

\`\`\`typescript
// BON
const { data: bookings, error } = await supabase
  .from('bookings')
  .select(`
    *,
    pickup_address:user_addresses!pickup_address_id(
      street_address,
      city,
      postal_code
    ),
    booking_items(
      quantity,
      service:services(name, base_price)
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

if (error) {
  console.error('[v0] Database error:', error)
  throw new Error('Failed to fetch bookings')
}

// MAUVAIS
const { data } = await supabase
  .from('bookings')
  .select('*') // Pas de relations
// Pas de gestion d'erreur
\`\`\`

#### Transactions
- Utiliser les transactions pour les opérations multiples
- Rollback en cas d'erreur

\`\`\`typescript
// Création de réservation avec articles
const { data: booking, error: bookingError } = await supabase
  .from('bookings')
  .insert(bookingData)
  .select()
  .single()

if (bookingError) {
  throw new Error('Booking creation failed')
}

const { error: itemsError } = await supabase
  .from('booking_items')
  .insert(items.map(item => ({ ...item, booking_id: booking.id })))

if (itemsError) {
  // Rollback : supprimer la réservation
  await supabase.from('bookings').delete().eq('id', booking.id)
  throw new Error('Items creation failed')
}
\`\`\`

## Tests

### Tests Unitaires (Vitest)

#### Structure
\`\`\`typescript
// __tests__/utils/validation.test.ts
import { describe, it, expect } from 'vitest'
import { validatePostalCode } from '@/lib/utils/validation'

describe('validatePostalCode', () => {
  it('accepts valid postal codes', () => {
    expect(validatePostalCode('75001')).toBe(true)
    expect(validatePostalCode('92200')).toBe(true)
  })
  
  it('rejects invalid postal codes', () => {
    expect(validatePostalCode('7500')).toBe(false)
    expect(validatePostalCode('750011')).toBe(false)
    expect(validatePostalCode('ABCDE')).toBe(false)
  })
})
\`\`\`

#### Composants
\`\`\`typescript
// __tests__/components/service-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ServiceCard } from '@/components/ui/service-card'

describe('ServiceCard', () => {
  const mockService = {
    id: '1',
    name: 'Service Classique',
    base_price: 24.99
  }
  
  it('renders service information', () => {
    render(<ServiceCard service={mockService} quantity={0} />)
    
    expect(screen.getByText('Service Classique')).toBeInTheDocument()
    expect(screen.getByText('24,99€')).toBeInTheDocument()
  })
  
  it('calls onQuantityChange when quantity is updated', () => {
    const handleChange = vi.fn()
    render(
      <ServiceCard 
        service={mockService} 
        quantity={0}
        onQuantityChange={handleChange}
      />
    )
    
    const incrementButton = screen.getByRole('button', { name: '+' })
    fireEvent.click(incrementButton)
    
    expect(handleChange).toHaveBeenCalledWith(mockService.id, 1)
  })
})
\`\`\`

### Couverture de Code
- Objectif : 80% minimum
- Commande : `npm run test:coverage`
- Priorité : Logique métier, validations, utilitaires

### Lancer les Tests
\`\`\`bash
# Tous les tests
npm run test

# Mode watch
npm run test:watch

# Avec interface graphique
npm run test:ui

# Avec couverture
npm run test:coverage
\`\`\`

## Documentation

### Code Comments

#### Quand Commenter
- Logique complexe ou non évidente
- Workarounds temporaires
- Décisions architecturales importantes
- TODOs et FIXMEs

\`\`\`typescript
// BON
// Workaround: Supabase ne supporte pas les transactions imbriquées
// TODO: Migrer vers une solution de transaction appropriée
const result = await createBookingWithItems(data)

// Calculate delivery date based on processing time
// Express service: +1 day, Standard: +2 days
const deliveryDate = addDays(pickupDate, isExpress ? 1 : 2)

// MAUVAIS
// Set loading to true
setLoading(true)

// Get user
const user = await getUser()
\`\`\`

#### JSDoc pour Fonctions Publiques
\`\`\`typescript
/**
 * Calcule le prix total d'une réservation
 * 
 * @param items - Liste des articles de la réservation
 * @param options - Options supplémentaires (express, repassage, etc.)
 * @returns Prix total TTC en euros
 * 
 * @example
 * const total = calculateBookingTotal(items, { express: true })
 * // => 29.99
 */
export function calculateBookingTotal(
  items: BookingItem[],
  options?: BookingOptions
): number {
  // Implementation
}
\`\`\`

### Documentation Markdown

#### Fichiers de Documentation
- `README.md` : Vue d'ensemble du projet
- `docs/architecture.md` : Architecture de l'application
- `docs/database-schema-documentation.md` : Schéma de base de données
- `docs/booking-system-workflow.md` : Système de réservation
- `docs/api-integration-guide.md` : Guide d'intégration API
- `docs/CONTRIBUTING.md` : Ce guide

#### Mise à Jour
- Mettre à jour la documentation lors des changements
- Ajouter des exemples de code
- Inclure des diagrammes si nécessaire

## Revue de Code

### Checklist du Reviewer

#### Code Quality
- [ ] Code lisible et bien structuré
- [ ] Nommage cohérent avec les conventions
- [ ] Pas de code dupliqué
- [ ] Gestion d'erreurs appropriée
- [ ] Pas de console.log (sauf debug avec [v0])

#### Fonctionnalité
- [ ] Répond au besoin décrit
- [ ] Pas de régression
- [ ] Edge cases gérés
- [ ] Validation des données

#### Tests
- [ ] Tests unitaires présents
- [ ] Tests passent
- [ ] Couverture suffisante

#### Performance
- [ ] Pas de requêtes N+1
- [ ] Optimisations appropriées
- [ ] Pas de re-renders inutiles

#### Sécurité
- [ ] Validation côté serveur
- [ ] Pas de données sensibles exposées
- [ ] Authentification/autorisation correcte

#### Documentation
- [ ] Code commenté si nécessaire
- [ ] Documentation mise à jour
- [ ] README à jour si applicable

### Feedback Constructif

#### BON
\`\`\`
Suggestion : Pourrait-on extraire cette logique dans une fonction utilitaire ?
Cela améliorerait la réutilisabilité et la testabilité.

Question : Avez-vous considéré le cas où l'utilisateur n'a pas d'adresse ?

Nitpick : Petite typo dans le commentaire ligne 42.
\`\`\`

#### MAUVAIS
\`\`\`
Ce code est mauvais.
Pourquoi avez-vous fait ça ?
Refaites tout.
\`\`\`

## Ressources

### Documentation Externe
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Zod Documentation](https://zod.dev)

### Outils
- **ESLint** : Linting JavaScript/TypeScript
- **Prettier** : Formatage de code
- **Vitest** : Tests unitaires
- **TypeScript** : Vérification de types

### Contact
Pour toute question :
- Ouvrir une issue sur GitHub
- Contacter l'équipe sur Discord
- Email : dev@ninowash.fr

---

Merci de contribuer à Nino Wash ! 🚀
