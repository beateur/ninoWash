# Changelog Technique - Nino Wash

Ce document trace les changements architecturaux et techniques majeurs du projet.

---

## 2025-10-03 - Migration Architecture Client/Server

### 🔧 Correctifs Critiques : Séparation Client/Server Components

**Problème identifié :**
Les Client Components importaient du code serveur (utilisant `next/headers`), causant des erreurs de compilation dans Next.js App Router.

**Erreur type :**
```
Error: You're importing a component that needs next/headers. 
That only works in a Server Component which is not supported in the pages/ directory.

Import trace:
./lib/supabase/server.ts
./lib/services/auth.service.ts
./components/forms/auth-form.tsx
```

---

### ✅ Changements Appliqués

#### 1. **Refactorisation des Composants d'Authentification**

**Fichiers modifiés :**
- `lib/hooks/use-auth.tsx`
- `components/forms/auth-form.tsx`
- `components/auth/logout-button.tsx`

**Changement :**
```typescript
// ❌ AVANT : Import du service qui contenait du code serveur
import { clientAuth } from "@/lib/services/auth.service"
await clientAuth.signOut()

// ✅ APRÈS : Import direct du client Supabase
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
await supabase.auth.signOut()
```

**Raison :**
- `auth.service.ts` importait `lib/supabase/server.ts` (utilise `next/headers`)
- Les Client Components ne peuvent pas utiliser `next/headers`
- Solution : utiliser directement `createClient()` de `@/lib/supabase/client`

---

#### 2. **Refactorisation Pages Admin (Architecture Hybride)**

**Fichiers créés/modifiés :**
- `app/admin/page.tsx` (Server Component)
- `app/admin/dashboard-client.tsx` (Client Component - nouveau)

**Ancien pattern (❌ problématique) :**
```typescript
"use client"
import { requireAdmin } from "@/lib/auth/route-guards"

export default async function AdminDashboard() {
  await requireAdmin() // ❌ Erreur : requireAdmin() utilise cookies()
  const [stats, setStats] = useState({...}) // Hooks React
  // ... UI
}
```

**Nouveau pattern (✅ correct) :**
```typescript
// app/admin/page.tsx (Server Component)
import { requireAdmin } from "@/lib/auth/route-guards"
import AdminDashboardClient from "./dashboard-client"

export default async function AdminDashboard() {
  await requireAdmin() // ✅ OK dans Server Component
  return <AdminDashboardClient />
}

// app/admin/dashboard-client.tsx (Client Component)
"use client"
export default function AdminDashboardClient() {
  const [stats, setStats] = useState({...}) // ✅ OK dans Client Component
  // ... UI interactive
}
```

**Avantages :**
- ✅ Vérification admin côté serveur (sécurisé)
- ✅ Interactivité client (hooks React)
- ✅ Séparation claire des responsabilités
- ✅ Pas d'erreur de compilation

---

### 📚 Règles Architecturales Établies

#### **Règle 1 : Imports Supabase**

| Contexte | Import | Utilisation |
|----------|--------|-------------|
| Client Component (`"use client"`) | `@/lib/supabase/client` | Composants React avec hooks |
| Server Component (défaut) | `@/lib/supabase/server` | Pages async, API routes |
| Middleware | `@/lib/supabase/middleware` | Protection routes, session refresh |

#### **Règle 2 : Pages Admin (Pattern Hybride)**

```
Server Component (page.tsx)
├── Vérifie permissions (requireAdmin)
├── Fetch données initiales si nécessaire
└── Rend Client Component
    └── Client Component (*-client.tsx)
        ├── Hooks React (useState, useEffect)
        ├── Interactivité (onClick, onChange)
        └── Appels API depuis le client
```

#### **Règle 3 : Ne Jamais Faire**

- ❌ Importer `lib/supabase/server.ts` dans un Client Component
- ❌ Utiliser `next/headers` dans un Client Component
- ❌ Utiliser `"use client"` + `await requireAdmin()` ensemble
- ❌ Importer `auth.service.ts` depuis un Client Component

---

### 🧪 Tests de Validation

**Commandes de vérification :**
```bash
# Vérifier qu'aucun Client Component n'importe du code serveur
grep -r "use client" --include="*.tsx" app/ components/ | \
  xargs grep -l "lib/supabase/server\|next/headers"

# Résultat attendu : aucun fichier
```

**Pages testées avec succès :**
- ✅ `/` (Homepage) - 200 OK
- ✅ `/auth/signin` - Compile sans erreur
- ✅ `/admin` - 200 OK (avec admin user)
- ✅ `/dashboard` - 200 OK

---

### 📦 Fichiers Impactés

```
Modifiés :
├── lib/hooks/use-auth.tsx
├── components/forms/auth-form.tsx
├── components/auth/logout-button.tsx
├── app/admin/page.tsx
└── docs/
    ├── architecture.md
    └── routes-and-interfaces.md

Créés :
└── app/admin/dashboard-client.tsx

Cache :
└── .next/ (supprimé et regénéré)
```

---

### 🔄 Migration pour Autres Composants

**Si vous créez un nouveau composant admin, suivez ce pattern :**

```typescript
// 1. Page Server Component (app/admin/nouvelle-page/page.tsx)
import { requireAdmin } from "@/lib/auth/route-guards"
import NouvellePageClient from "./page-client"

export default async function NouvellePage() {
  await requireAdmin()
  
  // Optionnel : fetch données serveur
  const data = await fetchServerData()
  
  return <NouvellePageClient initialData={data} />
}

// 2. Composant Client (app/admin/nouvelle-page/page-client.tsx)
"use client"

interface Props {
  initialData?: any
}

export default function NouvellePageClient({ initialData }: Props) {
  const [state, setState] = useState(initialData)
  // ... hooks et interactivité
  return <div>...</div>
}
```

---

### 🎓 Leçons Apprises

1. **Next.js App Router est strict sur la séparation client/server**
   - Erreurs de compilation si mélange incorrect
   - Pattern hybride nécessaire pour pages protégées interactives

2. **Le cache `.next/` peut masquer des erreurs résolues**
   - Toujours supprimer `.next/` après changements architecturaux
   - `rm -rf .next && pnpm dev`

3. **Les services intermédiaires peuvent poser problème**
   - `auth.service.ts` mélangeait code client et serveur
   - Préférer appels directs à Supabase dans les composants

4. **La documentation doit être mise à jour en parallèle**
   - Évite confusion future
   - Facilite onboarding nouveaux développeurs

---

### 🔗 Ressources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

**Dernière mise à jour :** 3 octobre 2025  
**Auteur :** Équipe Nino Wash
