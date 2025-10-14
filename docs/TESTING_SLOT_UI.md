# Guide de Test - Interface de Réservation par Créneaux

## ✅ Intégration Complétée

L'interface de sélection de créneaux Collecte & Livraison est maintenant **complètement intégrée** dans le parcours de réservation invité.

## 📋 Fichiers Modifiés

### 1. Composant DateTimeStep (Réécrit)
**Fichier**: `components/booking/guest/steps/datetime-step.tsx`
- ✅ **Ancien système supprimé** : Calendrier manuel + sélection d'horaires statiques
- ✅ **Nouveau système intégré** : Composant `CollectionDeliveryStep` avec créneaux dynamiques
- ✅ **Props adaptées** : Gère la conversion entre `Date` et `string` pour compatibilité avec le hook

### 2. Container de Réservation Invité (Adapté)
**Fichier**: `components/booking/guest/guest-booking-container.tsx`
- ✅ **Wrapper ajouté** : Conversion des types entre `DateTimeStep` et `updateDateTime`
- ✅ **Gestion des slots** : Transmission des objets `LogisticSlot` au hook d'état

### 3. Hook d'État (Déjà mis à jour)
**Fichier**: `lib/hooks/use-guest-booking.ts`
- ✅ **Interface étendue** : Champs `pickupSlot` et `deliverySlot` ajoutés
- ✅ **Validation améliorée** : Supporte à la fois les dates legacy et les slots

## 🧪 Plan de Test - Phase 1 : Interface

### Pré-requis
1. **Insérer les slots de test dans Supabase** :
   \`\`\`bash
   # Copier le contenu du fichier
   cat scripts/insert-test-slots.sql
   
   # Puis dans Supabase Dashboard > SQL Editor > Nouvelle requête
   # Coller et exécuter le script
   \`\`\`

2. **Vérifier que les slots sont créés** :
   \`\`\`sql
   SELECT role, slot_date, start_time, end_time, label, is_open 
   FROM public.logistic_slots 
   WHERE slot_date IN ('2025-10-14', '2025-10-16')
   ORDER BY slot_date, role, start_time;
   \`\`\`
   
   **Résultat attendu** : 8 lignes
   - 4 slots pour le mardi 14 octobre (2 pickup + 2 delivery)
   - 4 slots pour le jeudi 16 octobre (2 pickup + 2 delivery)

### Test 1 : Accès à la Page de Réservation
1. Ouvrir le navigateur : `http://localhost:3000/reservation/guest`
2. **Attendu** : Page de réservation invité avec étape 1 (Services)

### Test 2 : Navigation jusqu'à l'Étape Date & Heure
1. **Étape 1** : Sélectionner un service (ex: "Repassage uniquement")
2. Cliquer sur "Continuer"
3. **Étape 2** : Remplir les champs adresse
   - Contact : email + téléphone
   - Adresse collecte : adresse complète
   - Adresse livraison : même adresse ou différente
4. Cliquer sur "Continuer"
5. **Étape 3** : Vous devriez voir l'interface de sélection de créneaux

### Test 3 : Vérification de l'Interface de Slots

**Éléments attendus sur la page :**

#### 📅 Onglets de Dates
- Onglets affichant les dates disponibles (mardi 14 oct, jeudi 16 oct)
- Format : "lun. 14 oct." (format fr)
- Onglet actif mis en évidence

#### 📦 Section Collecte
- **Titre** : "🏠 Collecte à domicile"
- **Description** : "Sélectionnez un créneau pour la collecte de votre linge"
- **Cartes de créneaux** :
  - Badge "Collecte" (bleu)
  - Label du créneau (ex: "Après-midi", "Soirée")
  - Plage horaire (ex: "14:00 - 17:00")
- **État vide** : Message "Aucun créneau disponible" si pas de slots pour cette date

#### 🚚 Section Livraison
- **Titre** : "🚚 Livraison à domicile"
- **Description** : "Sélectionnez un créneau pour la livraison de votre linge"
- **Cartes de créneaux** : Même structure que Collecte
- **Badge "Livraison"** (vert)

#### ⚠️ Validation
- Message d'avertissement si un seul slot sélectionné :
  > "⚠️ Veuillez sélectionner un créneau de collecte ET un créneau de livraison pour continuer."
- Bouton "Continuer" désactivé jusqu'à sélection complète

### Test 4 : Interaction Utilisateur

#### Sélection d'un Créneau de Collecte
1. Cliquer sur une carte de créneau dans la section "Collecte"
2. **Attendu** :
   - Carte devient bleu foncé (sélectionnée)
   - Icône de check apparaît
   - Autres cartes restent claires
3. Cliquer sur un autre créneau
4. **Attendu** : La sélection se déplace (un seul créneau sélectionné à la fois)

#### Sélection d'un Créneau de Livraison
1. Cliquer sur une carte de créneau dans la section "Livraison"
2. **Attendu** : Même comportement que pour Collecte
3. **Avertissement disparaît** dès que les deux sélections sont faites
4. **Bouton "Continuer" s'active** (devient cliquable)

#### Navigation entre Dates
1. Cliquer sur l'onglet "jeudi 16 oct."
2. **Attendu** :
   - Créneaux changent pour afficher ceux du 16 octobre
   - Sélections précédentes sont perdues (normal, design actuel)
3. Re-cliquer sur "mardi 14 oct."
4. **Attendu** : Retour aux créneaux du 14 octobre

### Test 5 : Validation et Passage à l'Étape Suivante
1. Sélectionner un créneau de Collecte
2. Sélectionner un créneau de Livraison
3. Vérifier que le bouton "Continuer" est actif
4. Cliquer sur "Continuer"
5. **Attendu** :
   - Transition vers Étape 4 (Résumé)
   - Les informations de slots devraient être visibles dans le résumé

### Test 6 : États de Chargement
1. Rafraîchir la page à l'étape 3
2. **Attendu** (pendant le chargement) :
   - Skeletons (rectangles gris animés) à la place des cartes
   - Pas d'erreur visible

3. **Une fois chargé** :
   - Skeletons remplacés par les vraies cartes de créneaux

### Test 7 : Gestion d'Erreurs
Pour tester le cas où l'API échoue :
1. Désactiver temporairement la connexion Supabase (modifier `.env.local`)
2. Rafraîchir la page
3. **Attendu** :
   - Alert rouge avec message d'erreur
   - Pas de crash de l'application

## 🐛 Points de Vérification Communs

### ❌ Problème : "Aucun créneau disponible" affiché
**Cause** : Slots pas insérés dans Supabase OU date des slots dépassée
**Solution** :
1. Vérifier dans Supabase SQL Editor :
   \`\`\`sql
   SELECT * FROM logistic_slots WHERE is_open = TRUE AND slot_date >= CURRENT_DATE;
   \`\`\`
2. Si vide, exécuter `scripts/insert-test-slots.sql`
3. Si les dates sont dans le passé, modifier le script avec des dates futures

### ❌ Problème : Erreur 401 (Unauthorized) dans la console
**Cause** : Politique RLS trop restrictive
**Solution** :
1. Vérifier dans Supabase Dashboard > Authentication > Policies
2. La table `logistic_slots` doit avoir une policy SELECT pour `anon` :
   \`\`\`sql
   CREATE POLICY "Public read access for available slots"
   ON public.logistic_slots FOR SELECT
   TO anon, authenticated
   USING (is_open = TRUE AND slot_date >= CURRENT_DATE);
   \`\`\`

### ❌ Problème : Interface "ancienne" (calendrier visible)
**Cause** : Cache de Next.js ou erreur de compilation
**Solution** :
1. Arrêter le serveur dev (Ctrl+C)
2. Supprimer le cache :
   \`\`\`bash
   rm -rf .next
   \`\`\`
3. Redémarrer :
   \`\`\`bash
   pnpm dev
   \`\`\`

### ❌ Problème : Bouton "Continuer" reste désactivé malgré les sélections
**Cause** : État des slots non synchronisé
**Solution** :
1. Ouvrir DevTools (F12) > Console
2. Chercher des erreurs React
3. Vérifier que les callbacks `onPickupSelect` et `onDeliverySelect` sont bien appelés
4. Rafraîchir la page complètement

## 📊 Phase 2 : Test Backend (API)

Une fois l'interface validée, tester le parcours complet :

### Test API - Création de Réservation avec Slots
1. Compléter tout le parcours jusqu'à l'étape "Résumé"
2. Ouvrir DevTools > Network
3. Cliquer sur "Confirmer la réservation"
4. Rechercher la requête `POST /api/bookings`
5. **Vérifier le payload** :
   \`\`\`json
   {
     "pickupSlotId": 1,
     "deliverySlotId": 2,
     "serviceId": "...",
     "guestContact": {...},
     ...
   }
   \`\`\`
6. **Réponse attendue** : 201 Created avec l'objet booking

### Test Validation - Délais 24h/72h
1. Créer un slot avec une date dans moins de 24h :
   \`\`\`sql
   INSERT INTO logistic_slots (role, slot_date, start_time, end_time, label, is_open)
   VALUES ('pickup', CURRENT_DATE + INTERVAL '12 hours', '14:00', '17:00', 'Test', TRUE);
   \`\`\`
2. Essayer de réserver un service Express avec ce slot
3. **Attendu** : Erreur 400 "Le créneau de collecte doit être dans au moins 24h"

## 📝 Checklist de Validation Complète

- [ ] Slots insérés dans Supabase (8 slots minimum)
- [ ] Onglets de dates s'affichent correctement
- [ ] Cartes de créneaux Collecte visibles avec badge bleu
- [ ] Cartes de créneaux Livraison visibles avec badge vert
- [ ] Sélection d'un créneau met la carte en surbrillance
- [ ] Sélection multiple (Collecte + Livraison) active le bouton "Continuer"
- [ ] Avertissement disparaît après double sélection
- [ ] Bouton "Continuer" redirige vers l'étape Résumé
- [ ] Résumé affiche les informations de slots (si implémenté)
- [ ] API `/api/bookings` reçoit `pickupSlotId` et `deliverySlotId`
- [ ] Validation des délais 24h/72h fonctionne côté backend

## 🎯 Prochaines Étapes

### Améliorations UX à Prévoir
1. **Persistance de sélection** : Conserver les slots sélectionnés lors du changement d'onglet de date
2. **Affichage dans le résumé** : Formater joliment les créneaux dans l'étape 4
3. **Indicateur de disponibilité** : Badge "Places limitées" si `capacity_remaining` faible
4. **Suggestions intelligentes** : Proposer automatiquement des créneaux de livraison compatibles avec la collecte

### Intégration Fullstack
1. **Email de confirmation** : Envoyer les détails des créneaux par email
2. **Notifications** : Rappels 24h avant le créneau
3. **Gestion admin** : Interface pour créer/modifier/fermer des slots
4. **Analytics** : Tracker les créneaux les plus populaires

## 📖 Documentation Associée
- `docs/PRD/PRD_BOOKING_COLLECTION_DELIVERY.md` - Product Requirements
- `docs/IMPLEMENTATION_PLAN_SLOTS.md` - Plan d'implémentation technique
- `docs/SLOT_INTEGRATION_GUIDE.md` - Guide d'intégration (ce document complète)
