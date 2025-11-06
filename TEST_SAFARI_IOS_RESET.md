# 📱 Guide de Test - Safari iOS Password Reset

## Test Rapide (5 minutes)

### Prérequis
- iPhone avec Safari
- Compte email accessible sur iPhone
- Compte sur l'application (ou créer un nouveau)

---

## 🧪 Étapes de Test

### 1. Demander Réinitialisation
1. Sur iPhone, aller sur: `https://votredomaine.com/auth/forgot-password`
2. Entrer votre email
3. Cliquer "Envoyer le lien"
4. ✅ Vérifier: Message de confirmation s'affiche

### 2. Vérifier Email
1. Ouvrir l'app Mail sur iPhone
2. Trouver l'email de reset password
3. ✅ Vérifier: Email reçu

### 3. Cliquer sur le Lien (MOMENT CRITIQUE)
1. Dans l'email, cliquer sur le bouton/lien de reset
2. Safari iOS s'ouvre
3. **AVANT LE FIX:**
   - ❌ Page "Lien invalide"
   - ❌ Impossible de reset
4. **APRÈS LE FIX:**
   - ✅ Page de loading brève
   - ✅ Formulaire "Nouveau mot de passe" s'affiche

### 4. Changer le Mot de Passe
1. Entrer nouveau mot de passe (min 8 caractères)
2. Confirmer le mot de passe
3. Cliquer "Réinitialiser le mot de passe"
4. ✅ Vérifier: Message de succès
5. ✅ Vérifier: Redirection vers dashboard

### 5. Tester Connexion
1. Se déconnecter
2. Se reconnecter avec le nouveau mot de passe
3. ✅ Vérifier: Connexion réussie

---

## 🔍 Points de Vérification Détaillés

### URL à Vérifier
Après avoir cliqué le lien dans l'email, vérifier l'URL:

**Format attendu:**
```
https://votredomaine.com/auth/callback?code=ABC123...&type=recovery
```

**Vérifications:**
- ✅ Pas de `#` (hash) dans l'URL
- ✅ Paramètre `code` présent
- ✅ Paramètre `type=recovery` présent

### Comportements Attendus

**Page Callback:**
- Durée: < 2 secondes
- Action: Échange code contre session
- Redirection: Vers `/auth/reset-password`

**Page Reset Password:**
- Affichage: Loading 1-2 secondes
- Puis: Formulaire mot de passe
- Si erreur: Message clair avec bouton "Demander nouveau lien"

---

## 🐛 Scénarios d'Erreur à Tester

### Scénario 1: Lien Expiré
1. Demander reset password
2. **Attendre 1 heure**
3. Cliquer le lien
4. ✅ Attendu: Message "Session expirée, demander nouveau lien"

### Scénario 2: Lien Déjà Utilisé
1. Demander reset password
2. Utiliser le lien avec succès
3. Essayer de réutiliser le même lien
4. ✅ Attendu: Message "Lien déjà utilisé"

### Scénario 3: Mauvais Format Mot de Passe
1. Arriver sur page reset password
2. Entrer mot de passe < 8 caractères
3. ✅ Attendu: Message d'erreur validation

### Scénario 4: Mots de Passe Non Identiques
1. Entrer mot de passe
2. Entrer confirmation différente
3. ✅ Attendu: Message "Les mots de passe ne correspondent pas"

---

## 📊 Checklist de Test

### Test Basique
- [ ] Email reçu
- [ ] Lien cliquable
- [ ] Page reset password s'affiche
- [ ] Formulaire fonctionnel
- [ ] Changement mot de passe réussi
- [ ] Redirection dashboard
- [ ] Connexion avec nouveau mot de passe

### Test Safari iOS Spécifique
- [ ] Pas d'erreur "lien invalide"
- [ ] Pas de freeze/loading infini
- [ ] Session correctement créée
- [ ] Cookies fonctionnels
- [ ] LocalStorage accessible

### Test Navigateurs Alternatifs (Desktop)
- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari macOS
- [ ] Edge Desktop

### Test Autres Mobiles
- [ ] Chrome iOS
- [ ] Chrome Android
- [ ] Firefox iOS

---

## 🔧 Debug si Problème

### Si "Lien Invalide" Persiste

**1. Vérifier l'URL après clic:**
```
Si URL contient # (hash) → Problème config client
Si URL sans code → Problème Supabase
Si URL correcte → Problème session
```

**2. Vérifier Console Browser:**
Sur iPhone:
- Settings > Safari > Advanced > Web Inspector
- Connecter iPhone à Mac
- Safari Desktop > Develop > [iPhone] > Votre onglet

**3. Vérifier Supabase Dashboard:**
- Authentication > Logs
- Chercher tentatives de reset password
- Voir erreurs éventuelles

**4. Vérifier Variables Environnement:**
```bash
# Vercel Dashboard > Project > Settings > Environment Variables
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_DOMAIN=votredomaine.com (prod only)
```

**5. Vérifier Redirect URLs:**
Supabase Dashboard > Authentication > URL Configuration:
```
https://votredomaine.com/auth/callback ✅
https://votredomaine.com/auth/reset-password ✅
```

---

## 📝 Template Rapport de Test

```markdown
### Test Reset Password Safari iOS

**Date:** [date]
**Testeur:** [nom]
**Device:** iPhone [modèle], iOS [version]
**Navigateur:** Safari [version]

**Résultats:**
- [ ] ✅ Email reçu
- [ ] ✅ Lien fonctionnel (pas d'erreur "invalide")
- [ ] ✅ Page reset password affichée
- [ ] ✅ Mot de passe changé
- [ ] ✅ Connexion avec nouveau mot de passe

**Temps total:** [X] minutes

**Problèmes rencontrés:**
[décrire si applicable]

**Screenshots:**
[joindre si problème]
```

---

## ✅ Résultat Attendu

**Flow complet en ~2 minutes:**
1. Demander reset (30s)
2. Recevoir email (30s)
3. Cliquer lien → formulaire (10s)
4. Changer mot de passe (30s)
5. Redirection dashboard (5s)
6. Tester connexion (30s)

**Aucune erreur "lien invalide" ✅**

---

## 🎯 KPIs de Succès

- **Taux de succès:** > 95% (vs ~60% avant)
- **Temps moyen:** < 3 minutes
- **Taux d'abandon:** < 5%
- **Tickets support:** 0 "lien invalide"

---

## 📞 Contact Support

Si problème persiste après tests:
1. Capturer screenshot erreur
2. Noter URL exacte
3. Noter modèle iPhone et version iOS
4. Créer ticket avec ces informations

---

**Bon test ! 🧪**
