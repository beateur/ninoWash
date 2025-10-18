# Système de Réservation Nino Wash

## Vue d'ensemble

Le système de réservation de Nino Wash permet aux utilisateurs (authentifiés ou invités) de planifier des services de pressing à domicile en 4 étapes simples. Le système gère les réservations ponctuelles et les abonnements avec validation complète des données.

## Types de Réservations

### 1. Réservation Invité (Guest Booking)
- Aucune authentification requise
- Service Classique uniquement
- Informations de contact collectées dans le formulaire
- `user_id` NULL dans la base de données
- Données stockées dans le champ `metadata` (JSONB)

### 2. Réservation Authentifiée
- Compte utilisateur requis
- Accès à tous les services (Classique, Mensuel, Trimestriel)
- Adresses sauvegardées réutilisables
- Historique des réservations accessible
- Gestion des abonnements

## Workflow de Réservation

### Étape 1 : Adresses de Collecte et Livraison

**Composant** : `components/booking/address-step.tsx`

#### Pour Utilisateurs Authentifiés
1. Affichage des adresses sauvegardées
2. Sélection de l'adresse de collecte
3. Sélection de l'adresse de livraison (peut être différente)
4. Option d'ajouter une nouvelle adresse
5. Validation : Les deux adresses doivent être sélectionnées

#### Pour Invités
1. Formulaire d'informations de contact :
   - Prénom
   - Nom
   - Email
   - Téléphone
2. Formulaire d'adresse de collecte :
   - Adresse complète
   - Ville
   - Code postal (format : 5 chiffres)
   - Informations bâtiment (optionnel)
   - Instructions d'accès (optionnel)
3. Formulaire d'adresse de livraison (même structure)
4. Validation complète de tous les champs

**Validation** :
\`\`\`typescript
// Adresse authentifiée
addressSchema = z.object({
  type: z.enum(["home", "work", "other"]),
  label: z.string().min(1),
  streetAddress: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().regex(/^\d{5}$/),
  // ...
})

// Adresse invité
guestAddressSchema = z.object({
  street_address: z.string().min(5),
  city: z.string().min(2),
  postal_code: z.string().regex(/^\d{5}$/),
  // ...
})

// Contact invité
guestContactSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
})
\`\`\`

### Étape 2 : Sélection des Services

**Composant** : `components/booking/services-step.tsx`

#### Services Disponibles
1. **Service Classique** (3.00€)
   - Nettoyage standard
   - Délai : 2 jours
   - Accessible aux invités

2. **Abonnement Mensuel** (49.00€/mois)
   - Jusqu'à 15 services inclus
   - Tarif dégressif
   - Authentification requise

3. **Abonnement Trimestriel** (129.00€/trimestre)
   - Jusqu'à 50 services inclus
   - Meilleur tarif
   - Authentification requise

#### Options Supplémentaires
- **Express** (+5.00€) : Livraison en 24h
- **Repassage Premium** (+2.00€) : Repassage professionnel
- **Traitement Taches** (+3.00€) : Traitement spécialisé
- **Soin Délicat** (+4.00€) : Tissus délicats
- **Nettoyage Écologique** (+1.50€) : Produits écologiques

#### Sélection
1. Choix du service principal
2. Sélection de la quantité (minimum 1)
3. Ajout d'options supplémentaires (optionnel)
4. Instructions spéciales par article (optionnel)
5. Calcul automatique du total

**Validation** :
\`\`\`typescript
bookingItemSchema = z.object({
  serviceId: z.string().uuid(),
  quantity: z.number().min(1),
  specialInstructions: z.string().optional(),
})

items: z.array(bookingItemSchema).min(1, "Au moins un article requis")
\`\`\`

### Étape 3 : Date et Heure de Collecte

**Composant** : `components/booking/datetime-step.tsx`

#### Sélection de Date
1. Calendrier interactif
2. Date minimum : Demain (J+1)
3. Dates passées désactivées
4. Jours fériés marqués (optionnel)

#### Créneaux Horaires
- **Matin** : 09:00 - 12:00
- **Après-midi** : 14:00 - 17:00
- **Soir** : 18:00 - 21:00

#### Calcul de Livraison
- Date de livraison = Date de collecte + délai de traitement (2 jours par défaut)
- Affichage automatique de la date de livraison estimée
- Option Express : Livraison J+1

**Validation** :
\`\`\`typescript
pickupDate: z.string().refine((date) => {
  const selectedDate = new Date(date)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  selectedDate.setHours(0, 0, 0, 0)
  return selectedDate >= tomorrow
}, "La date de collecte doit être au minimum demain")

pickupTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"])
\`\`\`

### Étape 4 : Récapitulatif et Confirmation

**Composant** : `components/booking/summary-step.tsx`

#### Affichage
1. **Informations de Contact** (invités uniquement)
   - Nom complet
   - Email
   - Téléphone

2. **Adresses**
   - Adresse de collecte complète
   - Adresse de livraison complète
   - Instructions d'accès

3. **Services Sélectionnés**
   - Liste des articles avec quantités
   - Options supplémentaires
   - Prix unitaires
   - Sous-total

4. **Planning**
   - Date et créneau de collecte
   - Date de livraison estimée

5. **Récapitulatif Financier**
   - Sous-total services
   - Options supplémentaires
   - TVA (20%)
   - Total TTC

#### Actions
- Bouton "Modifier" pour chaque section (retour à l'étape concernée)
- Bouton "Confirmer la réservation"
- Acceptation des conditions générales (checkbox)

#### Après Confirmation
Une fois la réservation créée avec succès :
1. L'utilisateur est redirigé vers `/reservation/success?number=BOOK-XXXXX`
2. Une page de confirmation affiche :
   - Message "Réservation en attente de validation"
   - Numéro de réservation
   - 4 points clés sur les prochaines étapes :
     - Validation en cours par l'équipe
     - Lien de paiement envoyé par email
     - Email récapitulatif
     - Notification en cas de refus
3. Boutons CTA :
   - Utilisateurs authentifiés : "Accéder au tableau de bord" + "Voir mes réservations"
   - Invités : "Retour à l'accueil" + "Découvrir nos services"

**Page de confirmation** : `app/reservation/success/page.tsx`

## Traitement Backend

### API Endpoint : POST /api/bookings

**Fichier** : `app/api/bookings/route.ts`

#### 1. Validation des Données
\`\`\`typescript
const validatedData = createBookingSchema.parse(body)
\`\`\`

Le schéma `createBookingSchema` valide :
- Présence des adresses (IDs ou données invité)
- Format de la date de collecte (minimum J+1)
- Créneau horaire valide
- Au moins un article sélectionné
- Format des données invité si applicable

#### 2. Authentification
\`\`\`typescript
const { data: { user } } = await supabase.auth.getUser()
const isGuestBooking = !user
\`\`\`

#### 3. Calcul du Montant Total
\`\`\`typescript
// Récupération des prix des services
const { data: services } = await supabase
  .from("services")
  .select("id, base_price")
  .in("id", serviceIds)

// Calcul du total
for (const item of validatedData.items) {
  const service = services.find((s) => s.id === item.serviceId)
  if (service) {
    totalAmount += service.base_price * item.quantity
  }
}
\`\`\`

#### 4. Génération du Numéro de Réservation
\`\`\`typescript
const generateBookingNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `BK-${date}-${random}`
}
\`\`\`

Format : `BK-YYYYMMDD-XXXXXX`
Exemple : `BK-20250129-A3F7K2`

#### 5. Gestion des Réservations Invités
\`\`\`typescript
if (isGuestBooking) {
  bookingMetadata = {
    is_guest_booking: true,
    guest_contact: validatedData.guestContact,
    guest_pickup_address: validatedData.guestPickupAddress,
    guest_delivery_address: validatedData.guestDeliveryAddress,
  }
  
  pickupAddressId = null
  deliveryAddressId = null
}
\`\`\`

#### 6. Création de la Réservation
\`\`\`typescript
const { data: booking } = await supabase
  .from("bookings")
  .insert({
    booking_number: generateBookingNumber(),
    user_id: user?.id || null,
    service_id: primaryServiceId,
    pickup_address_id: pickupAddressId,
    delivery_address_id: deliveryAddressId,
    pickup_date: validatedData.pickupDate,
    pickup_time_slot: validatedData.pickupTimeSlot,
    special_instructions: validatedData.specialInstructions,
    total_amount: totalAmount,
    status: "pending",
    metadata: bookingMetadata,
  })
  .select()
  .single()
\`\`\`

#### 7. Création des Articles de Réservation
\`\`\`typescript
const bookingItems = validatedData.items.map((item) => {
  const service = services.find((s) => s.id === item.serviceId)
  return {
    booking_id: booking.id,
    quantity: item.quantity,
    unit_price: service?.base_price || 0,
    special_instructions: item.specialInstructions,
    service_id: item.serviceId,
  }
})

await supabase.from("booking_items").insert(bookingItems)
\`\`\`

#### 8. Gestion des Erreurs
- **Validation Zod** : Retour 400 avec détails des erreurs
- **Erreur de création** : Rollback automatique de la réservation
- **Erreur serveur** : Retour 500 avec message générique

## États de Réservation

### Cycle de Vie d'une Réservation

\`\`\`
pending → confirmed → collecting → processing → ready → delivering → completed
                                                                    ↓
                                                                cancelled
\`\`\`

#### États Détaillés

1. **pending** (En attente)
   - Réservation créée
   - En attente de confirmation
   - Paiement non effectué

2. **confirmed** (Confirmée)
   - Paiement validé
   - Réservation confirmée
   - En attente de collecte

3. **collecting** (Collecte en cours)
   - Chauffeur assigné
   - En route pour la collecte
   - Notification envoyée au client

4. **processing** (En traitement)
   - Articles collectés
   - Nettoyage en cours
   - Délai de traitement en cours

5. **ready** (Prêt)
   - Nettoyage terminé
   - Prêt pour la livraison
   - En attente d'assignation chauffeur

6. **delivering** (Livraison en cours)
   - Chauffeur assigné pour livraison
   - En route vers le client
   - Notification envoyée

7. **completed** (Terminée)
   - Livraison effectuée
   - Réservation terminée
   - Demande d'avis client

8. **cancelled** (Annulée)
   - Annulation par le client ou l'admin
   - Remboursement si applicable
   - Raison d'annulation enregistrée

## Validations Complètes

### Validation Côté Client (React Hook Form + Zod)

#### Adresses
- **streetAddress** : Minimum 5 caractères
- **city** : Minimum 2 caractères
- **postalCode** : Exactement 5 chiffres (regex: `^\d{5}$`)
- **label** : Requis, minimum 1 caractère

#### Contact Invité
- **first_name** : Minimum 2 caractères
- **last_name** : Minimum 2 caractères
- **email** : Format email valide
- **phone** : Minimum 10 caractères

#### Services
- **serviceId** : UUID valide
- **quantity** : Minimum 1
- **items** : Au moins 1 article requis

#### Date et Heure
- **pickupDate** : Minimum demain (J+1)
- **pickupTimeSlot** : Un des créneaux valides

### Validation Côté Serveur (API Routes + Zod)

Même schéma de validation appliqué côté serveur pour sécurité :

\`\`\`typescript
export const createBookingSchema = z.object({
  pickupAddressId: z.string().uuid().optional(),
  deliveryAddressId: z.string().uuid().optional(),
  pickupDate: z.string().refine((date) => {
    const selectedDate = new Date(date)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)
    return selectedDate >= tomorrow
  }),
  pickupTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"]),
  items: z.array(bookingItemSchema).min(1),
  specialInstructions: z.string().optional(),
  guestPickupAddress: guestAddressSchema.optional(),
  guestDeliveryAddress: guestAddressSchema.optional(),
  guestContact: guestContactSchema.optional(),
}).refine(
  (data) => {
    const hasAddressIds = data.pickupAddressId && data.deliveryAddressId
    const hasGuestAddresses = data.guestPickupAddress && data.guestDeliveryAddress && data.guestContact
    return hasAddressIds || hasGuestAddresses
  },
  {
    message: "Adresses de collecte et de livraison requises",
    path: ["pickupAddressId"],
  }
)
\`\`\`

### Règles Métier

#### Contraintes de Date
- Date de collecte minimum : Demain (J+1)
- Pas de collecte le dimanche (à implémenter)
- Créneaux horaires fixes : 09:00-12:00, 14:00-17:00, 18:00-21:00

#### Contraintes de Service
- Service Classique : Accessible à tous
- Abonnements : Authentification requise
- Quantité minimum : 1 article
- Options supplémentaires : Optionnelles

#### Contraintes d'Adresse
- Code postal : 5 chiffres exactement
- Zone de service : Vérification du code postal (à implémenter)
- Adresses différentes autorisées pour collecte/livraison

## Notifications

### Emails Automatiques

1. **Confirmation de Réservation**
   - Envoyé immédiatement après création
   - Contient le numéro de réservation
   - Récapitulatif complet
   - Lien de suivi

2. **Rappel de Collecte**
   - Envoyé la veille de la collecte
   - Rappel du créneau horaire
   - Instructions d'accès

3. **Collecte Effectuée**
   - Confirmation de la collecte
   - Articles collectés
   - Date de livraison estimée

4. **Prêt pour Livraison**
   - Nettoyage terminé
   - Livraison prévue
   - Créneau de livraison

5. **Livraison Effectuée**
   - Confirmation de livraison
   - Demande d'avis
   - Lien vers le prochain service

### Notifications Push (PWA)
- Statut de la réservation
- Arrivée du chauffeur
- Changements de planning

## Gestion des Erreurs

### Erreurs Utilisateur

#### Validation
\`\`\`typescript
if (error instanceof z.ZodError) {
  return NextResponse.json(
    { error: "Données invalides", details: error.errors },
    { status: 400 }
  )
}
\`\`\`

Messages d'erreur clairs et en français :
- "Adresse complète requise"
- "Code postal invalide"
- "La date de collecte doit être au minimum demain"
- "Au moins un article requis"

#### Affichage
- Messages d'erreur sous les champs concernés
- Toast notifications pour erreurs globales
- Désactivation du bouton "Suivant" si validation échoue

### Erreurs Système

#### Base de Données
\`\`\`typescript
if (bookingError) {
  console.error("[v0] Booking creation error:", bookingError)
  return NextResponse.json(
    { error: "Erreur lors de la création de la réservation" },
    { status: 500 }
  )
}
\`\`\`

#### Rollback Automatique
\`\`\`typescript
// Si création des items échoue, supprimer la réservation
if (itemsError) {
  await supabase.from("bookings").delete().eq("id", booking.id)
  return NextResponse.json(
    { error: "Erreur lors de la création des articles" },
    { status: 500 }
  )
}
\`\`\`

## Sécurité

### Protection des Données

1. **Validation Stricte**
   - Validation côté client ET serveur
   - Schémas Zod pour tous les inputs
   - Sanitization automatique

2. **Authentification**
   - Vérification de session pour utilisateurs authentifiés
   - Support des réservations invités sécurisé
   - Pas d'accès aux données d'autres utilisateurs

3. **Row Level Security (RLS)**
   - Politiques Supabase actives
   - Utilisateurs ne voient que leurs réservations
   - Admins ont accès complet

4. **Données Sensibles**
   - Pas de stockage de données de paiement
   - Tokenization Stripe
   - Chiffrement des données en transit (HTTPS)

## Performance

### Optimisations

1. **Chargement Progressif**
   - Étapes chargées à la demande
   - Lazy loading des composants
   - Skeleton loaders

2. **Caching**
   - Services en cache côté client
   - Adresses sauvegardées en mémoire
   - Réutilisation des données entre étapes

3. **Validation Asynchrone**
   - Validation en temps réel
   - Debouncing des inputs
   - Feedback immédiat

## Tests

### Tests Unitaires

\`\`\`typescript
// __tests__/api/bookings.test.ts
describe('POST /api/bookings', () => {
  it('creates a booking with valid data', async () => {
    const response = await POST(mockRequest)
    expect(response.status).toBe(200)
  })
  
  it('rejects invalid date', async () => {
    const response = await POST(mockRequestWithPastDate)
    expect(response.status).toBe(400)
  })
  
  it('handles guest bookings', async () => {
    const response = await POST(mockGuestRequest)
    expect(response.status).toBe(200)
  })
})
\`\`\`

### Tests d'Intégration

\`\`\`typescript
// __tests__/booking.test.tsx
describe('Booking Flow', () => {
  it('completes full booking process', async () => {
    render(<ReservationPage />)
    
    // Step 1: Addresses
    await selectAddress('pickup')
    await selectAddress('delivery')
    await clickNext()
    
    // Step 2: Services
    await selectService('classic')
    await clickNext()
    
    // Step 3: Date/Time
    await selectDate(tomorrow)
    await selectTimeSlot('09:00-12:00')
    await clickNext()
    
    // Step 4: Summary
    await clickConfirm()
    
    expect(screen.getByText('Réservation confirmée')).toBeInTheDocument()
  })
})
\`\`\`

## Améliorations Futures

### Fonctionnalités Prévues

1. **Estimation Intelligente**
   - Upload de photos des vêtements
   - IA pour estimation du prix
   - Détection automatique des taches

2. **Planification Récurrente**
   - Réservations automatiques hebdomadaires/mensuelles
   - Gestion des absences
   - Modification en masse

3. **Suivi en Temps Réel**
   - Géolocalisation du chauffeur
   - ETA dynamique
   - Notifications push

4. **Programme de Fidélité**
   - Points par réservation
   - Récompenses
   - Parrainage

5. **Multi-Langues**
   - Support i18n
   - Français, Anglais, Espagnol
   - Détection automatique

## Ressources

### Fichiers Clés

- **Validation** : `lib/validations/booking.ts`
- **API** : `app/api/bookings/route.ts`
- **Page** : `app/reservation/page.tsx`
- **Composants** :
  - `components/booking/address-step.tsx`
  - `components/booking/services-step.tsx`
  - `components/booking/datetime-step.tsx`
  - `components/booking/summary-step.tsx`

### Documentation Associée

- [Architecture](./architecture.md)
- [Database Schema](./database-schema-documentation.md)
- [API Integration](./api-integration-guide.md)
