# 📋 Mise en Place du Protocole de Vérification du Schéma DB

**Date :** 2025-10-06  
**Contexte :** Suite à des erreurs répétées dues à l'utilisation de noms de colonnes obsolètes provenant de scripts SQL non appliqués.

---

## 🚨 Problème Identifié

### Erreurs Constatées

1. **Code utilisant des colonnes inexistantes :**
   - `apartment` au lieu de `building_info`
   - `delivery_instructions` au lieu de `access_instructions`
   - `plan_type` au lieu de `plan_id`

2. **Source du problème :**
   - Copilot cherchait dans `scripts/*.sql` (potentiellement obsolètes)
   - `databaseschema.json` ne contenait que `auth.*` (manquait tout `public.*`)
   - Pas de protocole pour vérifier la base de données réelle

### Impact

- ❌ Erreurs runtime : `column "apartment" does not exist`
- ❌ Temps perdu en debugging
- ❌ Code écrit puis corrigé plusieurs fois
- ❌ Risque de bugs en production

---

## ✅ Solution Mise en Place

### 1. Création de Documentation Critique

#### `docs/CRITICAL_SCHEMA_VERIFICATION_PROTOCOL.md`

**Contenu principal :**
- ⚠️ Règle absolue : La base de données est la seule source de vérité
- ✅ Protocole obligatoire de vérification avant tout code DB
- 📝 Exemples de requêtes `information_schema` à exécuter
- ❌ Liste des sources à NE JAMAIS faire confiance
- 🔍 Checklist de vérification avant PR

**Points clés :**
\`\`\`sql
-- Toujours exécuter AVANT d'écrire du code :
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'TABLE_NAME'
ORDER BY ordinal_position;
\`\`\`

### 2. Mise à Jour des Instructions Copilot

#### `.github/copilot-instructions.md`

**Ajouts :**
- 📍 Section "Database Schema - Source of Truth (CRITICAL)" en haut
- 🔗 Référence à `CRITICAL_SCHEMA_VERIFICATION_PROTOCOL.md`
- ✅ Checklist mise à jour avec "Schema Verified" en premier
- ❌ "Common Pitfalls" enrichie avec erreurs de schéma
- 📚 "Key Files" inclut les nouveaux protocoles

**Changements :**
\`\`\`markdown
Before completing any task:
- [ ] **Schema Verified**: Database schema verified via Supabase SQL Editor ← NOUVEAU
- [ ] **PRD Created**: Complete PRD covering Frontend + Backend + Database + DevOps
\`\`\`

### 3. Scripts de Vérification

#### `scripts/get-complete-public-schema.sql`

**Objectif :** Extraire TOUT le schéma `public.*` depuis Supabase

\`\`\`sql
SELECT json_agg(
  json_build_object(
    'table_schema', table_schema,
    'table_name', table_name,
    'column_name', column_name,
    'data_type', data_type,
    'is_nullable', is_nullable,
    'column_default', column_default
  ) ORDER BY table_name, ordinal_position
) AS complete_schema
FROM information_schema.columns
WHERE table_schema = 'public';
\`\`\`

**Usage :**
1. Exécuter dans Supabase SQL Editor
2. Copier le résultat JSON
3. Mettre à jour `databaseschema.json`

### 4. Ajout du Schéma Public Index

**Données fournies par l'utilisateur :**
- Liste complète des index du schéma `public`
- 1000+ lignes d'index avec `schemaname`, `tablename`, `indexname`, `indexdef`

**Action :**
- Ces données confirment l'existence des tables réelles
- Permettent de vérifier les performances des requêtes
- Validé que `subscriptions.plan_id` existe (pas `plan_type`)

---

## 📊 Impact des Changements

### Avant

\`\`\`typescript
// ❌ Code basé sur vieux scripts
const addressSchema = z.object({
  apartment: z.string(),              // N'existe PAS !
  deliveryInstructions: z.string(),   // N'existe PAS !
  accessCode: z.string()              // N'existe PAS !
})
\`\`\`

**Résultat :** Erreur runtime en production

### Après

\`\`\`typescript
// ✅ Code vérifié via Supabase SQL Editor
const addressSchema = z.object({
  building_info: z.string().optional(),     // ✅ Existe
  access_instructions: z.string().optional() // ✅ Existe
})
\`\`\`

**Résultat :** Fonctionne du premier coup

---

## 🎯 Workflow Désormais Obligatoire

### Pour toute modification touchant la DB :

\`\`\`mermaid
graph TD
    A[Nouvelle Fonctionnalité] --> B[Ouvrir Supabase SQL Editor]
    B --> C[Exécuter Query information_schema]
    C --> D[Documenter Colonnes Réelles]
    D --> E[Créer Schéma Zod avec Noms Vérifiés]
    E --> F[Créer Types TypeScript]
    F --> G[Implémenter API Routes]
    G --> H[Tester avec Vraies Données]
    H --> I[PR avec Preuve de Vérification]
\`\`\`

### Checklist de Pull Request

\`\`\`markdown
## Checklist DB (Obligatoire)

- [ ] Schéma vérifié via `information_schema` dans Supabase SQL Editor
- [ ] Capture d'écran ou copie du résultat de la requête jointe
- [ ] Noms de colonnes confirmés (pas supposés)
- [ ] Types de données validés
- [ ] Relations (FK) vérifiées si applicable
- [ ] Schéma Zod aligné avec DB réelle
- [ ] Types TypeScript alignés avec DB réelle
- [ ] Tests passent avec vraies colonnes
- [ ] `databaseschema.json` mis à jour si nécessaire
\`\`\`

---

## 📝 Responsabilités

### Développeur

- ✅ **TOUJOURS** vérifier via Supabase SQL Editor AVANT d'écrire du code
- ✅ Documenter les vérifications dans la PR
- ✅ Mettre à jour `databaseschema.json` après migrations
- ✅ Signaler toute incohérence trouvée

### Copilot

- ✅ Rappeler le protocole de vérification AVANT de suggérer du code DB
- ✅ Suggérer les requêtes `information_schema` appropriées
- ✅ Refuser de supposer des noms de colonnes sans vérification
- ✅ Diriger vers `CRITICAL_SCHEMA_VERIFICATION_PROTOCOL.md`

### Code Review

- ✅ Vérifier que la vérification a été documentée
- ✅ Valider les noms de colonnes contre la DB réelle
- ✅ Refuser les PR sans preuve de vérification

---

## 🔄 Maintenance Continue

### Mensuel

- [ ] Audit de `databaseschema.json` vs DB réelle
- [ ] Vérification que toutes les migrations sont appliquées
- [ ] Mise à jour de la documentation si écarts trouvés

### À chaque migration

- [ ] Exécuter la migration dans Supabase
- [ ] Mettre à jour `databaseschema.json`
- [ ] Mettre à jour `docs/DATABASE_SCHEMA.md`
- [ ] Notifier l'équipe des changements

---

## 📚 Documentation Créée/Mise à Jour

| Fichier | Action | Contenu |
|---------|--------|---------|
| `docs/CRITICAL_SCHEMA_VERIFICATION_PROTOCOL.md` | ✅ CRÉÉ | Protocole obligatoire de vérification |
| `scripts/get-complete-public-schema.sql` | ✅ CRÉÉ | Script pour extraire schéma complet |
| `.github/copilot-instructions.md` | ✅ MIS À JOUR | Section "Database Schema - Source of Truth" |
| `.github/copilot-instructions.md` | ✅ MIS À JOUR | Checklist avec "Schema Verified" |
| `.github/copilot-instructions.md` | ✅ MIS À JOUR | Common Pitfalls enrichis |
| `.github/copilot-instructions.md` | ✅ MIS À JOUR | Key Files avec nouveaux docs |

---

## 🎓 Formation Requise

### Tous les développeurs doivent :

1. **Lire** `docs/CRITICAL_SCHEMA_VERIFICATION_PROTOCOL.md` (10 min)
2. **Pratiquer** : Exécuter au moins 3 requêtes `information_schema` (15 min)
3. **Valider** : Créer un schéma Zod pour une table en suivant le protocole (20 min)

### Copilot doit :

1. **Toujours** rappeler la vérification avant suggestion de code DB
2. **Systématiquement** suggérer les requêtes `information_schema`
3. **Ne jamais** supposer qu'un script SQL a été appliqué

---

## ✅ Validation du Protocole

### Test de Conformité

**Scénario :** Créer une nouvelle API route pour gérer les adresses utilisateur

**Étapes attendues :**

1. ✅ Ouvrir Supabase SQL Editor
2. ✅ Exécuter :
   \`\`\`sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'user_addresses'
   ORDER BY ordinal_position;
   \`\`\`
3. ✅ Documenter les colonnes trouvées
4. ✅ Créer schéma Zod avec noms vérifiés
5. ✅ Implémenter API route
6. ✅ Tester avec vraies données
7. ✅ PR avec preuve de vérification

**Résultat attendu :** Code fonctionne du premier coup, zéro erreur "column does not exist"

---

## 🎯 Objectifs Atteints

- ✅ **Protocole documenté** : Guide complet et clair
- ✅ **Instructions Copilot mises à jour** : Rappel systématique
- ✅ **Scripts de vérification** : Outils prêts à l'emploi
- ✅ **Workflow défini** : Étapes claires pour tout le monde
- ✅ **Responsabilités assignées** : Chacun sait ce qu'il doit faire

---

## 📈 Prochaines Étapes

### Court Terme (Cette Semaine)

- [ ] Partager ce document avec l'équipe
- [ ] Former tous les développeurs au protocole
- [ ] Mettre à jour `databaseschema.json` avec schéma `public.*` complet
- [ ] Créer template de PR avec checklist DB

### Moyen Terme (Ce Mois)

- [ ] Audit de tout le code existant pour détecter les colonnes incorrectes
- [ ] Migration/correction de toutes les incohérences trouvées
- [ ] Automatisation : Script CI pour vérifier alignement Zod ↔ DB

### Long Terme (Ce Trimestre)

- [ ] Outil de génération automatique de schémas Zod depuis `information_schema`
- [ ] Dashboard de monitoring des écarts schéma code ↔ DB réelle
- [ ] Tests d'intégration pour valider tous les schémas Zod contre DB

---

**🎯 Mantra à Retenir :**

> "La base de données est la source de vérité. Toujours vérifier, jamais supposer."

---

**Date de Mise en Place :** 2025-10-06  
**Auteur :** Équipe Nino Wash  
**Statut :** ✅ ACTIF - PROTOCOLE OBLIGATOIRE  
**Révision :** v1.0
