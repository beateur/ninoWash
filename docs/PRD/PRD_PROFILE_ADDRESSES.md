# PRD: Gestion des Adresses

**Status**: 🔴 À implémenter  
**Date**: 5 octobre 2025  
**Priority**: 🔴 High (Bloquant pour flow de réservation)  
**Design**: Minimaliste, épuré, premium

---

## 1. Vision

Offrir une expérience fluide et élégante pour gérer ses adresses. Chaque interaction doit respirer la simplicité et le soin du détail, à l'image du service Nino Wash.

### Principes Design
- **Clarté** : Une action par écran, pas de surcharge
- **Rapidité** : 2 clics maximum pour ajouter/modifier
- **Élégance** : Espacements généreux, typographie soignée
- **Cohérence** : Reprendre les patterns du dashboard existant

---

## 2. User Journey

### Scénario Principal
1. User clique "Mes adresses" dans le menu profil
2. Page `/profile#addresses` s'affiche avec liste élégante
3. User voit ses adresses sous forme de cartes espacées
4. User peut ajouter, modifier, définir par défaut, supprimer
5. Feedback immédiat et subtil (toast discret)

### Moments Clés
- **Première visite** : Message encourageant "Ajoutez votre première adresse"
- **Liste vide** : CTA prominent mais élégant
- **Modification** : Dialog fluide sans quitter la page
- **Suppression** : Confirmation élégante avec undo option

---

## 3. Spécifications Fonctionnelles

### 3.1 Vue Liste (État par défaut)

\`\`\`
┌─────────────────────────────────────────────────────────┐
│  Mes Adresses                                     [+ Nouvelle adresse]
│
│  ┌──────────────────────────────────────────────┐
│  │  🏠  Domicile                    [PAR DÉFAUT] │
│  │     15 Avenue des Champs-Élysées               │
│  │     75008 Paris                                │
│  │     Digicode: 1234A • Étage 3                  │
│  │                                   [Modifier] [•••] │
│  └──────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────┐
│  │  🏢  Bureau                                    │
│  │     42 Rue de Rivoli                           │
│  │     75004 Paris                                │
│  │     Accueil : Demander Sophie                  │
│  │                                   [Modifier] [•••] │
│  └──────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────┘
\`\`\`

### 3.2 Composants UI

#### Card Adresse
\`\`\`typescript
interface AddressCardProps {
  address: Address
  isDefault: boolean
  onEdit: () => void
  onSetDefault: () => void
  onDelete: () => void
}
\`\`\`

**Design**:
- Border subtil (gray-200)
- Hover: élévation douce (shadow-md)
- Espacement: p-6
- Typographie: 
  - Label: font-medium, text-base
  - Adresse: text-sm, text-muted-foreground
  - Badge "Par défaut": bg-primary/10, text-primary

#### Dialog Ajout/Modification
\`\`\`typescript
<DialogContent className="sm:max-w-lg">
  <DialogHeader>
    <DialogTitle className="text-2xl font-light">
      {isEdit ? 'Modifier l'adresse' : 'Nouvelle adresse'}
    </DialogTitle>
    <DialogDescription className="text-muted-foreground">
      Les informations renseignées faciliteront la collecte et la livraison.
    </DialogDescription>
  </DialogHeader>
  <AddressForm />
</DialogContent>
\`\`\`

**Champs** (dans cet ordre):
1. **Libellé** : "Domicile", "Bureau", "Chez mes parents"... (input libre)
2. **Type** : Icons 🏠 Domicile | 🏢 Bureau | 📍 Autre (radio cards)
3. **Adresse** : Autocomplétion Google Places (optionnel)
4. **Complément** : Appartement, bâtiment, étage (optionnel)
5. **Code postal** : Validation format 5 chiffres
6. **Ville** : Détection auto ou saisie manuelle
7. **Instructions** : "Sonner 2 fois, laisser devant la porte..." (textarea, optionnel)
8. **Code d'accès** : Digicode, badge, code portail (optionnel)
9. **Définir par défaut** : Toggle subtil en bas du form

### 3.3 Actions Disponibles

| Action | Déclencheur | Résultat | Feedback |
|--------|-------------|----------|----------|
| **Ajouter** | Bouton "+ Nouvelle adresse" | Dialog s'ouvre | Form vide, focus sur libellé |
| **Modifier** | Bouton "Modifier" sur card | Dialog s'ouvre | Form pré-rempli |
| **Définir par défaut** | Toggle ou menu "•••" | Badge "Par défaut" se déplace | Toast "Adresse par défaut mise à jour" |
| **Supprimer** | Menu "•••" → Supprimer | Confirmation dialog | Toast "Adresse supprimée" + Undo 5s |

### 3.4 États Spéciaux

#### Liste Vide (Première visite)
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              📍                                          │
│         Aucune adresse                                   │
│                                                          │
│    Ajoutez votre première adresse pour faciliter         │
│    vos futures réservations de pressing.                 │
│                                                          │
│         [+ Ajouter ma première adresse]                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
\`\`\`

#### Loading
- Skeleton cards (3 cartes grises animées)
- Animation douce (pulse)

#### Erreur
- Toast discret en haut à droite
- Message clair : "Impossible de charger les adresses. Réessayez."

---

## 4. Architecture Technique

### 4.1 Frontend

**Fichiers à créer**:
\`\`\`
components/profile/
  ├── addresses-section.tsx          ← Section principale
  ├── address-card.tsx               ← Card individuelle
  ├── address-form-dialog.tsx        ← Dialog add/edit
  └── address-delete-confirm.tsx     ← Dialog confirmation
\`\`\`

**Intégration**:
- Modifier `app/(authenticated)/profile/page.tsx`
- Ajouter section `<AddressesSection />` avec anchor `#addresses`
- Gérer scroll smooth vers section si hash présent

**State Management**:
\`\`\`typescript
const [addresses, setAddresses] = useState<Address[]>([])
const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
const [isDialogOpen, setIsDialogOpen] = useState(false)
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
\`\`\`

### 4.2 Backend

**API Routes existantes** (à utiliser):
- `GET /api/addresses` - Lister les adresses
- `POST /api/addresses` - Créer une adresse
- `PUT /api/addresses` - Modifier une adresse
- `DELETE /api/addresses` - Supprimer une adresse

**Validation Zod** (déjà existante dans `lib/validations/booking.ts`):
\`\`\`typescript
export const addressSchema = z.object({
  type: z.enum(["home", "work", "other"]).default("home"),
  label: z.string().min(1, "Libellé requis"),
  streetAddress: z.string().min(5, "Adresse complète requise"),
  apartment: z.string().optional(),
  city: z.string().min(2, "Ville requise"),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  deliveryInstructions: z.string().optional(),
  accessCode: z.string().optional(),
  isDefault: z.boolean().default(false),
})
\`\`\`

### 4.3 Database

**Table existante** : `user_addresses`

Colonnes déjà présentes :
- `id`, `user_id`, `type`, `label`
- `street_address`, `apartment`, `city`, `postal_code`
- `delivery_instructions`, `access_code`
- `is_default`, `created_at`, `updated_at`

**Aucune migration nécessaire** ✅

---

## 5. Design System

### 5.1 Couleurs & Styles

\`\`\`typescript
// Card normale
className="border border-gray-200 bg-white rounded-xl p-6 transition-all hover:shadow-md"

// Card par défaut
className="border-2 border-primary bg-primary/5 rounded-xl p-6"

// Badge "Par défaut"
className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"

// Bouton "+ Nouvelle adresse"
<Button className="bg-primary hover:bg-primary/90 text-white">
  <Plus className="mr-2 h-4 w-4" />
  Nouvelle adresse
</Button>

// Menu actions (•••)
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
</DropdownMenu>
\`\`\`

### 5.2 Animations

\`\`\`typescript
// Apparition des cards
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>

// Dialog
<DialogContent className="sm:max-w-lg" forceMount>
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.15 }}
  >
\`\`\`

### 5.3 Micro-interactions

- **Hover card** : Élévation shadow-sm → shadow-md
- **Click bouton** : Scale 0.98 pendant 100ms
- **Toast** : Slide-in from top-right, auto-dismiss 3s
- **Suppression** : Fade-out de la card (300ms)

---

## 6. User Flow Détaillé

### 6.1 Ajouter une Adresse

\`\`\`
1. User clique "+ Nouvelle adresse"
2. Dialog s'ouvre avec animation douce
3. User remplit les champs (label + adresse minimum)
4. User clique "Ajouter"
5. Loading 200ms (spinner discret)
6. Dialog se ferme
7. Nouvelle card apparaît en haut de liste (animation)
8. Toast "Adresse ajoutée avec succès" (3s)
\`\`\`

### 6.2 Définir par Défaut

\`\`\`
1. User clique toggle "Définir par défaut" ou menu "•••"
2. Badge "Par défaut" se déplace instantanément
3. Card devient highlighted (border-primary)
4. Toast discret "Adresse par défaut mise à jour"
\`\`\`

### 6.3 Supprimer une Adresse

\`\`\`
1. User clique menu "•••" → "Supprimer"
2. Dialog confirmation élégant:
   "Supprimer l'adresse {label} ?"
   "Cette action est irréversible."
3. User confirme
4. Card fait fade-out (300ms)
5. Toast avec bouton "Annuler" pendant 5s
6. Si "Annuler" : card réapparaît (fade-in)
\`\`\`

---

## 7. Edge Cases & Validations

### Règles Métier

| Situation | Comportement |
|-----------|--------------|
| **Supprimer adresse par défaut** | Confirmation spéciale : "Cette adresse est votre adresse par défaut. Veuillez d'abord en définir une autre." |
| **Supprimer dernière adresse** | Autorisé (user peut ajouter à nouveau) |
| **Définir par défaut** | Si déjà une par défaut : l'ancienne perd le badge automatiquement |
| **Code postal invalide** | Erreur inline : "Format attendu : 75008" |
| **Adresse incomplète** | Bouton "Ajouter" disabled tant que label + adresse + ville + CP manquants |

### Messages d'Erreur (Ton Premium)

\`\`\`typescript
const errorMessages = {
  loadFailed: "Impossible de charger vos adresses. Veuillez réessayer.",
  createFailed: "L'ajout de l'adresse a échoué. Réessayez dans un instant.",
  updateFailed: "La modification n'a pu être enregistrée. Réessayez.",
  deleteFailed: "La suppression a échoué. Veuillez réessayer.",
  network: "Connexion perdue. Vérifiez votre réseau.",
}
\`\`\`

---

## 8. Responsive Design

### Desktop (≥ 1024px)
- Cards en grille 2 colonnes
- Dialog centré (max-w-lg)
- Espacements généreux (gap-6)

### Tablet (768-1023px)
- Cards en grille 2 colonnes
- Dialog pleine largeur avec marges

### Mobile (< 768px)
- Cards en liste (1 colonne)
- Dialog fullscreen
- Boutons touch-friendly (min-h-12)

---

## 9. Accessibilité

- ✅ Labels ARIA sur tous les boutons
- ✅ Focus visible (ring-2 ring-primary)
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader friendly
- ✅ Contraste WCAG AA minimum

\`\`\`typescript
<button
  aria-label="Modifier l'adresse Domicile"
  className="focus:ring-2 focus:ring-primary"
>
\`\`\`

---

## 10. Performance

### Optimisations
- **Lazy load** : Charger form dialog seulement au clic
- **Optimistic updates** : Mise à jour UI avant confirmation serveur
- **Debounce** : Sur validation code postal (300ms)
- **Cache** : Stocker addresses en local (revalidate on focus)

### Métriques Cibles
- **Temps chargement liste** : < 500ms
- **Temps ajout adresse** : < 1s (ressenti instantané)
- **First paint** : < 100ms

---

## 11. Tests à Réaliser

### Scénarios Critiques
- [ ] Ajouter première adresse
- [ ] Ajouter adresse avec tous les champs remplis
- [ ] Modifier adresse existante
- [ ] Définir nouvelle adresse par défaut
- [ ] Supprimer adresse (non par défaut)
- [ ] Supprimer adresse par défaut (erreur attendue)
- [ ] Undo après suppression (5s max)
- [ ] Navigation via hash `/profile#addresses`
- [ ] Responsive mobile

---

## 12. Rollout Plan

### Phase 1 (Semaine 1)
- [ ] Créer `AddressesSection` component
- [ ] Créer `AddressCard` component
- [ ] Intégrer dans `/profile`
- [ ] Tests manuels desktop

### Phase 2 (Semaine 2)
- [ ] Créer `AddressFormDialog`
- [ ] Implémenter CRUD complet
- [ ] Toast notifications
- [ ] Tests responsive

### Phase 3 (Semaine 3)
- [ ] Undo suppression
- [ ] Animations micro-interactions
- [ ] Tests E2E
- [ ] Documentation

---

## 13. Success Metrics

| Métrique | Cible | Mesure |
|----------|-------|--------|
| **Temps ajout adresse** | < 30s | Analytics |
| **Taux d'abandon form** | < 5% | Hotjar |
| **Erreurs validation** | < 2% | Logs API |
| **Satisfaction** | > 4.5/5 | Survey in-app |

---

## 14. Out of Scope (Phase 2)

- ❌ Autocomplétion Google Places (nice to have)
- ❌ Validation adresse via API externe
- ❌ Géolocalisation automatique
- ❌ Import bulk adresses
- ❌ Partage d'adresse entre users

---

**Temps estimé** : 2-3 jours développement + 1 jour tests
**Dépendances** : Aucune (APIs déjà présentes)
**Risques** : Faible (feature isolée)
