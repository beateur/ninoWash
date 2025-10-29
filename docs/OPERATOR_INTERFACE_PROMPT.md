# 🤖 Prompt Agent - Interface Opérateur Nino Wash

**Date**: 29 octobre 2025  
**Objectif**: Développer l'interface opérateur complète de A à Z  
**Durée estimée**: 6-8 heures de développement

---

## 📋 PROMPT POUR L'AGENT

```
Tu es un développeur senior spécialisé en Next.js, TypeScript et Supabase. 

Ta mission est de créer une interface web complète pour le gérant d'un pressing, permettant de visualiser et gérer les réservations clients.

SPÉCIFICATIONS COMPLÈTES : Lis attentivement le document `docs/OPERATOR_INTERFACE_SPECIFICATION.md` qui contient TOUTES les informations nécessaires (credentials, schema database, code, etc.).

RÈGLES IMPORTANTES :
1. ✅ Suis EXACTEMENT les spécifications du document
2. ✅ Utilise les credentials fournis dans le document (ne demande RIEN)
3. ✅ Implémente TOUT le code fourni dans les sections 2 à 8
4. ✅ Suis la checklist de développement (section 9) dans l'ordre
5. ✅ Teste chaque phase avant de passer à la suivante
6. ❌ NE demande AUCUNE clarification (tout est dans le document)
7. ❌ NE modifie PAS les credentials ou la configuration Supabase
8. ❌ NE crée PAS de fonctionnalités non spécifiées

PROCESSUS DE DÉVELOPPEMENT :

Phase 0 - Setup Initial (OBLIGATOIRE - 30 min)
├─ Créer projet Next.js avec TypeScript et Tailwind
├─ Installer toutes les dépendances listées
├─ Créer .env.local avec les 3 clés Supabase du document
├─ Créer structure: components/, lib/, app/login/
├─ Créer lib/supabase.ts (client Supabase - code fourni)
├─ Créer lib/types.ts (types TypeScript - code fourni)
├─ Créer lib/utils.ts (helpers - code fourni)
└─ Tester: npm run dev → http://localhost:3000 doit fonctionner

Phase 1 - Authentification (1h)
├─ Créer compte opérateur dans Supabase (instructions section 8)
├─ Créer app/login/page.tsx (code complet fourni section 8)
├─ Créer middleware.ts (code fourni section 8)
├─ Tester connexion avec email: operateur@ninowash.fr
└─ Vérifier redirection vers / après login

Phase 2 - Dashboard Structure (1h)
├─ Créer app/page.tsx (layout fourni section 7)
├─ Implémenter système d'onglets (4 tabs)
├─ Ajouter états pour bookings (pending, pendingPayment, confirmed, history)
├─ Tester navigation entre onglets
└─ Vérifier responsive design

Phase 3 - Requêtes Database (1.5h)
├─ Implémenter requête "Pending" (section 6)
├─ Implémenter requête "Pending Payment" (section 6)
├─ Implémenter requête "Confirmed" (section 6)
├─ Implémenter requête "Historique" (section 6)
├─ Vérifier les JOINs avec user_addresses et booking_items
├─ Tester avec données réelles de la database
└─ Logger les résultats pour validation

Phase 4 - Composants UI (2h)
├─ Créer components/booking-card.tsx (code fourni section 7)
├─ Créer components/booking-list.tsx (code fourni section 7)
├─ Implémenter helpers dans lib/utils.ts si pas déjà fait
├─ Tester affichage avec réservations authentifiées
├─ Tester affichage avec réservations invités
├─ Vérifier tous les champs s'affichent correctement
└─ Styliser avec Tailwind (badges, couleurs, spacing)

Phase 5 - Actions Opérateur (1.5h)
├─ Implémenter fonction handleAccept (section 6)
├─ Implémenter fonction handleReject (section 6)
├─ Ajouter modal de confirmation pour "Refuser"
├─ Ajouter toasts/notifications de succès/erreur
├─ Tester acceptation d'une réservation pending
├─ Tester refus d'une réservation pending
├─ Vérifier que les cartes disparaissent/se déplacent correctement
└─ Tester edge cases (déjà traitée, etc.)

Phase 6 - Polish UI/UX (1h)
├─ Ajouter loading states (spinners pendant requêtes)
├─ Ajouter empty states ("Aucune réservation")
├─ Ajouter badges colorés pour status
├─ Optimiser responsive mobile/tablette
├─ Vérifier accessibilité (contraste, aria-labels)
└─ Tester sur différents navigateurs

Phase 7 - Tests & Validation (1h)
├─ Tester avec au moins 3 réservations pending
├─ Tester avec réservations de chaque statut
├─ Vérifier metadata invité vs user authentifié
├─ Tester actions (accept/reject) multiples
├─ Vérifier performance avec 20+ réservations
├─ Valider toutes les informations affichées
└─ Corriger les bugs détectés

Phase 8 - Déploiement (optionnel - 30 min)
├─ Configurer Vercel/Netlify
├─ Ajouter variables d'environnement en production
├─ Déployer
└─ Tester en production

CRITÈRES DE RÉUSSITE :
✅ Connexion opérateur fonctionne
✅ 4 onglets affichent les bonnes réservations
✅ Toutes les infos client/adresses/services affichées
✅ Actions Accepter/Refuser fonctionnent
✅ Gestion invités ET utilisateurs authentifiés
✅ Interface responsive et propre
✅ Aucune erreur console
✅ Performance correcte (< 2s chargement)

LIVRABLES ATTENDUS :
1. Projet Next.js fonctionnel
2. Code propre et commenté
3. Interface conforme aux maquettes (section 5)
4. Tous les tests passés
5. README.md avec instructions de démarrage

INFORMATIONS CRITIQUES :
- Database URL: https://slmhuhfunssmwhzajccm.supabase.co
- Les credentials sont dans le document (section 2)
- Le schema complet est dans le document (section 4)
- Tout le code TypeScript est fourni (sections 2, 6, 7, 8)
- Les requêtes SQL sont ready-to-use (section 6)

COMMENCE PAR :
1. Lire ENTIÈREMENT docs/OPERATOR_INTERFACE_SPECIFICATION.md
2. Créer le projet avec les commandes de la section "Démarrage Rapide"
3. Suivre la Phase 0 de la checklist
4. Progresser phase par phase en testant à chaque étape

NE PAS :
❌ Inventer des fonctionnalités
❌ Modifier le schema database
❌ Créer des boutons/pages non spécifiés
❌ Utiliser d'autres credentials
❌ Sauter des phases de test

COMMENCE MAINTENANT. Confirme que tu as bien lu le document et démarre par la Phase 0.
```

---

## 🎯 UTILISATION DU PROMPT

### Option 1: Agent IA Autonome (Claude, GPT-4, etc.)

Copier-coller le prompt ci-dessus dans votre agent IA avec accès au filesystem et terminal.

**Pré-requis**:
- Donner accès au dossier où créer le projet
- Donner accès au fichier `docs/OPERATOR_INTERFACE_SPECIFICATION.md`
- Autoriser l'agent à exécuter des commandes terminal
- Autoriser l'agent à créer/modifier des fichiers

### Option 2: Développeur Humain

Le prompt sert de guide méthodique pour un développeur. Suivre les phases dans l'ordre.

### Option 3: Pair Programming IA

Utiliser le prompt comme checklist et demander à l'IA d'implémenter chaque phase une par une.

---

## 📊 INDICATEURS DE PROGRESSION

### Phase 0 ✅
- [ ] Projet créé
- [ ] Dépendances installées
- [ ] .env.local configuré
- [ ] lib/ créé avec 3 fichiers
- [ ] `npm run dev` fonctionne

### Phase 1 ✅
- [ ] Compte opérateur créé dans Supabase
- [ ] Page login créée
- [ ] Middleware créé
- [ ] Connexion fonctionne
- [ ] Redirection après login OK

### Phase 2 ✅
- [ ] Dashboard créé
- [ ] 4 onglets visibles
- [ ] Navigation fonctionne
- [ ] États React en place

### Phase 3 ✅
- [ ] Requête Pending OK
- [ ] Requête Pending Payment OK
- [ ] Requête Confirmed OK
- [ ] Requête Historique OK
- [ ] Données s'affichent

### Phase 4 ✅
- [ ] BookingCard créé
- [ ] BookingList créé
- [ ] Helpers fonctionnent
- [ ] Invités ET auth affichés
- [ ] UI propre

### Phase 5 ✅
- [ ] Accepter fonctionne
- [ ] Refuser fonctionne
- [ ] Confirmations ajoutées
- [ ] Toasts fonctionnent
- [ ] Edge cases gérés

### Phase 6 ✅
- [ ] Loading states
- [ ] Empty states
- [ ] Badges colorés
- [ ] Responsive OK
- [ ] Accessible

### Phase 7 ✅
- [ ] Tests manuels passés
- [ ] Performance OK
- [ ] Bugs corrigés
- [ ] Validation complète

### Phase 8 ✅ (Optionnel)
- [ ] Déployé
- [ ] Variables env production
- [ ] Tests production OK

---

## 🚨 POINTS DE VIGILANCE POUR L'AGENT

### ⚠️ Erreurs Fréquentes à Éviter

1. **Oublier la SERVICE_ROLE_KEY**
   - ❌ Utiliser seulement ANON_KEY → RLS bloque l'accès
   - ✅ Utiliser SERVICE_ROLE_KEY côté serveur

2. **Confondre invités et authentifiés**
   - ❌ Toujours chercher dans user_addresses
   - ✅ Vérifier metadata.is_guest_booking d'abord

3. **Ignorer les relations**
   - ❌ Requête sans JOIN → données manquantes
   - ✅ Inclure tous les JOINs listés (section 6)

4. **Mauvais filtrage des statuts**
   - ❌ Afficher tous les bookings dans chaque onglet
   - ✅ Filtrer par status exact (voir section 5)

5. **Oublier les dates**
   - ❌ Afficher réservations passées dans "Confirmed"
   - ✅ Filtrer pickup_date >= TODAY

### ✅ Validations à Faire

Après chaque phase, vérifier:
- [ ] Aucune erreur console
- [ ] Types TypeScript corrects
- [ ] Données s'affichent comme attendu
- [ ] Actions fonctionnent
- [ ] Aucune régression

### 🔧 Debugging

Si problème:
1. Vérifier .env.local (3 clés présentes)
2. Vérifier console browser (erreurs réseau)
3. Vérifier Network tab (requêtes Supabase)
4. Logger les données retournées
5. Vérifier le schema dans Supabase Dashboard

---

## 📝 EXEMPLE DE CONVERSATION AVEC L'AGENT

**Vous:**
```
[Coller le prompt ci-dessus]
```

**Agent:** 
```
✅ J'ai lu le document OPERATOR_INTERFACE_SPECIFICATION.md
✅ J'ai compris les 8 phases de développement
✅ Je vais créer l'interface opérateur de bout en bout

Phase 0 - Setup Initial
═══════════════════════

Étape 1/8: Création du projet Next.js...
[exécute] npx create-next-app@latest operator-interface --typescript --tailwind --app --no-src-dir

✅ Projet créé avec succès

Étape 2/8: Installation des dépendances...
[exécute] cd operator-interface && npm install @supabase/supabase-js @supabase/auth-helpers-nextjs date-fns clsx tailwind-merge

✅ Dépendances installées

Étape 3/8: Configuration .env.local...
[crée fichier] .env.local avec les 3 clés du document

✅ Variables d'environnement configurées

...
```

---

## 🎓 FORMATION RAPIDE POUR L'AGENT

### Concepts Clés à Comprendre

**1. Réservations Invités vs Authentifiés**
- Invité: `user_id = NULL`, données dans `metadata` (JSONB)
- Authentifié: `user_id` présent, données dans tables relationnelles

**2. Les 4 Catégories de Réservations**
- **Pending**: `status = 'pending'` → Actions possibles
- **Pending Payment**: `status = 'pending_payment'` → Lecture seule
- **Confirmed**: `status = 'confirmed' AND pickup_date >= TODAY` → Lecture seule
- **Historique**: `status IN ('completed', 'cancelled') OR pickup_date < TODAY` → Lecture seule

**3. Actions Opérateur**
- **Accepter**: `UPDATE status = 'confirmed'` si `status = 'pending'`
- **Refuser**: `UPDATE status = 'cancelled'` si `status = 'pending'`

**4. Sécurité**
- SERVICE_ROLE_KEY = bypass RLS = UNIQUEMENT côté serveur
- ANON_KEY = respecte RLS = client-side OK

---

## ✅ CHECKLIST FINALE DE VALIDATION

Avant de déclarer le projet terminé, l'agent doit vérifier:

### Fonctionnalités
- [ ] Login opérateur fonctionne
- [ ] Dashboard affiche les 4 onglets
- [ ] Onglet Pending affiche les bonnes réservations
- [ ] Onglet Pending Payment affiche les bonnes réservations
- [ ] Onglet Confirmed affiche les bonnes réservations (futures)
- [ ] Onglet Historique affiche les bonnes réservations (passées/annulées)
- [ ] Bouton "Accepter" fonctionne (pending → confirmed)
- [ ] Bouton "Refuser" fonctionne (pending → cancelled)
- [ ] Modal de confirmation pour refus
- [ ] Toasts de succès/erreur

### Affichage des Données
- [ ] Numéro de réservation affiché
- [ ] Nom/Prénom client affiché (invité ET authentifié)
- [ ] Email client affiché
- [ ] Téléphone client affiché
- [ ] Adresse collecte affichée (rue, ville, code postal)
- [ ] Adresse livraison affichée
- [ ] Date/créneau collecte affichés
- [ ] Date/créneau livraison affichés
- [ ] Services commandés affichés (nom, quantité, prix)
- [ ] Instructions spéciales affichées
- [ ] Instructions d'accès affichées
- [ ] Montant total affiché (en euros, formaté)
- [ ] Badges de statut colorés

### Technique
- [ ] Aucune erreur console
- [ ] Aucune erreur TypeScript
- [ ] Types corrects partout
- [ ] Requêtes Supabase optimisées (avec JOINs)
- [ ] Loading states présents
- [ ] Empty states présents
- [ ] Responsive design (mobile/tablette/desktop)
- [ ] Accessibilité basique (contraste, labels)

### Code Quality
- [ ] Code commenté
- [ ] Fonctions réutilisables (helpers)
- [ ] Nommage clair des variables
- [ ] Structure propre (séparation components/lib)
- [ ] Pas de code dupliqué
- [ ] Gestion d'erreurs présente

### Documentation
- [ ] README.md avec instructions de démarrage
- [ ] Variables d'environnement documentées
- [ ] Credentials listés

---

## 🚀 LANCEMENT DE L'AGENT

**Commande pour lancer l'agent:**

```bash
# Si vous utilisez un agent CLI
agent-cli run --prompt "$(cat docs/OPERATOR_INTERFACE_PROMPT.md)" --context "docs/OPERATOR_INTERFACE_SPECIFICATION.md"

# Si vous utilisez Cursor/Copilot/Claude
# Coller le prompt dans le chat avec accès au filesystem
```

**Variables d'environnement pour l'agent:**
```bash
AGENT_WORKSPACE=/path/to/operator-interface
AGENT_MODE=autonomous
AGENT_MAX_ITERATIONS=100
AGENT_SAFETY=high
```

---

## 📞 SUPPORT

En cas de blocage de l'agent:

1. **Vérifier le document de spécifications**: Toutes les réponses y sont
2. **Checker les logs**: Console browser + terminal
3. **Tester manuellement**: Suivre la checklist phase par phase
4. **Vérifier Supabase Dashboard**: Les données sont-elles présentes ?

**Liens utiles:**
- Supabase Dashboard: https://supabase.com/dashboard/project/slmhuhfunssmwhzajccm
- Documentation Next.js: https://nextjs.org/docs
- Documentation Supabase: https://supabase.com/docs

---

**BONNE CHANCE À L'AGENT ! 🤖🚀**

Ce prompt est conçu pour permettre à un agent IA de développer l'interface complète sans intervention humaine, en suivant méthodiquement les 8 phases de développement.
