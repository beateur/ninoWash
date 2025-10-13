# Guide d'Implémentation : Feature Flag "Pause Réservations"

## ✅ Étapes Complétées

### 1. Feature Flag Configuration
- ✅ Ajouté `BOOKINGS_ENABLED` dans `lib/flags.ts`
- ✅ Variable documentée dans `.env.example`
- ✅ Hook `useBookingGuard` créé dans `hooks/use-booking-guard.ts`
- ✅ Lien Instagram vérifié dans le footer (`@nino.wash`)

---

## 🎯 Prochaines Étapes : Modifier les CTA

### Pattern de Modification Standard

**AVANT (Link statique)** :
```tsx
<Button size="lg" asChild>
  <Link href="/reservation/guest">Réserver maintenant</Link>
</Button>
```

**APRÈS (Hook avec guard)** :
```tsx
"use client"  // ← Ajouter en haut du fichier

import { useBookingGuard } from "@/hooks/use-booking-guard"

export function Component() {
  const { canBook, handleBookingClick } = useBookingGuard()
  
  return (
    <Button 
      size="lg" 
      onClick={() => handleBookingClick("/reservation/guest")}
      disabled={!canBook}
    >
      Réserver maintenant
    </Button>
  )
}
```

---

## 📂 Fichiers à Modifier (8 composants)

### 1. ✅ Hero Section
**Fichier** : `components/sections/hero-section.tsx`  
**Ligne** : 26  
**Modification** :
1. Ajouter `"use client"` en haut
2. Importer `useBookingGuard`
3. Remplacer `<Button asChild><Link>` par `<Button onClick={handleBookingClick}>`

---

### 2. ⏳ Header
**Fichier** : `components/layout/header.tsx`  
**Ligne** : 55  
**Code actuel** :
```tsx
<Link href="/reservation/guest">Réserver maintenant</Link>
```

**Code modifié** :
```tsx
"use client"
import { useBookingGuard } from "@/hooks/use-booking-guard"

// Dans le composant:
const { canBook, handleBookingClick } = useBookingGuard()

<Button onClick={() => handleBookingClick("/reservation/guest")} disabled={!canBook}>
  Réserver maintenant
</Button>
```

---

### 3. ⏳ Mobile Navigation
**Fichier** : `components/layout/mobile-nav.tsx`  
**Ligne** : 85  
**Code actuel** :
```tsx
<Link href="/reservation/guest" onClick={() => setIsOpen(false)} className="block">
  <Button className="w-full">Réserver maintenant</Button>
</Link>
```

**Code modifié** :
```tsx
const { canBook, handleBookingClick } = useBookingGuard()

<Button 
  className="w-full"
  onClick={() => {
    setIsOpen(false)
    handleBookingClick("/reservation/guest")
  }}
  disabled={!canBook}
>
  Réserver maintenant
</Button>
```

---

### 4. ⏳ Services Page
**Fichier** : `app/services/page.tsx`  
**Ligne** : 17  

---

### 5. ⏳ Comment ça marche (2 CTA)
**Fichier** : `app/comment-ca-marche/page.tsx`  
**Lignes** : 17 et 33  

---

### 6. ⏳ À propos
**Fichier** : `app/a-propos/page.tsx`  
**Ligne** : 191  

---

### 7. ⏳ CTA Section
**Fichier** : `components/sections/cta-section.tsx`  
**Ligne** : 18  

---

### 8. ⏳ Services Section
**Fichier** : `components/sections/services-section.tsx`  
**Ligne** : 149  
**Note** : Ce CTA redirige vers `/reservation?service=${service.id}` (authentifié)

---

## 🧪 Tests à Effectuer

### Test 1 : Flag Activé (Normal)
```bash
# .env.local
# NEXT_PUBLIC_BOOKINGS_ENABLED non défini (ou ="true")
```

**Résultat attendu** :
- ✅ Tous les boutons "Réserver" fonctionnent normalement
- ✅ Navigation vers `/reservation/guest` ou `/reservation`
- ✅ Aucun toast affiché

---

### Test 2 : Flag Désactivé (Bloqué)
```bash
# .env.local
NEXT_PUBLIC_BOOKINGS_ENABLED=false
```

**Résultat attendu** :
- ❌ Tous les boutons "Réserver" sont désactivés (grisés)
- 🚨 Clic sur bouton affiche toast :
  - Titre : "🚨 Réservations temporairement indisponibles"
  - Message : "Nous rencontrons un nombre élevé de demandes. Contactez-nous sur Instagram : @nino.wash (lien disponible dans le footer). Merci de votre compréhension !"
  - Durée : 6 secondes
- ✅ Lien Instagram dans footer cliquable

---

### Test 3 : Responsive
- Tester sur mobile (toast bien visible)
- Tester sur desktop
- Vérifier que les boutons désactivés ont un style clair

---

## 🚀 Activation en Production

### Scénario d'Urgence : Surcharge de Demandes

**Étape 1** : Connexion Vercel Dashboard
- URL : https://vercel.com

**Étape 2** : Sélectionner le projet Nino Wash

**Étape 3** : Settings → Environment Variables

**Étape 4** : Ajouter/Modifier la variable
- **Key** : `NEXT_PUBLIC_BOOKINGS_ENABLED`
- **Value** : `false`
- **Environments** : Production, Preview, Development

**Étape 5** : Save

**Étape 6** : Attendre ~30 secondes
- Les utilisateurs actuels verront le changement au prochain reload
- Pas besoin de redéployer !

---

### Réactivation

**Même procédure** :
- Modifier `NEXT_PUBLIC_BOOKINGS_ENABLED` → `true`
- Ou supprimer la variable (par défaut = activé)

---

## 📝 Communication Client

### Message Instagram Story (Suggestion)
```
🚨 Forte affluence !

Nos créneaux de réservation sont temporairement complets.

📲 Envoyez-nous un DM pour être contacté dès qu'un créneau se libère.

Merci de votre patience ! ❤️

#NinoWash #PressingDeLuxe
```

### Réponse Type DM
```
Bonjour ! 👋

Merci pour votre intérêt.

Nous rencontrons actuellement un nombre élevé de demandes. Nos créneaux seront de nouveau disponibles [date].

En attendant, nous notons votre demande et vous recontacterons dès qu'un créneau se libère.

À très vite ! 
L'équipe Nino Wash 🧺✨
```

---

## ⚠️ Points d'Attention

### 1. Performance
- Les composants passent de Server à Client Components
- Impact minime (hooks simples)

### 2. SEO
- Pas d'impact (boutons toujours présents dans le HTML)
- Juste désactivés côté client

### 3. Accessibilité
- Attribut `disabled` présent → lecteurs d'écran informés
- Toast ARIA-live → annoncé automatiquement

---

## 📊 Statistiques d'Implémentation

| Catégorie | Nombre |
|-----------|--------|
| Fichiers modifiés | 11 fichiers |
| CTA impactés | 8 références marketing |
| Lignes de code ajoutées | ~150 lignes |
| Temps d'implémentation | ~2h |
| Temps d'activation (urgence) | <2 minutes |

---

## 🔗 Références

- PRD Complet : `docs/PRD/PRD_BOOKING_PAUSE_FEATURE_FLAG.md`
- Liste des CTA : `docs/RESERVATION_FLOW_REFERENCES.md`
- Hook : `hooks/use-booking-guard.ts`
- Feature Flags : `lib/flags.ts`

---

**Dernière mise à jour** : 13 octobre 2025  
**Status** : ⏳ En cours d'implémentation (3/8 composants modifiés)
