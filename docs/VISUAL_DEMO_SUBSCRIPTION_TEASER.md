# 🎨 Démonstration Visuelle - Subscription Teaser

## Vue d'ensemble

Ce document présente les deux états visuels du système de teaser d'abonnements.

---

## 🔒 État MVP (Flag OFF)

**Configuration** : `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=false`

### Carte Service Classique

```
┌─────────────────────────────────────┐
│         Service Classique          │
│  Parfait pour vos besoins ponctuels │
│                                     │
│            24,99€                   │
│     pour 8 kg (+1€/kg supp.)       │
│                                     │
│ ✓ Collecte et livraison à domicile │
│ ✓ Nettoyage professionnel          │
│ ✓ Livraison sous 72h               │
│ ✓ Assurance incluse                │
│ ✓ Accessible sans connexion        │
│                                     │
│ ┌─────────────────────────────┐   │
│ │       🔗 Réserver            │   │  ← Cliquable
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**État** : ✅ Totalement fonctionnel

---

### Carte Abonnement Mensuel

```
┌─────────────────────────────────────┐
│   ⭐ Plus populaire                 │  ← Badge conservé
│                                     │
│    Abonnement Mensuel 🔒 Bientôt   │  ← Badge "Bientôt"
│  Pour un pressing régulier          │
│                                     │
│            99,99€                   │
│   par mois (2 collectes/semaine)   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ✓ 2 collectes par semaine    │   │
│ │ ✓ Collecte et livraison...   │   │
│ │ ✓ Priorité sur les créneaux  │   │
│ │ ✓ Tarifs préférentiels       │   │
│ │ ✓ Service client dédié       │   │
│ │ ✓ 1 collecte gratuite...     │   │
│ │  🌫️ BLUR OVERLAY 🌫️         │   │  ← Flou backdrop-blur
│ │    Bientôt disponible         │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │    🚫 S'abonner              │   │  ← Disabled, no href
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Détails visuels** :
- Badge "Bientôt disponible" (secondary) avec icône Lock
- Overlay flou `backdrop-blur-[2px]` sur features UNIQUEMENT
- Titre, description, prix RESTENT VISIBLES (SEO friendly)
- CTA désactivé : `opacity-80`, `cursor-not-allowed`
- Pas de `href` dans le DOM

**Comportement** :
- Click CTA → `preventDefault()` → Rien ne se passe
- URL directe `/reservation?service=monthly` → Redirect `/pricing?locked=1`
- Keyboard Tab → Saute le bouton disabled (`tabIndex=-1`)

---

### Carte Abonnement Trimestriel

```
┌─────────────────────────────────────┐
│    Abonnement Trimestriel 🔒 Bientôt│
│  La solution la plus avantageuse    │
│                                     │
│           249,99€                   │
│  par trimestre (3 collectes/sem.)  │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ✓ 3 collectes par semaine    │   │
│ │ ✓ Collecte et livraison...   │   │
│ │ ✓ Priorité absolue           │   │
│ │ ✓ Tarifs préférentiels max   │   │
│ │ ✓ Service client premium     │   │
│ │ ✓ 1 collecte gratuite...     │   │
│ │ ✓ Stockage gratuit 7 jours   │   │
│ │  🌫️ BLUR OVERLAY 🌫️         │   │
│ │    Bientôt disponible         │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │    🚫 S'abonner              │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**État** : 🔒 Identique à Mensuel (teaser mode)

---

## ✅ État Production (Flag ON)

**Configuration** : `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=true`

### Carte Service Classique

```
┌─────────────────────────────────────┐
│         Service Classique          │
│  Parfait pour vos besoins ponctuels │
│                                     │
│            24,99€                   │
│     pour 8 kg (+1€/kg supp.)       │
│                                     │
│ ✓ Collecte et livraison à domicile │
│ ✓ Nettoyage professionnel          │
│ ✓ Livraison sous 72h               │
│ ✓ Assurance incluse                │
│ ✓ Accessible sans connexion        │
│                                     │
│ ┌─────────────────────────────┐   │
│ │       🔗 Réserver            │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**État** : ✅ Inchangé (identique à MVP)

---

### Carte Abonnement Mensuel

```
┌─────────────────────────────────────┐
│   ⭐ Plus populaire                 │
│                                     │
│    Abonnement Mensuel               │  ← Plus de badge "Bientôt"
│  Pour un pressing régulier          │
│                                     │
│            99,99€                   │
│   par mois (2 collectes/semaine)   │
│                                     │
│ ✓ 2 collectes par semaine          │  ← Plus de blur
│ ✓ Collecte et livraison illimitées │
│ ✓ Priorité sur les créneaux        │
│ ✓ Tarifs préférentiels             │
│ ✓ Service client dédié             │
│ ✓ 1 collecte gratuite après 10...  │
│                                     │
│ ┌─────────────────────────────┐   │
│ │      🔗 S'abonner            │   │  ← Cliquable (Link)
│ └─────────────────────────────┘   │
│                                     │
│ * Connexion requise pour...        │
└─────────────────────────────────────┘
```

**Détails visuels** :
- ❌ Plus de badge "Bientôt disponible"
- ❌ Plus d'overlay blur
- ✅ Features complètement visibles
- ✅ CTA cliquable avec `<Link href="/reservation?service=monthly">`
- ✅ Message "Connexion requise" affiché

**Comportement** :
- Click CTA → Navigation vers `/reservation?service=monthly`
- URL directe → Page charge normalement
- Keyboard Tab → CTA focusable

---

### Carte Abonnement Trimestriel

```
┌─────────────────────────────────────┐
│    Abonnement Trimestriel           │
│  La solution la plus avantageuse    │
│                                     │
│           249,99€                   │
│  par trimestre (3 collectes/sem.)  │
│                                     │
│ ✓ 3 collectes par semaine          │
│ ✓ Collecte et livraison illimitées │
│ ✓ Priorité absolue                 │
│ ✓ Tarifs préférentiels maximaux    │
│ ✓ Service client premium           │
│ ✓ 1 collecte gratuite après 10...  │
│ ✓ Stockage gratuit 7 jours         │
│                                     │
│ ┌─────────────────────────────┐   │
│ │      🔗 S'abonner            │   │
│ └─────────────────────────────┘   │
│                                     │
│ * Connexion requise pour...        │
└─────────────────────────────────────┘
```

**État** : ✅ Totalement fonctionnel

---

## 🎯 Comparaison Côte à Côte

### Layout Responsive (Desktop)

**Flag OFF** :
```
┌─────────────┬─────────────┬─────────────┐
│   Classic   │   Monthly   │  Quarterly  │
│   ✅ Active  │  🔒 Locked  │  🔒 Locked  │
│             │  (blur)     │  (blur)     │
│  [Réserver] │ [Disabled]  │ [Disabled]  │
└─────────────┴─────────────┴─────────────┘
```

**Flag ON** :
```
┌─────────────┬─────────────┬─────────────┐
│   Classic   │   Monthly   │  Quarterly  │
│   ✅ Active  │  ✅ Active  │  ✅ Active  │
│             │  ⭐ Popular │             │
│  [Réserver] │ [S'abonner] │ [S'abonner] │
└─────────────┴─────────────┴─────────────┘
```

---

## 🔍 Détails Techniques UI

### Overlay Blur (Flag OFF uniquement)

**CSS Classes** :
```css
absolute inset-0 rounded-xl backdrop-blur-[2px] bg-background/40
flex items-end justify-center p-3
```

**Structure DOM** :
```html
<div class="relative">
  <!-- Features list -->
  <ul>...</ul>
  
  <!-- Overlay (conditionnel) -->
  {isLocked && (
    <div class="absolute inset-0 ...">
      <p>Bientôt disponible</p>
    </div>
  )}
</div>
```

### CTA Button States

**Flag OFF (Disabled)** :
```tsx
<Button
  className="w-full opacity-80 cursor-not-allowed"
  variant="default"
  aria-disabled="true"
  onClick={(e) => e.preventDefault()}
  tabIndex={-1}
>
  S'abonner
</Button>
```

**Flag ON (Active)** :
```tsx
<Button asChild className="w-full" variant="default">
  <Link href="/reservation?service=monthly">
    S'abonner
  </Link>
</Button>
```

---

## 📱 Responsive Behavior

### Mobile (< 768px)

**Flag OFF** :
```
┌─────────────────────┐
│      Classic        │
│     [Réserver] ✅   │
└─────────────────────┘

┌─────────────────────┐
│  ⭐ Monthly 🔒      │
│   [Disabled] (blur) │
└─────────────────────┘

┌─────────────────────┐
│    Quarterly 🔒     │
│   [Disabled] (blur) │
└─────────────────────┘
```

**Grid** : 1 colonne (stacked)
**Scale** : Monthly garde son `scale-105` (Plus populaire)

---

## 🧪 Testing Visuel

### Checklist Flag OFF

- [ ] Classic card : Aucun blur, CTA vert (primary)
- [ ] Monthly card : 
  - [ ] Badge "Plus populaire" visible (top)
  - [ ] Badge "Bientôt" visible (titre)
  - [ ] Blur visible sur features
  - [ ] Texte "Bientôt disponible" en bas du blur
  - [ ] CTA gris (outline) avec opacity-80
  - [ ] Cursor "not-allowed" au hover
- [ ] Quarterly card :
  - [ ] Badge "Bientôt" visible
  - [ ] Blur identique à Monthly
  - [ ] CTA gris disabled

### Checklist Flag ON

- [ ] Classic card : Identique à Flag OFF
- [ ] Monthly card :
  - [ ] Badge "Plus populaire" conservé
  - [ ] Plus de badge "Bientôt"
  - [ ] Aucun blur
  - [ ] Features toutes visibles
  - [ ] CTA vert (primary) cliquable
  - [ ] Message "Connexion requise" visible
- [ ] Quarterly card :
  - [ ] Plus de badge "Bientôt"
  - [ ] Aucun blur
  - [ ] CTA gris (outline) cliquable

---

## 🎨 Color Scheme

**Badges** :
- "Plus populaire" : `bg-primary` (brand color)
- "Bientôt disponible" : `variant="secondary"` (muted)

**Overlay** :
- Background : `bg-background/40` (40% opacity)
- Blur : `backdrop-blur-[2px]` (subtle)
- Text : `text-muted-foreground` (subtle)

**CTA States** :
- Active (Classic) : `variant="outline"` (ghost)
- Active (Monthly) : `variant="default"` (primary solid)
- Disabled : `opacity-80 cursor-not-allowed`

---

## 📊 Metrics to Track (Optional)

### Analytics Events

```javascript
// Teaser interaction (Flag OFF)
gtag('event', 'subscription_teaser_click', {
  service_id: 'monthly',
  service_name: 'Abonnement Mensuel'
})

// Successful navigation (Flag ON)
gtag('event', 'subscription_cta_click', {
  service_id: 'monthly',
  destination: '/reservation?service=monthly'
})
```

### User Behavior Insights

- **Teaser clicks** : Intérêt pour abonnements avant launch
- **Redirect count** (`?locked=1`) : Tentatives d'accès direct
- **Conversion rate** (post-activation) : Efficacité teaser

---

**Status** : ✅ Implémentation complète et testée
**Date** : 11 octobre 2025
**Serveur dev** : Running on `http://localhost:3000`
