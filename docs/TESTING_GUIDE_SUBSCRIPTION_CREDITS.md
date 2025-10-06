# Guide de Test - Système de Crédits d'Abonnement

**Date** : 5 octobre 2025  
**Objectif** : Valider le fonctionnement end-to-end du système de crédits  
**Durée estimée** : 1-2 heures

---

## 📋 Prérequis

- [x] Migrations SQL appliquées (2 fichiers)
- [x] Services backend déployés
- [x] Frontend compilé sans erreur
- [x] Accès Supabase Dashboard
- [x] User de test avec abonnement actif

---

## 🧪 Plan de Test Complet

### Phase 1 : Tests Database (PostgreSQL)

#### Test 1.1 : Vérifier les tables créées

```sql
-- Vérifier que les tables existent
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('subscription_credits', 'credit_usage_log')
  AND table_schema = 'public';

-- Expected: 2 rows (subscription_credits, credit_usage_log)
```

#### Test 1.2 : Vérifier les fonctions PostgreSQL

```sql
-- Lister les fonctions de crédits
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name LIKE '%credit%'
  AND routine_schema = 'public';

-- Expected: 
-- - get_user_current_credits (function, TABLE)
-- - consume_subscription_credit (function, boolean)
-- - initialize_weekly_credits (function, uuid)
-- - get_credits_from_plan (function, integer)
```

#### Test 1.3 : Tester la fonction `initialize_weekly_credits`

```sql
-- Créer un user de test (si pas déjà existant)
DO $$
DECLARE
  test_user_id UUID;
  test_sub_id UUID;
BEGIN
  -- Récupérer un user avec abonnement actif
  SELECT s.user_id, s.id INTO test_user_id, test_sub_id
  FROM subscriptions s
  WHERE s.status = 'active'
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Aucun abonnement actif trouvé. Créer un abonnement de test.';
  ELSE
    -- Initialiser les crédits
    PERFORM initialize_weekly_credits(test_user_id, test_sub_id, 2);
    RAISE NOTICE 'Crédits initialisés pour user %', test_user_id;
  END IF;
END $$;

-- Vérifier les crédits créés
SELECT * FROM subscription_credits
WHERE created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;

-- Expected: 1 row avec credits_total = 2, credits_remaining = 2
```

#### Test 1.4 : Tester la fonction `consume_subscription_credit`

```sql
-- Consommer un crédit
DO $$
DECLARE
  test_user_id UUID;
  test_sub_id UUID;
  test_booking_id UUID := gen_random_uuid();
  success BOOLEAN;
BEGIN
  -- Récupérer un user avec crédits
  SELECT user_id, subscription_id INTO test_user_id, test_sub_id
  FROM subscription_credits
  WHERE credits_remaining > 0
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Aucun crédit disponible. Exécuter Test 1.3 d abord.';
  ELSE
    -- Consommer 1 crédit
    SELECT consume_subscription_credit(
      test_user_id,
      test_sub_id,
      test_booking_id,
      10.0,  -- 10kg
      35.70  -- amount saved (10kg × 3.57€)
    ) INTO success;
    
    RAISE NOTICE 'Crédit consommé: %', success;
  END IF;
END $$;

-- Vérifier la consommation
SELECT 
  credits_total,
  credits_remaining,
  credits_used
FROM subscription_credits
WHERE updated_at > NOW() - INTERVAL '1 minute';

-- Expected: credits_remaining = 1, credits_used = 1

-- Vérifier le log
SELECT * FROM credit_usage_log
WHERE used_at > NOW() - INTERVAL '1 minute';

-- Expected: 1 row avec booking_weight_kg = 10.0, amount_saved = 35.70
```

---

### Phase 2 : Tests API Backend

#### Test 2.1 : GET /api/subscriptions/credits

```bash
# Via curl (remplacer YOUR_TOKEN)
curl -X GET 'http://localhost:3000/api/subscriptions/credits' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Expected Response:
# {
#   "credits": {
#     "creditsRemaining": 2,
#     "creditsTotal": 2,
#     "weekStartDate": "2025-10-05",
#     "resetAt": "2025-10-12T00:00:00Z"
#   }
# }
```

#### Test 2.2 : GET /api/subscriptions/credits?stats=true

```bash
curl -X GET 'http://localhost:3000/api/subscriptions/credits?stats=true' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Expected Response:
# {
#   "credits": { ... },
#   "stats": {
#     "totalUsed": 5,
#     "totalSaved": 178.50,
#     "usageRate": 0.625
#   }
# }
```

#### Test 2.3 : GET /api/subscriptions/credits/history

```bash
curl -X GET 'http://localhost:3000/api/subscriptions/credits/history?limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Expected Response:
# {
#   "history": [
#     {
#       "id": "...",
#       "bookingId": "...",
#       "creditsBefore": 2,
#       "creditsAfter": 1,
#       "bookingWeightKg": 10.0,
#       "amountSaved": 35.70,
#       "usedAt": "2025-10-05T..."
#     }
#   ],
#   "totalSaved": 35.70,
#   "count": 1
# }
```

#### Test 2.4 : POST /api/subscriptions/credits/check

```bash
curl -X POST 'http://localhost:3000/api/subscriptions/credits/check' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"bookingWeightKg": 10}'

# Expected Response:
# {
#   "canUse": true,
#   "creditsRemaining": 1,
#   "totalAmount": 0,
#   "discountAmount": 35.70,
#   "surplusAmount": 0,
#   "message": "Réservation gratuite (crédit utilisé)"
# }
```

#### Test 2.5 : POST /api/bookings (avec crédit)

```bash
curl -X POST 'http://localhost:3000/api/bookings' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "pickupAddressId": "YOUR_ADDRESS_ID",
    "deliveryAddressId": "YOUR_ADDRESS_ID",
    "pickupDate": "2025-10-10",
    "pickupTimeSlot": "09:00-12:00",
    "items": [{"serviceId": "YOUR_SERVICE_ID", "quantity": 1}]
  }'

# Expected Response:
# {
#   "booking": {
#     "id": "...",
#     "total_amount": 0,  // ← 0€ (gratuit)
#     "used_subscription_credit": true,
#     "credit_discount_amount": 35.70,
#     "booking_weight_kg": 10,
#     "payment_status": "paid"  // ← automatique
#   },
#   "message": "Réservation créée avec succès"
# }
```

Vérifier dans la DB :
```sql
SELECT 
  id,
  total_amount,
  used_subscription_credit,
  credit_discount_amount,
  booking_weight_kg,
  payment_status
FROM bookings
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- Expected: total_amount = 0, used_subscription_credit = true
```

---

### Phase 3 : Tests Frontend

#### Test 3.1 : Dashboard - Affichage des crédits

**Actions** :
1. Se connecter en tant qu'abonné
2. Naviguer vers `/dashboard`
3. Vérifier la présence du composant `CreditsDisplay`

**Résultats attendus** :
- ✅ Card "Réservations Gratuites" visible
- ✅ Badge affichant "2 / 2" (ou crédits actuels)
- ✅ Progress bar à 100% (si aucun crédit utilisé)
- ✅ Message "2 réservation(s) gratuite(s) restante(s)"
- ✅ Countdown "Reset dans X jours" (calcul dynamique)
- ✅ Tooltip info avec règles (au survol de l'icône ℹ️)

#### Test 3.2 : Composant CreditsDisplay (mode compact)

**Test dans React DevTools** :
```tsx
<CreditsDisplay userId="YOUR_USER_ID" compact={true} />
```

**Résultats attendus** :
- ✅ Badge + Progress bar seulement (pas de card)
- ✅ Texte réduit pour intégration dans layouts compacts

#### Test 3.3 : Composant CreditUsageBadge (formulaire réservation)

**Note** : Ce composant n'est pas encore intégré dans `summary-step.tsx` (P4).

**Test manuel possible** :
```tsx
// Ajouter temporairement dans un composant page
import { CreditUsageBadge } from "@/components/subscription/credit-usage-badge"

<CreditUsageBadge 
  userId="YOUR_USER_ID" 
  bookingWeightKg={10}
  onCreditCheck={(canUse, totalAmount) => {
    console.log("Can use credit:", canUse)
    console.log("Total amount:", totalAmount)
  }}
/>
```

**Résultats attendus** :
- ✅ Badge vert avec "Réservation gratuite !" si crédit disponible
- ✅ Badge bleu avec "15kg gratuits, surplus X€" si >15kg
- ✅ Alert gris avec "Tarif classique appliqué" si pas de crédit

---

### Phase 4 : Tests Edge Function (Cron Job)

#### Test 4.1 : Déployer la fonction (si pas déjà fait)

```bash
# Login Supabase
supabase login

# Lier le projet
supabase link --project-ref YOUR_PROJECT_REF

# Déployer
supabase functions deploy reset-weekly-credits

# Vérifier
supabase functions list
```

#### Test 4.2 : Test manuel de la fonction

```bash
# Option A : Via script
export SUPABASE_PROJECT_REF=your-project-ref
export SUPABASE_ANON_KEY=your-anon-key
./scripts/test-reset-credits.sh

# Option B : Via curl direct
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-weekly-credits' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'
```

**Résultat attendu** :
```json
{
  "success": true,
  "totalProcessed": 5,
  "successCount": 5,
  "errorCount": 0,
  "timestamp": "2025-10-05T12:34:56Z",
  "results": [...]
}
```

#### Test 4.3 : Vérifier les crédits après reset

```sql
SELECT 
  sc.user_id,
  sc.credits_total,
  sc.credits_remaining,
  sc.credits_used,
  sc.week_start_date,
  sc.reset_at,
  sc.created_at,
  u.email
FROM subscription_credits sc
JOIN auth.users u ON u.id = sc.user_id
WHERE sc.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY sc.created_at DESC;

-- Expected: Nouveaux crédits avec week_start_date = lundi actuel
```

#### Test 4.4 : Configurer le cron job

**Note** : Voir `docs/CRON_JOB_DEPLOYMENT_GUIDE.md` pour guide complet.

```sql
-- Vérifier pg_cron installé
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Si pas installé:
CREATE EXTENSION pg_cron;

-- Créer le job (remplacer variables)
SELECT cron.schedule(
  'reset-weekly-credits',
  '0 0 * * 1',  -- Chaque lundi minuit
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-weekly-credits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Vérifier le job créé
SELECT * FROM cron.job WHERE jobname = 'reset-weekly-credits';
```

---

## ✅ Checklist de Validation Finale

### Backend
- [ ] Migration SQL 1 appliquée (tables + fonctions)
- [ ] Migration SQL 2 appliquée (cron config)
- [ ] Fonction `initialize_weekly_credits` testée
- [ ] Fonction `consume_subscription_credit` testée
- [ ] API `/api/subscriptions/credits` répond 200
- [ ] API `/api/bookings` consomme crédit correctement
- [ ] Crédit consommé visible dans `credit_usage_log`

### Frontend
- [ ] Dashboard affiche composant `CreditsDisplay`
- [ ] Progress bar mise à jour dynamiquement
- [ ] Countdown "Reset dans X jours" correct
- [ ] Tooltip info visible
- [ ] Pas d'erreurs console

### Edge Function / Cron
- [ ] Edge Function déployée
- [ ] Test manuel réussi (HTTP 200)
- [ ] Crédits créés dans DB après exécution
- [ ] Cron job configuré dans pg_cron
- [ ] Job visible dans `SELECT * FROM cron.job`

### Monitoring
- [ ] Logs Edge Function accessibles
- [ ] Table `credit_reset_logs` existe
- [ ] Vues `credit_reset_stats` et `credit_reset_anomalies` créées
- [ ] Trigger `credit_reset_failure_alert` configuré

---

## 🐛 Troubleshooting Rapide

### Erreur : "credits_total must be 2 or 3"
**Solution** : Le plan_id n'est pas reconnu. Vérifier :
```sql
SELECT DISTINCT plan_id FROM subscriptions;
-- Doit contenir 'monthly' ou 'quarterly'
```

### Erreur : "Permission denied for table subscription_credits"
**Solution** : Vérifier les RLS policies :
```sql
SELECT * FROM pg_policies WHERE tablename = 'subscription_credits';
-- Doit avoir au moins 1 policy pour SELECT
```

### Erreur : "Function not found: initialize_weekly_credits"
**Solution** : Fonction non créée. Appliquer migration :
```bash
supabase db push
# Ou exécuter manuellement le SQL
```

### Dashboard ne montre pas les crédits
**Solution** : Vérifier `hasActiveSubscription` prop :
```sql
SELECT id, user_id, status FROM subscriptions WHERE user_id = 'YOUR_USER_ID';
-- status doit être 'active' ou 'trialing'
```

---

## 📊 Résultats Attendus (Résumé)

| Test | Durée | Résultat Attendu |
|------|-------|------------------|
| Database (fonctions SQL) | 10 min | ✅ Fonctions exécutables, crédits créés |
| API Backend (5 endpoints) | 15 min | ✅ HTTP 200, JSON valide |
| Frontend (dashboard) | 10 min | ✅ Crédits affichés, pas d'erreurs |
| Edge Function (deploy + test) | 20 min | ✅ HTTP 200, crédits reset |
| Cron Job (config) | 15 min | ✅ Job créé, visible dans pg_cron |
| **Total** | **~1h10** | **Système complet fonctionnel** |

---

## 📞 Support

**En cas de blocage** :
1. Consulter `docs/CRON_JOB_DEPLOYMENT_GUIDE.md`
2. Vérifier logs : `supabase functions logs reset-weekly-credits`
3. Vérifier database : `SELECT * FROM subscription_credits`

---

**Auteur** : GitHub Copilot  
**Date** : 5 octobre 2025  
**Version** : 1.0.0
