# Modifications Manuelles : Feature Flag "Pause Réservations"

## ✅ Composants Déjà Modifiés

### 1. Hero Section ✅
**Fichier** : `components/sections/hero-section.tsx`  
**Status** : ✅ Terminé

### 2. Header ✅
**Fichier** : `components/layout/header.tsx`  
**Status** : ✅ Terminé

### 3. Mobile Nav ✅
**Fichier** : `components/layout/mobile-nav.tsx`  
**Status** : ✅ Terminé

---

## ⏳ Composants Restants à Modifier

### 4. Services Page
**Fichier** : `app/services/page.tsx`  
**Ligne 1** : Ajouter `"use client"` en tout premier

**Ligne 1-3** : Modifier les imports
\`\`\`tsx
// AVANT:
import { ServicesSection } from "@/components/sections/services-section"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// APRÈS:
"use client"

import { ServicesSection } from "@/components/sections/services-section"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useBookingGuard } from "@/hooks/use-booking-guard"
\`\`\`

**Ligne 5** : Ajouter le hook dans le composant
\`\`\`tsx
// AVANT:
export default function ServicesPage() {
  return (

// APRÈS:
export default function ServicesPage() {
  const { canBook, handleBookingClick } = useBookingGuard()
  
  return (
\`\`\`

**Ligne ~16-18** : Modifier le bouton "Réserver maintenant"
\`\`\`tsx
// AVANT:
          <Button asChild size="lg">
            <Link href="/reservation/guest">Réserver maintenant</Link>
          </Button>

// APRÈS:
          <Button 
            size="lg"
            onClick={() => handleBookingClick("/reservation/guest")}
            disabled={!canBook}
          >
            Réserver maintenant
          </Button>
\`\`\`

---

### 5. Comment ça marche (2 CTA)
**Fichier** : `app/comment-ca-marche/page.tsx`

#### CTA #1 (Hero Section - ligne ~17)
**Avant** :
\`\`\`tsx
<Button asChild>
  <Link href="/reservation/guest">Réserver maintenant</Link>
</Button>
\`\`\`

**Après** :
\`\`\`tsx
<Button 
  onClick={() => handleBookingClick("/reservation/guest")}
  disabled={!canBook}
>
  Réserver maintenant
</Button>
\`\`\`

#### CTA #2 (Fin de page - ligne ~33)
**Avant** :
\`\`\`tsx
<Button asChild>
  <Link href="/reservation/guest">Réserver maintenant</Link>
</Button>
\`\`\`

**Après** :
\`\`\`tsx
<Button 
  onClick={() => handleBookingClick("/reservation/guest")}
  disabled={!canBook}
>
  Réserver maintenant
</Button>
\`\`\`

**Imports à ajouter** :
\`\`\`tsx
"use client"  // en ligne 1

import { useBookingGuard } from "@/hooks/use-booking-guard"  // dans les imports

// Dans le composant:
const { canBook, handleBookingClick } = useBookingGuard()
\`\`\`

---

### 6. À propos
**Fichier** : `app/a-propos/page.tsx`  
**Ligne** : ~191

**Avant** :
\`\`\`tsx
<Button asChild>
  <Link href="/reservation/guest">Réserver maintenant</Link>
</Button>
\`\`\`

**Après** :
\`\`\`tsx
<Button 
  onClick={() => handleBookingClick("/reservation/guest")}
  disabled={!canBook}
>
  Réserver maintenant
</Button>
\`\`\`

**Imports à ajouter** :
\`\`\`tsx
"use client"  // en ligne 1

import { useBookingGuard } from "@/hooks/use-booking-guard"

// Dans le composant:
const { canBook, handleBookingClick } = useBookingGuard()
\`\`\`

---

### 7. CTA Section
**Fichier** : `components/sections/cta-section.tsx`  
**Ligne** : ~18

**Avant** :
\`\`\`tsx
<Button asChild>
  <Link href="/reservation/guest">Réserver maintenant</Link>
</Button>
\`\`\`

**Après** :
\`\`\`tsx
<Button 
  onClick={() => handleBookingClick("/reservation/guest")}
  disabled={!canBook}
>
  Réserver maintenant
</Button>
\`\`\`

**Imports à ajouter** :
\`\`\`tsx
"use client"  // en ligne 1

import { useBookingGuard } from "@/hooks/use-booking-guard"

// Dans le composant:
export function CtaSection() {
  const { canBook, handleBookingClick } = useBookingGuard()
  
  return (
    // ...
  )
}
\`\`\`

---

### 8. Services Section
**Fichier** : `components/sections/services-section.tsx`  
**Ligne** : ~149

⚠️ **ATTENTION** : Ce CTA est différent des autres car il redirige vers `/reservation?service=${service.id}` (utilisateurs authentifiés).

**Avant** :
\`\`\`tsx
<Button asChild>
  <Link href={`/reservation?service=${service.id}`}>
    Choisir ce service
  </Link>
</Button>
\`\`\`

**Après** :
\`\`\`tsx
<Button 
  onClick={() => handleBookingClick(`/reservation?service=${service.id}`)}
  disabled={!canBook}
>
  Choisir ce service
</Button>
\`\`\`

**Imports à ajouter** :
\`\`\`tsx
"use client"  // en ligne 1

import { useBookingGuard } from "@/hooks/use-booking-guard"

// Dans le composant:
export function ServicesSection() {
  const { canBook, handleBookingClick } = useBookingGuard()
  
  return (
    // ...
  )
}
\`\`\`

---

## 📋 Pattern Général à Appliquer

Pour chaque composant :

### Étape 1 : Ajouter "use client"
\`\`\`tsx
"use client"  // TOUJOURS en ligne 1, avant les imports
\`\`\`

### Étape 2 : Importer le hook
\`\`\`tsx
import { useBookingGuard } from "@/hooks/use-booking-guard"
\`\`\`

### Étape 3 : Utiliser le hook dans le composant
\`\`\`tsx
export function MonComposant() {
  const { canBook, handleBookingClick } = useBookingGuard()
  
  return (
    // JSX...
  )
}
\`\`\`

### Étape 4 : Remplacer les boutons
\`\`\`tsx
// ❌ ANCIEN (avec Link):
<Button asChild>
  <Link href="/reservation/guest">Réserver maintenant</Link>
</Button>

// ✅ NOUVEAU (avec onClick):
<Button 
  onClick={() => handleBookingClick("/reservation/guest")}
  disabled={!canBook}
>
  Réserver maintenant
</Button>
\`\`\`

---

## 🧪 Test Rapide

1. **Vérifier la compilation** :
   \`\`\`bash
   pnpm tsc --noEmit
   \`\`\`

2. **Tester en local** :
   \`\`\`bash
   # Dans .env.local, ajouter:
   NEXT_PUBLIC_BOOKINGS_ENABLED=false
   
   # Lancer le serveur:
   pnpm dev
   
   # Visiter les pages et cliquer sur "Réserver"
   # → Doit afficher le toast avec message Instagram
   \`\`\`

3. **Réactiver** :
   \`\`\`bash
   # Dans .env.local, changer en:
   NEXT_PUBLIC_BOOKINGS_ENABLED=true
   
   # Ou supprimer la ligne complètement (par défaut = true)
   \`\`\`

---

## ⚠️ Erreurs Courantes

### Erreur : "Link is not defined"
**Cause** : Oubli d'importer `Link` si utilisé ailleurs dans le composant  
**Solution** : Garder `import Link from "next/link"` si d'autres liens existent

### Erreur : "'use client' must be at the top"
**Cause** : `"use client"` n'est pas en ligne 1  
**Solution** : Déplacer AVANT tous les imports

### Erreur : "Cannot use hooks in Server Component"
**Cause** : Oubli de `"use client"`  
**Solution** : Ajouter `"use client"` en ligne 1

---

## 📊 Progress Tracker

| #  | Fichier | Status | Notes |
|----|---------|--------|-------|
| 1  | `hero-section.tsx` | ✅ Terminé | - |
| 2  | `header.tsx` | ✅ Terminé | - |
| 3  | `mobile-nav.tsx` | ✅ Terminé | - |
| 4  | `services/page.tsx` | ⏳ À faire | 1 CTA |
| 5  | `comment-ca-marche/page.tsx` | ⏳ À faire | 2 CTA |
| 6  | `a-propos/page.tsx` | ⏳ À faire | 1 CTA |
| 7  | `cta-section.tsx` | ⏳ À faire | 1 CTA |
| 8  | `services-section.tsx` | ⏳ À faire | 1 CTA (route spéciale) |

**Total** : 3/8 composants terminés (37%)

---

## 🚀 Prochaines Étapes

1. Terminer les 5 composants restants manuellement
2. Exécuter `pnpm tsc --noEmit` pour vérifier la compilation
3. Tester avec `NEXT_PUBLIC_BOOKINGS_ENABLED=false`
4. Commit des changements

---

**Dernière mise à jour** : 13 octobre 2025  
**Par** : GitHub Copilot (auto-generated)
