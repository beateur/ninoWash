# 🛡️ Fix : Protection Suppression Adresses Liées aux Réservations

**Date** : 6 octobre 2025  
**Problème** : Erreur 500 lors de la suppression d'une adresse utilisée dans des réservations  
**Cause** : Contrainte de clé étrangère (`foreign key constraint`) non gérée côté application

---

## 🔴 Erreur Originale

```
[API] Address deletion error: {
  code: '23503',
  details: 'Key (id)=(d637c2d4-eb07-4afc-bf7d-138e69d5900f) is still referenced from table "bookings".',
  hint: null,
  message: 'update or delete on table "user_addresses" violates foreign key constraint "bookings_pickup_address_id_fkey" on table "bookings"'
}
DELETE /api/addresses/d637c2d4-eb07-4afc-bf7d-138e69d5900f 500 in 1337ms
```

**Impact** : Mauvaise UX - Message d'erreur technique non compréhensible par l'utilisateur

---

## ✅ Solution Implémentée

### 1️⃣ **Vérification Préventive (Backend)**

Ajout d'une vérification AVANT la tentative de suppression dans `app/api/addresses/[id]/route.ts` :

```typescript
// Check if address is used in any bookings
const { data: bookingsWithAddress, error: bookingCheckError } = await supabase
  .from("bookings")
  .select("id, status")
  .or(`pickup_address_id.eq.${addressId},delivery_address_id.eq.${addressId}`)
  .limit(1)

if (bookingsWithAddress && bookingsWithAddress.length > 0) {
  return NextResponse.json(
    {
      error:
        "Cette adresse est utilisée dans une ou plusieurs réservations et ne peut pas être supprimée. Vous pouvez la modifier si nécessaire.",
    },
    { status: 400 } // 400 au lieu de 500
  )
}
```

### 2️⃣ **Fallback sur Erreur PostgreSQL**

Si la vérification échoue et que PostgreSQL rejette quand même la suppression :

```typescript
if (deleteError) {
  console.error("[API] Address deletion error:", deleteError)
  
  // Check if it's a foreign key constraint error
  if (deleteError.code === "23503") {
    return NextResponse.json(
      {
        error:
          "Cette adresse est liée à des réservations existantes et ne peut pas être supprimée.",
      },
      { status: 400 } // Message utilisateur friendly
    )
  }
  
  return NextResponse.json(
    { error: "Erreur lors de la suppression de l'adresse" },
    { status: 500 }
  )
}
```

### 3️⃣ **Gestion des Erreurs Frontend**

Mise à jour de `components/addresses/addresses-section.tsx` :

```typescript
const handleDeleteConfirm = async () => {
  try {
    const response = await fetch(`/api/addresses/${deleteConfirm.address.id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || "Failed to delete")
    }

    // Success...
  } catch (error) {
    console.error("[v0] Delete address error:", error)
    toast({
      title: "Erreur",
      description: error instanceof Error 
        ? error.message 
        : "Impossible de supprimer cette adresse",
      variant: "destructive",
    })
    setDeleteConfirm({ open: false, address: null })
  }
}
```

**Avant** : `throw error` → erreur non gérée  
**Après** : Toast d'erreur avec message clair

### 4️⃣ **Amélioration UX : Bouton "Définir par défaut"**

Ajout d'une prop `onSetDefault` au composant `AddressCard` :

```tsx
// components/addresses/address-card.tsx
interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (address: Address) => void
  onSetDefault?: (id: string) => void // ✅ Ajouté
}

// Affichage conditionnel du bouton
{!address.is_default && onSetDefault && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onSetDefault(address.id)}
    className="w-full text-xs"
  >
    Définir par défaut
  </Button>
)}
```

---

## 🔍 Contraintes de Clé Étrangère Concernées

### Table `bookings`

```sql
ALTER TABLE bookings 
  ADD CONSTRAINT bookings_pickup_address_id_fkey 
  FOREIGN KEY (pickup_address_id) 
  REFERENCES user_addresses(id);

ALTER TABLE bookings 
  ADD CONSTRAINT bookings_delivery_address_id_fkey 
  FOREIGN KEY (delivery_address_id) 
  REFERENCES user_addresses(id);
```

**Comportement** : Si une adresse est référencée dans `bookings.pickup_address_id` ou `bookings.delivery_address_id`, PostgreSQL **bloque la suppression** (code d'erreur `23503`).

---

## 🎯 Flux de Suppression (Après Fix)

```
User clicks "Supprimer"
  ↓
Frontend sends DELETE /api/addresses/{id}
  ↓
Backend: Verify ownership ✅
  ↓
Backend: Check if is_default ❌ → 400 (message clair)
  ↓
Backend: Check if used in bookings ❌ → 400 (message clair)
  ↓
Backend: DELETE from database ✅
  ↓
PostgreSQL constraint error (fallback) ❌ → 400 (code 23503 détecté)
  ↓
Frontend: Display toast with error message
```

---

## 🧪 Tests Suggérés

1. **Adresse non utilisée** → Suppression réussie ✅
2. **Adresse par défaut** → Erreur claire : "Définir une autre adresse par défaut d'abord"
3. **Adresse dans booking** → Erreur claire : "Adresse utilisée dans des réservations"
4. **Adresse supprimée puis réessayer** → Pas d'erreur réseau

---

## 📝 Alternative Future : Soft Delete

Au lieu de supprimer physiquement, on pourrait :

1. Ajouter une colonne `deleted_at TIMESTAMPTZ` dans `user_addresses`
2. Filtrer les adresses où `deleted_at IS NULL`
3. Marquer comme supprimée au lieu de `DELETE`

**Avantages** :
- Historique préservé pour les anciennes réservations
- Possibilité de restaurer
- Pas de contrainte de clé étrangère à gérer

**Migration SQL** :
```sql
ALTER TABLE user_addresses ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX idx_user_addresses_deleted_at ON user_addresses(deleted_at);
```

---

## ✅ Résultat Final

- ✅ **Erreur 500** → **400 avec message clair**
- ✅ **Message technique** → **Message utilisateur friendly**
- ✅ **Crash frontend** → **Toast d'erreur élégant**
- ✅ **Expérience utilisateur** améliorée
- ✅ **Logging** ajouté pour debugging futur

---

**Fichiers modifiés** :
- `app/api/addresses/[id]/route.ts` (vérifications + gestion erreur 23503)
- `components/addresses/addresses-section.tsx` (gestion erreur frontend)
- `components/addresses/address-card.tsx` (ajout bouton "Définir par défaut")
