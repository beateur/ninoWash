# 🚨 ERREUR 500 lors de l'annulation - SOLUTION RAPIDE

## Problème
\`\`\`
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
\`\`\`

## Cause
❌ **La migration SQL n'a pas encore été appliquée !**

Les colonnes `cancellation_reason`, `cancelled_at`, `cancelled_by` n'existent pas encore dans la table `bookings`.

---

## ✅ SOLUTION (5 minutes)

### Option 1️⃣ : Supabase Studio (RECOMMANDÉ)

1. **Ouvrir** https://supabase.com/dashboard
2. **Sélectionner** votre projet
3. **Menu gauche** → **SQL Editor**
4. **Cliquer** "New query"
5. **Copier-Coller** tout le contenu de :
   \`\`\`
   supabase/migrations/20251004_booking_cancellation_and_reports.sql
   \`\`\`
6. **Cliquer** "Run" (bouton vert en bas à droite)
7. ✅ **Attendre** "Success"

### Vérification rapide
Exécuter cette requête dans le même SQL Editor :
\`\`\`sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('cancellation_reason', 'cancelled_at', 'cancelled_by');
\`\`\`

**Résultat attendu** : 3 lignes
\`\`\`
cancellation_reason
cancelled_at
cancelled_by
\`\`\`

---

### Option 2️⃣ : Via CLI Supabase

Si Supabase CLI est installé et configuré :

\`\`\`bash
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
supabase db push
\`\`\`

**Pas installé ?**
\`\`\`bash
# Installation
brew install supabase/tap/supabase

# Configuration
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Application
supabase db push
\`\`\`

---

### Option 3️⃣ : Script automatique

\`\`\`bash
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
./scripts/apply-migration.sh
\`\`\`

---

## 🧪 Test après migration

1. **Recharger** la page du dashboard
2. **Cliquer** sur une réservation future
3. **Cliquer** "Annuler la réservation"
4. **Remplir** la raison (min 10 caractères)
5. **Cliquer** "Confirmer l'annulation"

### ✅ Résultat attendu
- Toast success "Réservation annulée"
- Panel se ferme
- Liste rafraîchie
- Badge "Annulée" (rouge)

### ❌ Si encore erreur 500
Vérifier les logs serveur :
\`\`\`bash
# Dans le terminal où tourne pnpm dev
# Chercher l'erreur PostgreSQL exacte
\`\`\`

Ou ouvrir la console browser (F12) → onglet Network → cliquer sur la requête failed → onglet Response

---

## 📋 Checklist Post-Migration

- [ ] Migration SQL appliquée
- [ ] 3 colonnes ajoutées à `bookings`
- [ ] Tables `booking_modifications` et `booking_reports` créées
- [ ] Indexes créés (6 au total)
- [ ] RLS policies actives (7 au total)
- [ ] Test annulation réussit
- [ ] Test signalement problème réussit

---

## 🆘 Besoin d'aide ?

1. **Consulter** `supabase/migrations/MIGRATION_GUIDE.md` (guide complet)
2. **Tester** avec `docs/PRD/TESTING_GUIDE.md` (10 scénarios)
3. **Vérifier** logs PostgreSQL dans Supabase Studio → Logs → Postgres Logs

---

## 📊 Prochaines étapes

Une fois la migration appliquée :
1. ✅ Tester l'annulation d'une réservation
2. ✅ Tester le signalement d'un problème
3. ✅ Vérifier les données en base
4. 📝 Suivre le guide de tests complet (`TESTING_GUIDE.md`)

---

**Temps estimé** : 5-10 minutes maximum 🚀
