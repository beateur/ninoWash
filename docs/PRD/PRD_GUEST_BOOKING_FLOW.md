# PRD : Parcours de Réservation Invité (Guest Booking Flow)

**Date** : 9 janvier 2025  
**Auteur** : Product Team  
**Statut** : 🔴 Draft - En attente d'approbation  
**Priority** : P0 - Critical (Core User Journey)

---

## 📋 Table des Matières

1. [Context & Goals](#context--goals)
2. [User Journey](#user-journey)
3. [Technical Scope](#technical-scope)
4. [UI/UX Specifications](#uiux-specifications)
5. [Backend Architecture](#backend-architecture)
6. [Database Schema](#database-schema)
7. [Security & Validation](#security--validation)
8. [Payment Integration](#payment-integration)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)
11. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Context & Goals

### 🎯 Business Context

**Problem Statement:**
- Actuellement, les liens "Réserver maintenant" (10 occurrences dans le parcours marketing) redirigent vers `/reservation`, qui est le parcours authentifié.
- Les utilisateurs non connectés ne peuvent pas réserver facilement → **friction majeure dans le tunnel de conversion**.
- Le parcours authentifié utilise le système de crédits, inadapté pour les invités.

**Solution:**
Créer un **parcours de réservation invité dédié**, complètement séparé du parcours authentifié, avec :
- Collecte des informations contact (étape 0)
- Même UI/UX que le parcours authentifié (4 étapes)
- Paiement Stripe unique (pas de crédits)
- Création automatique du compte après paiement réussi

### 🎯 Success Criteria

**Must Have (P0):**
- [ ] Parcours invité fonctionnel de bout en bout (contact → paiement → compte créé)
- [ ] UI/UX identique au parcours authentifié (composants visuellement similaires)
- [ ] Paiement Stripe intégré et testé
- [ ] Création automatique du compte après paiement
- [ ] Aucune référence au système de crédits dans le code invité
- [ ] Taux de conversion invité → client ≥ 30%

**Should Have (P1):**
- [ ] Gestion des comptes existants (email déjà utilisé)
- [ ] Email de confirmation de réservation
- [ ] Redirection vers dashboard après inscription
- [ ] Analytics sur chaque étape du funnel

**Could Have (P2):**
- [ ] Sauvegarde partielle du panier (localStorage)
- [ ] Possibilité de se connecter en cours de parcours
- [ ] A/B testing sur l'étape contact

**Won't Have (This Iteration):**
- ❌ Système de crédits pour invités
- ❌ Abonnements pour invités (seulement service classique)
- ❌ Modification de réservation pour invités (post-MVP)

---

## 2. User Journey

### 🚀 Main Flow: Guest Booking

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                     PARCOURS INVITÉ (Guest)                      │
└─────────────────────────────────────────────────────────────────┘

[Marketing Page] 
   "Réserver maintenant" (10 points d'entrée)
            ↓
   [/reservation/guest] ← Nouvelle route dédiée
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 0: Contact                                                 │
│ - Email (required, validated)                                    │
│ - Prénom (required, min 2 chars)                                 │
│ - Nom (required, min 2 chars)                                    │
│ - Téléphone (optional, format FR)                                │
│ - Checkbox RGPD (required)                                       │
│                                                                  │
│ Actions:                                                         │
│ - Vérification email (déjà utilisé?)                            │
│ - Sauvegarde dans sessionStorage                                │
│ - Proposition de connexion si compte existe                      │
└──────────────────────────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1: Adresses (Pickup & Delivery)                           │
│ - Même UI que parcours authentifié                              │
│ - Formulaires adresse identiques                                │
│ - Validation code postal (zones couvertes)                      │
│ - Option "même adresse" pour livraison                          │
│                                                                  │
│ Différences:                                                     │
│ - Pas de sauvegarde "Mes adresses"                              │
│ - Adresses stockées temporairement (session)                    │
└──────────────────────────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2: Services (Selection)                                   │
│ - Liste des services disponibles                                │
│ - Sélection quantité par service                                │
│ - Calcul prix en temps réel                                     │
│ - Instructions spéciales (textarea)                             │
│                                                                  │
│ Restrictions:                                                    │
│ - ❌ Pas d'abonnements (seulement service classique)            │
│ - ❌ Pas de calcul de crédits                                   │
│ - ✅ Affichage prix unitaire + total                            │
└──────────────────────────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 3: Date & Heure (Planning)                                │
│ - Calendrier interactif                                         │
│ - Sélection créneau (9h-12h, 14h-17h, 18h-21h)                 │
│ - Validation disponibilité (API)                                │
│ - Affichage délai livraison estimé (72h)                        │
└──────────────────────────────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ ÉTAPE 4: Récapitulatif & Paiement                               │
│                                                                  │
│ Récapitulatif complet:                                          │
│ - Contact (email, nom, prénom)                                  │
│ - Adresses (collecte & livraison)                               │
│ - Services sélectionnés (quantité + prix)                       │
│ - Date/heure de collecte                                        │
│ - Total à payer (€)                                             │
│                                                                  │
│ Paiement Stripe:                                                │
│ - Stripe Payment Element (carte bancaire)                       │
│ - Validation 3D Secure                                          │
│ - Indicateur de chargement                                      │
│                                                                  │
│ Exclusions:                                                      │
│ - ❌ Pas de section "Mes crédits"                               │
│ - ❌ Pas de toggle "Utiliser mes crédits"                       │
│ - ❌ Pas de calcul prorata crédits                              │
└──────────────────────────────────────────────────────────────────┘
            ↓
   [Paiement Stripe Processing]
            ↓
┌──────────────────────────────────────────────────────────────────┐
│ ACTIONS POST-PAIEMENT (Backend Orchestration)                   │
│                                                                  │
│ 1️⃣ Création du compte utilisateur                               │
│    - Email (de l'étape 0)                                       │
│    - Mot de passe générique: généré aléatoirement               │
│    - Email de bienvenue avec lien reset password                │
│    - Gestion cas "email déjà utilisé"                           │
│                                                                  │
│ 2️⃣ Création de la réservation                                   │
│    - user_id (du compte créé)                                   │
│    - pickup/delivery addresses                                  │
│    - items sélectionnés                                         │
│    - pickup_date + pickup_time_slot                             │
│    - status: "pending"                                          │
│    - payment_status: "paid"                                     │
│    - booking_number généré                                      │
│                                                                  │
│ 3️⃣ Enregistrement des adresses                                  │
│    - Sauvegarde dans user_addresses                             │
│    - Association au user_id                                     │
│    - Label auto-généré ("Domicile", "Travail", etc.)           │
│                                                                  │
│ 4️⃣ Enregistrement du paiement                                   │
│    - Stripe payment_intent_id                                   │
│    - Montant payé                                               │
│    - Association à la réservation                               │
└──────────────────────────────────────────────────────────────────┘
            ↓
   [/reservation/success?number=XXX] (Page de confirmation)
            ↓
   [Email de confirmation envoyé]
            ↓
   [Redirection automatique après 5s]
            ↓
   [/auth/signin?email=XXX&new_account=true]
            ↓
   [Connexion avec email de bienvenue]
            ↓
   [/dashboard] (Compte créé, réservation visible)
\`\`\`

### 🔄 Alternative Flows

#### Flow A: Email Already Exists
\`\`\`
[ÉTAPE 0: Contact]
   User entre email existant
            ↓
   [API Check: Email exists]
            ↓
   [Modal: "Un compte existe avec cet email"]
            ↓
   [Se connecter] → /auth/signin?redirect=/reservation
\`\`\`

#### Flow B: Payment Failed
\`\`\`
[ÉTAPE 4: Paiement]
   Stripe payment fails
            ↓
   [Error Message: "Paiement refusé"]
            ↓
   [Bouton: Réessayer]
            ↓
   Reste sur l'étape 4 (données conservées)
\`\`\`

#### Flow C: User Abandons Flow
\`\`\`
[N'importe quelle étape]
   User quitte la page
            ↓
   [SessionStorage conserve les données]
            ↓
   User revient sur /reservation/guest
            ↓
   [Modal: "Reprendre où vous en étiez?"]
            ↓
   Option 2: [Non] → Reset + Étape 0
\`\`\`

---

## 3. Technical Scope

### 📂 File Structure (New Files Only)

\`\`\`
app/
  reservation/
    guest/                          ← Nouvelle route dédiée invités
      page.tsx                      ← Orchestrateur principal (stepper)
      layout.tsx                    ← Layout minimal (pas de sidebar auth)
      
components/
  booking/
    guest/                          ← Composants spécifiques invités
      contact-step.tsx              ← ÉTAPE 0 (nouveau)
      guest-addresses-step.tsx      ← ÉTAPE 1 (copie adaptée)
      guest-services-step.tsx       ← ÉTAPE 2 (sans crédits)
      guest-datetime-step.tsx       ← ÉTAPE 3 (copie adaptée)
      guest-summary-step.tsx        ← ÉTAPE 4 (sans crédits + Stripe)
      guest-stepper.tsx             ← Indicateur de progression
      
lib/
  services/
    guest-booking.ts                ← Service orchestration invité
    guest-payment.ts                ← Gestion paiement Stripe invité
    
  validations/
    guest-contact.ts                ← Zod schema contact
    
  hooks/
    use-guest-booking.ts            ← Hook state management invité
    
app/api/
  bookings/
    guest/
      route.ts                      ← POST /api/bookings/guest (création)
      check-email/
        route.ts                    ← POST /api/bookings/guest/check-email
      create-account/
        route.ts                    ← POST /api/bookings/guest/create-account
\`\`\`

### 🔧 Technology Stack

**Frontend:**
- Next.js 14 App Router (Server Components + Client Components)
- React 19 (useState, useEffect, useCallback)
- TypeScript 5 (strict mode)
- Zod (validation schemas)
- React Hook Form (formulaires)
- Stripe.js + Stripe Elements (paiement)
- Tailwind CSS (styling)
- Shadcn/ui (composants UI)

**Backend:**
- Next.js API Routes (app/api/)
- Supabase Client (database operations)
- Stripe SDK (paiement serveur)
- Zod (validation backend)

**State Management:**
- SessionStorage (persistance temporaire)
- Custom hook `useGuestBooking` (state local)

**Database:**
- Supabase PostgreSQL (existing tables)

---

## 4. UI/UX Specifications

### 🎨 Design Principles

**Parité visuelle avec parcours authentifié:**
- ✅ Mêmes composants UI (Card, Button, Input, Label)
- ✅ Mêmes couleurs, typographies, espacements
- ✅ Même hiérarchie visuelle (titres, sous-titres, descriptions)
- ✅ Mêmes états (loading, error, success, disabled)
- ✅ Mêmes animations de transition entre étapes

**Différences fonctionnelles (non visuelles):**
- ❌ Pas de bannière "Mes crédits" (jamais affichée)
- ❌ Pas de toggle "Utiliser mes crédits"
- ❌ Pas de lien "Mes adresses sauvegardées"
- ❌ Pas de bouton "Modifier la réservation"

### 📱 Responsive Behavior

**Desktop (≥768px):**
- Stepper horizontal en haut (5 étapes)
- Formulaires centrés (max-width: 800px)
- Boutons "Précédent" / "Suivant" en bas

**Mobile (<768px):**
- Stepper vertical compact (icônes + étape actuelle)
- Formulaires pleine largeur (padding 16px)
- Boutons sticky en bas de l'écran

### 🎭 Screens Breakdown

#### Screen 1: ÉTAPE 0 - Contact

**Layout:**
\`\`\`
┌────────────────────────────────────────────────────────┐
│  [Progress: ●○○○○] 1/5 - Vos informations             │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📧 Informations de contact                            │
│                                                        │
│  Email *                                               │
│  [____________________________________]                 │
│                                                        │
│  Prénom *                                              │
│  [____________________________________]                 │
│                                                        │
│  Nom *                                                 │
│  [____________________________________]                 │
│                                                        │
│  Téléphone (optionnel)                                 │
│  [____________________________________]                 │
│                                                        │
│  ☐ J'accepte la politique de confidentialité *        │
│                                                        │
│  ℹ️  Nous créerons un compte pour vous après paiement │
│                                                        │
│                          [Continuer →]                 │
└────────────────────────────────────────────────────────┘
\`\`\`

**Validations:**
- Email: Format valide + vérification unicité (API call)
- Prénom: Min 2 caractères, max 50, lettres + accents uniquement
- Nom: Min 2 caractères, max 50, lettres + accents uniquement
- Téléphone: Format français 0X XX XX XX XX (optionnel)
- RGPD checkbox: Required

**States:**
- Loading: Spinner sur bouton "Continuer"
- Error: Message rouge sous champ invalide
- Success: Transition vers étape 1

#### Screen 2: ÉTAPE 1 - Adresses

**Identical to authenticated flow, but:**
- Pas de dropdown "Mes adresses"
- Formulaire manuel uniquement
- Checkbox "Même adresse pour livraison"

#### Screen 3: ÉTAPE 2 - Services

**Identical to authenticated flow, but:**
- ❌ Pas de bannière crédits
- ❌ Pas de services abonnement (seulement classique)
- ✅ Affichage prix unitaire + total en temps réel

#### Screen 4: ÉTAPE 3 - Date & Heure

**Identical to authenticated flow:**
- Calendrier React Day Picker
- 3 créneaux horaires
- Validation disponibilité

#### Screen 5: ÉTAPE 4 - Récapitulatif & Paiement

**Layout:**
\`\`\`
┌────────────────────────────────────────────────────────┐
│  [Progress: ●●●●●] 5/5 - Confirmation et paiement     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📋 Récapitulatif de votre réservation                 │
│                                                        │
│  👤 Contact                                            │
│     John Doe (john@example.com)                        │
│                                                        │
│  📍 Adresses                                           │
│     Collecte: 123 Rue de Paris, 75001 Paris           │
│     Livraison: 123 Rue de Paris, 75001 Paris          │
│                                                        │
│  🧺 Services (3 articles)                              │
│     2x Chemise (10€) = 20€                            │
│     1x Pantalon (8€) = 8€                             │
│                                                        │
│  📅 Planification                                      │
│     Collecte: Lundi 13 janvier, 9h-12h                │
│     Livraison estimée: Jeudi 16 janvier               │
│                                                        │
│  💳 Paiement                                           │
│  ┌────────────────────────────────────────────┐       │
│  │  [Stripe Payment Element]                  │       │
│  │  Numéro de carte                           │       │
│  │  [____________________________________]     │       │
│  │  MM/AA  CVC                                │       │
│  │  [____]  [____]                            │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  💰 Total: 28,00 €                                    │
│                                                        │
│  [← Retour]              [Payer 28,00 € →]            │
└────────────────────────────────────────────────────────┘
\`\`\`

**Exclusions strictes:**
- ❌ Section "Mes crédits disponibles"
- ❌ Toggle "Utiliser X crédits"
- ❌ Calcul de réduction crédits
- ❌ Message "Il vous reste X crédits"

---

## 5. Backend Architecture

### 🏗️ API Routes Design

#### 1. POST /api/bookings/guest/check-email

**Purpose:** Vérifier si l'email existe déjà

**Request:**
\`\`\`typescript
{
  email: string
}
\`\`\`

**Response:**
\`\`\`typescript
{
  exists: boolean
  suggestLogin?: boolean  // Si compte trouvé
}
\`\`\`

**Logic:**
\`\`\`typescript
1. Validate email format (Zod)
2. Query Supabase: SELECT id FROM auth.users WHERE email = ?
3. Return { exists: true/false }
\`\`\`

---

#### 2. POST /api/bookings/guest

**Purpose:** Créer la réservation invité + compte + adresses

**Request:**
\`\`\`typescript
{
  // Contact (Étape 0)
  guestContact: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  },
  
  // Adresses (Étape 1)
  guestPickupAddress: {
    street_address: string
    city: string
    postal_code: string
    building_info?: string
    access_instructions?: string
    label: string
  },
  guestDeliveryAddress: {
    // Same structure
  },
  
  // Services (Étape 2)
  items: Array<{
    serviceId: string
    quantity: number
    specialInstructions?: string
  }>,
  
  // Planning (Étape 3)
  pickupDate: string  // ISO 8601
  pickupTimeSlot: string  // "09:00-12:00"
  
  // Paiement (Étape 4)
  paymentIntentId: string  // Stripe Payment Intent ID
}
\`\`\`

**Response:**
\`\`\`typescript
{
  success: boolean
  booking: {
    id: string
    booking_number: string
    user_id: string
    status: string
  }
  user: {
    id: string
    email: string
    temporary_password: string  // Pour email de bienvenue
  }
  message: string
}
\`\`\`

**Backend Logic (Orchestration):**

\`\`\`typescript
export async function POST(request: NextRequest) {
  // 1. Validation
  const body = await request.json()
  const validated = guestBookingSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 })
  }

  const { guestContact, guestPickupAddress, guestDeliveryAddress, items, pickupDate, pickupTimeSlot, paymentIntentId } = validated.data

  // 2. Vérifier paiement Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (paymentIntent.status !== "succeeded") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
  }

  // 3. Créer le compte utilisateur (ou récupérer si existe)
  let userId: string
  let isNewUser = false
  
  const { data: existingUser } = await supabase.auth.admin.listUsers()
  const userExists = existingUser?.users.find(u => u.email === guestContact.email)
  
  if (userExists) {
    userId = userExists.id
  } else {
    // Générer mot de passe temporaire sécurisé
    const tempPassword = crypto.randomBytes(16).toString('hex')
    
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: guestContact.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: guestContact.firstName,
        last_name: guestContact.lastName,
        phone: guestContact.phone,
        created_from: "guest_booking"
      }
    })
    
    if (error || !newUser.user) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
    }
    
    userId = newUser.user.id
    isNewUser = true
    
    // Envoyer email de bienvenue avec lien reset password
    await sendWelcomeEmail(guestContact.email, tempPassword)
  }

  // 4. Créer les adresses
  const { data: pickupAddr } = await supabase
    .from('user_addresses')
    .insert({
      user_id: userId,
      ...guestPickupAddress,
      is_default: true
    })
    .select()
    .single()

  const { data: deliveryAddr } = await supabase
    .from('user_addresses')
    .insert({
      user_id: userId,
      ...guestDeliveryAddress,
      is_default: false
    })
    .select()
    .single()

  // 5. Créer la réservation
  const bookingNumber = `NW${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      booking_number: bookingNumber,
      pickup_address_id: pickupAddr.id,
      delivery_address_id: deliveryAddr.id,
      pickup_date: pickupDate,
      pickup_time_slot: pickupTimeSlot,
      status: 'pending',
      payment_status: 'paid',
      total_amount: paymentIntent.amount / 100,  // Stripe uses cents
      created_from: 'guest_flow'
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }

  // 6. Créer les booking_items
  const bookingItems = items.map(item => ({
    booking_id: booking.id,
    service_id: item.serviceId,
    quantity: item.quantity,
    unit_price: 0,  // À calculer depuis services table
    special_instructions: item.specialInstructions
  }))

  await supabase.from('booking_items').insert(bookingItems)

  // 7. Enregistrer le paiement
  await supabase.from('payments').insert({
    user_id: userId,
    booking_id: booking.id,
    stripe_payment_intent_id: paymentIntentId,
    amount: paymentIntent.amount / 100,
    status: 'succeeded',
    payment_method: 'card'
  })

  // 8. Return success
  return NextResponse.json({
    success: true,
    booking: {
      id: booking.id,
      booking_number: booking.booking_number,
      user_id: userId,
      status: booking.status
    },
    user: {
      id: userId,
      email: guestContact.email,
      is_new: isNewUser
    },
    message: isNewUser 
      ? "Compte créé et réservation enregistrée. Consultez vos emails pour définir votre mot de passe."
      : "Réservation enregistrée avec succès."
  })
}
\`\`\`

---

#### 3. POST /api/bookings/guest/create-payment-intent

**Purpose:** Créer un Payment Intent Stripe avant l'étape 4

**Request:**
\`\`\`typescript
{
  items: Array<{ serviceId: string, quantity: number }>,
  metadata: {
    email: string
    flow: "guest"
  }
}
\`\`\`

**Response:**
\`\`\`typescript
{
  clientSecret: string  // Pour Stripe Elements
  amount: number        // Total en cents
}
\`\`\`

---

### 🗄️ Database Operations

**Tables utilisées (existing):**
- `auth.users` (création compte)
- `user_addresses` (sauvegarde adresses)
- `bookings` (réservation)
- `booking_items` (services sélectionnés)
- `payments` (paiement Stripe)

**Pas de nouvelle table nécessaire** ✅

**Colonnes supplémentaires (optionnel):**
\`\`\`sql
-- Migration: Add guest tracking fields
ALTER TABLE bookings
ADD COLUMN created_from VARCHAR(20) DEFAULT 'authenticated';

-- Index pour analytics
CREATE INDEX idx_bookings_created_from ON bookings(created_from);
\`\`\`

---

## 6. Security & Validation

### 🔒 Security Measures

**1. Input Validation (Frontend + Backend):**
- Zod schemas identiques front/back
- Sanitization HTML (XSS prevention)
- Rate limiting sur API routes

**2. RGPD Compliance:**
- Checkbox consentement obligatoire
- Lien vers politique de confidentialité
- Mention "Nous créerons un compte pour vous"
- Email opt-out dans email de bienvenue

**3. Payment Security:**
- Stripe PCI-DSS compliant
- 3D Secure activé
- Pas de stockage carte côté serveur
- Webhook Stripe pour vérification paiement

**4. Account Creation Security:**
- Mot de passe temporaire fort (16 chars aléatoires)
- Email de vérification immédiat
- Lien reset password dans email
- Expiration du lien après 24h

### ✅ Validation Schemas

**Contact Schema (Zod):**
\`\`\`typescript
// lib/validations/guest-contact.ts
import { z } from "zod"

export const guestContactSchema = z.object({
  email: z
    .string()
    .email("Email invalide")
    .min(5, "Email trop court")
    .max(100, "Email trop long")
    .toLowerCase()
    .trim(),
    
  firstName: z
    .string()
    .min(2, "Prénom trop court")
    .max(50, "Prénom trop long")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Caractères invalides")
    .trim(),
    
  lastName: z
    .string()
    .min(2, "Nom trop court")
    .max(50, "Nom trop long")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Caractères invalides")
    .trim(),
    
  phone: z
    .string()
    .regex(/^0[1-9](?:\s?\d{2}){4}$/, "Format: 0X XX XX XX XX")
    .optional()
    .or(z.literal("")),
    
  rgpdConsent: z
    .boolean()
    .refine(val => val === true, "Vous devez accepter la politique de confidentialité")
})

export type GuestContact = z.infer<typeof guestContactSchema>
\`\`\`

**Full Booking Schema:**
\`\`\`typescript
// lib/validations/guest-booking.ts
import { z } from "zod"
import { guestContactSchema } from "./guest-contact"
import { createAddressSchema } from "./address"  // Existing
import { createBookingItemSchema } from "./booking"  // Existing

export const guestBookingSchema = z.object({
  guestContact: guestContactSchema,
  guestPickupAddress: createAddressSchema,
  guestDeliveryAddress: createAddressSchema,
  items: z.array(createBookingItemSchema).min(1, "Sélectionnez au moins un service"),
  pickupDate: z.string().datetime(),
  pickupTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"]),
  paymentIntentId: z.string().min(1)
})
\`\`\`

---

## 7. Payment Integration

### 💳 Stripe Payment Flow

**Step 1: Create Payment Intent (Before Step 4)**
\`\`\`typescript
// When user reaches step 4
const response = await fetch('/api/bookings/guest/create-payment-intent', {
  method: 'POST',
  body: JSON.stringify({
    items: bookingState.items,
    metadata: {
      email: bookingState.contact.email,
      flow: 'guest'
    }
  })
})

const { clientSecret } = await response.json()
\`\`\`

**Step 2: Mount Stripe Elements (Step 4 UI)**
\`\`\`typescript
// components/booking/guest/guest-summary-step.tsx
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function GuestSummaryStep({ bookingData, onComplete }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    // Create Payment Intent
    createPaymentIntent().then(setClientSecret)
  }, [])

  if (!clientSecret) return <LoadingSpinner />

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm bookingData={bookingData} onComplete={onComplete} />
    </Elements>
  )
}

function CheckoutForm({ bookingData, onComplete }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return
    
    setIsProcessing(true)

    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required'
    })

    if (error) {
      toast.error(error.message)
      setIsProcessing(false)
      return
    }

    if (paymentIntent.status === 'succeeded') {
      // Call backend to create booking + account
      const result = await fetch('/api/bookings/guest', {
        method: 'POST',
        body: JSON.stringify({
          ...bookingData,
          paymentIntentId: paymentIntent.id
        })
      })

      const data = await result.json()
      
      if (data.success) {
        onComplete(data.booking.booking_number)
      }
    }

    setIsProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isProcessing}>
        {isProcessing ? "Traitement..." : `Payer ${totalAmount}€`}
      </Button>
    </form>
  )
}
\`\`\`

**Step 3: Webhook Verification (Security)**
\`\`\`typescript
// app/api/webhooks/stripe/route.ts (existing, enhance)
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()

  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object

    // Verify booking was created
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('payment_intent_id', paymentIntent.id)
      .single()

    if (!booking) {
      console.error('[Stripe Webhook] Booking not found for payment:', paymentIntent.id)
    }
  }

  return NextResponse.json({ received: true })
}
\`\`\`

---

## 8. Error Handling

### 🚨 Error Scenarios & Recovery

**1. Email Already Exists (Step 0)**
\`\`\`
Error: "Un compte existe déjà avec cet email"
Recovery: 
  - Bouton "Se connecter" → /auth/signin?redirect=/reservation
  - Bouton "Continuer quand même" → Continue flow (skip account creation)
\`\`\`

**2. Payment Failed (Step 4)**
\`\`\`
Error: "Paiement refusé par votre banque"
Recovery:
  - Afficher message Stripe
  - Bouton "Réessayer" → Recharger Payment Element
  - Bouton "Modifier services" → Retour Step 2
\`\`\`

**3. Booking Creation Failed (Post-Payment)**
\`\`\`
Error: "Réservation non enregistrée (mais paiement réussi)"
Recovery:
  - Enregistrer dans table `failed_bookings` pour retry manuel
  - Email automatique au support
  - Afficher: "Erreur technique, nous vous contacterons sous 24h"
\`\`\`

**4. Network Error (Any Step)**
\`\`\`
Error: "Connexion perdue"
Recovery:
  - SessionStorage conserve les données
  - Toast: "Vérifiez votre connexion et réessayez"
  - Bouton "Réessayer"
\`\`\`

**5. Invalid Postal Code (Step 1)**
\`\`\`
Error: "Code postal non couvert"
Recovery:
  - Message: "Nous ne livrons pas encore dans cette zone"
  - Lien: "Être notifié de l'ouverture" (newsletter)
\`\`\`

### 📊 Error Logging

\`\`\`typescript
// lib/utils/error-logger.ts
export function logGuestBookingError(step: string, error: Error, context: any) {
  console.error(`[Guest Booking - ${step}]`, {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    session: context.sessionId
  })

  // Send to monitoring service (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // sentry.captureException(error, { tags: { flow: 'guest_booking', step } })
  }
}
\`\`\`

---

## 9. Testing Strategy

### 🧪 Test Coverage

**Unit Tests:**
- [ ] Validation schemas (Zod) - 100% coverage
- [ ] Helper functions (formatters, calculators)
- [ ] State management hook (useGuestBooking)

**Integration Tests:**
- [ ] API route /api/bookings/guest (happy path)
- [ ] API route /api/bookings/guest (error cases)
- [ ] Stripe Payment Intent creation
- [ ] Account creation logic

**E2E Tests (Playwright):**
- [ ] Complete guest flow (Step 0 → Payment → Confirmation)
- [ ] Email already exists scenario
- [ ] Payment failure recovery
- [ ] Session persistence (abandon + return)
- [ ] Mobile responsive flow

**Manual Testing Checklist:**
- [ ] Test avec vraie carte Stripe (mode test)
- [ ] Tester email de bienvenue
- [ ] Vérifier compte créé dans Supabase
- [ ] Vérifier réservation visible dans dashboard
- [ ] Tester tous les messages d'erreur
- [ ] Tester sur mobile (iOS + Android)
- [ ] Tester avec connexion lente (throttle)

---

## 10. Implementation Roadmap

### 📅 Phase 1: Foundation (Week 1)

**Day 1-2: Setup & Validation**
- [ ] Create file structure (`app/reservation/guest/`, `components/booking/guest/`)
- [ ] Implement Zod schemas (contact, booking)
- [ ] Setup SessionStorage persistence
- [ ] Create `useGuestBooking` hook

**Day 3-4: Steps 0-2 (Contact, Addresses, Services)**
- [ ] Build ContactStep component with validation
- [ ] Adapt AddressesStep (remove "saved addresses")
- [ ] Adapt ServicesStep (remove credits logic)
- [ ] Implement stepper navigation

**Day 5: Step 3-4 (DateTime, Summary)**
- [ ] Copy DateTimeStep (no changes needed)
- [ ] Build GuestSummaryStep (recap only, no payment yet)
- [ ] Test full navigation flow (mocked data)

---

### 📅 Phase 2: Payment Integration (Week 2)

**Day 1-2: Stripe Setup**
- [ ] Create `/api/bookings/guest/create-payment-intent`
- [ ] Integrate Stripe Elements in GuestSummaryStep
- [ ] Test payment with Stripe test cards
- [ ] Implement 3D Secure flow

**Day 3-4: Backend Orchestration**
- [ ] Implement `/api/bookings/guest` route (full logic)
- [ ] Account creation function
- [ ] Booking creation with payment
- [ ] Address saving logic

**Day 5: Email & Confirmation**
- [ ] Email template: Welcome + password reset
- [ ] Confirmation page `/reservation/success`
- [ ] Redirection to /auth/signin with params

---

### 📅 Phase 3: Error Handling & Polish (Week 3)

**Day 1-2: Error Scenarios**
- [ ] Email exists flow (modal + login option)
- [ ] Payment failure handling
- [ ] Network error recovery
- [ ] Session persistence on abandon

**Day 3-4: Testing**
- [ ] Write E2E tests (Playwright)
- [ ] Test all error scenarios
- [ ] Mobile responsive testing
- [ ] Performance audit (Lighthouse)

**Day 5: Analytics & Monitoring**
- [ ] Add tracking events (Google Analytics / Mixpanel)
- [ ] Setup error logging (Sentry)
- [ ] Create dashboard for guest conversion metrics

---

### 📅 Phase 4: Launch & Optimization (Week 4)

**Day 1: Soft Launch**
- [ ] Deploy to staging
- [ ] Internal team testing
- [ ] Fix critical bugs

**Day 2-3: Production Deployment**
- [ ] Update all "Réserver maintenant" links → `/reservation/guest`
- [ ] Deploy to production
- [ ] Monitor error rates

**Day 4-5: Monitoring & Optimization**
- [ ] Analyze funnel drop-off rates
- [ ] A/B test contact form variations
- [ ] Optimize payment conversion
- [ ] Collect user feedback

---

## 11. Success Metrics & KPIs

### 📈 Key Performance Indicators

**Conversion Funnel:**
\`\`\`
Marketing Page (100%)
  ↓ Click "Réserver maintenant"
Step 0 - Contact (Target: 80%)
  ↓
Step 1 - Addresses (Target: 90%)
  ↓
Step 2 - Services (Target: 95%)
  ↓
Step 3 - DateTime (Target: 95%)
  ↓
Step 4 - Payment (Target: 70%)
  ↓
Booking Created (Target: 30% overall conversion)
\`\`\`

**Success Criteria (3 months post-launch):**
- [ ] Guest conversion rate ≥ 30% (click → booking)
- [ ] Average booking value ≥ 25€
- [ ] Payment success rate ≥ 95%
- [ ] Guest → repeat customer rate ≥ 40%
- [ ] Mobile conversion ≥ 25% (slightly lower than desktop OK)

**Technical Metrics:**
- [ ] Page load time < 2s (Step 0)
- [ ] Payment processing time < 5s
- [ ] Error rate < 2%
- [ ] 99.9% uptime

---

## 12. Risks & Mitigation

### ⚠️ Potential Risks

### 🔄 Orchestration Sequence (Critical Path)

**Flow séquentiel bloquant:**
\`\`\`
1. PAYMENT (Stripe) 
   ↓ [BLOCKS next step]
2. ACCOUNT CREATION (Supabase Auth)
   ↓ [BLOCKS next step]
3. BOOKING CREATION (Database)
   ↓
4. SUCCESS
\`\`\`

**Principe:** Chaque étape DOIT réussir avant de passer à la suivante.

---

**Risk 1: Payment Fails**
- **Impact:** High (conversion blocked)
- **Probability:** Medium (10-15% des paiements échouent)
- **Mitigation:**
  - ✅ **Retry autorisé par l'utilisateur** (bouton "Réessayer")
  - ✅ User reste sur l'étape 4 (données conservées)
  - ✅ Message d'erreur clair depuis Stripe (ex: "Carte refusée", "Fonds insuffisants")
  - ✅ Option "Modifier les services" pour réduire le montant
  - ❌ **PAS de retry automatique** (décision user uniquement)
  
**UI Behavior:**
\`\`\`typescript
if (paymentError) {
  toast.error(`Paiement refusé: ${stripeError.message}`)
  // User reste sur Step 4, peut:
  // - Réessayer avec même carte
  // - Changer de carte
  // - Retourner à Step 2 (modifier services)
}
\`\`\`

---

**Risk 2: Payment Succeeds → Account Creation Fails**
- **Impact:** HIGH (customer charged, no account)
- **Probability:** Low (< 1%)
- **Mitigation:**
  - ✅ **Retry automatique: 3 tentatives max** (exponential backoff: 1s, 3s, 5s)
  - ✅ Après 3 échecs → **Log en database** (`failed_account_creations` table)
  - ✅ **Toast discret** (non bloquant): 
    \`\`\`
    "Une erreur est survenue. Veuillez contacter contact@ninowash.fr 
    avec votre numéro de paiement: [payment_intent_id]"
    \`\`\`
  - ✅ Webhook Stripe détecte l'échec → email automatique au support
  - ❌ **PAS de refund automatique** (gestion manuelle support)

**Database Log Schema:**
\`\`\`sql
CREATE TABLE failed_account_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);
\`\`\`

**Backend Logic:**
\`\`\`typescript
// POST /api/bookings/guest
let accountCreationAttempts = 0
let userId: string | null = null

while (accountCreationAttempts < 3 && !userId) {
  try {
    const { data: newUser } = await supabase.auth.admin.createUser({...})
    userId = newUser.user.id
    break // Succès
  } catch (error) {
    accountCreationAttempts++
    if (accountCreationAttempts < 3) {
      await sleep(accountCreationAttempts * 2000) // 2s, 4s, 6s
    }
  }
}

if (!userId) {
  // Log l'échec en database
  await supabase.from('failed_account_creations').insert({
    payment_intent_id: paymentIntentId,
    email: guestContact.email,
    first_name: guestContact.firstName,
    last_name: guestContact.lastName,
    phone: guestContact.phone,
    error_message: lastError.message,
    retry_count: 3
  })
  
  return NextResponse.json({
    error: "account_creation_failed",
    message: `Une erreur technique est survenue. Contactez contact@ninowash.fr avec votre référence: ${paymentIntentId}`,
    payment_intent_id: paymentIntentId
  }, { status: 500 })
}
\`\`\`

---

**Risk 3: Account Created → Booking Creation Fails**
- **Impact:** MEDIUM (account exists, no booking visible)
- **Probability:** Very Low (< 0.5%)
- **Mitigation:**
  - ✅ **Retry automatique: 3 tentatives max** (exponential backoff)
  - ✅ Après 3 échecs → **Log en database** (`failed_bookings` table)
  - ✅ **Toast visible** (bloquant):
    \`\`\`
    "Erreur lors de l'enregistrement de votre réservation. 
    Veuillez contacter contact@ninowash.fr avec votre référence: [payment_intent_id]"
    \`\`\`
  - ✅ Support contacte le client sous 24h pour créer la réservation manuellement
  - ❌ **PAS de refund automatique**

**Database Log Schema:**
\`\`\`sql
CREATE TABLE failed_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  guest_contact JSONB NOT NULL,
  guest_pickup_address JSONB NOT NULL,
  guest_delivery_address JSONB NOT NULL,
  items JSONB NOT NULL,
  pickup_date TIMESTAMPTZ NOT NULL,
  pickup_time_slot TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT
);
\`\`\`

**Backend Logic:**
\`\`\`typescript
let bookingCreationAttempts = 0
let bookingId: string | null = null

while (bookingCreationAttempts < 3 && !bookingId) {
  try {
    const { data: booking } = await supabase.from('bookings').insert({...})
    bookingId = booking.id
    break // Succès
  } catch (error) {
    bookingCreationAttempts++
    if (bookingCreationAttempts < 3) {
      await sleep(bookingCreationAttempts * 2000) // 2s, 4s, 6s
    }
  }
}

if (!bookingId) {
  // Log l'échec en database
  await supabase.from('failed_bookings').insert({
    payment_intent_id: paymentIntentId,
    user_id: userId,
    guest_contact: guestContact,
    guest_pickup_address: guestPickupAddress,
    guest_delivery_address: guestDeliveryAddress,
    items: items,
    pickup_date: pickupDate,
    pickup_time_slot: pickupTimeSlot,
    total_amount: paymentIntent.amount / 100,
    error_message: lastError.message,
    retry_count: 3
  })
  
  return NextResponse.json({
    error: "booking_creation_failed",
    message: `Erreur lors de l'enregistrement de votre réservation. Contactez contact@ninowash.fr avec votre référence: ${paymentIntentId}`,
    payment_intent_id: paymentIntentId,
    user_id: userId // User account created successfully
  }, { status: 500 })
}
\`\`\`

---

**Risk 4: Email Already Exists, User Confused**
- **Impact:** Low (UX friction)
- **Probability:** Medium (20-30% des cas)
- **Mitigation:**
  - ✅ **Modal explicite** à l'étape 0 (Contact):
    \`\`\`
    ⚠️ Un compte existe avec cet email
    
    [Se connecter] → Redirect to /auth/signin?redirect=/reservation
    [Continuer quand même] → Skip account creation, booking-only mode
    \`\`\`
  - ✅ En mode "booking-only": 
    - Associer la réservation à l'user_id existant
    - Pas de création de compte
    - Email de confirmation envoyé avec lien dashboard

---

**Risk 5: Stripe Payment Element Fails to Load**
- **Impact:** High (no payment possible)
- **Probability:** Very Low (< 0.1%)
- **Mitigation:**
  - ✅ **Fallback UI**: Message d'erreur après 10s de chargement
  - ✅ **Option alternative**: Bouton "Payer avec Stripe Checkout" (hosted page)
  - ✅ Toast: "Contactez contact@ninowash.fr si le problème persiste"

---

### 📊 Error Monitoring Dashboard (Admin)

**Créer une page admin** `/admin/failed-operations` pour:
- [ ] Voir tous les `failed_account_creations` (paiement OK, no account)
- [ ] Voir tous les `failed_bookings` (paiement + account OK, no booking)
- [ ] Actions: Retry manuel, Mark as resolved, Refund client

**Colonnes table:**
| Payment ID | Email | Amount | Error Type | Retry Count | Status | Actions |
|------------|-------|--------|------------|-------------|--------|---------|
| pi_xxx     | john@ | 28€    | Account    | 3/3         | Open   | [Retry][Refund][Resolve] |

---

## 13. Open Questions

**Q1:** Faut-il permettre les abonnements en mode invité ?
- **Recommandation:** ❌ Non. Abonnements = compte requis (gestion complexe).

**Q2:** Que faire si l'email existe déjà ?
- **Recommandation:** Proposer connexion.

**Q3:** Durée de vie du session storage ?
- **Recommandation:** fermeture du navigateur.

**Q4:** Envoyer email de confirmation avant ou après création compte ?
- **Recommandation:** Après (ne pas inclure infos de connexion).

**Q5:** Activer l'abonnement newsletter par défaut ?
- **Recommandation:** ❌ Non. Opt-in explicite (RGPD).

---

## 14. Exclusions (Out of Scope)

**Ne PAS implémenter dans cette itération:**
- ❌ Modification de réservation pour invités
- ❌ Système de crédits pour invités
- ❌ Abonnements pour invités
- ❌ Historique de réservations pour invités (avant création compte)
- ❌ Sauvegarde "Mes adresses" pour invités
- ❌ Programme de parrainage pour invités
- ❌ Multi-langue (français uniquement)

---

## 15. Documentation & Handoff

**Fichiers à créer après implémentation:**
- [ ] `docs/GUEST_BOOKING_FLOW_ARCHITECTURE.md` (architecture technique)
- [ ] `docs/GUEST_BOOKING_API_DOCUMENTATION.md` (API endpoints)
- [ ] `docs/GUEST_BOOKING_TESTING_GUIDE.md` (guide de test)
- [ ] `docs/GUEST_BOOKING_TROUBLESHOOTING.md` (debug common issues)

**Mises à jour nécessaires:**
- [ ] Mettre à jour `docs/INDEX.md` avec les nouvelles routes
- [ ] Ajouter section "Guest Booking" dans `docs/architecture.md`
- [ ] Documenter les nouveaux événements analytics
- [ ] Mettre à jour `.env.example` avec les variables Stripe

---

## 16. Approval & Sign-off

**Stakeholders:**
- [ ] **Product Owner:** Approves PRD scope & priority
- [ ] **Tech Lead:** Approves technical architecture
- [ ] **Design Lead:** Approves UI/UX parity with authenticated flow
- [ ] **Security Lead:** Approves payment & data handling
- [ ] **Legal/RGPD:** Approves data collection & consent flow

**Estimated Effort:**
- **Development:** 3 weeks (1 dev fullstack)
- **Testing:** 1 week (QA + dev)
- **Total:** 4 weeks to production

**Go/No-Go Decision Date:** [TBD]

---

**Fin du PRD** ✅

**Next Steps:**
1. Review & approval by stakeholders
2. Technical spike for Stripe integration (1 day)
3. Create implementation tickets in Jira/Linear
4. Assign developer + start Phase 1

---

**Version History:**
- v1.0 (2025-01-09): Initial PRD création
