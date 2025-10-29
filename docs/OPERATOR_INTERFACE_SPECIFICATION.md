# 📋 Spécifications Techniques - Interface Opérateur Pressing

**Version**: 1.0  
**Date**: 29 octobre 2025  
**Projet**: Nino Wash - Interface de Gestion Opérateur  
**Database partagée**: Projet principal Nino Wash

---

## 🚀 Démarrage Rapide (5 min)

**Pour un développeur qui commence de zéro**, voici les commandes essentielles:

```bash
# 1. Créer le projet
npx create-next-app@latest operator-interface --typescript --tailwind --app --no-src-dir
cd operator-interface

# 2. Installer les dépendances
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs date-fns

# 3. Créer .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://slmhuhfunssmwhzajccm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbWh1aGZ1bnNzbXdoemFqY2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzY0MjAsImV4cCI6MjA3NDY1MjQyMH0.ZOIZtN_D7AAmI3EBBPVK7cjppqdZtHCwdvtCkzECKkM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbWh1aGZ1bnNzbXdoemFqY2NtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA3NjQyMCwiZXhwIjoyMDc0NjUyNDIwfQ.0QctkSaCskTNr23Ml_WT-ekpuv0CO8-hxyhl_5pCSEU
EOF

# 4. Créer la structure
mkdir -p components lib app/login

# 5. Démarrer
npm run dev
```

**Ensuite**: Suivre les sections 2 à 9 de ce document pour implémenter l'interface complète.

**Compte opérateur**: À créer dans Supabase Dashboard (voir section 8).

---

## 📖 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Setup Projet de Zéro](#setup-projet-de-zéro)
3. [Configuration Database](#configuration-database)
4. [Schéma de Données](#schéma-de-données)
5. [Spécifications Fonctionnelles](#spécifications-fonctionnelles)
6. [API & Requêtes Database](#api--requêtes-database)
7. [Interface Utilisateur](#interface-utilisateur)
8. [Authentification](#authentification)
9. [Checklist de Développement](#checklist-de-développement)

---

## 1. Vue d'ensemble

### 🎯 Objectif
Créer une interface web minimaliste permettant au gérant du pressing de visualiser et gérer les réservations clients.

### ✅ Fonctionnalités INCLUSES
- Connexion opérateur (email + mot de passe)
- Visualisation des réservations par statut
- Acceptation/refus des réservations "pending"
- Affichage de toutes les informations client et réservation

### ❌ Fonctionnalités EXCLUES
- Déconnexion (pas de bouton logout)
- Page de paramètres/settings
- Modification des informations client
- Création de réservations
- Gestion des utilisateurs
- Notifications push
- Statistiques/analytics

### 🛠️ Stack Technique Recommandée
- **Frontend**: Next.js 14+ (App Router) ou React + Vite
- **Database Client**: Supabase JS Client (`@supabase/supabase-js`)
- **Styling**: Tailwind CSS ou shadcn/ui
- **Forms**: React Hook Form + Zod
- **Date**: date-fns

---

## 2. Setup Projet de Zéro

### 🚀 Création du Projet Next.js

#### Étape 1: Initialiser le projet

```bash
# Créer un nouveau projet Next.js avec TypeScript et Tailwind
npx create-next-app@latest operator-interface --typescript --tailwind --app --no-src-dir

# Naviguer dans le dossier
cd operator-interface
```

**Options sélectionnées lors de la création**:
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ✅ App Router: Yes
- ❌ `src/` directory: No
- ✅ Import alias: Yes (`@/*`)

---

#### Étape 2: Installer les dépendances

```bash
# Supabase client
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Gestion formulaires et validation
npm install react-hook-form zod @hookform/resolvers

# Utilitaires dates
npm install date-fns

# Utilitaires CSS (pour la fonction cn())
npm install clsx tailwind-merge

# UI Components (optionnel - shadcn/ui)
npx shadcn-ui@latest init
# Puis installer les composants nécessaires
npx shadcn-ui@latest add button card badge tabs
```

---

#### Étape 3: Configuration des variables d'environnement

Créer le fichier `.env.local` à la racine du projet:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://slmhuhfunssmwhzajccm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbWh1aGZ1bnNzbXdoemFqY2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzY0MjAsImV4cCI6MjA3NDY1MjQyMH0.ZOIZtN_D7AAmI3EBBPVK7cjppqdZtHCwdvtCkzECKkM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbWh1aGZ1bnNzbXdoemFqY2NtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA3NjQyMCwiZXhwIjoyMDc0NjUyNDIwfQ.0QctkSaCskTNr23Ml_WT-ekpuv0CO8-hxyhl_5pCSEU
```

**⚠️ Important**: Ajouter `.env.local` au `.gitignore` (déjà fait par défaut avec Next.js).

---

#### Étape 4: Structure du projet

Créer l'arborescence suivante:

```
operator-interface/
├── app/
│   ├── layout.tsx          # Layout racine
│   ├── page.tsx            # Dashboard (page principale)
│   ├── login/
│   │   └── page.tsx        # Page de connexion
│   └── globals.css         # Styles globaux
├── components/
│   ├── booking-card.tsx    # Carte réservation
│   └── booking-list.tsx    # Liste réservations
├── lib/
│   ├── supabase.ts         # Client Supabase
│   ├── types.ts            # Types TypeScript
│   └── utils.ts            # Helpers
├── .env.local              # Variables environnement
├── next.config.js          # Config Next.js
├── tsconfig.json           # Config TypeScript
└── package.json
```

Créer les dossiers:

```bash
mkdir -p components lib
```

---

#### Étape 5: Configurer le client Supabase

Créer `lib/supabase.ts`:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client avec SERVICE_ROLE_KEY pour bypasser RLS
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Client pour authentification (côté client avec ANON_KEY)
export const supabaseAuth = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

#### Étape 6: Définir les types TypeScript

Créer `lib/types.ts`:

```typescript
// lib/types.ts
export type BookingStatus = 
  | 'pending' 
  | 'pending_payment' 
  | 'confirmed' 
  | 'collecting'
  | 'in_progress'
  | 'in_transit'
  | 'ready_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'on_hold'
  | 'processing'

export type PaymentStatus = 'pending' | 'succeeded' | 'failed'

export interface Booking {
  id: string
  booking_number: string
  user_id: string | null
  status: BookingStatus
  payment_status: PaymentStatus
  pickup_address_id: string | null
  delivery_address_id: string | null
  pickup_date: string | null
  pickup_time_slot: string | null
  delivery_date: string | null
  delivery_time_slot: string | null
  pickup_slot_id: string | null
  delivery_slot_id: string | null
  total_amount_cents: number
  payment_intent_id: string | null
  stripe_session_id: string | null
  paid_at: string | null
  metadata: {
    is_guest_booking?: boolean
    guest_contact?: {
      first_name: string
      last_name: string
      email: string
      phone: string
    }
    guest_pickup_address?: Address
    guest_delivery_address?: Address
  } | null
  created_at: string
  updated_at: string
  
  // Relations
  pickup_address?: UserAddress
  delivery_address?: UserAddress
  booking_items?: BookingItem[]
  user?: User
}

export interface UserAddress {
  id: string
  user_id: string
  label: string
  street_address: string
  building_info: string | null
  postal_code: string
  city: string
  access_instructions: string | null
  is_default: boolean
}

export interface Address {
  street_address: string
  city: string
  postal_code: string
  building_info?: string
  access_instructions?: string
  label?: string
}

export interface BookingItem {
  id: string
  booking_id: string
  service_id: string
  quantity: number
  unit_price: number
  special_instructions: string | null
  service?: Service
}

export interface Service {
  id: string
  code: string
  name: string
  description: string | null
  base_price: number
  type: 'one_time' | 'subscription'
}

export interface User {
  id: string
  email: string
  raw_user_meta_data: {
    first_name?: string
    last_name?: string
    phone?: string
  }
}
```

---

#### Étape 7: Créer les helpers utilitaires

Créer `lib/utils.ts`:

```typescript
// lib/utils.ts
import { Booking, Address } from './types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getClientInfo(booking: Booking) {
  const isGuest = booking.metadata?.is_guest_booking === true
  
  if (isGuest) {
    return {
      firstName: booking.metadata.guest_contact?.first_name || '',
      lastName: booking.metadata.guest_contact?.last_name || '',
      email: booking.metadata.guest_contact?.email || '',
      phone: booking.metadata.guest_contact?.phone || '',
      source: 'guest' as const
    }
  } else {
    return {
      firstName: booking.user?.raw_user_meta_data?.first_name || '',
      lastName: booking.user?.raw_user_meta_data?.last_name || '',
      email: booking.user?.email || '',
      phone: booking.user?.raw_user_meta_data?.phone || '',
      source: 'auth' as const
    }
  }
}

export function getPickupAddress(booking: Booking): Address | null {
  const isGuest = booking.metadata?.is_guest_booking === true
  
  if (isGuest) {
    return booking.metadata.guest_pickup_address || null
  } else {
    const addr = booking.pickup_address
    if (!addr) return null
    
    return {
      street_address: addr.street_address,
      city: addr.city,
      postal_code: addr.postal_code,
      building_info: addr.building_info || undefined,
      access_instructions: addr.access_instructions || undefined,
      label: addr.label
    }
  }
}

export function getDeliveryAddress(booking: Booking): Address | null {
  const isGuest = booking.metadata?.is_guest_booking === true
  
  if (isGuest) {
    return booking.metadata.guest_delivery_address || null
  } else {
    const addr = booking.delivery_address
    if (!addr) return null
    
    return {
      street_address: addr.street_address,
      city: addr.city,
      postal_code: addr.postal_code,
      building_info: addr.building_info || undefined,
      access_instructions: addr.access_instructions || undefined,
      label: addr.label
    }
  }
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100)
}
```

---

#### Étape 8: Vérifier l'installation

```bash
# Démarrer le serveur de développement
npm run dev

# Ouvrir http://localhost:3000
```

Vous devriez voir la page d'accueil par défaut de Next.js.

---

### ✅ Projet initialisé avec succès !

Vous avez maintenant:
- ✅ Projet Next.js configuré
- ✅ Supabase client initialisé
- ✅ Types TypeScript définis
- ✅ Helpers utilitaires créés
- ✅ Variables d'environnement configurées

**Prochaine étape**: Implémenter l'authentification (voir section 8).

---

## 3. Configuration Database

### 🔌 Connexion à Supabase

#### Informations de Connexion

**⚠️ ATTENTION**: Ces clés sont réelles et actives. Ne pas les partager publiquement.

```env
# .env.local - Configuration complète
NEXT_PUBLIC_SUPABASE_URL=https://slmhuhfunssmwhzajccm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbWh1aGZ1bnNzbXdoemFqY2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzY0MjAsImV4cCI6MjA3NDY1MjQyMH0.ZOIZtN_D7AAmI3EBBPVK7cjppqdZtHCwdvtCkzECKkM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbWh1aGZ1bnNzbXdoemFqY2NtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA3NjQyMCwiZXhwIjoyMDc0NjUyNDIwfQ.0QctkSaCskTNr23Ml_WT-ekpuv0CO8-hxyhl_5pCSEU
```

**Clés fournies**:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`: URL de la database Supabase
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clé publique (client-side)
- ✅ `SUPABASE_SERVICE_ROLE_KEY`: Clé service (server-side, bypass RLS)

**⚠️ Important**: La clé SERVICE_ROLE bypasse toutes les Row Level Security policies. Utilisez-la UNIQUEMENT côté serveur (API routes, Server Components).

#### Installation Supabase Client

```bash
# NPM
npm install @supabase/supabase-js

# PNPM
pnpm add @supabase/supabase-js

# Yarn
yarn add @supabase/supabase-js
```

#### Initialisation du Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Demander à l'admin

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

#### Configuration CLI (optionnelle pour migrations)

```bash
# Installation
npm install -g supabase

# Login
supabase login

# Link au projet
supabase link --project-ref slmhuhfunssmwhzajccm
```

**Project Reference ID**: `slmhuhfunssmwhzajccm`

**Dashboard Supabase**: https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm

---

## 4. Schéma de Données

### 📊 Tables Utilisées

#### Table `bookings`

**Localisation**: `public.bookings`

**Colonnes utilisées**:

| Colonne | Type | Description | Nullable |
|---------|------|-------------|----------|
| `id` | `UUID` | ID unique de la réservation | Non |
| `booking_number` | `VARCHAR(20)` | Numéro de réservation (ex: NW20250129001) | Non |
| `user_id` | `UUID` | ID du client (NULL pour réservations invités) | Oui |
| `status` | `VARCHAR(20)` | Statut de la réservation | Non |
| `payment_status` | `VARCHAR(50)` | Statut du paiement | Non |
| `pickup_address_id` | `UUID` | ID adresse de collecte | Oui |
| `delivery_address_id` | `UUID` | ID adresse de livraison | Oui |
| `pickup_date` | `DATE` | Date de collecte | Oui |
| `pickup_time_slot` | `VARCHAR(20)` | Créneau de collecte | Oui |
| `delivery_date` | `DATE` | Date de livraison | Oui |
| `delivery_time_slot` | `VARCHAR(20)` | Créneau de livraison | Oui |
| `pickup_slot_id` | `UUID` | ID slot logistique collecte (nouveau système) | Oui |
| `delivery_slot_id` | `UUID` | ID slot logistique livraison (nouveau système) | Oui |
| `total_amount_cents` | `INTEGER` | Montant total en centimes | Non |
| `payment_intent_id` | `TEXT` | ID Stripe Payment Intent | Oui |
| `stripe_session_id` | `TEXT` | ID Stripe Checkout Session | Oui |
| `paid_at` | `TIMESTAMPTZ` | Date/heure du paiement | Oui |
| `metadata` | `JSONB` | Données invité et préférences | Oui |
| `created_at` | `TIMESTAMPTZ` | Date de création | Non |
| `updated_at` | `TIMESTAMPTZ` | Date de dernière modification | Non |

**Valeurs ENUM pour `status`**:
- `pending` - En attente de validation opérateur
- `pending_payment` - En attente de paiement client
- `confirmed` - Confirmée et payée
- `collecting` - Collecte en cours
- `in_progress` - En traitement pressing
- `in_transit` - En transit pour livraison
- `ready_for_delivery` - Prêt pour livraison
- `delivered` - Livré au client
- `completed` - Terminé
- `cancelled` - Annulé
- `on_hold` - En attente
- `processing` - En cours de traitement

**Valeurs ENUM pour `payment_status`**:
- `pending` - Paiement en attente
- `succeeded` - Paiement réussi
- `failed` - Paiement échoué

#### Champ `metadata` (JSONB)

**Structure pour réservations invités** (`is_guest_booking: true`):

```typescript
{
  is_guest_booking: boolean,
  guest_contact: {
    first_name: string,
    last_name: string,
    email: string,
    phone: string
  },
  guest_pickup_address: {
    street_address: string,
    city: string,
    postal_code: string,
    building_info?: string,
    access_instructions?: string,
    label: string
  },
  guest_delivery_address: {
    street_address: string,
    city: string,
    postal_code: string,
    building_info?: string,
    access_instructions?: string,
    label: string
  }
}
```

---

#### Table `user_addresses`

**Localisation**: `public.user_addresses`

**Colonnes utilisées**:

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `UUID` | ID unique de l'adresse |
| `user_id` | `UUID` | ID du propriétaire (référence `auth.users`) |
| `label` | `VARCHAR(50)` | Libellé (ex: "Domicile", "Bureau") |
| `street_address` | `VARCHAR(255)` | Adresse complète |
| `building_info` | `VARCHAR(100)` | Bâtiment, étage, porte |
| `postal_code` | `VARCHAR(10)` | Code postal |
| `city` | `VARCHAR(100)` | Ville |
| `access_instructions` | `TEXT` | Instructions d'accès (digicode, etc.) |
| `is_default` | `BOOLEAN` | Adresse par défaut |

---

#### Table `booking_items`

**Localisation**: `public.booking_items`

**Colonnes utilisées**:

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `UUID` | ID unique |
| `booking_id` | `UUID` | ID réservation (FK vers `bookings`) |
| `service_id` | `UUID` | ID du service (FK vers `services`) |
| `quantity` | `INTEGER` | Quantité |
| `unit_price` | `DECIMAL(10,2)` | Prix unitaire |
| `special_instructions` | `TEXT` | Instructions spéciales pour cet item |

---

#### Table `services`

**Localisation**: `public.services`

**Colonnes utilisées**:

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `UUID` | ID unique |
| `code` | `VARCHAR(50)` | Code service (ex: "SHIRT", "DRESS") |
| `name` | `VARCHAR(100)` | Nom du service |
| `description` | `TEXT` | Description |
| `base_price` | `DECIMAL(10,2)` | Prix de base |
| `type` | `VARCHAR(20)` | Type (one_time, subscription) |

---

#### Table `logistic_slots` (optionnelle - nouveau système)

**Localisation**: `public.logistic_slots`

**Colonnes utilisées**:

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `UUID` | ID unique |
| `slot_date` | `DATE` | Date du créneau |
| `time_range` | `VARCHAR(50)` | Plage horaire (ex: "09:00-12:00") |
| `slot_type` | `VARCHAR(20)` | Type (pickup, delivery) |
| `capacity` | `INTEGER` | Capacité totale |
| `booked_count` | `INTEGER` | Nombre de réservations |

---

#### Table `auth.users` (Supabase Auth)

**⚠️ NE PAS MODIFIER** - Table système Supabase

**Colonnes de référence**:

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `UUID` | ID utilisateur |
| `email` | `VARCHAR(255)` | Email |
| `raw_user_meta_data` | `JSONB` | Métadonnées (first_name, last_name, phone) |

---

## 5. Spécifications Fonctionnelles

### 📱 Pages de l'Application

#### Page 1: Login (`/login`)

**Champs**:
- Email (input text)
- Mot de passe (input password)
- Bouton "Se connecter"

**Validation**:
- Email valide requis
- Mot de passe minimum 6 caractères

**Comportement**:
- Authentification via Supabase Auth
- Redirection vers `/` après connexion réussie
- Affichage erreur si échec

---

#### Page 2: Dashboard Réservations (`/`)

**Layout**:

```
┌─────────────────────────────────────────────┐
│  🧺 Nino Wash - Interface Opérateur         │
├─────────────────────────────────────────────┤
│                                             │
│  [Pending] [Pending Payment] [Confirmed]   │
│  [Historique]                               │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 📋 Réservation NW20250129001          │ │
│  │ 👤 Marie Dubois                       │ │
│  │ 📞 06 12 34 56 78                     │ │
│  │ 📅 Collecte: 30/10/2025 09:00-12:00  │ │
│  │ 📍 123 Rue de la Paix, 75001 Paris   │ │
│  │ 💶 45,00 €                            │ │
│  │ [Accepter] [Refuser]                  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 📋 Réservation NW20250129002          │ │
│  │ ...                                   │ │
└─────────────────────────────────────────────┘
```

**Onglets**:

1. **Pending** (En attente)
   - Affiche: `status = 'pending'`
   - Actions: Accepter → `status = 'confirmed'` | Refuser → `status = 'cancelled'`

2. **Pending Payment** (En attente paiement)
   - Affiche: `status = 'pending_payment'`
   - Actions: Aucune (lecture seule)

3. **Confirmed** (Confirmées à venir)
   - Affiche: `status = 'confirmed'` ET `pickup_date >= TODAY`
   - Actions: Aucune (lecture seule)

4. **Historique** (Terminées/annulées)
   - Affiche: `status IN ('completed', 'cancelled', 'delivered')` OU `pickup_date < TODAY`
   - Actions: Aucune (lecture seule)

---

### 📋 Carte de Réservation - Informations Affichées

**En-tête**:
- Numéro de réservation (`booking_number`)
- Badge statut (`status`)
- Badge paiement (`payment_status`)

**Informations Client**:

**Pour utilisateurs authentifiés** (`user_id IS NOT NULL`):
- Nom/Prénom: `auth.users.raw_user_meta_data->>'first_name'` + `last_name`
- Email: `auth.users.email`
- Téléphone: `auth.users.raw_user_meta_data->>'phone'`

**Pour invités** (`metadata->>'is_guest_booking' = 'true'`):
- Nom/Prénom: `metadata->'guest_contact'->>'first_name'` + `last_name`
- Email: `metadata->'guest_contact'->>'email'`
- Téléphone: `metadata->'guest_contact'->>'phone'`

**Collecte**:
- Date: `pickup_date` (format: "30/10/2025")
- Créneau: `pickup_time_slot` (ex: "09:00-12:00") OU récupérer depuis `logistic_slots` via `pickup_slot_id`
- Adresse:
  - **Si user_id**: JOIN `user_addresses` via `pickup_address_id`
  - **Si invité**: `metadata->'guest_pickup_address'`
- Instructions accès:
  - **Si user_id**: `user_addresses.access_instructions`
  - **Si invité**: `metadata->'guest_pickup_address'->>'access_instructions'`

**Livraison**:
- Date: `delivery_date`
- Créneau: `delivery_time_slot` OU `logistic_slots` via `delivery_slot_id`
- Adresse:
  - **Si user_id**: JOIN `user_addresses` via `delivery_address_id`
  - **Si invité**: `metadata->'guest_delivery_address'`

**Services commandés**:
- Liste depuis `booking_items` JOIN `services`
- Format: `quantity x service.name` (Prix unitaire: `unit_price €`)
- Instructions spéciales: `booking_items.special_instructions`

**Montant**:
- Total: `total_amount_cents / 100` (convertir centimes en euros)
- Affichage: "45,00 €"

**Dates**:
- Créée le: `created_at` (format: "29/10/2025 à 14:30")
- Payée le: `paid_at` (si non null)

---

### 🎯 Actions Opérateur

#### Action: Accepter une Réservation

**Conditions**:
- `status = 'pending'` uniquement
- Affiché uniquement sur onglet "Pending"

**Requête SQL**:
```sql
UPDATE bookings
SET 
  status = 'confirmed',
  updated_at = NOW()
WHERE id = '{booking_id}'
  AND status = 'pending'
RETURNING *;
```

**UI**:
- Bouton vert "✅ Accepter"
- Confirmation modal: "Confirmer cette réservation ?"
- Toast success: "Réservation NW20250129001 acceptée"
- Retrait de la carte de l'onglet "Pending"

---

#### Action: Refuser une Réservation

**Conditions**:
- `status = 'pending'` uniquement
- Affiché uniquement sur onglet "Pending"

**Requête SQL**:
```sql
UPDATE bookings
SET 
  status = 'cancelled',
  updated_at = NOW(),
  cancellation_reason = '{raison_operateur}'
WHERE id = '{booking_id}'
  AND status = 'pending'
RETURNING *;
```

**UI**:
- Bouton rouge "❌ Refuser"
- Modal avec textarea: "Raison du refus (optionnelle)"
- Confirmation: "Êtes-vous sûr ?"
- Toast warning: "Réservation NW20250129001 refusée"
- Déplacement vers onglet "Historique"

---

## 6. API & Requêtes Database

### 📡 Requêtes Supabase

#### 1. Récupérer toutes les réservations Pending

```typescript
const { data: pendingBookings, error } = await supabase
  .from('bookings')
  .select(`
    *,
    pickup_address:user_addresses!pickup_address_id(
      street_address,
      city,
      postal_code,
      building_info,
      access_instructions
    ),
    delivery_address:user_addresses!delivery_address_id(
      street_address,
      city,
      postal_code,
      building_info,
      access_instructions
    ),
    booking_items(
      id,
      quantity,
      unit_price,
      special_instructions,
      service:services(
        name,
        code,
        description
      )
    ),
    user:auth.users!user_id(
      id,
      email,
      raw_user_meta_data
    )
  `)
  .eq('status', 'pending')
  .order('created_at', { ascending: false })
```

**⚠️ Note**: Pour accéder à `auth.users`, vous DEVEZ utiliser la SERVICE_ROLE_KEY.

---

#### 2. Récupérer réservations Pending Payment

```typescript
const { data, error } = await supabase
  .from('bookings')
  .select(`
    *,
    pickup_address:user_addresses!pickup_address_id(*),
    delivery_address:user_addresses!delivery_address_id(*),
    booking_items(*, service:services(*)),
    user:auth.users!user_id(*)
  `)
  .eq('status', 'pending_payment')
  .order('created_at', { ascending: false })
```

---

#### 3. Récupérer réservations Confirmées (à venir)

```typescript
const today = new Date().toISOString().split('T')[0]

const { data, error } = await supabase
  .from('bookings')
  .select(`
    *,
    pickup_address:user_addresses!pickup_address_id(*),
    delivery_address:user_addresses!delivery_address_id(*),
    booking_items(*, service:services(*)),
    user:auth.users!user_id(*)
  `)
  .eq('status', 'confirmed')
  .gte('pickup_date', today)
  .order('pickup_date', { ascending: true })
```

---

#### 4. Récupérer Historique

```typescript
const today = new Date().toISOString().split('T')[0]

const { data, error } = await supabase
  .from('bookings')
  .select(`
    *,
    pickup_address:user_addresses!pickup_address_id(*),
    delivery_address:user_addresses!delivery_address_id(*),
    booking_items(*, service:services(*)),
    user:auth.users!user_id(*)
  `)
  .or(`status.in.(completed,cancelled,delivered),pickup_date.lt.${today}`)
  .order('created_at', { ascending: false })
  .limit(50) // Limiter pour performance
```

---

#### 5. Accepter une Réservation

```typescript
const { data, error } = await supabase
  .from('bookings')
  .update({
    status: 'confirmed',
    updated_at: new Date().toISOString()
  })
  .eq('id', bookingId)
  .eq('status', 'pending') // Sécurité: uniquement si encore pending
  .select()
  .single()

if (error) {
  console.error('Erreur acceptation:', error)
  throw new Error(error.message)
}

return data
```

---

#### 6. Refuser une Réservation

```typescript
const { data, error } = await supabase
  .from('bookings')
  .update({
    status: 'cancelled',
    cancellation_reason: reason, // Raison saisie par opérateur
    updated_at: new Date().toISOString()
  })
  .eq('id', bookingId)
  .eq('status', 'pending')
  .select()
  .single()

if (error) {
  console.error('Erreur refus:', error)
  throw new Error(error.message)
}

return data
```

---

### 🔄 Récupération des Informations Client

#### Helper: Extraire les Données Client

```typescript
function getClientInfo(booking: Booking) {
  // Vérifier si c'est un invité
  const isGuest = booking.metadata?.is_guest_booking === true
  
  if (isGuest) {
    return {
      firstName: booking.metadata.guest_contact?.first_name,
      lastName: booking.metadata.guest_contact?.last_name,
      email: booking.metadata.guest_contact?.email,
      phone: booking.metadata.guest_contact?.phone,
      source: 'guest'
    }
  } else {
    // Utilisateur authentifié
    return {
      firstName: booking.user?.raw_user_meta_data?.first_name,
      lastName: booking.user?.raw_user_meta_data?.last_name,
      email: booking.user?.email,
      phone: booking.user?.raw_user_meta_data?.phone,
      source: 'auth'
    }
  }
}
```

---

#### Helper: Extraire Adresse Collecte

```typescript
function getPickupAddress(booking: Booking) {
  const isGuest = booking.metadata?.is_guest_booking === true
  
  if (isGuest) {
    const addr = booking.metadata.guest_pickup_address
    return {
      street: addr?.street_address,
      city: addr?.city,
      postalCode: addr?.postal_code,
      buildingInfo: addr?.building_info,
      accessInstructions: addr?.access_instructions,
      label: addr?.label
    }
  } else {
    const addr = booking.pickup_address
    return {
      street: addr?.street_address,
      city: addr?.city,
      postalCode: addr?.postal_code,
      buildingInfo: addr?.building_info,
      accessInstructions: addr?.access_instructions,
      label: addr?.label
    }
  }
}
```

**Note**: Même structure pour `getDeliveryAddress`

---

## 7. Interface Utilisateur

### 🎨 Composants Recommandés

#### Composant: BookingCard

```tsx
interface BookingCardProps {
  booking: Booking
  onAccept?: (id: string) => void
  onReject?: (id: string, reason: string) => void
  showActions?: boolean
}

function BookingCard({ booking, onAccept, onReject, showActions }: BookingCardProps) {
  const client = getClientInfo(booking)
  const pickupAddr = getPickupAddress(booking)
  const deliveryAddr = getDeliveryAddress(booking)
  
  return (
    <div className="border rounded-lg p-4 shadow">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">📋 {booking.booking_number}</h3>
        <div className="flex gap-2">
          <Badge variant={getStatusVariant(booking.status)}>
            {booking.status}
          </Badge>
          <Badge variant={getPaymentVariant(booking.payment_status)}>
            {booking.payment_status}
          </Badge>
        </div>
      </div>
      
      {/* Client */}
      <div className="space-y-2 mb-4">
        <p className="font-semibold">
          👤 {client.firstName} {client.lastName}
        </p>
        <p className="text-sm text-gray-600">
          📧 {client.email}
        </p>
        <p className="text-sm text-gray-600">
          📞 {client.phone}
        </p>
      </div>
      
      {/* Collecte */}
      <div className="mb-4">
        <p className="font-semibold mb-1">📅 Collecte</p>
        <p className="text-sm">
          {format(new Date(booking.pickup_date), 'dd/MM/yyyy')} • {booking.pickup_time_slot}
        </p>
        <p className="text-sm text-gray-600">
          📍 {pickupAddr.street}, {pickupAddr.postalCode} {pickupAddr.city}
        </p>
        {pickupAddr.accessInstructions && (
          <p className="text-sm text-gray-500 italic">
            ℹ️ {pickupAddr.accessInstructions}
          </p>
        )}
      </div>
      
      {/* Livraison */}
      <div className="mb-4">
        <p className="font-semibold mb-1">🚚 Livraison</p>
        <p className="text-sm">
          {format(new Date(booking.delivery_date), 'dd/MM/yyyy')} • {booking.delivery_time_slot}
        </p>
        <p className="text-sm text-gray-600">
          📍 {deliveryAddr.street}, {deliveryAddr.postalCode} {deliveryAddr.city}
        </p>
      </div>
      
      {/* Services */}
      <div className="mb-4">
        <p className="font-semibold mb-2">🧺 Services</p>
        {booking.booking_items?.map(item => (
          <div key={item.id} className="text-sm flex justify-between">
            <span>{item.quantity}x {item.service.name}</span>
            <span className="text-gray-600">{item.unit_price} €</span>
          </div>
        ))}
      </div>
      
      {/* Total */}
      <div className="border-t pt-3 mb-4">
        <p className="font-bold text-lg">
          💶 Total: {(booking.total_amount_cents / 100).toFixed(2)} €
        </p>
      </div>
      
      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          <button 
            onClick={() => onAccept?.(booking.id)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded"
          >
            ✅ Accepter
          </button>
          <button 
            onClick={() => {
              const reason = prompt('Raison du refus (optionnelle):')
              onReject?.(booking.id, reason || '')
            }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded"
          >
            ❌ Refuser
          </button>
        </div>
      )}
    </div>
  )
}
```

---

#### Composant: BookingList

```tsx
interface BookingListProps {
  bookings: Booking[]
  title: string
  showActions?: boolean
  onAccept?: (id: string) => void
  onReject?: (id: string, reason: string) => void
}

function BookingList({ bookings, title, showActions, onAccept, onReject }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucune réservation dans cette catégorie
      </div>
    )
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map(booking => (
          <BookingCard
            key={booking.id}
            booking={booking}
            showActions={showActions}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  )
}
```

---

### 🖼️ Layout Principal

```tsx
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'pending_payment' | 'confirmed' | 'history'>('pending')
  const [bookings, setBookings] = useState({
    pending: [],
    pendingPayment: [],
    confirmed: [],
    history: []
  })
  
  useEffect(() => {
    loadBookings()
  }, [])
  
  async function loadBookings() {
    // Charger depuis Supabase (voir section 5)
  }
  
  async function handleAccept(bookingId: string) {
    // UPDATE status = 'confirmed'
    // Recharger les données
  }
  
  async function handleReject(bookingId: string, reason: string) {
    // UPDATE status = 'cancelled'
    // Recharger les données
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">🧺 Nino Wash - Interface Opérateur</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          >
            Pending ({bookings.pending.length})
          </button>
          <button
            onClick={() => setActiveTab('pending_payment')}
            className={`px-4 py-2 ${activeTab === 'pending_payment' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          >
            Pending Payment ({bookings.pendingPayment.length})
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-4 py-2 ${activeTab === 'confirmed' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          >
            Confirmed ({bookings.confirmed.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          >
            Historique ({bookings.history.length})
          </button>
        </div>
        
        {/* Content */}
        {activeTab === 'pending' && (
          <BookingList
            bookings={bookings.pending}
            title="Réservations en Attente"
            showActions={true}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        )}
        
        {activeTab === 'pending_payment' && (
          <BookingList
            bookings={bookings.pendingPayment}
            title="En Attente de Paiement"
            showActions={false}
          />
        )}
        
        {activeTab === 'confirmed' && (
          <BookingList
            bookings={bookings.confirmed}
            title="Réservations Confirmées"
            showActions={false}
          />
        )}
        
        {activeTab === 'history' && (
          <BookingList
            bookings={bookings.history}
            title="Historique"
            showActions={false}
          />
        )}
      </main>
    </div>
  )
}
```

---

## 8. Authentification

### 🔐 Configuration Supabase Auth

#### Créer un Utilisateur Opérateur

**IMPORTANT**: Cette étape doit être effectuée AVANT de développer la page login.

**Méthode 1: Via Supabase Dashboard (RECOMMANDÉ)**

1. Aller sur: https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm/auth/users
2. Cliquer sur "Add User" (ou "Invite")
3. Remplir:
   - **Email**: `operateur@ninowash.fr` (ou votre email)
   - **Password**: Créer un mot de passe sécurisé (min. 8 caractères)
   - **Auto Confirm User**: ✅ Cocher (pour éviter la vérification email)
4. Cliquer "Send Magic Link" ou "Create User"
5. Une fois créé, cliquer sur l'utilisateur et aller dans l'onglet "User Metadata"
6. Ajouter (en mode "Raw JSON"):
   ```json
   {
     "role": "operator",
     "first_name": "Opérateur",
     "last_name": "Pressing"
   }
   ```
7. Sauvegarder

**Méthode 2: Via SQL Editor**

1. Aller sur: https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm/sql/new
2. Copier-coller ce SQL:

```sql
-- Créer utilisateur opérateur
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'operateur@ninowash.fr',
  crypt('MotDePasseSecurise123!', gen_salt('bf')),
  NOW(),
  '{"role": "operator", "first_name": "Opérateur", "last_name": "Pressing"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  NOW(),
  NOW(),
  '',
  ''
);
```

3. Remplacer `MotDePasseSecurise123!` par votre mot de passe
4. Cliquer "Run"

**Vérification**:

Retourner sur https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm/auth/users

Vous devriez voir l'utilisateur `operateur@ninowash.fr` dans la liste.

**⚠️ Credentials à retenir**:
- Email: `operateur@ninowash.fr`
- Password: `[VOTRE_MOT_DE_PASSE]`
- Role: `operator` (dans user_metadata)

---

### 🔑 Implémentation Login

#### Page Login

```tsx
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setError(error.message)
        return
      }
      
      // Vérifier que c'est un opérateur
      const userRole = data.user?.user_metadata?.role
      if (userRole !== 'operator') {
        setError('Accès non autorisé')
        await supabase.auth.signOut()
        return
      }
      
      router.push('/')
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🧺 Nino Wash Opérateur
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder="operateur@ninowash.fr"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-semibold disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

#### Middleware de Protection

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Rediriger vers login si pas authentifié
  if (!session && req.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  // Vérifier rôle opérateur
  if (session && req.nextUrl.pathname !== '/login') {
    const userRole = session.user.user_metadata?.role
    if (userRole !== 'operator') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  
  // Si connecté et sur /login, rediriger vers dashboard
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  return res
}

export const config = {
  matcher: ['/', '/login']
}
```

---

## 9. Checklist de Développement

### ✅ Phase 0: Setup Initial (CRITIQUE)

- [ ] Créer projet Next.js: `npx create-next-app@latest operator-interface --typescript --tailwind --app`
- [ ] Installer dépendances: `npm install @supabase/supabase-js @supabase/auth-helpers-nextjs date-fns react-hook-form zod @hookform/resolvers`
- [ ] Créer `.env.local` avec les 3 clés Supabase (voir section 2)
- [ ] Créer structure dossiers: `mkdir -p components lib`
- [ ] Créer `lib/supabase.ts` (client Supabase)
- [ ] Créer `lib/types.ts` (types TypeScript)
- [ ] Créer `lib/utils.ts` (helpers)
- [ ] Tester connexion: `npm run dev` → http://localhost:3000

### ✅ Phase 1: Authentification

- [ ] Créer compte opérateur dans Supabase
- [ ] Implémenter page `/login`
- [ ] Implémenter middleware de protection
- [ ] Tester connexion/déconnexion

### ✅ Phase 2: Dashboard

- [ ] Créer page principale `/`
- [ ] Implémenter système d'onglets
- [ ] Créer composant `BookingCard`
- [ ] Créer composant `BookingList`
- [ ] Tester affichage des données

### ✅ Phase 3: Requêtes Database

- [ ] Implémenter requête "Pending"
- [ ] Implémenter requête "Pending Payment"
- [ ] Implémenter requête "Confirmed"
- [ ] Implémenter requête "Historique"
- [ ] Implémenter helpers `getClientInfo`, `getPickupAddress`, `getDeliveryAddress`
- [ ] Tester avec données réelles

### ✅ Phase 4: Actions Opérateur

- [ ] Implémenter action "Accepter"
- [ ] Implémenter action "Refuser"
- [ ] Ajouter confirmations modales
- [ ] Ajouter toasts de succès/erreur
- [ ] Tester edge cases (réservation déjà traitée, etc.)

### ✅ Phase 5: UI/UX

- [ ] Styliser les cartes de réservation
- [ ] Ajouter badges de statut colorés
- [ ] Ajouter loading states
- [ ] Ajouter empty states
- [ ] Responsive design (mobile/tablette/desktop)
- [ ] Tester accessibilité

### ✅ Phase 6: Tests & Validation

- [ ] Tester avec réservations utilisateurs authentifiés
- [ ] Tester avec réservations invités
- [ ] Tester acceptation/refus
- [ ] Tester navigation entre onglets
- [ ] Tester performance avec beaucoup de données
- [ ] Valider sur différents navigateurs

### ✅ Phase 7: Déploiement

- [ ] Configurer Vercel/Netlify
- [ ] Ajouter variables d'environnement production
- [ ] Déployer
- [ ] Tester en production
- [ ] Former le gérant

---

## 📞 Support & Contacts

### Informations Projet Principal

- **Nom**: Nino Wash
- **Database**: Supabase (Project Ref: `slmhuhfunssmwhzajccm`)
- **Repository**: https://github.com/beateur/ninoWash

### Points de Contact

Pour obtenir:
- `SUPABASE_SERVICE_ROLE_KEY` → Contacter admin projet principal
- Compte opérateur → Demander création dans Supabase Auth
- Questions schema → Consulter `docs/DATABASE_SCHEMA.md` du projet principal
- Problèmes RLS → Vérifier que SERVICE_ROLE_KEY est utilisée

---

## 🔒 Sécurité

### ⚠️ Points d'Attention

1. **SERVICE_ROLE_KEY**:
   - NE JAMAIS commit dans le code
   - Utiliser uniquement côté serveur (API routes ou server components)
   - Permet de bypasser RLS policies

2. **Validation Rôle**:
   - TOUJOURS vérifier `user_metadata.role === 'operator'` après login
   - Implémenter middleware de protection

3. **Actions Destructives**:
   - Ajouter confirmations pour "Refuser"
   - Logger les actions dans une table d'audit (optionnel)

4. **Données Sensibles**:
   - Ne pas logger les données clients en clair
   - Respecter RGPD (ne stocker que le nécessaire)

---

## 📚 Ressources Utiles

### Documentation

- **Supabase JS Client**: https://supabase.com/docs/reference/javascript
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### Exemples Code

```bash
# Projet principal (pour référence schema)
git clone https://github.com/beateur/ninoWash
cd ninoWash
code docs/DATABASE_SCHEMA.md
code lib/types/booking.ts
```

---

**Document créé le**: 29 octobre 2025  
**Dernière mise à jour**: 29 octobre 2025  
**Version**: 1.0  

---

**✅ Ce document contient TOUTES les informations nécessaires pour développer l'interface opérateur de bout en bout sans questions supplémentaires.**
