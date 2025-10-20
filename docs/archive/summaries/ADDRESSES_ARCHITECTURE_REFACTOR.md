# 📋 Réorganisation Architecture : Adresses vs Profil

**Date** : 6 octobre 2025  
**Contexte** : Séparation des composants Adresses et Profil pour une architecture plus claire

---

## 🎯 Objectif

Séparer les composants liés aux **adresses** (page dédiée `/addresses`) des composants liés au **profil utilisateur** (page `/profile`).

---

## 📁 Changements de Structure

### Avant (Structure mélangée)

\`\`\`
components/
├── profile/
│   ├── address-card.tsx                # ❌ Mélangé avec profil
│   ├── address-delete-confirm.tsx      # ❌ Mélangé avec profil
│   ├── address-form-dialog.tsx         # ❌ Mélangé avec profil
│   └── addresses-section.tsx           # ❌ Mélangé avec profil
\`\`\`

### Après (Architecture claire)

\`\`\`
components/
├── addresses/                           # ✅ Nouveau dossier dédié
│   ├── address-card.tsx
│   ├── address-delete-confirm.tsx
│   ├── address-form-dialog.tsx
│   ├── addresses-section.tsx
│   └── README.md
├── profile/                             # ✅ Maintenant vide (prêt pour composants profil)
└── forms/
    └── address-form.tsx                 # ✅ Reste ici (parcours réservation)
\`\`\`

---

## 🚀 Pages Impactées

### `/addresses` (Route Indépendante)
\`\`\`tsx
// app/(authenticated)/addresses/page.tsx
import { AddressesSection } from "@/components/addresses/addresses-section" // ✅ Nouveau chemin

export default async function AddressesPage() {
  await requireAuth()
  return <AddressesSection />
}
\`\`\`

### `/profile` (Nettoyé)
\`\`\`tsx
// app/(authenticated)/profile/page.tsx
// ✅ Supprimé : import { AddressesSection } from "@/components/profile/addresses-section"
// ✅ Supprimé : <AddressesSection /> dans le JSX

export default async function ProfilePage() {
  return (
    <Card>
      <ProfileForm /> {/* Uniquement les infos personnelles */}
    </Card>
  )
}
\`\`\`

---

## 🔗 Navigation (Sidebar)

### Avant
\`\`\`tsx
<Link href="/profile#addresses"> {/* ❌ Fragment d'URL */}
  Mes adresses
</Link>
\`\`\`

### Après
\`\`\`tsx
<Link href="/addresses"> {/* ✅ Route dédiée */}
  Mes adresses
</Link>
\`\`\`

**Fichier modifié** : `components/layout/dashboard-sidebar.tsx` (2 occurrences : Desktop + Mobile)

---

## 🛡️ Sécurité (Middleware)

Ajout de la route `/addresses` dans les routes protégées :

\`\`\`typescript
// middleware.ts
const PROTECTED_ROUTES = {
  auth: [
    "/dashboard",
    "/profile",
    "/addresses",  // ✅ Ajouté
    "/reservation",
    "/subscription/manage"
  ],
  // ...
}
\`\`\`

---

## 📦 Fichiers Déplacés

| Fichier | Avant | Après |
|---------|-------|-------|
| `address-card.tsx` | `components/profile/` | `components/addresses/` |
| `address-delete-confirm.tsx` | `components/profile/` | `components/addresses/` |
| `address-form-dialog.tsx` | `components/profile/` | `components/addresses/` |
| `addresses-section.tsx` | `components/profile/` | `components/addresses/` |

**Commandes exécutées** :
\`\`\`bash
mkdir components/addresses
mv components/profile/address-*.tsx components/addresses/
mv components/profile/addresses-section.tsx components/addresses/
\`\`\`

---

## ⚠️ Distinction Importante

### `components/forms/address-form.tsx` (Inchangé)
- **Usage** : Parcours de **réservation** (`/reservation`)
- **Contexte** : Formulaire inline pour ajouter une adresse pendant la réservation
- **Utilisateurs** : Invités ET authentifiés

### `components/addresses/address-form-dialog.tsx` (Déplacé)
- **Usage** : Page de **gestion des adresses** (`/addresses`)
- **Contexte** : Dialog complet avec liste des adresses + CRUD
- **Utilisateurs** : Authentifiés uniquement

**Ces deux composants ont des usages différents et ne doivent PAS être fusionnés.**

---

## ✅ Checklist de Validation

- [x] Dossier `components/addresses/` créé
- [x] 4 fichiers déplacés depuis `components/profile/`
- [x] Import mis à jour dans `app/(authenticated)/addresses/page.tsx`
- [x] Suppression de `<AddressesSection />` dans `/profile/page.tsx`
- [x] Mise à jour des liens dans `dashboard-sidebar.tsx` (2 occurrences)
- [x] Ajout de `/addresses` dans le middleware
- [x] Documentation créée (`components/addresses/README.md`)
- [x] Vérification TypeScript (aucune erreur d'import)
- [x] Dossier `components/profile/` maintenant vide (prêt pour composants profil)

---

## 🎯 Architecture Finale

\`\`\`
/profile               → Informations personnelles uniquement
/addresses             → Gestion complète des adresses (CRUD)
/subscription/manage   → Gestion abonnement
/reservation           → Parcours de réservation (utilise forms/address-form.tsx)
\`\`\`

---

## 📝 Notes pour le Futur

1. **`components/profile/`** est maintenant prêt à recevoir des composants spécifiques au profil (avatar, préférences, etc.)
2. Les composants d'adresses sont maintenant isolés et facilement réutilisables
3. La séparation permet une meilleure scalabilité (ajout de pages comme `/payment-methods`, `/settings`, etc.)

---

**Implémenté par** : GitHub Copilot  
**Validé par** : Tests de compilation TypeScript + Navigation manuelle
