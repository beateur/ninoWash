# Summary: Payment Method Card Actions Enhancement

**Date**: 6 octobre 2025  
**Feature**: Enhanced payment method card with dropdown menu (Replace + Delete)

---

## 🎯 Objectif

Améliorer l'UX des cartes de paiement en ajoutant un menu dropdown avec les actions :
- ✅ **Définir par défaut** (si non-par défaut)
- ✅ **Remplacer la carte** (workflow explicatif)
- ✅ **Supprimer** (confirmation dialog)

---

## 🔧 Modifications Techniques

### 1. **PaymentMethodCard** (`components/payment-methods/payment-method-card.tsx`)

**Changements** :
- Ajout de l'icône `Edit` (Lucide)
- Ajout du callback `onReplace` dans l'interface
- Refactorisation du menu dropdown pour toujours l'afficher (même pour carte par défaut)
- Ajout de l'option "Remplacer la carte" dans le menu
- Utilisation de `DropdownMenuSeparator` pour séparer visuellement les actions

**Avant** :
\`\`\`tsx
// Dropdown uniquement pour cartes non-par défaut
// Bouton "Supprimer" seul pour carte par défaut
\`\`\`

**Après** :
\`\`\`tsx
// Dropdown toujours affiché avec actions contextuelles :
// - "Définir par défaut" (si non-par défaut)
// - "Remplacer la carte" (toujours)
// - "Supprimer" (toujours)
\`\`\`

---

### 2. **ReplacePaymentMethodDialog** (nouveau composant)

**Fichier** : `components/payment-methods/replace-payment-method-dialog.tsx`

**Rôle** : Dialog explicatif qui informe l'utilisateur que pour des raisons de sécurité Stripe, on ne peut pas "modifier" directement une carte. Le workflow est :
1. Supprimer l'ancienne carte
2. Ajouter une nouvelle carte via formulaire Stripe

**Design** :
- Icône `Info` bleue (pas destructive)
- Alert bleu avec explication sécurité
- Liste ordonnée des étapes
- Bouton "Continuer" (bleu) + "Annuler"

**Props** :
\`\`\`tsx
interface ReplacePaymentMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  paymentMethod: {
    card_brand: string
    card_last4: string
  } | null
}
\`\`\`

---

### 3. **PaymentMethodsList** (`components/payment-methods/payment-methods-list.tsx`)

**Changements** :
- Correction des noms de colonnes : `card_brand`, `card_last4`, `card_exp_month`, `card_exp_year`
- Ajout de l'état `methodToReplace` + `replaceDialogOpen`
- Ajout du handler `handleReplace(id: string)`
- Ajout du handler `handleReplaceConfirm()` qui :
  1. Supprime l'ancienne carte via API DELETE
  2. Refresh la liste
  3. Ouvre automatiquement le dialog "Ajouter une carte"
  4. Toast de confirmation
- Passage du callback `onReplace` à `PaymentMethodCard`
- Ajout du composant `<ReplacePaymentMethodDialog />`

---

## 📊 Workflow Utilisateur

### Scénario: Remplacer une carte

1. **User** clique sur le menu dropdown (icône `•••`)
2. **User** clique sur "Remplacer la carte"
3. **Dialog explicatif** s'affiche :
   - Titre: "Remplacer votre carte"
   - Explication sécurité Stripe
   - Liste des étapes (suppression + ajout)
4. **User** clique sur "Continuer"
5. **Backend** supprime l'ancienne carte (soft delete: `is_active = false`)
6. **Frontend** refresh la liste des cartes
7. **Dialog "Ajouter une carte"** s'ouvre automatiquement avec Stripe Elements
8. **User** remplit le formulaire Stripe avec la nouvelle carte
9. **Backend** enregistre la nouvelle carte
10. **Frontend** refresh la liste → nouvelle carte visible

---

## 🎨 UI/UX

### Menu Dropdown (toujours affiché)

**Pour carte par défaut** :
\`\`\`
┌───────────────────────┐
│ 📝 Remplacer la carte │
├───────────────────────┤
│ 🗑️  Supprimer          │
└───────────────────────┘
\`\`\`

**Pour carte non-par défaut** :
\`\`\`
┌───────────────────────┐
│ ⭐ Définir par défaut │
├───────────────────────┤
│ 📝 Remplacer la carte │
├───────────────────────┤
│ 🗑️  Supprimer          │
└───────────────────────┘
\`\`\`

### Replace Dialog

\`\`\`
┌────────────────────────────────────────┐
│ ℹ️  Remplacer votre carte              │
│                                         │
│ Vous êtes sur le point de remplacer    │
│ votre carte Visa •••• 4242.            │
│                                         │
│ ⚠️ Pour des raisons de sécurité, nous  │
│    ne pouvons pas modifier directement │
│    les informations d'une carte.       │
│                                         │
│ 1. Supprimer l'ancienne carte          │
│ 2. Ajouter votre nouvelle carte        │
│                                         │
│         [Annuler]  [Continuer]         │
└────────────────────────────────────────┘
\`\`\`

---

## 🔐 Sécurité & Stripe

### Pourquoi on ne peut pas "modifier" ?

**Stripe ne permet pas de modifier les détails d'une carte** (PCI-DSS compliance) :
- Le numéro de carte, CVV, expiration sont **tokenisés** et **immutables**
- Stripe expose uniquement `last4`, `brand`, `exp_month`, `exp_year` (lecture seule)
- Pour changer de carte, il faut créer un nouveau Payment Method

### Workflow Stripe

1. **Setup Intent** : Créé côté serveur, retourne `clientSecret`
2. **Payment Element** : Formulaire Stripe sécurisé (iframe, pas de contact avec notre backend)
3. **Confirm Setup** : Tokenisation côté client → `paymentMethodId`
4. **Save to DB** : Backend récupère les détails depuis Stripe API et enregistre la référence

---

## ✅ Tests

### Test Manuel

1. ✅ Afficher la page `/payment-methods`
2. ✅ Cliquer sur le menu dropdown d'une carte
3. ✅ Vérifier que "Remplacer la carte" est présent
4. ✅ Cliquer sur "Remplacer la carte"
5. ✅ Vérifier le contenu du dialog explicatif
6. ✅ Cliquer sur "Continuer"
7. ✅ Vérifier que la carte est supprimée
8. ✅ Vérifier que le dialog "Ajouter une carte" s'ouvre automatiquement
9. ✅ Ajouter une nouvelle carte test (4242 4242 4242 4242)
10. ✅ Vérifier que la nouvelle carte apparaît dans la liste

### États à Tester

- ✅ Dropdown pour carte par défaut (pas d'option "Définir par défaut")
- ✅ Dropdown pour carte non-par défaut (option "Définir par défaut" présente)
- ✅ Loading state pendant la suppression
- ✅ Toast de confirmation "Ancienne carte supprimée"
- ✅ Dialog "Ajouter une carte" s'ouvre automatiquement après suppression
- ✅ Gestion d'erreur si la suppression échoue

---

## 📁 Fichiers Modifiés

\`\`\`
components/payment-methods/
├── payment-method-card.tsx              (modifié)
├── payment-methods-list.tsx             (modifié)
├── replace-payment-method-dialog.tsx    (nouveau)
└── README.md                            (à mettre à jour)
\`\`\`

---

## 📝 TODO (Optionnel)

- [ ] Ajouter des tests unitaires pour `handleReplace` et `handleReplaceConfirm`
- [ ] Documenter le workflow dans `docs/PAYMENT_METHODS_WORKFLOW.md`
- [ ] Ajouter des analytics (track "replace_card_initiated", "replace_card_completed")
- [ ] Internationalisation (i18n) des messages du dialog
- [ ] Améliorer l'accessibilité (ARIA labels pour le dropdown)

---

## 🎉 Résultat

Les utilisateurs peuvent maintenant facilement **remplacer** leur carte de paiement avec un workflow clair et sécurisé, tout en respectant les contraintes de sécurité PCI-DSS de Stripe.
