# Scripts - Nino Wash

Collection de scripts utilitaires pour le développement et le testing.

---

## 📜 Scripts Disponibles

### 1. `test-reset-credits.sh` ✅

**Description** : Script de test automatisé pour la fonction Edge "reset-weekly-credits" (production)

**Usage** :
```bash
# Définir les variables d'environnement
export SUPABASE_PROJECT_REF=your-project-ref
export SUPABASE_ANON_KEY=your-anon-key

# Exécuter le script
./scripts/test-reset-credits.sh
```

**Ce que le script fait** :
1. ✅ Vérifie que la fonction Edge est déployée (HTTP ping)
2. ✅ Exécute le reset des crédits hebdomadaires
3. ✅ Parse et affiche la réponse JSON
4. ✅ Valide le succès/échec
5. ✅ Affiche des instructions SQL pour vérifier les crédits créés

**Use Case** : Validation après déploiement, tests CI/CD

---

### 2. `dev-reset-credits.sh` 🆕 (DEV ONLY)

**Description** : Reset manuel des crédits pour le développement local

**Usage** :
```bash
# Charger les variables d'environnement
source .env.local

# Reset tous les abonnements actifs
./scripts/dev-reset-credits.sh

# Reset un utilisateur spécifique
./scripts/dev-reset-credits.sh abc-123-def-456
```

**Ce que le script fait** :
1. ✅ Récupère tous les abonnements actifs (ou utilisateur spécifique)
2. ✅ Demande confirmation interactive
3. ✅ Reset les crédits (monthly: 2, quarterly: 3)
4. ✅ Affiche la progression détaillée
5. ✅ Fournit des requêtes SQL de vérification

**Sortie attendue** :
```
═══════════════════════════════════════════════════════════
   🔄 Manual Credit Reset (DEV MODE)
═══════════════════════════════════════════════════════════

✅ Found 3 subscription(s)

Continue with reset? [y/N]: y

  Processing: abc-123-def (monthly) → 2 credits
    ✅ Success

Summary: 3 processed, 3 successful, 0 failed
```

**Use Case** : Tests locaux, itération rapide, régénération de crédits

---

## 🆚 Comparaison

| Feature | `test-reset-credits.sh` | `dev-reset-credits.sh` |
|---------|-------------------------|------------------------|
| **Cible** | Edge Function (production) | Database directe (dev) |
| **Environnement** | Tous (avec fonction déployée) | Development uniquement |
| **Filtre utilisateur** | Non | Oui (paramètre optionnel) |
| **Confirmation** | Non (automatisé) | Oui (interactif) |
| **Use Case** | CI/CD, validation déploiement | Tests locaux, itération rapide |

---

✅ Reset réussi !
   • Total traité: 5 abonnements
   • Succès: 5
   • Erreurs: 0

...
```

**Dépendances** :
- `curl` (installé par défaut sur macOS/Linux)
- `jq` (pour parser JSON) : `brew install jq` ou `apt-get install jq`

**Codes de sortie** :
- `0` : Tous les tests réussis
- `1` : Erreur détectée (voir logs)

**Troubleshooting** :
- **Erreur "Function not found"** : Déployer la fonction avec `supabase functions deploy reset-weekly-credits`
- **Erreur "Permission denied"** : Vérifier que `SUPABASE_ANON_KEY` est correcte
- **Erreur "No subscriptions found"** : Normal si environnement vide, créer un abonnement test

---

## 🔮 Scripts Futurs (À Créer)

### `seed-test-data.sh` (TODO)
Créer des données de test (users, subscriptions, bookings)

### `backup-database.sh` (TODO)
Backup automatisé de la base Supabase

### `deploy-all.sh` (TODO)
Déploiement complet (migrations + functions + frontend)

### `check-credits.sh` (TODO)
Vérifier rapidement les crédits d'un user spécifique

---

## 📝 Conventions

- **Permissions** : Tous les scripts doivent être exécutables (`chmod +x`)
- **Shebang** : Utiliser `#!/bin/bash` pour compatibilité
- **Exit codes** : `0` = succès, `1+` = erreur
- **Couleurs** : Utiliser codes ANSI pour meilleure lisibilité
- **Variables d'env** : Préférer les env vars aux arguments hardcodés

---

## 🧪 Tests

Avant de commit un script :
1. Tester en local
2. Vérifier les codes de sortie
3. Tester avec des données invalides
4. Documenter les dépendances

---

**Auteur** : Équipe Nino Wash  
**Dernière mise à jour** : 5 octobre 2025
