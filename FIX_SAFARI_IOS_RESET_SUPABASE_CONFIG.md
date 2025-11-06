# 🔧 Configuration Supabase pour Safari iOS - Reset Password

## ⚠️ Problème Actuel

Sur Safari iOS, le lien de réinitialisation affiche :
- **Titre** : "Lien invalide"
- **Description** : "Erreur lors de la vérification du lien"

## 🎯 Solution : Configurer PKCE dans Supabase Dashboard

### Étape 1 : Vérifier l'URL Configuration

1. Aller sur **Supabase Dashboard** → Votre projet → **Authentication** → **URL Configuration**

2. **Site URL** :
   ```
   https://ninowash.fr
   ```

3. **Redirect URLs** (ajouter cette ligne) :
   ```
   https://ninowash.fr/auth/callback
   https://ninowash.fr/auth/callback?type=recovery
   ```

---

### Étape 2 : Modifier le Template Email "Reset Password"

1. Aller sur **Authentication** → **Email Templates** → **Reset Password**

2. **ANCIEN** template (ne fonctionne PAS sur Safari iOS) :
   ```html
   <a href="{{ .SiteURL }}/auth/reset-password#access_token={{ .Token }}&type=recovery">
     Réinitialiser mon mot de passe
   </a>
   ```

3. **NOUVEAU** template (compatible PKCE + Safari iOS) :
   ```html
   <a href="{{ .SiteURL }}/auth/callback?code={{ .TokenHash }}&type=recovery">
     Réinitialiser mon mot de passe
   </a>
   ```

---

### Étape 3 : Activer PKCE Flow (déjà fait dans le code)

✅ **Déjà configuré** dans `/lib/supabase/client.ts` :
```typescript
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',  // ✅ Flow PKCE activé
        detectSessionInUrl: true,
        persistSession: true,
      },
      cookieOptions: {
        sameSite: 'lax',  // ✅ Compatible Safari iOS
      },
    }
  )
}
```

---

## 🧪 Procédure de Test

### Test complet sur iPhone Safari :

1. **Vider le cache Safari** :
   - Réglages → Safari → Avancé → Données de sites web → Supprimer

2. **Demander un nouveau lien** :
   - Aller sur `https://ninowash.fr/auth/forgot-password`
   - Entrer votre email
   - Cliquer sur "Envoyer"

3. **Ouvrir l'email sur iPhone** :
   - Ouvrir l'email Supabase
   - Cliquer sur le lien "Réinitialiser mon mot de passe"

4. **Vérifier le comportement** :
   - ✅ **Succès** : Redirection vers `/auth/reset-password` avec formulaire
   - ❌ **Échec** : "Lien invalide" → Le template email n'est pas à jour

---

## 🔍 Debug : Vérifier l'URL du lien

Avant de cliquer sur le lien dans l'email, **copier l'URL** et vérifier :

### ❌ Ancien format (ne marche PAS) :
```
https://ninowash.fr/auth/reset-password#access_token=XXX&type=recovery
```
→ Safari iOS supprime tout après le `#`

### ✅ Nouveau format (fonctionne) :
```
https://ninowash.fr/auth/callback?code=XXX&type=recovery
```
→ Safari iOS préserve les query params `?`

---

## 📋 Checklist Finale

- [ ] Site URL = `https://ninowash.fr` dans Supabase Dashboard
- [ ] Redirect URLs contient `https://ninowash.fr/auth/callback`
- [ ] Template email utilise `{{ .SiteURL }}/auth/callback?code={{ .TokenHash }}&type=recovery`
- [ ] Code PKCE activé (`flowType: 'pkce'` dans client.ts) ✅
- [ ] Test sur iPhone Safari avec **nouveau lien** (pas un ancien)

---

## 🚨 Erreur Persistante ?

Si après avoir modifié le template, l'erreur persiste :

1. **Attendre 5 minutes** (cache Supabase)
2. **Vérifier que vous testez avec un NOUVEAU lien** (pas un ancien email)
3. **Vérifier les logs Supabase** :
   - Dashboard → Logs → Auth Logs
   - Rechercher l'erreur exacte

4. **Vérifier la console navigateur** :
   - Ouvrir Safari → Développement → Inspecteur Web
   - Onglet Console
   - Copier les erreurs

---

## 📞 Support

Si le problème persiste après ces changements, fournir :
1. L'URL exacte du lien reçu dans l'email
2. Les logs de la console Safari
3. Screenshot de l'erreur
