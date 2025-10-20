# 🎯 Résumé - Configuration Complète des Environnements

**Date:** 20 octobre 2025  
**Statut:** ✅ TOUS LES ENVIRONNEMENTS CONFIGURÉS

---

## 📊 Vue d'Ensemble

### Environnements Stripe

| Environnement | Clés Stripe | Webhook | Usage |
|---------------|-------------|---------|-------|
| **Production** | LIVE (pk_live/sk_live) | ninowash.org/api/webhooks/stripe | Clients réels |
| **Preview** | TEST (pk_test/sk_test) | Auto Vercel | Tests pre-merge |
| **Development** | TEST (pk_test/sk_test) | stripe listen | Dev local |

---

## ✅ Ce qui a été Configuré

### 1. Stripe Production (LIVE)

**Variables Vercel (Production):**
```bash
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_51SCydT8RTaT...
✅ STRIPE_SECRET_KEY = sk_live_51SCydT8RTaT...
✅ STRIPE_WEBHOOK_SECRET = whsec_rW0ezOF2XDOLQI...
```

**Webhook Stripe:**
- URL: `https://ninowash.org/api/webhooks/stripe`
- Mode: LIVE
- Événements: 8 configurés (checkout, payment_intent, subscription)

**Déploiement:**
- URL: https://ninowash.org
- Statut: ✅ Déployé avec clés LIVE
- Dernière mise à jour: 20 oct 2025 ~22h30

### 2. Stripe Development & Preview (TEST)

**Variables Vercel (Development + Preview):**
```bash
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_51SCydZ4Zvo5...
✅ STRIPE_SECRET_KEY = sk_test_51SCydZ4Zvo5...
✅ STRIPE_WEBHOOK_SECRET = whsec_3ff1dcb9bdda...
```

**Utilisation:**
- Development: `vercel dev` ou `npm run dev`
- Preview: Branches Git automatiques
- Cartes: 4242 4242 4242 4242

### 3. Migration Base de Données

**Architecture Supabase Auth:**
```
auth.users (11) ←→ user_profiles (11)
         ↓
   public.users (VIEW)
```

**Statut:**
- ✅ Migration SQL exécutée
- ✅ Contraintes FK corrigées
- ✅ Trigger auto-création profils actif
- ✅ 100% réconcilié (11 users = 11 profiles)

---

## 🚀 Comment Utiliser

### Développement Local

**Option 1: Script Automatique**
```bash
./start-dev.sh
```
Ce script va:
- Installer Stripe CLI si nécessaire
- Démarrer `stripe listen`
- Démarrer `npm run dev` ou `vercel dev`
- Afficher le webhook secret temporaire

**Option 2: Manuel**

**Terminal 1 - Stripe Webhooks:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Terminal 2 - Application:**
```bash
npm run dev
# ou
vercel dev
```

**Mise à jour .env.local:**
```bash
# Copier le webhook secret de stripe listen
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Test sur Preview

**1. Créer une branche de test:**
```bash
git checkout -b test/my-feature
git push origin test/my-feature
```

**2. Vercel déploie automatiquement:**
- URL Preview générée
- Utilise les clés TEST
- Webhooks configurés automatiquement

**3. Tester le flow complet:**
- Réservation guest
- Email de confirmation
- Paiement avec 4242...
- Vérifier webhook sur Stripe Dashboard (TEST)

### Production

**1. Merge vers main:**
```bash
git checkout main
git merge test/my-feature
git push origin main
```

**2. Vercel déploie automatiquement:**
- Utilise les clés LIVE
- Webhook production actif
- URL: https://ninowash.org

**3. Test avec vraie carte:**
- ⚠️ Utiliser une vraie carte bancaire
- Vérifier Stripe Dashboard (LIVE)
- Monitorer les webhooks

---

## 📝 Scripts Disponibles

### Scripts de Configuration

| Script | Description |
|--------|-------------|
| `configure-stripe-prod.sh` | Configure les clés Stripe LIVE (production) |
| `configure-stripe-dev.sh` | Configure les clés Stripe TEST (dev/preview) |
| `configure-vercel-env.sh` | Configure TOUTES les variables (complet) |
| `start-dev.sh` | Démarre l'environnement de développement |

### Commandes Utiles

```bash
# Vérifier les variables Stripe
vercel env ls | grep STRIPE

# Vérifier toutes les variables
vercel env ls

# Supprimer une variable
vercel env rm STRIPE_WEBHOOK_SECRET production

# Ajouter une variable
vercel env add STRIPE_WEBHOOK_SECRET production

# Déployer en production
vercel --prod

# Logs production
vercel logs https://ninowash.org

# Tester les webhooks localement
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger un événement de test
stripe trigger checkout.session.completed
```

---

## 🧪 Cartes de Test Stripe

| Type | Numéro | Résultat |
|------|--------|----------|
| **Succès** | 4242 4242 4242 4242 | ✅ Paiement réussi |
| **Refusé** | 4000 0000 0000 0002 | ❌ Carte refusée |
| **3D Secure** | 4000 0025 0000 3155 | 🔐 Auth requise |
| **Insuffisant** | 4000 0000 0000 9995 | 💸 Fonds insuffisants |

**Expiration:** N'importe quelle date future (ex: 12/30)  
**CVC:** N'importe quel 3 chiffres (ex: 123)  
**Code postal:** N'importe quel code

---

## 📚 Documentation

### Guides Créés

| Document | Contenu |
|----------|---------|
| `TESTING_GUIDE.md` | Guide complet de test du flow de paiement |
| `STRIPE_PRODUCTION_SETUP.md` | Configuration production Stripe |
| `DEPLOYMENT_SUCCESS.md` | Rapport de déploiement complet |
| `RECONCILIATION_FINALE.md` | Migration Supabase Auth |
| `MIGRATION_SUPABASE_AUTH_GUIDE.md` | Guide migration |

### Ressources Externes

- **Stripe Docs:** https://stripe.com/docs
- **Stripe Testing:** https://stripe.com/docs/testing
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## 🎯 Checklist de Test Complète

### Test Local (Development)
- [ ] `npm run dev` démarre sans erreur
- [ ] `stripe listen` fonctionne
- [ ] Réservation guest créée
- [ ] User/profile auto-créés
- [ ] Email de confirmation envoyé
- [ ] Paiement 4242... réussit
- [ ] Webhook reçu (200)
- [ ] Booking confirmé dans DB

### Test Preview
- [ ] Branch poussée crée deployment
- [ ] URL Preview accessible
- [ ] Clés TEST utilisées
- [ ] Flow complet fonctionne
- [ ] Webhooks reçus sur Stripe Dashboard (TEST)

### Test Production
- [ ] Merge vers main déclenche deploy
- [ ] https://ninowash.org accessible
- [ ] Clés LIVE actives
- [ ] Test avec vraie carte
- [ ] Webhooks reçus sur Stripe Dashboard (LIVE)
- [ ] Aucune erreur en production

---

## 🚨 Troubleshooting

### Webhook non reçu (local)

```bash
# Vérifier que stripe listen tourne
ps aux | grep "stripe listen"

# Redémarrer stripe listen
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copier le nouveau secret dans .env.local
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Erreur "Invalid API Key"

```bash
# Vérifier les clés dans .env.local
grep STRIPE .env.local

# Pour preview/prod, vérifier Vercel
vercel env ls production | grep STRIPE

# S'assurer que les clés correspondent à l'environnement
# Dev/Preview: pk_test_... et sk_test_...
# Production: pk_live_... et sk_live_...
```

### Paiement refusé

```bash
# En dev/preview: utiliser carte de test
4242 4242 4242 4242

# En prod: vérifier que c'est une vraie carte
# Vérifier Stripe Dashboard pour les détails
```

### Base de données non à jour

```sql
-- Vérifier les users
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM user_profiles;

-- Doivent être égaux!

-- Si différent, recréer les profils manquants
-- Voir: scripts/MIGRATION_TO_SUPABASE_AUTH.sql
```

---

## 📞 Support

### En cas de problème

1. **Vérifier les logs:**
   ```bash
   # Local
   Console du navigateur + terminal npm run dev
   
   # Preview/Prod
   vercel logs <url>
   ```

2. **Vérifier Stripe Dashboard:**
   - TEST: https://dashboard.stripe.com/test/payments
   - LIVE: https://dashboard.stripe.com/payments

3. **Vérifier Supabase:**
   - https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm

4. **Vérifier les variables:**
   ```bash
   vercel env ls
   ```

5. **Documentation:**
   - `TESTING_GUIDE.md` - Guide de test complet
   - `docs/troubleshooting/` - Guides de dépannage

---

## ✅ État Final

### Production (ninowash.org)
- ✅ Déployé avec clés Stripe LIVE
- ✅ Webhook production configuré
- ✅ Base de données réconciliée
- ✅ Prêt pour vrais paiements

### Preview (*.vercel.app)
- ✅ Clés Stripe TEST configurées
- ✅ Webhooks automatiques
- ✅ Test sur branches Git

### Development (localhost)
- ✅ Clés Stripe TEST dans .env.local
- ✅ Script de démarrage rapide
- ✅ Stripe CLI configuré
- ✅ Guide de test complet

---

**Créé le:** 20 octobre 2025  
**Dernière mise à jour:** 20 octobre 2025  
**Version:** 1.0 - Configuration Complète  
**Statut:** 🚀 PRÊT POUR DÉVELOPPEMENT ET PRODUCTION
