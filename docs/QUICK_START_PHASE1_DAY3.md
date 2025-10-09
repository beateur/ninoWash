# 🚀 Guest Booking Flow - Quick Start (Reprise Phase 1 Day 3-4)

**Date de dernière mise à jour**: 9 janvier 2025  
**Phase actuelle**: Phase 1 - Foundation (40% complété)  
**Prochaine session**: Day 3-4 (Addresses + Services steps)

---

## ✅ Ce qui a été fait (Phase 1 Day 1-2)

### Fichiers créés (11)
```
app/reservation/guest/
  ├─ page.tsx                 ✅ Entry point
  └─ layout.tsx               ✅ Minimal layout

app/api/bookings/guest/
  └─ check-email/route.ts     ✅ Email validation API

components/booking/guest/
  ├─ guest-booking-container.tsx  ✅ Main orchestrator
  ├─ guest-stepper.tsx             ✅ Progress indicator
  └─ steps/
      └─ contact-step.tsx          ✅ Step 0 (Contact)

lib/
  ├─ hooks/use-guest-booking.ts    ✅ State management
  └─ validations/
      ├─ guest-contact.ts          ✅ Contact validation
      └─ guest-booking.ts          ✅ Full booking validation

supabase/migrations/
  └─ 20250109000001_add_failed_operations_tables.sql  ⚠️ À appliquer

docs/
  ├─ PRD/PRD_GUEST_BOOKING_FLOW.md
  ├─ IMPLEMENTATION_GUEST_BOOKING_PHASE1.md
  └─ PHASE1_COMPLETION_SUMMARY.md
```

### Fonctionnalités opérationnelles
- ✅ Route `/reservation/guest` accessible
- ✅ Step 0 (Contact) fonctionnel avec validation
- ✅ API check-email opérationnelle
- ✅ SessionStorage persistence (24h)
- ✅ Stepper visuel responsive
- ✅ Build successful (pnpm build)

---

## ⏭️ Prochaines étapes (Phase 1 Day 3-4)

### Day 3: Addresses Step (Step 1)

**Fichier à créer**: `components/booking/guest/steps/addresses-step.tsx`

**Spécifications**:
- Réutiliser le composant `AddressForm` existant (si disponible)
- 2 sections: Adresse de collecte + Adresse de livraison
- Checkbox "Même adresse pour livraison"
- Validation code postal (zones couvertes Paris)
- **Exclusions**: 
  - ❌ Pas de dropdown "Mes adresses sauvegardées"
  - ❌ Pas de bouton "Définir par défaut"

**Code de départ**:
```typescript
// components/booking/guest/steps/addresses-step.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { guestAddressSchema, type GuestAddress } from "@/lib/validations/guest-booking"

interface AddressesStepProps {
  initialPickupAddress: GuestAddress | null
  initialDeliveryAddress: GuestAddress | null
  onComplete: (pickup: GuestAddress, delivery: GuestAddress) => void
}

export function AddressesStep({ 
  initialPickupAddress, 
  initialDeliveryAddress, 
  onComplete 
}: AddressesStepProps) {
  const [sameAddress, setSameAddress] = useState(false)

  // TODO: Implémenter les 2 formulaires d'adresse
  // TODO: Gérer la checkbox "Même adresse"
  // TODO: Valider les codes postaux

  return (
    <div className="space-y-6">
      <h2>Adresses de collecte et livraison</h2>
      {/* TODO */}
    </div>
  )
}
```

**Actions**:
1. Créer le fichier `addresses-step.tsx`
2. Implémenter les 2 formulaires (pickup + delivery)
3. Gérer la checkbox "Même adresse"
4. Valider les codes postaux (75xxx pour Paris)
5. Tester la sauvegarde en SessionStorage
6. Mettre à jour `guest-booking-container.tsx` pour afficher Step 1

---

### Day 3: Services Step (Step 2)

**Fichier à créer**: `components/booking/guest/steps/services-step.tsx`

**Spécifications**:
- Fetch les services depuis la table `services` (Supabase)
- Afficher uniquement les services "classiques" (pas d'abonnements)
- Sélection quantité par service (input number)
- Calcul prix temps réel (quantité × prix unitaire)
- Textarea pour instructions spéciales
- **Exclusions**:
  - ❌ Pas de bannière crédits
  - ❌ Pas de services abonnement

**Code de départ**:
```typescript
// components/booking/guest/steps/services-step.tsx
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { GuestBookingItem } from "@/lib/validations/guest-booking"

interface ServicesStepProps {
  initialItems: GuestBookingItem[]
  onComplete: (items: GuestBookingItem[], totalAmount: number) => void
}

export function ServicesStep({ initialItems, onComplete }: ServicesStepProps) {
  const [services, setServices] = useState([])
  const [selectedItems, setSelectedItems] = useState<GuestBookingItem[]>(initialItems)
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    // TODO: Fetch services from Supabase
    // TODO: Filter out subscriptions
  }, [])

  // TODO: Calculate total amount when items change
  // TODO: Handle quantity changes
  // TODO: Handle special instructions

  return (
    <div className="space-y-6">
      <h2>Sélectionnez vos services</h2>
      {/* TODO: List services with quantity inputs */}
      <div className="text-xl font-bold">
        Total: {totalAmount.toFixed(2)} €
      </div>
    </div>
  )
}
```

**Actions**:
1. Créer le fichier `services-step.tsx`
2. Fetch les services (query Supabase `services` table)
3. Filtrer les abonnements (`type !== 'subscription'`)
4. Implémenter la sélection quantité
5. Calculer le prix total en temps réel
6. Ajouter textarea instructions spéciales
7. Tester la sauvegarde en SessionStorage
8. Mettre à jour `guest-booking-container.tsx` pour afficher Step 2

---

### Day 4: DateTime Step (Step 3)

**Fichier à créer**: `components/booking/guest/steps/datetime-step.tsx`

**Spécifications**:
- **Copier depuis le parcours authentifié** (aucun changement nécessaire)
- Calendrier React Day Picker
- Sélection créneau: "09:00-12:00" | "14:00-17:00" | "18:00-21:00"
- Validation disponibilité (si API existante)
- Affichage délai livraison estimé (72h)

**Code de départ**:
```typescript
// components/booking/guest/steps/datetime-step.tsx
// TODO: Copier depuis components/booking/datetime-step.tsx
// TODO: Adapter les props pour accepter initialPickupDate + initialPickupTimeSlot
// TODO: Supprimer les références aux crédits si existantes
```

**Actions**:
1. Copier `datetime-step.tsx` depuis le parcours authentifié
2. Adapter les props pour le guest flow
3. Tester la sélection date + créneau
4. Vérifier la sauvegarde en SessionStorage
5. Mettre à jour `guest-booking-container.tsx` pour afficher Step 3

---

### Day 5: Summary Step (Step 4 - Sans paiement)

**Fichier à créer**: `components/booking/guest/steps/summary-step.tsx`

**Spécifications**:
- Récapitulatif complet:
  - Contact (email, nom, prénom)
  - Adresses (collecte + livraison)
  - Services sélectionnés (quantité + prix)
  - Date & heure de collecte
  - Total à payer
- **Phase 1**: Pas de paiement Stripe (placeholder)
- **Exclusions**:
  - ❌ Section "Mes crédits"
  - ❌ Toggle "Utiliser mes crédits"

**Code de départ**:
```typescript
// components/booking/guest/steps/summary-step.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { GuestBookingState } from "@/lib/hooks/use-guest-booking"

interface SummaryStepProps {
  bookingData: GuestBookingState
  onComplete: () => void
}

export function SummaryStep({ bookingData, onComplete }: SummaryStepProps) {
  return (
    <div className="space-y-6">
      <h2>Récapitulatif de votre réservation</h2>

      {/* Contact */}
      <Card className="p-4">
        <h3 className="font-bold mb-2">👤 Contact</h3>
        <p>{bookingData.contact?.firstName} {bookingData.contact?.lastName}</p>
        <p>{bookingData.contact?.email}</p>
      </Card>

      {/* Adresses */}
      <Card className="p-4">
        <h3 className="font-bold mb-2">📍 Adresses</h3>
        {/* TODO: Afficher pickup + delivery */}
      </Card>

      {/* Services */}
      <Card className="p-4">
        <h3 className="font-bold mb-2">🧺 Services</h3>
        {/* TODO: Lister les items */}
      </Card>

      {/* Date */}
      <Card className="p-4">
        <h3 className="font-bold mb-2">📅 Planification</h3>
        {/* TODO: Afficher date + créneau */}
      </Card>

      {/* Total */}
      <div className="text-2xl font-bold">
        Total: {bookingData.totalAmount.toFixed(2)} €
      </div>

      {/* Placeholder paiement */}
      <Button disabled>
        Paiement (Phase 2) →
      </Button>
    </div>
  )
}
```

**Actions**:
1. Créer le fichier `summary-step.tsx`
2. Afficher toutes les données du booking
3. Calculer le total final
4. Ajouter un bouton désactivé "Paiement (Phase 2)"
5. Tester l'affichage complet
6. Mettre à jour `guest-booking-container.tsx` pour afficher Step 4

---

## 🔧 Commandes utiles

### Démarrer le serveur dev
```bash
pnpm dev
```

### Tester l'application
```
http://localhost:3000/reservation/guest
```

### Vérifier TypeScript
```bash
pnpm tsc --noEmit
```

### Build production
```bash
pnpm build
```

### Vérifier SessionStorage (console navigateur)
```javascript
JSON.parse(sessionStorage.getItem('ninowash_guest_booking'))
```

---

## 📚 Références

### Documentation PRD
- **PRD complet**: `docs/PRD/PRD_GUEST_BOOKING_FLOW.md`
- **Section UI/UX**: Lignes 290-470 (mockups des 5 étapes)
- **Section Validation**: Lignes 760-840 (schemas Zod)

### Composants existants à réutiliser
- `components/forms/address-form.tsx` (formulaire adresse)
- `components/booking/datetime-step.tsx` (calendrier + créneaux)
- `components/ui/*` (tous les composants Shadcn/ui)

### Base de données
- Table `services`: Fetch pour Step 2
- Table `bookings`: Structure cible pour Step 4 (Phase 2)
- Table `user_addresses`: Structure adresse pour Step 1

---

## ⚠️ Points d'attention

### À faire AVANT de commencer Day 3-4
1. ✅ Vérifier que le serveur dev tourne (`pnpm dev`)
2. ⚠️ Appliquer la migration SQL (tables failed_*)
3. ✅ Tester Step 0 pour confirmer que tout fonctionne
4. ✅ Lire le PRD section UI/UX (mockups)

### Exclusions strictes (rappel)
- ❌ Pas de système de crédits
- ❌ Pas d'abonnements
- ❌ Pas de "Mes adresses sauvegardées"
- ❌ Pas de modification de réservation
- ❌ Pas de paiement Stripe (Phase 2)

### Tests à faire après chaque step
1. Remplir le formulaire
2. Cliquer "Suivant"
3. Vérifier SessionStorage (console)
4. Rafraîchir la page → données conservées
5. Naviguer en arrière (bouton "Précédent")
6. Vérifier que les données sont toujours là

---

## 🎯 Objectif de fin de Phase 1 Day 3-4

À la fin de cette session, le parcours guest doit être **fonctionnel de bout en bout** (Steps 0-4), **SAUF le paiement Stripe** qui sera fait en Phase 2.

**Checklist de complétion Day 3-4**:
- [ ] Step 1 (Addresses) fonctionnel
- [ ] Step 2 (Services) fonctionnel
- [ ] Step 3 (DateTime) fonctionnel
- [ ] Step 4 (Summary) affiche toutes les données
- [ ] Navigation complète (0 → 4)
- [ ] SessionStorage persiste tout
- [ ] Tests manuels passent
- [ ] TypeScript compile sans erreur
- [ ] Build production OK

**Ensuite**: Phase 2 (Week 2) - Intégration Stripe Payment

---

## 📞 Besoin d'aide ?

### Questions fréquentes
1. **Où trouver les services ?** → `SELECT * FROM services WHERE type != 'subscription'`
2. **Validation code postal ?** → Regex `/^75[0-9]{3}$/` (Paris uniquement)
3. **Calcul prix total ?** → `items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)`

### Contacts
- **Product Owner**: Bilel
- **Tech Lead**: [À définir]
- **Documentation**: `docs/PRD/PRD_GUEST_BOOKING_FLOW.md`

---

**Bonne continuation ! 🚀**

*Dernière mise à jour: 9 janvier 2025, 10h00*
