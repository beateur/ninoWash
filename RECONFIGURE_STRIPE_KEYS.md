# 🔧 Guide: Re-configurer les Clés Stripe sur Vercel

**Objectif :** Nettoyer les clés Stripe pour éviter ERR_INVALID_CHAR  
**Temps :** 5 minutes  
**Impact :** Fix immédiat sans redéploiement de code

---

## 🎯 Méthode Propre pour Configurer les Clés

### Étape 1 : Récupérer les clés depuis Stripe

1. **Aller sur Stripe Dashboard**
   - TEST mode : https://dashboard.stripe.com/test/apikeys
   - LIVE mode : https://dashboard.stripe.com/apikeys

2. **Copier la clé Publishable**
   - Cliquer sur "Reveal test key" (ou "Reveal live key")
   - **Méthode 1 (Recommandée) :**
     - Triple-cliquer sur la clé pour la sélectionner entièrement
     - CTRL+C (Cmd+C sur Mac)
   - **Méthode 2 :**
     - Cliquer sur l'icône "Copy" à côté de la clé

3. **Coller dans un éditeur de texte d'abord**
   ```bash
   # Ouvrir TextEdit/Notepad/VSCode
   # Coller la clé
   # Vérifier visuellement qu'il n'y a pas d'espace
   ```

4. **Re-copier depuis l'éditeur**
   - Sélectionner UNIQUEMENT la clé (sans espace avant/après)
   - CTRL+A puis CTRL+C

### Étape 2 : Configurer sur Vercel (via CLI)

**Option A : Via Terminal (RECOMMANDÉ)**

```bash
# 1. Se positionner dans le projet
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash

# 2. Supprimer les anciennes variables (Preview)
vercel env rm STRIPE_SECRET_KEY preview
vercel env rm NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY preview
vercel env rm STRIPE_WEBHOOK_SECRET preview

# 3. Ajouter les nouvelles (propres)
# IMPORTANT: NE PAS mettre de guillemets, Vercel les ajoute automatiquement

# Publishable Key (TEST pour Preview)
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY preview
# Coller: pk_test_51xxx (sans guillemets, sans espaces)

# Secret Key (TEST pour Preview)
vercel env add STRIPE_SECRET_KEY preview
# Coller: sk_test_51xxx (sans guillemets, sans espaces)

# Webhook Secret (TEST pour Preview)
vercel env add STRIPE_WEBHOOK_SECRET preview
# Coller: whsec_xxx (sans guillemets, sans espaces)
```

**Option B : Via Dashboard Vercel (Si tu préfères l'UI)**

1. **Aller sur Vercel Dashboard**
   - https://vercel.com/beateurs-projects/ninowash/settings/environment-variables

2. **Supprimer les variables existantes (Preview)**
   - Chercher `STRIPE_SECRET_KEY` → Preview → Delete
   - Chercher `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Preview → Delete
   - Chercher `STRIPE_WEBHOOK_SECRET` → Preview → Delete

3. **Ajouter les nouvelles variables**
   
   **Variable 1:**
   ```
   Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   Value: [COLLER ICI - UN SEUL CLIC, PAS D'ENTRÉE]
   Environment: Preview (cocher uniquement Preview)
   [Save]
   ```

   **Variable 2:**
   ```
   Name: STRIPE_SECRET_KEY
   Value: [COLLER ICI - UN SEUL CLIC, PAS D'ENTRÉE]
   Environment: Preview (cocher uniquement Preview)
   [Save]
   ```

   **Variable 3:**
   ```
   Name: STRIPE_WEBHOOK_SECRET
   Value: [COLLER ICI - UN SEUL CLIC, PAS D'ENTRÉE]
   Environment: Preview (cocher uniquement Preview)
   [Save]
   ```

### Étape 3 : Redéployer (obligatoire)

Les variables d'environnement ne sont appliquées qu'au **prochain déploiement**.

**Option A : Redéploiement automatique**
```bash
# Faire un commit vide pour forcer un redéploiement
git commit --allow-empty -m "chore: redeploy pour appliquer nouvelles vars Stripe"
git push origin dev
```

**Option B : Redéploiement manuel**
1. Aller sur https://vercel.com/beateurs-projects/ninowash/deployments
2. Trouver le dernier déploiement de `dev`
3. Cliquer sur les 3 points `...`
4. Cliquer "Redeploy"
5. Confirmer

### Étape 4 : Vérifier

**Attendre ~3 minutes**, puis :

1. **Tester le flow de paiement**
   - Créer un booking guest
   - Aller sur /booking/[id]/pay
   - Cliquer "Procéder au paiement"

2. **Vérifier les logs**
   ```bash
   vercel logs <url-preview> --follow
   ```

**Résultat attendu :**
```
✅ Pas d'erreur ERR_INVALID_CHAR
✅ Stripe Checkout s'ouvre
✅ Email pré-rempli
```

---

## 🔍 Comment Vérifier si les Clés sont Propres

### Test 1 : Via Node.js (Local)

```bash
# Dans le terminal
node -e "console.log(JSON.stringify(process.env.STRIPE_SECRET_KEY))"

# ✅ BON:
"sk_test_51xxx"

# ❌ MAUVAIS (espace à la fin):
"sk_test_51xxx "
              ^^

# ❌ MAUVAIS (retour à la ligne):
"sk_test_51xxx\n"
              ^^^^
```

### Test 2 : Via Vercel CLI

```bash
# Récupérer la valeur
vercel env pull .env.preview

# Vérifier dans un éditeur hexadécimal
hexdump -C .env.preview | grep STRIPE_SECRET_KEY

# Chercher les caractères suspects:
# 20 = espace
# 0A = \n (line feed)
# 0D = \r (carriage return)
# 09 = \t (tab)
```

### Test 3 : Via Script Python

```python
#!/usr/bin/env python3
import os

key = os.getenv('STRIPE_SECRET_KEY', '')

print(f"Longueur: {len(key)}")
print(f"Valeur: '{key}'")
print(f"Repr: {repr(key)}")

# Vérifier les caractères invisibles
if key != key.strip():
    print("❌ ERREUR: Espaces avant/après détectés!")
else:
    print("✅ OK: Pas d'espace")

if '\n' in key or '\r' in key:
    print("❌ ERREUR: Retour à la ligne détecté!")
else:
    print("✅ OK: Pas de retour à la ligne")
```

---

## 🚨 Erreurs Courantes

### Erreur 1 : Mettre des guillemets

```bash
# ❌ MAUVAIS
vercel env add STRIPE_SECRET_KEY preview
> Enter value: "sk_test_51xxx"
              ↑             ↑
           Guillemets inclus dans la valeur!

# ✅ BON
vercel env add STRIPE_SECRET_KEY preview
> Enter value: sk_test_51xxx
           Pas de guillemets
```

### Erreur 2 : Appuyer sur ENTRÉE après collage

```bash
# Dans le dashboard Vercel
Value: sk_test_51xxx[ENTRÉE]
                    ^^^^^^^^ Ajoute \n

# ✅ Bon
Value: sk_test_51xxx[CLIC SUR SAVE]
           Pas d'ENTRÉE, directement Save
```

### Erreur 3 : Copier avec le préfixe

```bash
# ❌ MAUVAIS (copié depuis la doc)
Secret key: sk_test_51xxx
↑↑↑↑↑↑↑↑↑↑↑↑ Texte en trop

# ✅ BON
sk_test_51xxx
Seulement la clé
```

---

## ✅ Checklist Complète

### Avant de Commencer
- [ ] Avoir accès au Stripe Dashboard
- [ ] Avoir accès au Vercel Dashboard ou CLI
- [ ] Savoir quelle clé utiliser (TEST pour Preview, LIVE pour Production)

### Configuration
- [ ] Copier la clé depuis Stripe Dashboard
- [ ] Coller dans un éditeur de texte
- [ ] Vérifier visuellement (pas d'espace visible)
- [ ] Sélectionner UNIQUEMENT la clé
- [ ] Re-copier depuis l'éditeur
- [ ] Supprimer l'ancienne variable sur Vercel
- [ ] Ajouter la nouvelle variable
- [ ] SANS guillemets
- [ ] SANS appuyer sur ENTRÉE
- [ ] Sauvegarder

### Après Configuration
- [ ] Redéployer (commit vide OU redeploy manuel)
- [ ] Attendre ~3 minutes
- [ ] Tester le flow de paiement
- [ ] Vérifier les logs Vercel
- [ ] Confirmer : pas d'erreur ERR_INVALID_CHAR

---

## 📊 Comparaison : Avant vs Après

### AVANT (avec caractères invisibles)

```
Variable Vercel: STRIPE_SECRET_KEY
Valeur: "sk_test_51xxx "
                      ↑ espace

Header HTTP généré:
Authorization: Bearer sk_test_51xxx 
                                  ↑ ERR_INVALID_CHAR
```

### APRÈS (propre)

```
Variable Vercel: STRIPE_SECRET_KEY
Valeur: "sk_test_51xxx"
                      Pas d'espace

Header HTTP généré:
Authorization: Bearer sk_test_51xxx
                                  ✅ Valide
```

---

## 🎓 Pourquoi le Code .trim() ne Suffit Pas ?

Tu pourrais penser : "On a ajouté `.trim()` dans le code, ça devrait marcher !"

**Problème :** Le `.trim()` dans le code sera actif **après le prochain déploiement**.

**Mais :** Le déploiement actuel sur Preview n'a **pas encore** le code avec `.trim()`.

**Timeline :**
```
14:23 - Push commit dbc3b89 (avec .trim())
14:24 - Vercel commence le build
14:27 - Build terminé, nouveau déploiement créé
14:30 - Tu testes → Nouvelle Preview URL générée
14:32 - ERREUR → Mais cette erreur est sur l'ANCIEN déploiement (sans .trim())
```

**Solution :**
1. Re-configurer les clés MAINTENANT (fix immédiat sur déploiement actuel)
2. Le prochain déploiement aura `.trim()` en bonus (protection future)

---

## 🚀 Commandes Rapides

```bash
# Tout en une fois (via Vercel CLI)

# Supprimer les anciennes
vercel env rm STRIPE_SECRET_KEY preview --yes
vercel env rm NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY preview --yes
vercel env rm STRIPE_WEBHOOK_SECRET preview --yes

# Ajouter les nouvelles (interactif)
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY preview
vercel env add STRIPE_SECRET_KEY preview
vercel env add STRIPE_WEBHOOK_SECRET preview

# Redéployer
git commit --allow-empty -m "chore: redeploy pour nouvelles vars Stripe"
git push origin dev

# Suivre le déploiement
vercel --prod=false
```

---

**Temps estimé :** 5 minutes  
**Difficulté :** ⭐☆☆☆☆ (Facile)  
**Impact :** Fix immédiat de l'erreur ERR_INVALID_CHAR
