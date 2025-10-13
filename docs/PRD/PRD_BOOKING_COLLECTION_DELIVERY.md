# Feature: Collecte & Livraison – Booking Scheduling Rework

## 1. Context
- Pourquoi : l’expérience actuelle de réservation ne permet de sélectionner qu’une date/heure de collecte statique, sans gestion fine des disponibilités ni visibilité sur la livraison. Les équipes opérationnelles doivent gérer manuellement les créneaux et la communication avec les clients.
- Parcours impacté : réservation guest (wizard) et réservation authentifiée (dashboard). L’étape “Date & heure” doit devenir “Collecte & Livraison” avec sélection guidée de deux créneaux.
- Valeur métier : fiabiliser la prise de rendez-vous, éviter les allers-retours, ouvrir la voie à une optimisation future des capacités et réduire les erreurs humaines.

## 2. Goals (Success Criteria)
- [ ] L’utilisateur (guest & auth) peut choisir un créneau de collecte et un créneau de livraison depuis une liste dynamique alimentée par la base de données.
- [ ] Les créneaux affichés correspondent strictement aux slots ouverts et à venir configurés par l’équipe opérationnelle.
- [ ] Le délai minimum entre collecte et livraison respecte la règle du service sélectionné (24h pour Express, 72h pour Classic).
- [ ] Les informations de réservation (collecte & livraison) sont persistées via des clés étrangères vers les nouveaux slots et restent consultables dans le back-office.
- [ ] Aucun slot fermé (`is_open = false`) ou expiré n’est affiché ou sélectionnable.

## 3. Scope

### Frontend
- **Composants à créer/modifier** :
  - `components/booking/guest/steps/datetime-step.tsx` → refonte complète en `CollectionDeliveryStep` mutualisable.
  - `components/booking/datetime-step.tsx` (parcours auth) → adopter le nouveau composant.
  - `components/booking/guest/steps/summary-step.tsx` et `components/booking/summary-step.tsx` → afficher les slots sélectionnés.
  - Hook `useLogisticSlots` (nouveau) pour charger et mettre en cache les slots.
- **Pages affectées** :
  - Flow guest (`/reservation/guest` wizard).
  - Flow authentifié (dashboard réservation).
- **États UI** :
  - Chargement (squelette) des slots.
  - Vide (aucun slot disponible) avec message + CTA contact.
  - Erreur (toast Sonner).
  - Sélection active (cards highlight) + désactivation des dates non disponibles.
- **Responsive** :
  - Grilles en 1 colonne mobile, 2 colonnes desktop.
  - Navigation clavier accessible.
- **Accessibilité** :
  - Boutons avec `aria-pressed` pour sélection.
  - Labels explicites pour lecteurs d’écran.

### Backend
- **Routes API** :
  - GET `/api/logistic-slots` (nouveau) – filtre par rôle (`pickup`/`delivery`), intervalle de dates.
  - POST `/api/bookings` – accepter `pickupSlotId` et `deliverySlotId`, valider règles métier, persister FKs et champs legacy.
  - PATCH `/api/bookings/:id` – même logique pour modifications.
- **Services métiers** :
  - `lib/services/logistic-slots.ts` : récupération slots, transformation DTO.
  - `lib/services/bookings.ts` : validation du délai, mapping fallback dates.
- **Zod schemas** :
  - Mise à jour `lib/validations/booking.ts` pour intégrer les nouveaux champs.
- **Logs** :
  - Ajouter logs `[v0]` pour debugging (slots indisponibles, délai non respecté).

### Database
- **Tables** :
  - `logistic_slots` (nouvelle) – stocker les créneaux collecte/livraison.
  - `slot_requests` (nouvelle) – journaliser les demandes de réservation de slots.
- **Colonnes** :
  - `bookings.pickup_slot_id`, `bookings.delivery_slot_id` (FK).
  - Conserver `pickup_date`, `pickup_time_slot`, `delivery_date`, `delivery_time_slot` pour compatibilité.
- **RLS** :
  - `logistic_slots` : SELECT public (anon & authenticated), write réservé admin/dashboard/service role.
  - `slot_requests` : INSERT public (pour journal), SELECT réservé admin.
- **Indexes** :
  - `logistic_slots(role, slot_date)` filtré sur `is_open = true`.
  - `slot_requests(slot_id)`.

### Validation
- Zod : `pickupSlotId`, `deliverySlotId` doivent être des UUID.
- Vérification service côté serveur : délai minimal en heures selon service (24h ou 72h).
- Blocage si slot fermé ou inexistant.

### Sécurité
- Authentification existante (`apiRequireAuth` pour parcours auth). Guest route reste accessible.
- RLS garantissant que les slots ne peuvent être modifiés que par l’admin.
- Protection contre sélection d’un slot expiré (filtre SQL + validation backend).

### DevOps
- Migration SQL (voir section 4). Aucune automatisation de capacity pour l’instant.
- Documentation interne sur la procédure d’ajout de slots (SQL manuel).
- Aucun changement d’environnement requis (pas de nouvelle variable pour l’instant).

## 4. Technical Implementation Plan

### Step 1: Database
- [ ] Créer migration `supabase/migrations/<timestamp>_create_logistic_slots.sql` avec :
  - Table `logistic_slots` (structure + index + RLS policies).
  - Table `slot_requests` (structure + index + RLS policies).
  - Altération `bookings` pour ajouter `pickup_slot_id`, `delivery_slot_id` (FKs).
  - Mise à jour champs `updated_at` (trigger `set_updated_at` si existant).
- [ ] Documenter la procédure d’ajout des slots (SQL insert) dans `docs/OPERATIONS/SLOTS.md` (à créer lors de l’implémentation).

### Step 2: Validation Schemas
- [ ] Mettre à jour `lib/validations/booking.ts` (create & update) pour intégrer `pickupSlotId`, `deliverySlotId`.
- [ ] Générer types TS (ex `BookingSlotSelection`).

### Step 3: API & Services
- [ ] Créer `app/api/logistic-slots/route.ts` (GET) – query supabase, formatage JSON.
- [ ] Mettre à jour `app/api/bookings/route.ts` (POST) :
  - Charger slots par ID.
  - Valider disponibilité + délai.
  - Insérer booking avec FKs et fallback dates.
  - Insérer deux entrées `slot_requests`.
- [ ] Mettre à jour route de modification (`app/api/bookings/[id]/route.ts` ou action existante).
- [ ] Ajouter helpers dans `lib/services/logistic-slots.ts` (par ex. `getSlotsByRole`, `checkSlotGap`).

### Step 4: Frontend
- [ ] Créer hook `use-logistic-slots.ts` (chargement + regroupement par date).
- [ ] Refonte composant step guest : affichage sections “Collecte” et “Livraison”.
- [ ] Adapter step auth pour réutiliser la même logique (mutualisation via composant `CollectionDeliveryStep`).
- [ ] Mettre à jour summary (guest & auth) pour afficher les slots choisis (date + horaire + label).
- [ ] Gérer états vide/erreur + toasts.

### Step 5: Testing
- [ ] Tests unitaires :
  - Fonctions de validation (délai 24h/72h).
  - Formatage front (grouping par date).
- [ ] Tests d’intégration API :
  - Création de booking valide.
  - Erreur si slot fermé / délai non respecté.
- [ ] Tests e2e (optionnel futur) pour le wizard guest.

### Step 6: Documentation
- [ ] Mettre à jour `docs/DATABASE_SCHEMA.md` pour inclure les nouvelles tables/colonnes.
- [ ] Ajouter guide opérateur : comment ajouter/fermer un slot.
- [ ] Mettre à jour `docs/architecture.md` (section booking flow).

## 5. Data Flow
```
Utilisateur (guest/auth) → CollectionDeliveryStep → sélection slots
  ↓ (GET /api/logistic-slots?role=pickup/delivery)
Front regroupe par date, applique règles délai
  ↓ (POST /api/bookings)
Backend vérifie slots + délai, insère booking + slot_requests
  ↓ Réponse OK
SummaryStep affiche slots sélectionnés
```

## 6. Error Scenarios
- Slot fermé entre temps → 409 Conflict, message utilisateur.
- Aucun slot valide après délai → UI affiche message & bouton disabled.
- API Supabase indisponible → toast erreur + action “Réessayer”.
- Mauvaise combinaison service/slot (ex: Express < 24h) → 400 avec explication.

## 7. Edge Cases
- Date de collecte choisie en fin de journée → vérifier que le délai se base sur l’heure de début du créneau.
- Changement de service en cours de flow → recalculer délai minimal et réinitialiser sélection livraison.
- Slots très nombreux (performance) → limiter requête à 30 jours glissants.
- Utilisateur revient sur step et modifie collecte → remettre à zéro livraison si non conforme.

## 8. Testing Strategy
- Unit : validation délais + grouping slots par date.
- Integration : API bookings (success / failure cases).
- UI : tests RTL sur step (sélection/désactivation).
- QA manuelle :
  - Classic → aucune livraison < 72h.
  - Express → aucune livraison < 24h.
  - Slot fermé → ne s’affiche pas.
  - Modification réservation → nouveaux slots pris en compte.

## 9. Rollout Plan
- Déploiement feature flag ? (optionnel) – non prévu pour l’instant.
- Migration DB exécutée hors heures ouvrées, backup avant.
- Monitoring logs API pour détecter anomalies slots.
- Communication interne aux opérateurs sur le nouveau process.

## 10. Out of Scope
- Gestion automatique des capacités (sera traité plus tard).
- Interface d’administration pour gérer les slots.
- Notifications ou email de confirmation personnalisés.
- Optimisation algorithmique de la livraison (assignation automatique).
