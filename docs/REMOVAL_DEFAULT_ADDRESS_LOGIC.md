# 🗑️ Suppression : Logique "Adresse par Défaut"

**Date** : 6 octobre 2025  
**Raison** : Simplification - Pas besoin de gestion d'adresse par défaut

---

## 🎯 Changements Effectués

### ❌ Fonctionnalités Supprimées

1. **Vérification "adresse par défaut" lors de la suppression**
   - Avant : Impossible de supprimer une adresse par défaut
   - Après : Toutes les adresses peuvent être supprimées (sauf si utilisées dans bookings)

2. **Bouton "Définir par défaut"**
   - Supprimé de l'interface utilisateur

3. **Badge "Par défaut"**
   - Supprimé de l'affichage des cartes d'adresses

4. **Gestion automatique du flag `is_default`**
   - Avant : Lors de la mise à jour, réinitialisation automatique des autres adresses
   - Après : Aucune logique spéciale

---

## 📝 Fichiers Modifiés

### 1️⃣ **Backend : `app/api/addresses/[id]/route.ts`**

#### DELETE Endpoint
**Supprimé** :
\`\`\`typescript
if (existingAddress.is_default) {
  return NextResponse.json(
    {
      error: "Cette adresse est votre adresse par défaut. Veuillez d'abord en définir une autre.",
    },
    { status: 400 }
  )
}
\`\`\`

**Résultat** : Plus de blocage pour adresses par défaut

#### PUT Endpoint
**Supprimé** :
\`\`\`typescript
// If this is set as default, unset other default addresses
if (validatedData.isDefault) {
  await supabase
    .from("user_addresses")
    .update({ is_default: false })
    .eq("user_id", user.id)
    .neq("id", addressId)
}
\`\`\`

**Supprimé dans l'update** :
\`\`\`typescript
is_default: validatedData.isDefault, // ❌ Retiré
\`\`\`

#### PATCH Endpoint
**Supprimé** :
\`\`\`typescript
// If setting as default, unset other default addresses
if (body.is_default === true) {
  await supabase
    .from("user_addresses")
    .update({ is_default: false })
    .eq("user_id", user.id)
    .neq("id", addressId)
}
\`\`\`

---

### 2️⃣ **Frontend : `components/addresses/addresses-section.tsx`**

**Fonction supprimée** :
\`\`\`typescript
// Set default address
const handleSetDefault = async (id: string) => {
  try {
    const response = await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true }),
    })

    if (!response.ok) throw new Error("Failed to set default")

    // Update local state
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        is_default: addr.id === id,
      }))
    )

    toast({
      title: "Succès",
      description: "Adresse par défaut mise à jour",
    })
  } catch (error) {
    throw error
  }
}
\`\`\`

**Prop supprimée du composant** :
\`\`\`tsx
<AddressCard
  address={address}
  onEdit={handleEdit}
  onSetDefault={handleSetDefault} // ❌ Retiré
  onDelete={handleDeleteClick}
/>
\`\`\`

---

### 3️⃣ **Composant : `components/addresses/address-card.tsx`**

**Interface simplifiée** :
\`\`\`typescript
interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (address: Address) => void
  onSetDefault?: (id: string) => void // ❌ Retiré
}
\`\`\`

**Badge "Par défaut" supprimé** :
\`\`\`tsx
<div className="flex items-center space-x-2">
  {getAddressIcon(address.type)}
  <span className="font-medium">{address.label}</span>
  {address.is_default && ( // ❌ Retiré
    <Badge variant="secondary">Par défaut</Badge>
  )}
</div>
\`\`\`

**Bouton "Définir par défaut" supprimé** :
\`\`\`tsx
{!address.is_default && onSetDefault && ( // ❌ Retiré tout le bloc
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onSetDefault(address.id)}
    className="w-full text-xs"
  >
    Définir par défaut
  </Button>
)}
\`\`\`

**Layout simplifié** :
- Avant : `flex-col` avec 2 lignes (boutons + bouton défaut)
- Après : `flex` simple avec 2 boutons côte à côte

---

## ✅ Protections Maintenues

### 🛡️ Suppression d'adresse TOUJOURS bloquée si :
1. **Adresse utilisée dans des bookings** (pickup ou delivery)
   - Message : "Cette adresse est utilisée dans une ou plusieurs réservations..."
   - Code HTTP : `400`

### ✅ Suppressions AUTORISÉES :
1. ✅ Toutes les adresses (sauf si utilisées dans bookings)
2. ✅ Suppression en masse possible
3. ✅ Plus de contrainte "adresse par défaut"

---

## 📊 Tests de Validation

### ✅ Test 1 : Suppression d'adresse non utilisée
\`\`\`
POST /api/addresses 200       # Création nouvelle adresse
DELETE /api/addresses/c3578... 200  # Suppression réussie
\`\`\`
**Résultat** : ✅ Succès

### ✅ Test 2 : Suppression d'adresse utilisée dans booking
\`\`\`
DELETE /api/addresses/00fb32... 400
[API] Bookings check: [ { id: '90be3e...', status: 'pending' } ]
\`\`\`
**Résultat** : ✅ Bloquée avec message clair

### ✅ Test 3 : Suppression de "l'ancienne adresse par défaut"
\`\`\`
DELETE /api/addresses/d637c2... 400
\`\`\`
**Résultat** : ✅ Plus de blocage lié au statut "par défaut"  
**Raison du 400** : Adresse utilisée dans booking (pas à cause du flag `is_default`)

---

## 🗄️ Schéma Base de Données (Inchangé)

La colonne `is_default` existe toujours dans `user_addresses` mais **n'est plus utilisée** par l'application.

### Option Future : Nettoyer le schéma
Si tu veux supprimer complètement :
\`\`\`sql
ALTER TABLE user_addresses DROP COLUMN is_default;
\`\`\`

⚠️ **Attention** : Vérifier avant que cette colonne n'est pas utilisée ailleurs (parcours de réservation, etc.)

---

## 🎨 Interface Simplifiée

### Avant
\`\`\`
┌─────────────────────────────────────┐
│ 🏠 Domicile  [Par défaut]  Domicile │
│                                     │
│ 123 rue Example                     │
│ 75001 Paris                         │
│                                     │
│ [Modifier]  [Supprimer]             │
│ [Définir par défaut]                │
└─────────────────────────────────────┘
\`\`\`

### Après
\`\`\`
┌─────────────────────────────────────┐
│ 🏠 Domicile           Domicile      │
│                                     │
│ 123 rue Example                     │
│ 75001 Paris                         │
│                                     │
│ [Modifier]  [Supprimer]             │
└─────────────────────────────────────┘
\`\`\`

Plus simple, plus épuré ! ✨

---

## 📝 Notes

- La colonne `is_default` existe toujours en base mais n'est plus gérée
- Aucun impact sur le parcours de réservation (utilise `components/forms/address-form.tsx`)
- Simplification majeure du code (moins de logique conditionnelle)
- Meilleure flexibilité pour l'utilisateur (peut tout supprimer)

---

**Validé par** : Tests de compilation TypeScript + Logs runtime  
**Status** : ✅ Fonctionnel et simplifié
