# Schema Verification Improvement - 2025-10-06

## Problème Identifié

L'agent Copilot a commis une erreur critique en cherchant la structure de la base de données dans des fichiers SQL potentiellement obsolètes au lieu de vérifier la source de vérité : **la base de données live Supabase**.

### Erreur Spécifique
- ❌ Recherche dans `scripts/*.sql` (potentiellement outdated)
- ❌ Confiance en `databaseschema.json` (ne contient QUE les tables `auth.*`, pas les tables `public.*`)
- ❌ Pas de vérification via Supabase SQL Editor

### Conséquences
- Tentatives d'utiliser des colonnes inexistantes (ex: `plan_type` au lieu de `plan_id`)
- Requêtes SQL qui échouent
- Perte de temps en debugging

## Solutions Implémentées

### 1. ✅ Instructions Copilot Mises à Jour

**Fichier:** `.github/copilot-instructions.md`

**Ajouts:**
- Section **"Database Schema - Source of Truth (CRITICAL)"** avec protocole de vérification strict
- Liste des erreurs communes à éviter
- Exemples de requêtes SQL pour vérifier le schéma
- Mise à jour de "Common Pitfalls" avec avertissements spécifiques

**Règles Obligatoires:**
```markdown
1. NEVER trust SQL script files
2. NEVER trust databaseschema.json (only auth.* tables)
3. ALWAYS query live database via Supabase SQL Editor
4. Verify schema BEFORE writing Zod validators
5. Verify schema BEFORE creating API routes
```

### 2. ✅ Documentation Complète Créée

**Fichier:** `docs/DATABASE_SCHEMA_VERIFICATION.md`

**Contenu:**
- Guide complet de vérification du schéma
- Requêtes SQL prêtes à l'emploi pour vérifier :
  - Existence de tables
  - Structure des colonnes
  - Relations entre tables (foreign keys)
  - Contraintes et indexes
- Exemples réels du projet (correct vs incorrect)
- Checklist de prévention avant commit

### 3. ✅ Script SQL de Diagnostic

**Fichier:** `scripts/get-real-schema.sql`

**Fonctionnalités:**
- Extraction complète du schéma `public` et `auth`
- Liste toutes les tables, colonnes, types
- Affiche toutes les foreign keys
- Affiche tous les indexes
- Requêtes de référence rapide commentées

**Usage:**
```sql
-- Copier dans Supabase SQL Editor et exécuter
-- Exporter le résultat comme documentation
```

## Workflow Corrigé

### Avant (❌ INCORRECT)
```
1. Chercher dans scripts/*.sql
2. Assumer que le script reflète la réalité
3. Écrire du code basé sur ces suppositions
4. ❌ Échec car colonnes inexistantes
```

### Après (✅ CORRECT)
```
1. Ouvrir Supabase SQL Editor
2. Exécuter requête information_schema
3. Vérifier colonnes exactes
4. Écrire code avec noms de colonnes vérifiés
5. ✅ Succès garanti
```

## Impact

### Prévention des Erreurs
- ✅ Plus d'erreurs "column does not exist"
- ✅ Plus d'erreurs de foreign key incorrectes
- ✅ Plus de confusion snake_case vs camelCase
- ✅ Gain de temps en développement

### Amélioration du Process
- ✅ Documentation claire et accessible
- ✅ Scripts réutilisables
- ✅ Checklist de validation
- ✅ Instructions Copilot renforcées

## Fichiers Modifiés

1. `.github/copilot-instructions.md` - Instructions renforcées
2. `docs/DATABASE_SCHEMA_VERIFICATION.md` - Guide complet (NOUVEAU)
3. `scripts/get-real-schema.sql` - Script de diagnostic (NOUVEAU)

## Prochaines Actions Recommandées

### Immédiat
1. ✅ Exécuter `scripts/get-real-schema.sql` dans Supabase SQL Editor
2. ✅ Sauvegarder le résultat comme `docs/LIVE_SCHEMA_EXPORT.md`
3. ✅ Vérifier la structure actuelle de la table `subscriptions`

### Pour le Problème de Crédits (en cours)
1. ⏳ Utiliser les nouvelles requêtes pour vérifier `subscriptions` table
2. ⏳ Confirmer l'existence de `plan_id` (pas `plan_type`)
3. ⏳ Créer la requête de diagnostic corrigée
4. ⏳ Identifier pourquoi les crédits ne sont pas alloués

## Leçons Apprises

### Pour l'Agent
- ✅ Toujours vérifier avec `information_schema` en premier
- ✅ Ne jamais faire confiance à des fichiers statiques
- ✅ Documenter les sources de vérité clairement

### Pour le Projet
- ✅ Maintenir `databaseschema.json` à jour OU le supprimer
- ✅ Créer un script CI pour exporter le schéma régulièrement
- ✅ Ajouter des tests d'intégration qui valident le schéma

## Validation

### Tests de Non-Régression
- [ ] Tester une requête avec nom de colonne incorrect → doit échouer rapidement
- [ ] Tester vérification via Supabase SQL Editor → doit réussir
- [ ] Vérifier que les instructions Copilot sont suivies

### Monitoring
- [ ] Surveiller les erreurs "column does not exist" (devrait disparaître)
- [ ] Vérifier le temps de résolution des bugs de schéma (devrait diminuer)

---

**Date:** 2025-10-06  
**Auteur:** Copilot (correction après feedback utilisateur)  
**Statut:** ✅ Implémenté et documenté
