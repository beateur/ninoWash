# 📍 Composants Adresses

Ce dossier contient tous les composants liés à la **gestion des adresses** de l'utilisateur.

## 📁 Structure

\`\`\`
components/addresses/
├── address-card.tsx              # Carte d'affichage d'une adresse (avec actions Modifier/Supprimer)
├── address-delete-confirm.tsx    # Dialog de confirmation de suppression
├── address-form-dialog.tsx       # Dialog contenant le formulaire d'ajout/édition d'adresse
└── addresses-section.tsx         # Section complète de gestion des adresses (utilisée dans /addresses)
\`\`\`

## 🎯 Usage

### Page dédiée `/addresses`
\`\`\`tsx
import { AddressesSection } from "@/components/addresses/addresses-section"

export default function AddressesPage() {
  return <AddressesSection />
}
\`\`\`

### Utilisation individuelle
\`\`\`tsx
import { AddressCard } from "@/components/addresses/address-card"
import { AddressFormDialog } from "@/components/addresses/address-form-dialog"

// Afficher une carte d'adresse
<AddressCard
  address={address}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

// Dialog de création/édition
<AddressFormDialog
  address={editingAddress}
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={handleSuccess}
/>
\`\`\`

## ⚠️ Différence avec `components/forms/address-form.tsx`

- **`components/forms/address-form.tsx`**: Formulaire utilisé dans le **parcours de réservation** (booking flow) pour les utilisateurs invités et authentifiés
- **`components/addresses/address-form-dialog.tsx`**: Dialog complet pour la **page de gestion des adresses** (`/addresses`)

Ces deux composants ont des contextes d'utilisation différents et ne doivent pas être confondus.

## 🔗 Routes associées

- **`/addresses`** - Page de gestion des adresses (utilise `AddressesSection`)
- **`/api/addresses`** - CRUD des adresses (GET, POST)
- **`/api/addresses/[id]`** - CRUD individuel (GET, PATCH, DELETE)

## 🔒 Sécurité

Tous les composants utilisent l'authentification Supabase et les RLS policies pour sécuriser l'accès aux données.
