# ✅ État des Lieux : Abonnements Nino Wash

**Date**: 5 octobre 2025  
**Statut**: 🚨 Incohérence critique détectée

---

## 📋 Ce Que Dit le Marketing

| Plan | Prix | Promesses |
|------|------|-----------|
| **Mensuel** | 99,99€/mois | • 2 collectes/semaine<br>• Collecte et livraison illimitées<br>• Priorité créneaux<br>• **Tarifs préférentiels**<br>• Service client dédié |
| **Trimestriel** | 249,99€/trim. | • 3 collectes/semaine<br>• Collecte et livraison illimitées<br>• Priorité absolue<br>• **Tarifs préférentiels maximaux**<br>• Service premium<br>• Stockage 7j gratuit |

---

## ⚙️ Ce Que Fait le Code

| Fonctionnalité Annoncée | Implémenté ? | Fichier Source | Commentaire |
|-------------------------|--------------|----------------|-------------|
| **Tarifs préférentiels** | ❌ NON | `app/api/bookings/route.ts:68-88` | Tous paient `base_price × quantity` |
| **2-3 collectes/semaine** | ❌ NON | `app/api/bookings/route.ts` (aucune vérif) | Illimité pour tout le monde |
| **Inclus dans l'abonnement** | ❌ NON | `app/api/bookings/route.ts:118` | `payment_status: "pending"` toujours |
| **Priorité créneaux** | ❌ NON | Aucun système de priorité | Pas de différence |
| **Service client dédié** | ❓ INCONNU | Pas dans le code | Peut-être process humain |
| **Badge "Abonné"** | ✅ OUI | `components/dashboard/*` | Cosmétique uniquement |

---

## 💸 Comparaison Réelle

### Scénario : 4 réservations par mois

| Action | Sans Abonnement | Avec Abonnement Mensuel |
|--------|-----------------|-------------------------|
| Frais d'abonnement | 0€ | **99,99€** |
| Réservation 1 (24,99€) | 24,99€ | **24,99€** (facturé quand même !) |
| Réservation 2 (24,99€) | 24,99€ | **24,99€** (facturé quand même !) |
| Réservation 3 (29,99€) | 29,99€ | **29,99€** (facturé quand même !) |
| Réservation 4 (29,99€) | 29,99€ | **29,99€** (facturé quand même !) |
| **TOTAL** | **109,96€** | **�� 209,95€** |

**Verdict** : L'abonnement coûte **+100€ de plus** pour aucun bénéfice ! 😱

---

## 🔍 Preuve Technique

### Backend : Aucune exemption de paiement
```typescript
// app/api/bookings/route.ts (POST handler)

// Ligne 68-81 : Calcul du montant
let totalAmount = 0
const serviceIds = validatedData.items.map((item) => item.serviceId)

const { data: services } = await supabase
  .from("services")
  .select("id, base_price")
  .in("id", serviceIds)

for (const item of validatedData.items) {
  const service = services.find((s) => s.id === item.serviceId)
  if (service) {
    totalAmount += service.base_price * item.quantity
  }
}

// ❌ Aucune vérification d'abonnement ici !

// Ligne 113-128 : Insertion avec paiement requis
const { data: booking } = await supabase
  .from("bookings")
  .insert({
    booking_number: generateBookingNumber(),
    user_id: user?.id || null,
    service_id: primaryServiceId,
    // ...
    total_amount: totalAmount,        // 💰 Montant complet
    status: "pending",
    payment_status: "pending",        // 🚨 Paiement attendu !
    // ❌ Pas de subscription_id
    // ❌ Pas de is_subscription_booking
    // ❌ Pas de discount appliqué
  })
```

### Frontend : Mensonge affiché
```tsx
// components/booking/summary-step.tsx, ligne 344-360

<div className="flex items-center justify-between">
  <span>Total</span>
  <div>
    {serviceType === "classic" ? (
      <>{getTotalPrice().toFixed(2)}€</>
    ) : (
      // 🟢 UI dit : "Inclus"
      <span className="text-green-600">
        Inclus dans l'abonnement
      </span>
    )}
  </div>
</div>

// Mais le backend charge quand même ! ❌
```

---

## 🗄️ Structure Base de Données

### Table `bookings` (Actuelle)
```sql
CREATE TABLE bookings (
    id UUID,
    booking_number VARCHAR(20),
    user_id UUID REFERENCES auth.users(id),
    service_id UUID REFERENCES services(id),
    -- ...
    total_amount DECIMAL(10,2),           -- Montant à payer
    payment_status VARCHAR(20),            -- 'pending', 'paid', ...
    -- ❌ PAS DE subscription_id !
    -- ❌ PAS DE is_included_in_subscription !
    -- ❌ PAS DE discount_from_subscription !
);
```

### Table `subscriptions` (Actuelle)
```sql
CREATE TABLE subscriptions (
    id UUID,
    user_id UUID REFERENCES auth.users(id),
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT,  -- 'active', 'canceled', ...
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    stripe_subscription_id TEXT,
    total_amount DECIMAL(10,2),
    -- ...
    -- ❌ Aucun lien vers bookings !
    -- ❌ Pas de compteur de services utilisés
);
```

**Problème** : Les deux tables sont **complètement déconnectées** ! 🔥

---

## 📊 Flux Utilisateur Actuel

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Utilisateur souscrit Abonnement Mensuel (99,99€)            │
│    └─> Paye via Stripe                                          │
│    └─> Statut "active" dans table subscriptions                 │
│    └─> Badge "Abonnement Actif" affiché ✅                      │
└─────────────────────────────────────────────────────────────────┘
                              ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ 2. Utilisateur crée une Réservation                             │
│    └─> Choisit service (24,99€)                                 │
│    └─> UI affiche "Inclus dans l'abonnement" 🟢                │
│    └─> Clique "Confirmer"                                       │
└─────────────────────────────────────────────────────────────────┘
                              ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend crée la réservation                                  │
│    └─> Calcule total_amount = 24,99€                           │
│    └─> payment_status = "pending" ❌                            │
│    └─> AUCUNE vérification d'abonnement ❌                      │
└─────────────────────────────────────────────────────────────────┘
                              ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ 4. Utilisateur voit : "Paiement en attente" 🤔                  │
│    └─> Confusion : "Mais j'ai un abonnement ?"                  │
│    └─> Doit payer 24,99€ en plus des 99,99€ déjà payés ❌      │
└─────────────────────────────────────────────────────────────────┘
                              ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ Bilan mensuel :                                                  │
│   • Abonnement : 99,99€                                          │
│   • Réservations : 4 × ~25€ = 100€                              │
│   • TOTAL : ~200€ 💸                                            │
│                                                                  │
│ Sans abonnement aurait coûté : 100€ seulement ❌                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Ce Qui Devrait Se Passer (Idéalement)

### Option A : Services Inclus
```
Abonnement Mensuel (99,99€) = 8 services inclus/mois
├─> Service 1-8 : Gratuit (total_amount = 0, payment_status = "paid")
└─> Service 9+  : Payant au tarif normal
```

### Option B : Tarifs Réduits
```
Abonnement Mensuel (99,99€) = 20% de réduction
├─> Service normal : 24,99€ → 19,99€ (abonné)
└─> Service express : 34,99€ → 27,99€ (abonné)
```

### Option C : Crédits Mensuels
```
Abonnement Mensuel (99,99€) = 100€ de crédit/mois
├─> Utilise crédit d'abord (tant qu'il reste du crédit)
└─> Puis paye le surplus si dépassement
```

---

## ⚠️ Actions Urgentes Requises

### 🔴 Priorité P0 (Blocker)
1. **Décider du modèle économique** : Qu'est-ce que l'abonnement doit vraiment offrir ?
2. **Aligner Frontend/Backend** : Soit tout est payant, soit c'est inclus, mais cohérence !
3. **Communiquer aux utilisateurs** : Clarifier immédiatement les conditions

### 🟡 Priorité P1 (Important)
4. **Créer PRD complet** : Spécifier le comportement attendu
5. **Implémenter logique backend** : Vérifier abonnement, appliquer exemption/réduction
6. **Ajouter colonne `subscription_id`** : Lier bookings ↔ subscriptions

### 🟢 Priorité P2 (Nice to have)
7. **Système de quotas** : Respecter "2 collectes/semaine"
8. **Priorité créneaux** : Implémenter vraie priorité pour abonnés
9. **Dashboard abonné** : Afficher compteur de services utilisés/restants

---

## 📚 Documents Liés

- **Analyse complète** : `docs/ANALYSIS_SUBSCRIPTION_BOOKING_RELATIONSHIP.md`
- **Réponses rapides** : `docs/QUICK_ANSWERS_SUBSCRIPTION_BOOKING.md`
- **Script SQL** : `scripts/analyze_subscription_booking_relationship.sql`

---

## 🎯 Conclusion

**État actuel** : L'abonnement est une **fonctionnalité cosmétique** qui coûte de l'argent sans apporter de valeur. C'est une **régression financière** pour l'utilisateur.

**Recommandation** : 🚨 **Suspendre les souscriptions** jusqu'à implémentation complète ou clarifier que l'abonnement ne donne AUCUN avantage sur les réservations (juste un paiement récurrent).

---

**Dernière mise à jour** : 5 octobre 2025  
**Statut** : 🔴 Critique - Incohérence majeure
