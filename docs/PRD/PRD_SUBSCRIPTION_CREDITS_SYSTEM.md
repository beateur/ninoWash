# PRD : Système de Crédits de Réservation pour Abonnés

**Date** : 5 octobre 2025  
**Status** : 🟡 Draft - Validation requise  
**Objectif** : Implémenter un système de crédits hebdomadaires pour les abonnés

---

## 1. Context

### Problème Actuel
- Les abonnements (99,99€/mois) ne donnent aucun avantage sur les réservations
- Les utilisateurs paient l'abonnement + le prix complet de chaque réservation
- Incohérence entre l'UI (affiche "inclus") et le backend (facture)

### Solution Proposée
Système de crédits hebdomadaires :
- Mensuel (99,99€) = 2 crédits/semaine
- Trimestriel (249,99€) = 3 crédits/semaine
- 1 crédit = 1 réservation gratuite jusqu'à 15kg
- Reset automatique chaque lundi

---

## 2. Goals (Success Criteria)

### Must Have (P0)
- ✅ Abonné peut voir ses crédits restants
- ✅ Réservation avec crédit = gratuite (jusqu'à 15kg)
- ✅ Réservation sans crédit = tarif classique
- ✅ Reset automatique chaque lundi
- ✅ Crédits non utilisés perdus au reset
- ✅ Si dépassement 15kg avec crédit = surplus facturé

### Should Have (P1)
- ✅ Historique utilisation crédits
- ✅ Notification avant reset des crédits
- ✅ Badge "Crédit utilisé" dans dashboard

### Nice to Have (P2)
- ⏸️ Analytics : taux d'utilisation crédits
- ⏸️ Report crédits (max 1 semaine)
- ⏸️ Bonus crédits (parrainage, fidélité)

---

## 3. Scope

### 3.1 Frontend

#### Composants à Créer
- `components/subscription/credits-display.tsx` - Widget crédits restants
- `components/subscription/credit-usage-badge.tsx` - Badge "Gratuit" sur booking
- `components/subscription/credits-history.tsx` - Historique utilisation

#### Composants à Modifier
- `components/booking/summary-step.tsx` - Afficher crédit disponible
- `components/dashboard/dashboard-client.tsx` - Widget crédits
- `app/(authenticated)/dashboard/page.tsx` - Charger crédits user

#### Pages à Modifier
- `/dashboard` - Ajouter section crédits
- `/reservation` - Vérifier crédits avant soumission
- `/subscription` - Afficher crédits inclus par plan

#### UI States
- **Avec crédits disponibles** : Badge "Gratuit" + compteur
- **Sans crédits** : Message "Tarif classique appliqué"
- **Dépassement 15kg** : Alerte "Surplus de Xkg facturé Y€"
- **Avant reset** : Notification "Crédits expireront lundi"

### 3.2 Backend

#### API Routes à Créer
- `POST /api/subscriptions/credits/check` - Vérifier crédits disponibles
- `GET /api/subscriptions/credits/history` - Historique utilisation
- `POST /api/subscriptions/credits/consume` - Consommer un crédit

#### API Routes à Modifier
- `POST /api/bookings` - Vérifier et consommer crédit si disponible
- `GET /api/subscriptions` - Inclure crédits restants

#### Business Logic
```typescript
// Logique de consommation crédit
if (userHasActiveSubscription && creditsRemaining > 0) {
  if (bookingWeight <= 15) {
    // Réservation gratuite
    totalAmount = 0
    consumeCredit()
  } else {
    // Gratuit jusqu'à 15kg + surplus facturé
    const surplusKg = bookingWeight - 15
    totalAmount = calculateSurplusPrice(surplusKg)
    consumeCredit()
  }
} else {
  // Tarif classique complet
  totalAmount = calculateStandardPrice(bookingWeight)
}
```

### 3.3 Database

#### Tables à Créer

**`subscription_credits`**
```sql
CREATE TABLE subscription_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  credits_total INTEGER NOT NULL,           -- Crédits alloués (2 ou 3)
  credits_remaining INTEGER NOT NULL,        -- Crédits restants
  credits_used INTEGER DEFAULT 0,            -- Crédits consommés
  week_start_date DATE NOT NULL,             -- Début semaine (lundi)
  week_end_date DATE NOT NULL,               -- Fin semaine (dimanche)
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Prochain reset
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX idx_subscription_credits_user ON subscription_credits(user_id);
CREATE INDEX idx_subscription_credits_reset ON subscription_credits(reset_at);
```

**`credit_usage_log`**
```sql
CREATE TABLE credit_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  booking_weight DECIMAL(5,2),
  amount_saved DECIMAL(10,2),              -- Montant économisé
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_usage_user ON credit_usage_log(user_id);
CREATE INDEX idx_credit_usage_booking ON credit_usage_log(booking_id);
```

#### Tables à Modifier

**`bookings`**
```sql
-- Ajouter colonnes
ALTER TABLE bookings 
  ADD COLUMN subscription_id UUID REFERENCES subscriptions(id),
  ADD COLUMN used_subscription_credit BOOLEAN DEFAULT false,
  ADD COLUMN booking_weight_kg DECIMAL(5,2),
  ADD COLUMN credit_discount_amount DECIMAL(10,2) DEFAULT 0;

CREATE INDEX idx_bookings_subscription ON bookings(subscription_id);
```

#### Migrations
- `supabase/migrations/YYYYMMDDHHMMSS_add_subscription_credits.sql`
- `supabase/migrations/YYYYMMDDHHMMSS_alter_bookings_credits.sql`

#### RLS Policies
```sql
-- subscription_credits
CREATE POLICY "Users can view own credits" ON subscription_credits
  FOR SELECT USING (auth.uid() = user_id);

-- credit_usage_log  
CREATE POLICY "Users can view own usage log" ON credit_usage_log
  FOR SELECT USING (auth.uid() = user_id);
```

### 3.4 Validation

**Zod Schemas** (`lib/validations/subscription.ts`)
```typescript
export const checkCreditsSchema = z.object({
  subscriptionId: z.string().uuid(),
  bookingWeight: z.number().positive().max(50),
})

export const consumeCreditSchema = z.object({
  subscriptionId: z.string().uuid(),
  bookingId: z.string().uuid(),
  bookingWeight: z.number().positive(),
})
```

### 3.5 Security

#### Authentication
- Toutes les routes crédits nécessitent authentification
- `requireAuth()` middleware obligatoire

#### Authorization
- User peut uniquement voir/consommer SES crédits
- RLS policies sur toutes les tables crédits
- Validation côté serveur du `user_id`

#### RLS Policies
```sql
-- Empêcher consommation crédits d'autres users
CREATE POLICY "prevent_credit_theft" ON subscription_credits
  FOR UPDATE USING (auth.uid() = user_id);
```

#### Input Sanitization
- Validation poids réservation (max 50kg)
- Vérification subscription_id appartient au user
- Protection contre double consommation (transaction DB)

### 3.6 DevOps

#### Environment Variables
```bash
# .env.local
CREDITS_RESET_CRON_SECRET=xxx  # Secret pour cron job reset
CREDITS_NOTIFICATION_DAYS=2     # Notifier 2 jours avant reset
```

#### Supabase Edge Functions
**`supabase/functions/reset-weekly-credits/index.ts`**
```typescript
// Fonction Cron pour reset hebdomadaire
// Déclenchée chaque lundi à 00:00 UTC
```

#### Webhooks
- Stripe webhook : Création abonnement → Initialiser crédits
- Stripe webhook : Annulation abonnement → Désactiver crédits

---

## 4. Technical Implementation Plan

### Step 1: Database (2-3 jours)
- [ ] Créer migration `add_subscription_credits.sql`
- [ ] Créer table `subscription_credits`
- [ ] Créer table `credit_usage_log`
- [ ] Modifier table `bookings` (nouvelles colonnes)
- [ ] Ajouter RLS policies
- [ ] Créer indexes
- [ ] Tester migration en local

### Step 2: Backend Core Logic (2-3 jours)
- [ ] Créer service `lib/services/subscription-credits.ts`
  - `getCurrentCredits(userId)`
  - `consumeCredit(userId, bookingId, weight)`
  - `calculateCreditDiscount(weight)`
  - `initializeWeeklyCredits(subscriptionId)`
- [ ] Créer API route `POST /api/subscriptions/credits/check`
- [ ] Créer API route `GET /api/subscriptions/credits/history`
- [ ] Modifier API route `POST /api/bookings` (intégrer crédits)
- [ ] Ajouter validation Zod
- [ ] Tester avec curl/Postman

### Step 3: Cron Job Reset (1-2 jours)
- [ ] Créer Edge Function `reset-weekly-credits`
- [ ] Logique reset :
  - Trouver toutes subscriptions actives
  - Calculer crédits selon plan (2 ou 3)
  - Créer nouvelle entrée `subscription_credits`
  - Logger anciens crédits perdus
- [ ] Configurer cron dans Supabase
- [ ] Tester manuellement le reset

### Step 4: Frontend Components (2-3 jours)
- [ ] Créer `components/subscription/credits-display.tsx`
  - Affiche crédits restants
  - Badge "X réservations gratuites"
  - Barre de progression
- [ ] Créer `components/subscription/credits-history.tsx`
  - Liste utilisation crédits
  - Montant économisé total
- [ ] Modifier `components/booking/summary-step.tsx`
  - Vérifier crédits disponibles
  - Afficher "Gratuit" si crédit utilisé
  - Afficher surplus si > 15kg
- [ ] Modifier `components/dashboard/dashboard-client.tsx`
  - Ajouter widget crédits

### Step 5: Pages Integration (1-2 jours)
- [ ] Modifier `/dashboard`
  - Charger crédits user
  - Afficher widget crédits
- [ ] Modifier `/reservation`
  - Check crédits avant soumission
  - UI conditionnelle (gratuit/payant)
- [ ] Modifier `/subscription`
  - Afficher crédits inclus dans plans

### Step 6: Testing (2 jours)
- [ ] Unit tests : Services crédits
- [ ] Integration tests : API routes
- [ ] E2E tests : Parcours complet booking avec crédit
- [ ] Test cas limites :
  - Booking avec 0 crédits
  - Booking > 15kg avec crédit
  - Reset crédits
  - Double consommation (race condition)

### Step 7: Documentation (1 jour)
- [ ] Update `docs/architecture.md`
- [ ] Update `docs/DATABASE_SCHEMA.md`
- [ ] Update `docs/api-integration-guide.md`
- [ ] Créer guide utilisateur crédits

---

## 5. Data Flow

### Parcours : Réservation avec Crédit

```
1. User ouvre /reservation
   ↓
2. Frontend : GET /api/subscriptions (inclut crédits)
   ↓
3. User remplit formulaire (15kg)
   ↓
4. Frontend : Affiche "Gratuit (crédit utilisé)" ✅
   ↓
5. User clique "Confirmer"
   ↓
6. Backend : POST /api/bookings
   ├─> Vérifier abonnement actif
   ├─> Vérifier crédits_remaining > 0
   ├─> Si oui :
   │   ├─> totalAmount = 0
   │   ├─> used_subscription_credit = true
   │   ├─> Consommer 1 crédit
   │   └─> Créer log usage
   └─> Créer booking
   ↓
7. Frontend : Redirection /dashboard
   ↓
8. Dashboard : Affiche "1 crédit restant"
```

### Parcours : Réservation sans Crédit

```
1. User ouvre /reservation (0 crédits)
   ↓
2. Frontend : Affiche "Tarif classique appliqué"
   ↓
3. User remplit formulaire
   ↓
4. Backend : POST /api/bookings
   ├─> Vérifier crédits_remaining = 0
   ├─> totalAmount = prix standard
   └─> used_subscription_credit = false
   ↓
5. Frontend : Affiche "Paiement requis : 24,99€"
```

### Parcours : Reset Hebdomadaire

```
Lundi 00:00 UTC
   ↓
Supabase Edge Function déclenchée
   ↓
Pour chaque subscription active :
   ├─> Plan mensuel ? credits_total = 2
   ├─> Plan trimestriel ? credits_total = 3
   ├─> Créer nouvelle entrée subscription_credits
   │   ├─> week_start_date = lundi
   │   ├─> reset_at = lundi prochain 00:00
   │   └─> credits_remaining = credits_total
   └─> Logger anciens crédits non utilisés
   ↓
Envoyer email notification (optionnel)
```

---

## 6. Error Scenarios

### Cas d'Erreur
1. **Abonnement expiré pendant réservation**
   - Vérifier `subscription.status = 'active'`
   - Message : "Abonnement inactif, tarif classique appliqué"

2. **Race condition : Double consommation crédit**
   - Transaction DB avec lock
   - Vérifier `credits_remaining > 0` dans transaction

3. **Poids booking > 15kg avec crédit**
   - Calculer surplus : `(weight - 15) × prix_kg`
   - Message : "Crédit utilisé pour 15kg, surplus de Xkg : Y€"

4. **Cron job reset échoue**
   - Retry automatique (3 tentatives)
   - Alert monitoring si échec
   - Fallback : Reset manuel via script

5. **User essaie de consommer crédit d'un autre user**
   - RLS policy bloque
   - 403 Forbidden
   - Log tentative suspecte

---

## 7. Edge Cases

### Cas Limites
1. **Booking créé vendredi, reset lundi avant traitement**
   - Crédit déjà consommé vendredi
   - Pas affecté par reset lundi

2. **User annule booking avec crédit consommé**
   - Option A : Crédit perdu (recommandé)
   - Option B : Crédit restauré si < 24h

3. **Abonnement créé mardi (milieu de semaine)**
   - Crédits disponibles immédiatement
   - Reset suivant : lundi prochain

4. **User upgrade mensuel → trimestriel**
   - Crédits actuels conservés
   - Prochain reset : 3 crédits au lieu de 2

5. **Booking exactement 15kg**
   - Entièrement gratuit
   - 1 crédit consommé

6. **Booking 14,5kg puis 0,5kg**
   - Premier : Gratuit (crédit 1)
   - Deuxième : Gratuit (crédit 2)
   - Total 15kg réparti sur 2 bookings ✅

---

## 8. Testing Strategy

### Unit Tests (`__tests__/services/subscription-credits.test.ts`)
```typescript
describe("Subscription Credits Service", () => {
  it("should initialize 2 credits for monthly plan", () => {})
  it("should initialize 3 credits for quarterly plan", () => {})
  it("should consume 1 credit for booking <= 15kg", () => {})
  it("should calculate surplus for booking > 15kg", () => {})
  it("should return 0 when no credits remaining", () => {})
  it("should prevent negative credits", () => {})
  it("should reset credits on monday", () => {})
  it("should log credit usage", () => {})
})
```

### Integration Tests (`__tests__/api/bookings-with-credits.test.ts`)
```typescript
describe("POST /api/bookings with credits", () => {
  it("should create free booking with available credit", async () => {})
  it("should charge standard price with 0 credits", async () => {})
  it("should charge surplus for booking > 15kg", async () => {})
  it("should decrement credits_remaining", async () => {})
  it("should create credit_usage_log entry", async () => {})
  it("should prevent double credit consumption", async () => {})
})
```

### E2E Tests (Playwright)
```typescript
test("User with credits creates free booking", async ({ page }) => {
  // 1. Login as subscribed user (2 credits)
  // 2. Navigate to /reservation
  // 3. Verify "2 réservations gratuites restantes" displayed
  // 4. Fill form (10kg)
  // 5. Verify "Gratuit (crédit utilisé)" shown
  // 6. Submit booking
  // 7. Verify dashboard shows "1 crédit restant"
})

test("User without credits pays standard price", async ({ page }) => {
  // 1. Login as subscribed user (0 credits)
  // 2. Navigate to /reservation
  // 3. Verify "Tarif classique appliqué" displayed
  // 4. Fill form
  // 5. Verify price shown (24,99€)
  // 6. Submit booking
  // 7. Verify payment required
})
```

---

## 9. Rollout Plan

### Phase 1 : Dev + Staging (Semaine 1-2)
- [ ] Développement complet
- [ ] Tests unitaires + intégration
- [ ] Déploiement staging
- [ ] Tests E2E staging

### Phase 2 : Beta Testing (Semaine 3)
- [ ] Sélectionner 10 utilisateurs beta
- [ ] Activer système crédits
- [ ] Collecter feedback
- [ ] Ajuster si nécessaire

### Phase 3 : Production Rollout (Semaine 4)
- [ ] Déploiement production
- [ ] Activer pour tous abonnés existants
- [ ] Monitoring 24/7 première semaine
- [ ] Support client renforcé

### Phase 4 : Optimization (Semaine 5+)
- [ ] Analytics : Taux utilisation crédits
- [ ] Optimizations performances
- [ ] Features P2 (historique, notifications)

### Rollback Strategy
- **Trigger** : Bug critique (perte crédits, double facturation)
- **Action** :
  1. Désactiver cron reset
  2. Rollback API bookings (version sans crédits)
  3. Geler table `subscription_credits`
  4. Communiquer aux users
  5. Fixer bug
  6. Re-déployer avec fix

---

## 10. Out of Scope

### Explicitement EXCLU de cette iteration

❌ **Report crédits semaine suivante**  
❌ **Bonus crédits (parrainage, fidélité)**  
❌ **Crédits échangeables contre réductions**  
❌ **Marché crédits entre users**  
❌ **Notification push mobile**  
❌ **Gamification (badges, niveaux)**  
❌ **API publique crédits (pour partenaires)**

---

## 11. Success Metrics

### KPIs à Monitorer

**Business**
- Taux d'utilisation crédits : `credits_used / credits_total`
- Montant économisé moyen/user : `AVG(amount_saved)`
- Taux rétention abonnés : Avant vs Après
- Satisfaction client (NPS)

**Technique**
- Temps réponse API crédits : < 200ms
- Erreurs cron reset : 0
- Precision reset : 100% (tous les lundis 00:00)

**Targets**
- 🎯 Utilisation crédits > 70%
- 🎯 Économie moyenne > 40€/mois
- 🎯 Rétention +15%
- 🎯 NPS +10 points

---

## 12. Timeline

```
Semaine 1-2 : Développement
├─ Jour 1-3  : Database + Migrations
├─ Jour 4-6  : Backend API + Services
├─ Jour 7-9  : Cron Job Reset
└─ Jour 10-12: Frontend Components

Semaine 3 : Testing & Integration
├─ Jour 1-2  : Tests unitaires
├─ Jour 3-4  : Tests E2E
└─ Jour 5    : Documentation

Semaine 4 : Beta + Staging
├─ Jour 1-2  : Déploiement staging
├─ Jour 3-5  : Beta testing
└─ Weekend   : Ajustements feedback

Semaine 5 : Production
├─ Jour 1    : Déploiement production
├─ Jour 2-5  : Monitoring intensif
└─> Semaine 6+: Optimizations
```

**Charge totale** : ~12-15 jours de développement

---

## 13. Dependencies

### Bloquants
- ✅ Stripe webhook fonctionnel (création/annulation abonnement)
- ✅ Supabase Edge Functions activées
- ✅ Table `subscriptions` avec données correctes

### Nice to Have
- ⏸️ Service email (notifications reset)
- ⏸️ Monitoring (Sentry, DataDog)

---

## 14. Risks & Mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Cron reset échoue | 🔴 Haut | 🟡 Moyen | Retry automatique + alert + fallback manuel |
| Race condition crédits | 🔴 Haut | 🟡 Moyen | Transaction DB avec lock pessimiste |
| Abus système (spam bookings) | 🟡 Moyen | 🟢 Faible | Rate limiting + monitoring |
| Users confus par reset lundi | 🟡 Moyen | 🟡 Moyen | Notification + tooltip explicatif |
| Bug calcul surplus > 15kg | 🟡 Moyen | 🟢 Faible | Tests exhaustifs + validation Zod |

---

## Conclusion

Ce système de crédits :
- ✅ Aligne backend avec promesses marketing
- ✅ Simple à comprendre pour l'utilisateur
- ✅ Flexible (2 ou 3 crédits selon plan)
- ✅ Automatisé (reset hebdo sans intervention)
- ✅ Scalable (support millions users)

**Next Step** : Validation business → Lancement développement

---

**Auteur** : GitHub Copilot  
**Dernière mise à jour** : 5 octobre 2025  
**Statut** : 🟡 Draft - En attente validation
