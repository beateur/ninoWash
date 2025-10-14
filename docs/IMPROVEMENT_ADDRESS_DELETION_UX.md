# Amélioration UX - Messages d'erreur suppression d'adresse

**Date**: 6 octobre 2025  
**Contexte**: Amélioration des messages d'erreur lors de la tentative de suppression d'une adresse liée à des réservations

## 🎯 Problème Initial

Les utilisateurs tentaient de supprimer des adresses utilisées dans des réservations et recevaient :
- Un rectangle rouge générique en bas à droite
- Message d'erreur vague : "Impossible de supprimer cette adresse"
- Aucune indication sur la raison ni sur l'action à entreprendre

## ✅ Solution Implémentée

### 1. Messages d'erreur contextuels et explicites

**Backend (`app/api/addresses/[id]/route.ts`)**:

Différenciation selon le statut des réservations :

\`\`\`typescript
// Pour réservations ACTIVES (pending, confirmed, in_progress)
"Cette adresse ne peut pas être supprimée car elle est utilisée dans une ou 
plusieurs réservations en cours. Vous devez d'abord annuler ou terminer ces réservations."

// Pour réservations PASSÉES (completed, cancelled)
"Cette adresse ne peut pas être supprimée car elle est liée à votre historique 
de réservations. Vous pouvez la modifier si vous le souhaitez."

// Fallback (contrainte FK PostgreSQL)
"Cette adresse ne peut pas être supprimée car elle est liée à des réservations 
existantes. Pour protéger votre historique, veuillez plutôt modifier l'adresse si nécessaire."
\`\`\`

### 2. Toast amélioré côté frontend

**Frontend (`components/addresses/addresses-section.tsx`)**:

- **Titre explicite**: "Suppression impossible" (au lieu de "Erreur")
- **Durée augmentée**: 6 secondes (au lieu de 3-4s par défaut) pour laisser le temps de lire
- **Message contextualisé**: Reprend le message détaillé de l'API

\`\`\`typescript
toast({
  title: "Suppression impossible",
  description: errorMessage, // Message explicite de l'API
  variant: "destructive",
  duration: 6000, // 6 secondes pour lire confortablement
})
\`\`\`

## 📊 Logique de détection

### Backend - Vérification pré-suppression

\`\`\`typescript
// 1. Requête pour vérifier si adresse utilisée
const { data: bookingsWithAddress } = await supabase
  .from("bookings")
  .select("id, status")
  .or(`pickup_address_id.eq.${addressId},delivery_address_id.eq.${addressId}`)
  .limit(1)

// 2. Distinction selon statut
const activeStatuses = ['pending', 'confirmed', 'in_progress']
const activeBookings = bookingsWithAddress.filter((b: { status: string }) => 
  activeStatuses.includes(b.status)
)

// 3. Message adapté
if (activeBookings.length > 0) {
  return "Message pour réservations actives"
} else {
  return "Message pour historique"
}
\`\`\`

## 🎨 Expérience utilisateur

### Avant
\`\`\`
❌ [Toast rouge] Erreur
   Impossible de supprimer cette adresse
\`\`\`
→ Utilisateur confus, ne sait pas pourquoi ni quoi faire

### Après
\`\`\`
🚫 [Toast rouge] Suppression impossible
   Cette adresse ne peut pas être supprimée car elle est utilisée 
   dans une ou plusieurs réservations en cours. Vous devez d'abord 
   annuler ou terminer ces réservations.
   
   [Durée: 6 secondes]
\`\`\`
→ Utilisateur comprend **pourquoi** et **quoi faire**

## 🛡️ Protection des données

Cette implémentation maintient l'intégrité des données :

1. **Vérification pré-suppression** : Empêche la suppression avant d'atteindre la BDD
2. **Contrainte FK en fallback** : Si la vérification échoue, PostgreSQL bloque quand même
3. **Messages éducatifs** : Expliquent que l'historique est précieux

## 📝 Fichiers Modifiés

### Backend
- **`app/api/addresses/[id]/route.ts`**
  - Ligne 157-181: Logique de vérification et messages contextuels
  - Ligne 197-205: Message amélioré pour contrainte FK

### Frontend
- **`components/addresses/addresses-section.tsx`**
  - Ligne 98-116: Gestion d'erreur améliorée avec toast explicite

## 🧪 Test Manuel

Pour tester :

1. Créer une adresse
2. Créer une réservation avec cette adresse (statut `pending`)
3. Tenter de supprimer l'adresse
4. **Vérifier** : Toast "Suppression impossible" avec message explicite pendant 6 secondes

## 🔮 Évolutions Futures Possibles

1. **Lien direct vers les réservations** : Toast cliquable qui redirige vers `/dashboard` avec filtrage sur les réservations utilisant cette adresse

2. **Soft delete** : Ajouter colonne `deleted_at` pour "masquer" l'adresse sans la supprimer physiquement
   \`\`\`sql
   ALTER TABLE user_addresses ADD COLUMN deleted_at TIMESTAMPTZ;
   \`\`\`
   - Avantage : Préserve l'historique, améliore l'UX
   - Inconvénient : Complexité accrue (filtrage `WHERE deleted_at IS NULL`)

3. **Badge visuel** : Indiquer sur la carte d'adresse si elle est utilisée dans des réservations actives
   \`\`\`tsx
   {hasActiveBookings && (
     <Badge variant="secondary">Utilisée dans 2 réservations</Badge>
   )}
   \`\`\`

## ✅ Validation

- ✅ TypeScript compile sans erreurs
- ✅ Messages contextuels selon statut réservation
- ✅ Toast avec durée augmentée (6s)
- ✅ Fallback FK constraint maintenu
- ✅ Protection intégrité données préservée

## 📚 Documentation Liée

- `docs/FIX_ADDRESS_DELETION_FOREIGN_KEY.md` - Implémentation initiale de la protection
- `docs/ADDRESSES_ARCHITECTURE_REFACTOR.md` - Architecture du système d'adresses
- `docs/DATABASE_SCHEMA.md` - Schéma BDD avec contraintes FK
