# Mobile Responsive Testing Guide - Guest Booking Flow

**Date**: 9 octobre 2025  
**Phase**: Phase 1 Day 5  
**Scope**: Tests responsive iOS + Android

---

## 📱 Devices à Tester

### iOS (Safari)
- ✅ iPhone 14 Pro Max (430 x 932)
- ✅ iPhone 14 Pro (393 x 852)
- ✅ iPhone SE 3rd gen (375 x 667)
- ✅ iPad Pro 12.9" (1024 x 1366)
- ✅ iPad Air (820 x 1180)

### Android (Chrome)
- ✅ Samsung Galaxy S23 Ultra (412 x 915)
- ✅ Google Pixel 7 (412 x 915)
- ✅ Samsung Galaxy A54 (360 x 800)
- ✅ OnePlus 11 (384 x 854)

---

## 🧪 Test Checklist par Step

### Step 0: Contact

**Layout** :
- [ ] Formulaire centré et lisible
- [ ] Inputs ne débordent pas de l'écran
- [ ] Label au-dessus des champs (pas à côté)
- [ ] Bouton "Continuer" visible sans scroll

**Interactions** :
- [ ] Clavier mobile s'adapte (email → @, téléphone → numérique)
- [ ] Auto-focus sur premier champ fonctionne
- [ ] Checkbox RGPD cliquable (zone tactile suffisante)
- [ ] Toast notifications visibles et lisibles

**Validation** :
- [ ] Erreurs affichées en rouge sous les champs
- [ ] Messages d'erreur ne cassent pas le layout
- [ ] Validation en temps réel ne lag pas

---

### Step 1: Addresses

**Layout** :
- [ ] 2 formulaires (pickup + delivery) empilés verticalement
- [ ] Checkbox "Même adresse" bien visible
- [ ] Pas de scroll horizontal
- [ ] Espacement suffisant entre les champs

**Interactions** :
- [ ] Checkbox toggle formulaire delivery sans décalage
- [ ] Clavier adapté (postal → numérique, adresse → texte)
- [ ] Textarea access instructions scroll si long texte
- [ ] Bouton "Continuer" accessible sans scroll excessif

**Validation** :
- [ ] Code postal Paris (75xxx) validé correctement
- [ ] Erreurs visibles et ne cassent pas UI
- [ ] Toast notifications positionnées correctement

---

### Step 2: Services

**Layout** :
- [ ] Grid 1 colonne sur mobile (< 768px)
- [ ] Cards services lisibles (image + texte + prix)
- [ ] Sélecteurs quantité (+/-) assez grands (44px min)
- [ ] Barre total fixée en bas visible
- [ ] Textarea instructions scroll si long

**Interactions** :
- [ ] Boutons +/- réactifs au touch
- [ ] Scroll fluide dans la liste services
- [ ] Barre total sticky en bas (pas cachée par clavier)
- [ ] Loading skeleton s'affiche correctement

**Performance** :
- [ ] Fetch services < 2s
- [ ] Calcul total instantané (pas de lag)
- [ ] Pas de reflow visible lors du chargement

---

### Step 3: Date & Time

**Layout** :
- [ ] Calendrier s'adapte à la largeur écran
- [ ] Créneaux horaires empilés verticalement sur mobile
- [ ] Card summary livraison lisible
- [ ] Pas de scroll horizontal sur calendrier

**Interactions** :
- [ ] Tap sur date fonctionne (zone tactile suffisante)
- [ ] Sélection créneau horaire visuelle (border + bg change)
- [ ] Dates désactivées (dimanche + passé) grisées clairement
- [ ] Scroll calendrier ne déclenche pas scroll page

**Validation** :
- [ ] Impossible de sélectionner date passée
- [ ] Impossible de sélectionner dimanche
- [ ] Message erreur si pas de date/créneau sélectionné

---

### Step 4: Summary

**Layout** :
- [ ] 4 sections (contact, adresses, services, dates) empilées
- [ ] Cards lisibles avec icônes alignées
- [ ] Liste services scroll si > 5 items
- [ ] Total en gros (32px+) bien visible
- [ ] Bouton paiement en bas, bien accessible

**Interactions** :
- [ ] Scroll fluide dans summary
- [ ] Badge "Même adresse" visible si applicable
- [ ] Bouton paiement (placeholder) désactivé clairement
- [ ] Bouton test dev visible uniquement en dev mode

**Validation** :
- [ ] Toutes les données affichées correctement
- [ ] Total = somme des services (vérifier calcul)
- [ ] Dates formatées en français lisibles

---

## 🎯 Tests Critiques

### Navigation

**Stepper** :
- [ ] Stepper visible en haut (pas caché)
- [ ] Steps cliquables pour naviguer en arrière
- [ ] Step actuel highlighted clairement
- [ ] Steps complétés marqués (checkmark)

**Boutons** :
- [ ] Boutons Précédent/Suivant bien visibles
- [ ] Boutons assez grands (44px min height)
- [ ] Disabled state clairement visible
- [ ] Touch feedback (ripple ou color change)

### Persistance

**SessionStorage** :
- [ ] Refresh page → données persistent
- [ ] Switch entre apps → données persistent
- [ ] Fermer onglet puis rouvrir → données expirent après 24h
- [ ] Données effacées après expiration

### Performance

**Métriques Lighthouse Mobile** :
- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

**Core Web Vitals** :
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

---

## 🔍 Tests Spécifiques iOS

### Safari Quirks

- [ ] Input zoom disabled (font-size >= 16px)
- [ ] Bottom bar (navigation) ne cache pas boutons
- [ ] Touch events (pas click) utilisés pour interactions
- [ ] -webkit-overflow-scrolling: touch pour scroll fluide
- [ ] Safe area insets respectées (notch iPhone)

### Gestures

- [ ] Swipe back iOS n'interfère pas avec stepper
- [ ] Pull-to-refresh désactivé sur pages booking
- [ ] Long press ne déclenche pas menu contextuel

---

## 🔍 Tests Spécifiques Android

### Chrome Quirks

- [ ] Keyboard ne cache pas inputs actifs (viewport resize)
- [ ] Back button Android fonctionne (navigate back step)
- [ ] Bottom navigation bar ne cache pas boutons
- [ ] Touch ripple material design visible

### Gestures

- [ ] Swipe pour fermer onglet n'interfère pas
- [ ] Pull-to-refresh géré correctement

---

## 🧰 Outils de Test

### Browser DevTools

```bash
# Chrome DevTools
1. F12 → Toggle device toolbar (Cmd+Shift+M)
2. Sélectionner device dans dropdown
3. Toggle responsive mode
4. Network throttling: Fast 3G

# Safari iOS Simulator (Mac only)
1. Ouvrir Xcode Simulator
2. Safari → Develop → Simulator → iPhone X
3. Inspector Web
```

### Tests Réels

**URL de test** :
```
http://localhost:3000/reservation/guest
```

**Tunnel ngrok (pour tests device physique)** :
```bash
ngrok http 3000
# → https://xxxx.ngrok.io/reservation/guest
```

### Lighthouse CLI

```bash
# Mobile audit
npx lighthouse http://localhost:3000/reservation/guest \
  --preset=mobile \
  --output=html \
  --output-path=./lighthouse-mobile-report.html

# Desktop audit
npx lighthouse http://localhost:3000/reservation/guest \
  --preset=desktop \
  --output=html \
  --output-path=./lighthouse-desktop-report.html
```

---

## 📊 Test Results Template

### Device: iPhone 14 Pro (393 x 852)

| Step | Layout | Interactions | Validation | Notes |
|------|--------|--------------|------------|-------|
| Step 0: Contact | ✅ Pass | ✅ Pass | ✅ Pass | - |
| Step 1: Addresses | ✅ Pass | ⚠️ Minor | ✅ Pass | Checkbox zone tactile petite |
| Step 2: Services | ✅ Pass | ✅ Pass | ✅ Pass | - |
| Step 3: DateTime | ✅ Pass | ✅ Pass | ✅ Pass | - |
| Step 4: Summary | ✅ Pass | ✅ Pass | ✅ Pass | - |

**Overall** : ✅ **PASS** (1 minor issue)

---

## 🐛 Issues Found & Fixes

### Issue 1: Checkbox RGPD zone tactile trop petite (iOS)

**Symptôme** : Difficile de cliquer sur checkbox sur iPhone SE
**Fix** :
```css
/* Augmenter zone tactile */
.rgpd-checkbox {
  min-width: 44px;
  min-height: 44px;
  padding: 8px;
}
```

### Issue 2: Barre total cachée par clavier Android

**Symptôme** : Keyboard cache barre total sur Android Chrome
**Fix** :
```javascript
// Scroll to bottom bar when keyboard opens
window.addEventListener('resize', () => {
  if (document.activeElement.tagName === 'TEXTAREA') {
    document.querySelector('.total-bar').scrollIntoView({ behavior: 'smooth' })
  }
})
```

---

## ✅ Sign-off

**Tested by** : [Nom]  
**Date** : [Date]  
**Build** : [Git commit hash]  
**Status** : ✅ PASS / ⚠️ MINOR ISSUES / ❌ FAIL

**Devices Tested** :
- [ ] iPhone 14 Pro (iOS 17.5)
- [ ] iPhone SE (iOS 16.7)
- [ ] Samsung Galaxy S23 (Android 14)
- [ ] Google Pixel 7 (Android 14)

**Issues Found** : 0 critical, 0 major, 0 minor

**Ready for Phase 2** : ✅ YES

---

**Next Steps** :
- Apply fixes for any issues found
- Retest after fixes
- Document any known limitations
- Proceed to Phase 2 (Stripe integration)
