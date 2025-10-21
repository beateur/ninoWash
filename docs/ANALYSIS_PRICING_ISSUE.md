# 🔍 Analyse: Problème de calcul du prix total (Options de poids)

**Date:** 21 octobre 2025  
**Problème:** Le prix total ne prend pas en compte les kg supplémentaires sélectionnés  
**Impact:** ❌ CRITIQUE - Sous-facturation potentielle

---

## 📊 Flow de données actuel

### **1. ServicesStep (Guest) - Calcul correct**

```tsx
// ✅ Calcul CORRECT dans services-step.tsx
const calculateTotal = (): number => {
  if (!selectedServiceId) return 0
  
  const service = services.find((s) => s.id === selectedServiceId)
  if (!service) return 0

  const basePrice = service.base_price      // Ex: 29€ (7kg)
  const extraPrice = extraKg > 0 ? getExtraKgPrice(extraKg) : 0  // Ex: +10€ (2kg)
  
  return basePrice + extraPrice  // Ex: 39€ ✅
}

// Grille tarifaire
const extraKgPricing = [
  { kg: 2, price: 10 },   // +2kg = 10€ (total 9kg)
  { kg: 5, price: 19 },   // +5kg = 19€ (total 12kg)
  { kg: 8, price: 27 },   // +8kg = 27€ (total 15kg)
  { kg: 11, price: 34 },  // +11kg = 34€ (total 18kg)
  { kg: 14, price: 40 },  // +14kg = 40€ (total 21kg)
]

// ✅ Le total correct est envoyé au parent
const handleValidation = () => {
  const items: GuestBookingItem[] = [{
    serviceId: selectedServiceId,
    quantity: 1,
    specialInstructions,
  }]
  const total = calculateTotal()  // Ex: 39€ ✅
  onComplete(items, total)  // ✅ Passé au hook
}
```

### **2. Hook use-guest-booking.ts - Stockage correct**

```typescript
// ✅ Le totalAmount est stocké correctement
const updateServices = useCallback((items: GuestBookingItem[], totalAmount: number) => {
  setState((prev) => ({
    ...prev,
    items,
    totalAmount,  // Ex: 39€ stocké dans sessionStorage ✅
    completedSteps: Array.from(new Set([...prev.completedSteps, 2])),
    lastUpdated: new Date().toISOString(),
  }))
}, [])
```

**État stocké dans sessionStorage:**
```json
{
  "items": [{
    "serviceId": "abc123",
    "quantity": 1,
    "specialInstructions": ""
  }],
  "totalAmount": 39  // ✅ Prix correct stocké
}
```

### **3. SummaryStep (Guest) - Affichage correct**

```tsx
// ✅ Affichage CORRECT dans summary-step.tsx
<div className="flex items-center justify-between mb-4">
  <span className="text-lg font-medium">Total à payer</span>
  <span className="text-3xl font-bold">
    {bookingData.totalAmount.toFixed(2)} €  // ✅ 39.00 € affiché
  </span>
</div>
```

---

## ❌ PROBLÈME IDENTIFIÉ: SummaryStep (Authenticated)

### **Flow utilisateur authentifié**

Le flow authentifié **NE STOCKE PAS** le `totalAmount` ! Il le **recalcule** dans le SummaryStep.

```tsx
// ❌ PROBLÈME dans summary-step.tsx (authenticated)
const getTotalPrice = () => {
  return bookingData.items.reduce((total, item) => {
    const service = getServiceDetails(item.serviceId)
    // ❌ Utilise SEULEMENT base_price * quantity
    // IGNORE complètement les kg supplémentaires !
    return total + (service?.base_price || 0) * item.quantity
  }, 0)
}

// Exemple:
// Service: 29€ (base_price)
// Quantity: 1
// Kg supplémentaires: +2kg (devrait être +10€)
// Résultat: 29€ ❌ (au lieu de 39€)
```

**Structure des données:**
```typescript
interface BookingData {
  items: Array<{ 
    serviceId: string
    quantity: number
    specialInstructions?: string
    // ❌ MANQUE: extraKg ou extraPrice !
  }>
  // ❌ MANQUE: totalAmount (pas stocké dans le flow authentifié)
}
```

---

## 🔍 Comparaison Guest vs Authenticated

| Aspect | Guest Flow | Authenticated Flow | Status |
|--------|-----------|-------------------|--------|
| **Calcul prix** | ✅ Dans ServicesStep | ❌ Recalculé dans SummaryStep | **DIFFÉRENT** |
| **Stockage totalAmount** | ✅ Dans hook state | ❌ Non stocké | **MANQUANT** |
| **Kg supplémentaires** | ✅ Calculé + ajouté | ❌ Non pris en compte | **BUG** |
| **Items structure** | Simple (quantity: 1) | ❌ Multiplié par quantity | **INCOHÉRENT** |

---

## 🚨 Impact du problème

### **Scénario 1: Utilisateur authentifié**
```
1. Sélectionne "Pressing Classique" (29€ base, 7kg)
2. Ajoute +2kg supplémentaires (devrait être +10€)
3. Total affiché: 39€ ✅ (dans ServicesStep)
4. Passe au SummaryStep
5. Total recalculé: 29€ ❌ (base_price seulement)
6. Paiement créé pour 29€ au lieu de 39€
```

**Résultat:** 
- ❌ Perte de 10€ pour l'entreprise
- ❌ Client sous-facturé
- ❌ Incohérence comptable

### **Scénario 2: Utilisateur invité**
```
1. Sélectionne "Pressing Classique" (29€ base, 7kg)
2. Ajoute +2kg supplémentaires (devrait être +10€)
3. Total affiché: 39€ ✅
4. totalAmount stocké: 39€ ✅
5. SummaryStep affiche: 39€ ✅
6. Paiement créé pour 39€ ✅
```

**Résultat:**
- ✅ Tout fonctionne correctement

---

## 💡 Solutions proposées

### **Option 1: Stocker extraKg dans les items (Recommandée)**

```typescript
// Modifier GuestBookingItem et BookingItem
interface GuestBookingItem {
  serviceId: string
  quantity: number
  specialInstructions?: string
  extraKg?: number  // ← AJOUTER
  extraPrice?: number  // ← AJOUTER (optionnel, peut être recalculé)
}

// Dans ServicesStep
const handleValidation = () => {
  const items: GuestBookingItem[] = [{
    serviceId: selectedServiceId,
    quantity: 1,
    specialInstructions,
    extraKg: extraKg,  // ← AJOUTER
    extraPrice: getExtraKgPrice(extraKg),  // ← AJOUTER
  }]
  const total = calculateTotal()
  onComplete(items, total)
}

// Dans SummaryStep (authenticated)
const getTotalPrice = () => {
  return bookingData.items.reduce((total, item) => {
    const service = getServiceDetails(item.serviceId)
    const basePrice = (service?.base_price || 0) * item.quantity
    const extraPrice = item.extraPrice || 0  // ← UTILISER
    return total + basePrice + extraPrice
  }, 0)
}
```

**Avantages:**
- ✅ Conserve l'historique exact des kg commandés
- ✅ Permet affichage détaillé dans le récapitulatif
- ✅ Compatible avec modification de réservation
- ✅ Audit trail complet

**Inconvénients:**
- ⚠️ Nécessite migration base de données
- ⚠️ Modifier plusieurs fichiers

---

### **Option 2: Stocker totalAmount dans BookingData (Plus simple)**

```typescript
// Modifier l'interface BookingData (authenticated flow)
interface BookingData {
  pickupAddressId: string
  deliveryAddressId: string
  items: Array<{ serviceId: string; quantity: number; specialInstructions?: string }>
  totalAmount: number  // ← AJOUTER
  // ... rest
}

// Dans le parent component qui appelle SummaryStep
const [bookingData, setBookingData] = useState({
  // ...
  totalAmount: 0,  // ← INITIALISER
})

// Quand ServicesStep appelle onComplete
const handleServicesComplete = (items, total) => {
  setBookingData(prev => ({
    ...prev,
    items,
    totalAmount: total,  // ← STOCKER
  }))
}

// Dans SummaryStep
const getTotalPrice = () => {
  // Utiliser bookingData.totalAmount si disponible
  if (bookingData.totalAmount) {
    return bookingData.totalAmount
  }
  // Fallback: recalcul (pour rétrocompatibilité)
  return bookingData.items.reduce((total, item) => {
    const service = getServiceDetails(item.serviceId)
    return total + (service?.base_price || 0) * item.quantity
  }, 0)
}
```

**Avantages:**
- ✅ Plus simple à implémenter
- ✅ Pas de migration DB nécessaire
- ✅ Fix immédiat du problème

**Inconvénients:**
- ⚠️ Ne conserve pas le détail des kg supplémentaires
- ⚠️ Impossible d'afficher "7kg + 2kg = 9kg" dans le récapitulatif
- ⚠️ Perd l'information si utilisateur revient en arrière

---

### **Option 3: Harmoniser avec le flow Guest (Idéal long terme)**

Utiliser le même hook `use-booking` pour authenticated ET guest, qui stocke déjà `totalAmount`.

```typescript
// Créer un hook unifié: use-booking.ts
export function useBooking(isGuest: boolean = false) {
  // Logique commune pour guest et authenticated
  // Stocke items, totalAmount, addresses, etc.
  
  const updateServices = useCallback((items, totalAmount) => {
    setState(prev => ({
      ...prev,
      items,
      totalAmount,  // ← Toujours stocké
    }))
  }, [])
  
  return { state, updateServices, ... }
}
```

**Avantages:**
- ✅ Code unifié (moins de duplication)
- ✅ Comportement cohérent guest/authenticated
- ✅ Plus facile à maintenir

**Inconvénients:**
- ⚠️ Refactoring important
- ⚠️ Risque de régression
- ⚠️ Temps de développement élevé

---

## 🎯 Recommandation finale

**Solution recommandée: Option 1 + Option 2**

1. **Court terme (urgent):**
   - Implémenter **Option 2** pour fix immédiat
   - Ajouter `totalAmount` dans `BookingData` (authenticated)
   - Passer `totalAmount` depuis ServicesStep vers SummaryStep
   - **Temps:** 30 minutes
   - **Risque:** Faible

2. **Moyen terme (améliorations):**
   - Implémenter **Option 1** pour traçabilité complète
   - Ajouter `extraKg` et `extraPrice` dans les items
   - Migration base de données si nécessaire
   - **Temps:** 2-3 heures
   - **Risque:** Moyen

3. **Long terme (optimisation):**
   - Implémenter **Option 3** pour harmoniser les flows
   - Créer hook unifié `use-booking`
   - Refactoriser tous les composants
   - **Temps:** 1-2 jours
   - **Risque:** Élevé

---

## 📝 Checklist de correction

### Phase 1: Fix urgent (Option 2)
- [ ] Ajouter `totalAmount` dans interface `BookingData`
- [ ] Modifier parent component pour stocker `totalAmount`
- [ ] Modifier `SummaryStep` (authenticated) pour utiliser `bookingData.totalAmount`
- [ ] Tester le flow complet avec kg supplémentaires
- [ ] Vérifier que le montant correct est envoyé à Stripe

### Phase 2: Traçabilité (Option 1)
- [ ] Ajouter `extraKg?: number` dans `GuestBookingItem`
- [ ] Ajouter `extraPrice?: number` dans `GuestBookingItem`
- [ ] Modifier `ServicesStep` pour inclure ces champs
- [ ] Modifier `SummaryStep` pour afficher le détail
- [ ] Créer migration DB pour colonne `extra_kg` dans `booking_items`
- [ ] Tester création/modification de réservations

### Phase 3: Tests
- [ ] Test: Service base (7kg) sans extra → 29€
- [ ] Test: Service base + 2kg extra → 39€ (29 + 10)
- [ ] Test: Service base + 5kg extra → 48€ (29 + 19)
- [ ] Test: Retour arrière puis re-validation conserve le prix
- [ ] Test: Modification d'une réservation conserve les kg

---

## 🔗 Fichiers à modifier

### Court terme (Option 2)
1. `components/booking/summary-step.tsx` (authenticated)
2. Parent component qui utilise `SummaryStep`
3. Interface `BookingData` (si dans un fichier séparé)

### Moyen terme (Option 1)
4. `lib/validations/guest-booking.ts` (interface `GuestBookingItem`)
5. `components/booking/guest/steps/services-step.tsx`
6. `components/booking/summary-step.tsx` (affichage détaillé)
7. `supabase/migrations/XXX_add_extra_kg_to_booking_items.sql`

---

**Status:** 🔴 BUG CRITIQUE - À corriger en priorité  
**Auteur:** Assistant AI  
**Reviewer:** @beateur
