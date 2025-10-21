# ✅ Fix Pricing Issue - Plan de test

**Date:** 21 octobre 2025  
**Problème résolu:** Prix total ne prenait pas en compte les kg supplémentaires (flow authentifié)  
**Fichiers modifiés:** 3

---

## 📝 Modifications appliquées

### 1. **components/booking/services-step.tsx**
```typescript
// ✅ AVANT
interface ServicesStepProps {
  onUpdate: (data: { items: BookingItem[] }) => void
}

// ✅ APRÈS
interface ServicesStepProps {
  onUpdate: (data: { items: BookingItem[]; totalAmount: number }) => void
}

// ✅ Fonction syncOnUpdate mise à jour
const syncOnUpdate = (serviceId: string | null, nextExtraKg: number) => {
  // Calcule base_price + extra_price
  const totalAmount = basePrice + extraPrice
  
  onUpdate({ 
    items: [...],
    totalAmount  // ← AJOUTÉ
  })
}
```

### 2. **app/reservation/reservation-client.tsx**
```typescript
// ✅ AVANT
const [bookingData, setBookingData] = useState({
  items: [],
  // totalAmount manquant ❌
})

// ✅ APRÈS
const [bookingData, setBookingData] = useState({
  items: [],
  totalAmount: 0,  // ← AJOUTÉ
})
```

### 3. **components/booking/summary-step.tsx**
```typescript
// ✅ AVANT
interface BookingData {
  items: Array<...>
  // totalAmount manquant ❌
}

const getTotalPrice = () => {
  // Recalcule avec base_price seulement ❌
  return items.reduce((total, item) => 
    total + (service.base_price * item.quantity)
  , 0)
}

// ✅ APRÈS
interface BookingData {
  items: Array<...>
  totalAmount?: number  // ← AJOUTÉ
}

const getTotalPrice = () => {
  // Utilise totalAmount si disponible ✅
  if (bookingData.totalAmount !== undefined) {
    return bookingData.totalAmount
  }
  
  // Fallback pour rétrocompatibilité
  return items.reduce(...)
}

// ✅ Affichage détaillé des kg
{extraKg > 0 && (
  <Badge>
    {totalWeight}kg ({baseWeight}kg + {extraKg}kg)
  </Badge>
)}
```

---

## 🧪 Plan de test

### **Test 1: Service base sans kg supplémentaires**

**Steps:**
1. Se connecter comme utilisateur authentifié
2. Aller sur `/reservation`
3. Étape 1: Sélectionner adresses de collecte/livraison
4. Étape 2: Sélectionner "Pressing Classique" (29€, 7kg)
5. **Ne PAS ajouter** de kg supplémentaires
6. Passer à l'étape 3 (Date/Time)
7. Passer à l'étape 4 (Summary)

**Résultat attendu:**
- ✅ Prix affiché: **29.00 €**
- ✅ Badge: "7kg"
- ✅ Détail: "29€ / pièce"

---

### **Test 2: Service avec +2kg supplémentaires**

**Steps:**
1. Se connecter comme utilisateur authentifié
2. Aller sur `/reservation`
3. Étape 1: Sélectionner adresses
4. Étape 2: Sélectionner "Pressing Classique" (29€, 7kg)
5. **Ajouter +2kg** supplémentaires (slider ou input)
6. Vérifier le prix affiché dans ServicesStep: **39€** (29 + 10)
7. Passer à l'étape 3
8. Passer à l'étape 4 (Summary)

**Résultat attendu:**
- ✅ Prix affiché: **39.00 €** (PAS 29€ !)
- ✅ Badge: "9kg (7kg + 2kg)"
- ✅ Prix total correct dans la section "Total"

---

### **Test 3: Service avec +5kg supplémentaires**

**Steps:**
1. Se connecter comme utilisateur authentifié
2. Aller sur `/reservation`
3. Étape 1: Sélectionner adresses
4. Étape 2: Sélectionner "Pressing Classique" (29€, 7kg)
5. **Ajouter +5kg** supplémentaires
6. Vérifier le prix affiché dans ServicesStep: **48€** (29 + 19)
7. Passer à l'étape 3
8. Passer à l'étape 4 (Summary)

**Résultat attendu:**
- ✅ Prix affiché: **48.00 €**
- ✅ Badge: "12kg (7kg + 5kg)"
- ✅ Prix total correct

---

### **Test 4: Service avec +14kg supplémentaires (max)**

**Steps:**
1. Se connecter comme utilisateur authentifié
2. Aller sur `/reservation`
3. Étape 1: Sélectionner adresses
4. Étape 2: Sélectionner "Pressing Classique" (29€, 7kg)
5. **Ajouter +14kg** supplémentaires (max)
6. Vérifier le prix affiché dans ServicesStep: **69€** (29 + 40)
7. Passer à l'étape 3
8. Passer à l'étape 4 (Summary)

**Résultat attendu:**
- ✅ Prix affiché: **69.00 €**
- ✅ Badge: "21kg (7kg + 14kg)"
- ✅ Prix total correct

---

### **Test 5: Retour arrière et modification**

**Steps:**
1. Se connecter comme utilisateur authentifié
2. Aller sur `/reservation`
3. Étape 1: Sélectionner adresses
4. Étape 2: Sélectionner "Pressing Classique" + ajouter +2kg (39€)
5. Passer à l'étape 3
6. Passer à l'étape 4 (Summary)
7. **Cliquer sur "Précédent"** pour revenir à l'étape 3
8. **Cliquer sur "Précédent"** pour revenir à l'étape 2
9. **Modifier** à +5kg (48€)
10. Re-passer aux étapes 3 et 4

**Résultat attendu:**
- ✅ Prix affiché au step 4: **48.00 €** (PAS 39€ !)
- ✅ Badge: "12kg (7kg + 5kg)"
- ✅ totalAmount mis à jour correctement

---

### **Test 6: Création de la réservation (API)**

**Steps:**
1. Se connecter comme utilisateur authentifié
2. Aller sur `/reservation`
3. Étape 1: Sélectionner adresses
4. Étape 2: Sélectionner "Pressing Classique" + ajouter +2kg (39€)
5. Étape 3: Sélectionner date/time
6. Étape 4: **Cliquer sur "Confirmer la réservation"**
7. Vérifier la requête POST à `/api/bookings`

**Résultat attendu:**
- ✅ Payload envoyé contient `totalAmount: 39`
- ✅ Base de données: colonne `total_amount = 39.00`
- ✅ Pas de `total_amount = 29.00` (bug corrigé)

**Comment vérifier:**
```bash
# Dans la console browser (Network tab)
POST /api/bookings
{
  "items": [...],
  "totalAmount": 39,  // ← Doit être 39, pas 29
  ...
}

# Dans Supabase (table bookings)
SELECT booking_number, total_amount FROM bookings 
WHERE id = 'booking-id-here';
-- total_amount devrait être 39.00
```

---

### **Test 7: Modification d'une réservation existante**

**Steps:**
1. Se connecter comme utilisateur authentifié
2. Créer une réservation avec +2kg (39€)
3. Aller sur `/dashboard`
4. Cliquer sur "Modifier" la réservation
5. URL: `/reservation?modify=booking-id`
6. Vérifier que le prix affiché dans Summary est **39€** (pas 29€)

**Résultat attendu:**
- ✅ Prix affiché: **39.00 €**
- ✅ Badge: "9kg (7kg + 2kg)"
- ✅ Les kg supplémentaires sont conservés

---

### **Test 8: Paiement Stripe (montant correct)**

**Steps:**
1. Se connecter comme utilisateur authentifié
2. Créer une réservation avec +2kg (39€)
3. Aller sur la page de paiement
4. Cliquer sur "Payer maintenant"
5. Vérifier la session Stripe créée

**Résultat attendu:**
- ✅ Montant Stripe: **39.00 EUR** (pas 29.00)
- ✅ Payment Intent créé avec le bon montant
- ✅ Client facturé correctement

**Comment vérifier:**
```bash
# Logs terminal (Stripe webhook)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Vérifier l'event checkout.session.completed
{
  "amount_total": 3900,  // ← 39.00€ en centimes
  ...
}
```

---

### **Test 9: Flow invité (déjà OK, vérification de non-régression)**

**Steps:**
1. **NE PAS** se connecter
2. Aller sur `/reservation/guest`
3. Étape 0: Remplir informations de contact
4. Étape 1: Remplir adresses
5. Étape 2: Sélectionner service + ajouter +2kg (39€)
6. Étape 3: Sélectionner date/time
7. Étape 4: Vérifier le summary

**Résultat attendu:**
- ✅ Prix affiché: **39.00 €** (déjà fonctionnel avant le fix)
- ✅ Aucune régression introduite

---

## 📊 Grille tarifaire de référence

| Kg supplémentaires | Prix extra | Prix total (base 29€) |
|-------------------|------------|----------------------|
| 0kg (7kg base) | +0€ | **29€** |
| +2kg (9kg total) | +10€ | **39€** |
| +5kg (12kg total) | +19€ | **48€** |
| +8kg (15kg total) | +27€ | **56€** |
| +11kg (18kg total) | +34€ | **63€** |
| +14kg (21kg total) | +40€ | **69€** |

---

## ✅ Checklist de validation

### Avant de merger
- [ ] Tous les tests manuels passent
- [ ] Pas d'erreurs TypeScript
- [ ] Build production réussit (`pnpm run build`)
- [ ] Prix correct dans ServicesStep
- [ ] Prix correct dans SummaryStep
- [ ] Prix correct dans la BDD
- [ ] Prix correct dans Stripe
- [ ] Badge affiche les kg corrects
- [ ] Retour arrière fonctionne
- [ ] Modification de réservation fonctionne
- [ ] Flow invité non régressé

### Tests automatisés à ajouter (futur)
- [ ] Test unitaire: `calculateTotal()` avec extraKg
- [ ] Test unitaire: `getTotalPrice()` utilise totalAmount
- [ ] Test E2E: Réservation complète avec kg supplémentaires
- [ ] Test E2E: Vérifier montant Stripe correspond

---

## 🐛 Bugs potentiels à surveiller

### 1. **Réservations existantes sans totalAmount**
**Problème:** Les anciennes réservations n'ont pas de `total_amount` en BDD.

**Solution actuelle:**
```typescript
// Fallback dans getTotalPrice()
if (!bookingData.totalAmount) {
  return items.reduce(...)  // Recalcul basique
}
```

**Action:** Acceptable pour rétrocompatibilité. Les nouvelles réservations auront le bon prix.

---

### 2. **Modification de réservation avec anciens items**
**Problème:** Si `specialInstructions` n'est pas du JSON, crash potentiel.

**Solution actuelle:**
```typescript
try {
  const parsed = JSON.parse(item.specialInstructions)
  extraKg = parsed.extraKg || 0
} catch (e) {
  // Ignorer silencieusement
}
```

**Action:** ✅ Try/catch en place, pas de crash.

---

### 3. **Quantité > 1 (cas rare)**
**Problème:** Si `quantity > 1`, le prix peut être mal calculé.

**Solution actuelle:** Non géré (feature non utilisée actuellement).

**Action future:** Si besoin, ajouter `totalAmount = (basePrice + extraPrice) * quantity`

---

## 📚 Documentation à mettre à jour

- [ ] `docs/API.md` : Ajouter `totalAmount` dans payload `/api/bookings`
- [ ] `docs/DATABASE_SCHEMA.md` : Documenter colonne `total_amount`
- [ ] `docs/BOOKING_FLOW.md` : Expliquer calcul prix avec kg supplémentaires

---

**Status:** ✅ Fix implémenté - En attente de tests  
**Auteur:** Assistant AI  
**Reviewer:** @beateur  
**Next:** Exécuter les 9 tests manuels ci-dessus
