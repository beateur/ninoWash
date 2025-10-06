# Analyse: Relation Abonnements ↔ Réservations

**Date d'analyse**: 5 octobre 2025  
**Analysé par**: GitHub Copilot  
**Objectif**: Comprendre la réalité de l'implémentation (pas la documentation théorique)

---

## 🎯 Questions Clés

1. **Ai-je besoin de payer pour les nouvelles réservations si je suis abonné en monthly plan ?**
2. **Quelle fréquence de réservation puis-je effectuer avec un abonnement ?**
3. **Quelle est la différence entre réserver sans abonnement vs avec abonnement ?**

---

## 📊 Découvertes : Plans d'Abonnement Actuels

### Plans Actifs (depuis script `006_update_subscription_plans.sql`)

| Plan | Prix | Période | Description |
|------|------|---------|-------------|
| **mensuel** | 99,99€ | monthly | Pour un pressing régulier et économique |
| **trimestriel** | 249,99€ | quarterly | La solution la plus avantageuse |

### Caractéristiques Mensuel (99,99€/mois)

```json
{
  "features": [
    "2 collectes par semaine",
    "Collecte et livraison illimitées",
    "Priorité sur les créneaux",
    "Tarifs préférentiels",
    "Service client dédié",
    "1 collecte gratuite après 10 commandes"
  ],
  "metadata": {
    "collections_per_week": 2,
    "priority_booking": true,
    "dedicated_support": true,
    "loyalty_bonus": "1 collecte gratuite après 10 commandes"
  }
}
```

### Caractéristiques Trimestriel (249,99€/trimestre)

```json
{
  "features": [
    "3 collectes par semaine",
    "Collecte et livraison illimitées",
    "Priorité absolue",
    "Tarifs préférentiels maximaux",
    "Service client premium",
    "1 collecte gratuite après 10 commandes",
    "Stockage gratuit 7 jours"
  ],
  "metadata": {
    "collections_per_week": 3,
    "priority_booking": "absolute",
    "premium_support": true,
    "loyalty_bonus": "1 collecte gratuite après 10 commandes",
    "free_storage_days": 7
  }
}
```

---

## 🔍 Analyse du Code Backend

### 1. Structure de la Table `bookings`

**Fichier**: `scripts/03-create-database-schema-fixed.sql` (lignes 83-108)

```sql
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    service_id UUID NOT NULL REFERENCES services(id),
    status VARCHAR(20) DEFAULT 'pending',
    pickup_address_id UUID REFERENCES user_addresses(id),
    delivery_address_id UUID REFERENCES user_addresses(id),
    pickup_date DATE,
    pickup_time_slot VARCHAR(20),
    delivery_date DATE,
    delivery_time_slot VARCHAR(20),
    special_instructions TEXT,
    urgency_level VARCHAR(20) DEFAULT 'normal',
    estimated_items INTEGER,
    actual_items INTEGER,
    subtotal DECIMAL(10,2),
    options_total DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    vat_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    payment_status VARCHAR(20) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

**❌ CONSTAT CRITIQUE**: **Il n'y a PAS de colonne `subscription_id`** dans la table `bookings` !

### 2. API de Création de Réservation

**Fichier**: `app/api/bookings/route.ts` (POST handler)

```typescript
// Calcul du montant total (lignes 68-88)
let totalAmount = 0
const serviceIds = validatedData.items.map((item) => item.serviceId)

const { data: services, error: servicesError } = await supabase
  .from("services")
  .select("id, base_price")
  .in("id", serviceIds)

// Calculate total
for (const item of validatedData.items) {
  const service = services.find((s) => s.id === item.serviceId)
  if (service) {
    totalAmount += service.base_price * item.quantity
  }
}
```

**❌ CONSTAT**: **Aucune logique de vérification d'abonnement actif !**
- Le calcul se fait **uniquement** sur `base_price * quantity`
- Pas de vérification si l'utilisateur a un abonnement
- Pas d'application de "tarifs préférentiels" mentionnés dans les features
- Pas de décompte de "collectes restantes"

### 3. Composant Frontend: Summary Step

**Fichier**: `components/booking/summary-step.tsx`

```typescript
const getTotalPrice = () => {
  return bookingData.items.reduce((total, item) => {
    const service = getServiceDetails(item.serviceId)
    return total + (service?.base_price || 0) * item.quantity
  }, 0)
}
```

**Interface utilisateur** (lignes 344-360):

```tsx
<div className="flex items-center justify-between text-lg font-semibold">
  <span>Total</span>
  <div className="flex items-center">
    {serviceType === "classic" ? (
      <>
        <Euro className="h-5 w-5 mr-1" />
        {getTotalPrice().toFixed(2)}
      </>
    ) : (
      <span className="text-green-600">Inclus dans l'abonnement</span>
    )}
  </div>
</div>
```

**⚠️ INCOHÉRENCE FRONTEND/BACKEND**:
- Le frontend affiche "Inclus dans l'abonnement" si `serviceType !== "classic"`
- Mais le backend **calcule et charge le montant dans tous les cas** !
- Il n'y a **aucune exemption de paiement** côté serveur

### 4. Services et Prix Actuels

**Fichier**: `docs/services-documentation.md`

| Service | Code | Prix | Délai |
|---------|------|------|-------|
| Nettoyage et pliage (Classique) | `CLASSIC_WASH_FOLD` | 24,99€ | 72h |
| Nettoyage, repassage et pliage (Classique) | `CLASSIC_WASH_IRON_FOLD` | 29,99€ | 72h |
| Nettoyage et pliage (Express) | `EXPRESS_WASH_FOLD` | 34,99€ | 24h |
| Nettoyage, repassage et pliage (Express) | `EXPRESS_WASH_IRON_FOLD` | 39,99€ | 24h |

### 5. Schéma de Validation Zod

**Fichier**: `lib/validations/booking.ts`

```typescript
export const createBookingSchema = z.object({
  pickupAddressId: z.string().uuid("Adresse de collecte requise").optional(),
  deliveryAddressId: z.string().uuid("Adresse de livraison requise").optional(),
  pickupDate: z.string().refine(...),
  pickupTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"]),
  items: z.array(bookingItemSchema).min(1, "Au moins un article requis"),
  specialInstructions: z.string().optional(),
  subscriptionId: z.string().uuid().optional(),  // ⚠️ Optionnel mais non utilisé !
  serviceType: z.string().optional(),
  guestPickupAddress: guestAddressSchema.optional(),
  guestDeliveryAddress: guestAddressSchema.optional(),
  guestContact: guestContactSchema.optional(),
})
```

**❌ OBSERVATION**: Le champ `subscriptionId` existe dans le schéma mais **n'est jamais utilisé** dans le code backend !

---

## 🚨 RÉPONSES AUX QUESTIONS

### Question 1: Ai-je besoin de payer pour les nouvelles réservations avec un abonnement monthly ?

**Réponse**: **OUI, dans l'état actuel de l'implémentation !** ❌

**Preuves**:
1. Le backend calcule **TOUJOURS** `totalAmount` basé sur `base_price * quantity`
2. Aucune vérification d'abonnement actif dans `POST /api/bookings`
3. Aucune exemption de paiement dans le code
4. Le champ `payment_status` est créé à `'pending'` pour toutes les réservations

**Incohérence avec les features promises**:
- Les plans annoncent "Tarifs préférentiels" → **Non implémenté**
- L'UI affiche "Inclus dans l'abonnement" → **Mensonger**
- Les plans promettent "2/3 collectes par semaine" → **Aucune limitation ou gratuité**

### Question 2: Quelle fréquence de réservation puis-je effectuer ?

**Réponse**: **ILLIMITÉE, sans aucune restriction !** ⚠️

**Preuves**:
1. Aucune vérification de quota dans le code
2. Aucune table de tracking des réservations par période
3. Les metadata des plans mentionnent `"collections_per_week": 2` mais **ce n'est pas vérifié**
4. Pas de trigger PostgreSQL pour bloquer les réservations excédentaires

**État actuel**:
- Mensuel (99,99€) : Théoriquement "2 collectes/semaine" → **Pas de limite réelle**
- Trimestriel (249,99€) : Théoriquement "3 collectes/semaine" → **Pas de limite réelle**
- Classique : Pas d'abonnement → **Pas de limite non plus**

### Question 3: Différence entre réserver sans abonnement vs avec abonnement ?

**Réponse**: **AUCUNE DIFFÉRENCE dans le code actuel !** ❌

**Ce qui est identique**:
- ✅ Même API endpoint (`POST /api/bookings`)
- ✅ Même calcul de prix (base_price × quantity)
- ✅ Même workflow de création
- ✅ Même statut de paiement (`pending`)
- ✅ Même accès aux créneaux horaires

**Différences promises mais non implémentées**:
- ❌ Tarifs préférentiels (annoncés mais pas appliqués)
- ❌ Priorité sur les créneaux (pas de système de priorité)
- ❌ Limite de collectes par semaine (pas vérifiée)
- ❌ Inclus dans l'abonnement (pas d'exemption de paiement)

---

## 🔧 Vestige de Tentatives Passées

### Script `03-add-payments-subscriptions.sql`

Ce script montre une **tentative antérieure** de lier bookings et subscriptions :

```sql
-- User subscriptions table (lignes 26-35)
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    services_used INTEGER DEFAULT 0,        -- 🔍 Compteur de services
    services_remaining INTEGER,              -- 🔍 Services restants
    payment_method_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP
);
```

**Trigger prévu** (lignes 206-221):

```sql
-- Function to update subscription services remaining
CREATE OR REPLACE FUNCTION update_subscription_services()
RETURNS TRIGGER AS $$
BEGIN
    -- When a booking is created with a subscription, decrease services remaining
    IF NEW.subscription_id IS NOT NULL AND OLD.subscription_id IS NULL THEN
        UPDATE user_subscriptions 
        SET services_used = services_used + 1,
            services_remaining = services_remaining - 1
        WHERE id = NEW.subscription_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update subscription usage when booking is created
CREATE TRIGGER update_subscription_services_trigger 
    AFTER UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_subscription_services();
```

**❌ PROBLÈME**: Ce trigger référence `NEW.subscription_id` mais **cette colonne n'existe pas** dans la table `bookings` actuelle !

---

## 📋 Tables Existantes

### Table `subscriptions` (depuis `002_subscription_billing.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'paused')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  payment_method_id UUID,
  quantity INTEGER DEFAULT 1,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  billing_cycle_anchor TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**❌ OBSERVATION**: Cette table gère l'abonnement Stripe mais **n'a aucun lien avec les réservations** !

---

## 🎭 Incohérences Majeures

### 1. Frontend vs Backend

**Frontend** (`summary-step.tsx`, ligne 356):
```tsx
{serviceType === "classic" ? (
  <>{getTotalPrice().toFixed(2)}€</>
) : (
  <span className="text-green-600">Inclus dans l'abonnement</span>
)}
```

**Backend** (`app/api/bookings/route.ts`, ligne 118):
```typescript
const { data: booking, error: bookingError } = await supabase
  .from("bookings")
  .insert({
    booking_number: generateBookingNumber(),
    user_id: user?.id || null,
    service_id: primaryServiceId,
    total_amount: totalAmount,  // ❌ TOUJOURS calculé !
    status: "pending",
    payment_status: "pending",  // ❌ Paiement attendu !
    // ...
  })
```

**Résultat**: L'utilisateur croit que c'est "inclus" mais une facture est créée ! 🚨

### 2. Documentation vs Implémentation

**Documentation** (`docs/services-documentation.md`):
> "Nino Wash propose deux types de services de pressing pour les **clients non abonnés**"

**Implémentation**:
- Tous les services sont facturés à tout le monde
- Abonnés et non-abonnés paient le même prix
- Aucune logique de "service inclus"

### 3. Validation Schema vs Utilisation

**Schema** (`lib/validations/booking.ts`, ligne 51):
```typescript
subscriptionId: z.string().uuid().optional(),
```

**Utilisation dans l'API**: **Zéro occurrence !**
```bash
grep -r "subscriptionId" app/api/bookings/route.ts
# Aucun résultat
```

---

## ✅ Ce Qui Fonctionne Correctement

1. **Gestion des abonnements Stripe**: La table `subscriptions` avec Stripe fonctionne
2. **Création de réservations**: Le workflow de booking fonctionne (guest + authenticated)
3. **Calcul des prix**: Le calcul `base_price × quantity` est correct
4. **Affichage UI**: Le dashboard affiche correctement `hasActiveSubscription`
5. **RLS Policies**: Les politiques de sécurité Supabase sont en place

---

## 🔥 Conclusion Finale

### Réponse à la question initiale

**"Ai-je besoin de payer pour les nouvelles réservations si je suis abonné en monthly plan ?"**

**Réponse**: **OUI, vous payez pour chaque réservation**, même avec un abonnement actif de 99,99€/mois.

**L'abonnement actuel vous donne**:
- ✅ Accès au dashboard
- ✅ Statut "Abonnement Actif" affiché
- ✅ Badge visuel dans l'UI
- ❌ **AUCUN bénéfice sur le prix des réservations**
- ❌ **AUCUNE limite de fréquence respectée**
- ❌ **AUCUN tarif préférentiel appliqué**

### État de l'implémentation

```
Promesses Marketing   ≠   Réalité Technique
─────────────────────────────────────────────
Tarifs préférentiels  →  Pas implémenté
2-3 collectes/semaine →  Pas de limitation
Inclus dans l'abonnement → Toujours facturé
Service client dédié  →  Pas de différence
Priorité sur créneaux →  Pas de système
```

### Recommandations Urgentes

1. **Aligner le backend avec l'UI** :
   - Implémenter l'exemption de paiement pour les abonnés
   - Ou modifier l'UI pour refléter la réalité (tout est payant)

2. **Implémenter les quotas** :
   - Ajouter une vérification du nombre de collectes hebdomadaires
   - Bloquer ou alerter si dépassement

3. **Lier bookings ↔ subscriptions** :
   - Ajouter `subscription_id` dans `bookings`
   - Créer un système de décompte des services inclus

4. **Clarifier l'offre** :
   - Soit les abonnements incluent X services gratuits
   - Soit ils donnent des réductions (%, montant fixe)
   - Soit ils donnent priorité + avantages non-monétaires

---

**Date de rapport**: 5 octobre 2025  
**Status**: 🚨 **Incohérence critique entre UX et backend**  
**Action requise**: **Alignement urgent frontend/backend ou clarification commerciale**
