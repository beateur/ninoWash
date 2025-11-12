# 🔄 Git Workflow - Bonnes Pratiques NinoWash

**Date:** 20 octobre 2025  
**Objectif:** Maintenir un workflow Git propre avec dev → main

---

## 📋 Stratégie de Branches

### Branches Principales

```
main (production)
  ↑
  │ merge après validation
  │
dev (développement)
  ↑
  │ merge features
  │
feature/* (features individuelles)
```

### Rôles des Branches

| Branche | Environnement | Déploiement | Protection |
|---------|---------------|-------------|------------|
| `main` | **Production** | ninowash.fr (auto) | ✅ Protégée |
| `dev` | **Preview** | URL Preview Vercel (auto) | ⚠️ Semi-protégée |
| `feature/*` | **Preview** | URL Preview Vercel (auto) | ❌ Libre |

---

## 🚀 Workflow Complet

### 1. Créer une Feature

```bash
# Partir de dev (toujours à jour)
git checkout dev
git pull origin dev

# Créer une branche feature
git checkout -b feature/nom-de-la-feature
# OU
git checkout -b fix/nom-du-bug
```

**Naming Convention:**
- `feature/` : Nouvelles fonctionnalités
- `fix/` : Corrections de bugs
- `refactor/` : Refactoring sans changement de fonctionnalité
- `test/` : Tests temporaires
- `docs/` : Documentation

### 2. Développer

```bash
# Faire des commits réguliers
git add .
git commit -m "type: description courte

Description détaillée si nécessaire
Refs: #issue-number"
```

**Types de commits:**
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `refactor:` Refactoring
- `docs:` Documentation
- `test:` Tests
- `chore:` Tâches de maintenance

### 3. Tester sur Preview

```bash
# Pousser la branche feature
git push origin feature/nom-de-la-feature
```

**Résultat:**
- ✅ Vercel crée automatiquement un déploiement Preview
- ✅ URL générée : `ninowash-xxx.vercel.app`
- ✅ Utilise les variables d'environnement **Preview** (clés TEST)

**Tester:**
- Créer réservation guest
- Tester paiement avec 4242...
- Vérifier webhooks
- Vérifier logs : `vercel logs <url-preview> --follow`

### 4. Merger vers Dev

```bash
# Une fois les tests OK, merger dans dev
git checkout dev
git pull origin dev
git merge feature/nom-de-la-feature --no-ff
git push origin dev

# Optionnel: Supprimer la branche feature
git branch -d feature/nom-de-la-feature
git push origin --delete feature/nom-de-la-feature
```

**Résultat:**
- ✅ `dev` mis à jour
- ✅ Nouveau déploiement Preview pour `dev`
- ✅ URL : `ninowash-dev-xxx.vercel.app`

### 5. Valider sur Dev

```bash
# Tester sur le déploiement dev
# URL Preview de la branche dev
```

**Tests sur Dev:**
- ✅ Build réussit
- ✅ Pas d'erreurs TypeScript
- ✅ Tests unitaires passent (si configurés)
- ✅ Flow complet fonctionne
- ✅ Pas de régression

### 6. Déployer en Production

```bash
# Une fois dev validé, merger dans main
git checkout main
git pull origin main
git merge dev --no-ff
git push origin main
```

**Résultat:**
- ✅ **Production déployée** : https://ninowash.fr
- ✅ CI/CD Vercel automatique
- ✅ Utilise les variables **Production** (clés LIVE)

**⚠️ ATTENTION : Production utilise vraies cartes bancaires !**

### 7. Synchroniser Dev

```bash
# Après chaque merge vers main, synchroniser dev
git checkout dev
git merge main --no-edit
git push origin dev
```

**Pourquoi ?**
- Garde `dev` à jour avec `main`
- Évite les conflits futurs
- Maintient l'historique propre

---

## 🔄 Workflow Quotidien Recommandé

### Matin : Démarrer une Feature

```bash
# 1. Synchroniser dev
git checkout dev
git pull origin dev

# 2. Créer feature branch
git checkout -b feature/nouvelle-feature

# 3. Développer
# ... code ...

# 4. Commit
git add .
git commit -m "feat: ajoute nouvelle fonctionnalité"

# 5. Push pour tester
git push origin feature/nouvelle-feature
```

### Midi : Tester sur Preview

```bash
# 1. Vérifier l'URL Preview dans GitHub ou Vercel
# 2. Tester la feature
# 3. Voir les logs si erreur
vercel logs <url-preview> --follow

# 4. Fix si nécessaire
git add .
git commit -m "fix: corrige bug xyz"
git push origin feature/nouvelle-feature
```

### Après-midi : Merger vers Dev

```bash
# 1. Tests OK, merger dans dev
git checkout dev
git pull origin dev
git merge feature/nouvelle-feature --no-ff
git push origin dev

# 2. Tester sur dev Preview
# 3. Si OK, nettoyer la feature branch
git branch -d feature/nouvelle-feature
git push origin --delete feature/nouvelle-feature
```

### Soir : Déployer en Production (si stable)

```bash
# 1. Dev validé toute la journée
git checkout main
git pull origin main
git merge dev --no-ff
git push origin main

# 2. Synchroniser dev
git checkout dev
git merge main --no-edit
git push origin dev

# 3. Monitorer production
vercel logs https://ninowash.fr --follow
```

---

## 🛡️ Règles de Protection

### ✅ À FAIRE

- ✅ **Toujours partir de `dev`** pour créer une feature
- ✅ **Tester sur Preview** avant de merger
- ✅ **Merger features dans `dev`** d'abord
- ✅ **Valider `dev`** avant de merger dans `main`
- ✅ **Synchroniser `dev`** après chaque push vers `main`
- ✅ **Commit messages clairs** avec type et description
- ✅ **Petit commits fréquents** plutôt qu'un gros commit

### ❌ À ÉVITER

- ❌ **NE JAMAIS** commit directement dans `main`
- ❌ **NE JAMAIS** push vers `main` sans tester sur `dev`
- ❌ **NE JAMAIS** merger une feature non testée
- ❌ **NE JAMAIS** oublier de synchroniser `dev` après un merge
- ❌ **NE PAS** laisser des branches features ouvertes longtemps
- ❌ **NE PAS** commit de fichiers `.env.local` ou secrets

---

## 🚨 En Cas d'Urgence (Hotfix)

Si un bug critique est découvert en production :

```bash
# 1. Créer un hotfix depuis main
git checkout main
git pull origin main
git checkout -b hotfix/bug-critique

# 2. Fix rapide
# ... code fix ...
git add .
git commit -m "hotfix: corrige bug critique xyz"

# 3. Tester sur Preview hotfix
git push origin hotfix/bug-critique
# Tester sur l'URL Preview

# 4. Merger directement dans main
git checkout main
git merge hotfix/bug-critique --no-ff
git push origin main

# 5. IMPORTANT: Merger aussi dans dev
git checkout dev
git merge hotfix/bug-critique --no-ff
git push origin dev

# 6. Nettoyer
git branch -d hotfix/bug-critique
git push origin --delete hotfix/bug-critique
```

---

## 📊 Environnements et Variables

| Environnement | Branche | Stripe | Supabase | Vercel |
|---------------|---------|--------|----------|---------|
| **Local** | n/a | TEST | Prod DB | Non |
| **Preview** | feature/* ou dev | TEST | Prod DB | Oui |
| **Production** | main | LIVE | Prod DB | Oui |

**Note:** Toutes les branches utilisent la **même base de données** Supabase en production.

**Variables par environnement:**
- **Development** : `.env.local` + Vercel Dev
- **Preview** : Vercel Environment Variables (Preview)
- **Production** : Vercel Environment Variables (Production)

---

## 🔍 Vérifications Avant Merge

### Checklist Feature → Dev

- [ ] Build local réussit (`npm run build`)
- [ ] Pas d'erreurs TypeScript
- [ ] Tests manuels sur Preview OK
- [ ] Logs Vercel propres (pas d'erreurs)
- [ ] Code review (si équipe)
- [ ] Commit message clair

### Checklist Dev → Main

- [ ] Tous les tests features passés
- [ ] Preview Dev stable (testé pendant plusieurs heures/jours)
- [ ] Pas de régression détectée
- [ ] Documentation à jour si nécessaire
- [ ] Changelog mis à jour (optionnel)
- [ ] Backup DB fait (si changements critiques)

---

## 📝 Exemples de Commits

### ✅ Bons Commits

```bash
git commit -m "feat: ajoute filtrage par date pour les réservations

Permet aux utilisateurs de filtrer leurs réservations par période.
Ajout de date pickers sur la page /reservations.

Refs: #123"
```

```bash
git commit -m "fix: corrige erreur 'Email introuvable' pour bookings guest

Utilise createAdminClient() au lieu de createClient() pour
getUserById() qui nécessite SERVICE_ROLE_KEY.

Fixes: #456"
```

```bash
git commit -m "refactor: simplifie la logique de calcul des prix

Extrait la logique dans une fonction utilitaire réutilisable.
Aucun changement de comportement."
```

### ❌ Mauvais Commits

```bash
git commit -m "fix"  # ← Trop vague
```

```bash
git commit -m "WIP"  # ← Ne pas commit du WIP dans dev/main
```

```bash
git commit -m "plein de changements partout"  # ← Trop large
```

---

## 🛠️ Scripts Utiles

### Script de Synchronisation Auto

Créer un alias dans `~/.zshrc` :

```bash
# Alias pour synchroniser dev avec main
alias sync-dev="git checkout dev && git pull origin dev && git merge main --no-edit && git push origin dev && echo '✅ Dev synchronisé avec main'"

# Alias pour démarrer une feature
alias new-feature="git checkout dev && git pull origin dev && git checkout -b"

# Utilisation:
# sync-dev
# new-feature feature/ma-feature
```

### Script de Déploiement Safe

```bash
#!/bin/bash
# deploy-to-prod.sh

echo "🚀 Déploiement vers Production"
echo ""

# Vérifications
echo "1️⃣ Build local..."
npm run build || exit 1

echo "2️⃣ Synchronisation dev..."
git checkout dev
git pull origin dev

echo "3️⃣ Synchronisation main..."
git checkout main
git pull origin main

echo "4️⃣ Merge dev → main..."
git merge dev --no-ff || exit 1

echo "5️⃣ Push vers main..."
git push origin main

echo "6️⃣ Synchronisation dev avec main..."
git checkout dev
git merge main --no-edit
git push origin dev

echo ""
echo "✅ Déploiement terminé!"
echo "📊 Vérifier: https://vercel.com/beateur/ninowash/deployments"
echo "🌐 Production: https://ninowash.fr"
```

---

## 📚 Ressources

- **Git Flow:** https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow
- **Conventional Commits:** https://www.conventionalcommits.org/
- **GitHub Flow:** https://guides.github.com/introduction/flow/

---

**Créé le:** 20 octobre 2025  
**Version:** 1.0  
**Dernière mise à jour:** 20 octobre 2025  
**Status:** ✅ Workflow actif
