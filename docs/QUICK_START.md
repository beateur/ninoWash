# Guide de Démarrage Rapide - Développeurs

Guide pour les nouveaux développeurs rejoignant le projet Nino Wash.

---

## 🚀 Installation en 5 Minutes

### Prérequis
- Node.js 18+ installé
- pnpm installé (`npm install -g pnpm`)
- Accès aux credentials Supabase et Stripe

### Étapes

```bash
# 1. Clone le repo
git clone https://github.com/beateur/ninoWash.git
cd ninoWash

# 2. Install dependencies
pnpm install

# 3. Configure environnement
cp .env.example .env.local
# Remplir les variables dans .env.local

# 4. Démarrer le serveur
pnpm dev

# ✅ Ouvrir http://localhost:3000
```

---

## 🔑 Variables d'Environnement Requises

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📁 Structure du Projet

```
ninoWash/
├── app/                    # Next.js App Router
│   ├── (main)/            # Routes publiques
│   ├── admin/             # Interface admin (rôle requis)
│   ├── api/               # API endpoints
│   └── auth/              # Authentification
├── components/            # Composants React
│   ├── ui/               # Composants Shadcn/ui
│   ├── forms/            # Formulaires
│   └── layout/           # Header, Footer, Nav
├── lib/                   # Utilitaires et config
│   ├── supabase/         # Clients Supabase
│   ├── validations/      # Schémas Zod
│   └── hooks/            # Hooks personnalisés
└── docs/                  # Documentation
```

---

## 🎯 Règles Essentielles

### 1. **Séparation Client/Server Components**

```typescript
// ✅ Client Component (interactivité)
"use client"
import { createClient } from "@/lib/supabase/client"

export function MonComposant() {
  const [state, setState] = useState()
  const supabase = createClient()
  // ...
}

// ✅ Server Component (données, auth)
import { createClient } from "@/lib/supabase/server"

export default async function MaPage() {
  const supabase = await createClient()
  const data = await supabase.from('table').select()
  // ...
}
```

### 2. **Pages Admin : Pattern Hybride**

```typescript
// page.tsx (Server - vérifie permissions)
import { requireAdmin } from "@/lib/auth/route-guards"
import MonPageClient from "./page-client"

export default async function AdminPage() {
  await requireAdmin()
  return <MonPageClient />
}

// page-client.tsx (Client - UI interactive)
"use client"
export default function MonPageClient() {
  // Hooks React ici
}
```

### 3. **Ne Jamais Faire**

❌ Importer `@/lib/supabase/server` dans un Client Component  
❌ Utiliser `next/headers` dans un Client Component  
❌ Mélanger `"use client"` + code serveur (cookies, headers)

---

## 🧪 Commandes Utiles

```bash
# Développement
pnpm dev                   # Démarrer serveur (port 3000)
pnpm build                 # Build production
pnpm start                 # Démarrer en production

# Tests
pnpm test                  # Tests unitaires
pnpm test:coverage         # Avec couverture

# Lint & Format
pnpm lint                  # ESLint
pnpm format                # Prettier

# Database
pnpm db:push               # Push schema Supabase
pnpm db:pull               # Pull schema
pnpm db:seed               # Seed données de test

# Cache
rm -rf .next               # Nettoyer cache Next.js
```

---

## 👤 Créer un Utilisateur Admin

```bash
# Méthode 1 : Script TypeScript
pnpm tsx scripts/create-admin.ts

# Méthode 2 : SQL direct
psql -h db.xxx.supabase.co -U postgres -d postgres -f scripts/create-admin.sql
```

**Credentials admin de test :**
- Email : `habilel99@gmail.com`
- User ID : `4253ed6b-0e53-4187-ac30-7731744189e4`
- Rôle : `admin`

---

## 🔍 Résolution de Problèmes Courants

### Erreur : "Port 3000 already in use"

```bash
# Trouver et tuer le processus
lsof -ti:3000 | xargs kill -9

# Ou utiliser un autre port
pnpm dev --port 3001
```

### Erreur : "You're importing a component that needs next/headers"

**Cause :** Client Component importe du code serveur.

**Solution :**
1. Vérifier la trace d'import dans l'erreur
2. Remplacer par l'import client approprié
3. Exemple : `@/lib/supabase/server` → `@/lib/supabase/client`

### Erreur : "Function components cannot be given refs"

**Cause :** Composant UI sans `forwardRef` utilisé avec react-hook-form.

**Solution :**
```typescript
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <input ref={ref} {...props} />
)
```

### Page blanche / 500 Internal Server Error

```bash
# 1. Nettoyer le cache
rm -rf .next

# 2. Vérifier les logs du terminal
# 3. Vérifier les variables d'environnement

# 4. Redémarrer le serveur
pnpm dev
```

---

## 📚 Documentation Clé

| Document | Contenu |
|----------|---------|
| `architecture.md` | Architecture complète du projet |
| `routes-and-interfaces.md` | Liste des routes et permissions |
| `DATABASE_SCHEMA.md` | Schéma de base de données |
| `TECHNICAL_CHANGELOG.md` | Historique des changements techniques |
| `api-integration-guide.md` | Guide d'intégration API |

---

## 🎨 Conventions de Code

### Composants
- PascalCase : `MyComponent.tsx`
- Un composant par fichier
- Client Components : directive `"use client"` en haut

### Fonctions
- camelCase : `handleSubmit`, `fetchData`
- Async : préfixer `async` : `async function fetchUser()`

### Variables
- camelCase : `userData`, `isLoading`
- Constantes : UPPER_SNAKE_CASE : `API_URL`, `MAX_ITEMS`

### Fichiers
- kebab-case : `auth-form.tsx`, `booking-step.tsx`
- Client Components : suffixe `-client.tsx` si séparé du serveur

---

## 🔐 Accès Environnements

### Supabase
- Dashboard : https://supabase.com/dashboard
- Project : `slmhuhfunssmwhzajccm`
- Database : PostgreSQL 15

### Stripe
- Dashboard : https://dashboard.stripe.com
- Mode : Test (clés `sk_test_...`)

### Vercel
- Dashboard : https://vercel.com
- Projet : `nino-wash`

---

## 🤝 Workflow Git

```bash
# 1. Créer une branche feature
git checkout -b feature/ma-feature

# 2. Faire vos modifications
git add .
git commit -m "feat: description"

# 3. Push et créer PR
git push origin feature/ma-feature

# 4. Merge après review
```

**Branches principales :**
- `main` : Production
- `develop` : Développement
- `feature/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs

---

## ✅ Checklist Premier Jour

- [ ] Installation complète réussie
- [ ] Serveur démarre sans erreur
- [ ] Accès à la homepage (/)
- [ ] Connexion avec compte admin
- [ ] Accès au dashboard admin (/admin)
- [ ] Lire `architecture.md`
- [ ] Comprendre la séparation client/server
- [ ] Créer une branche de test

---

## 🆘 Besoin d'Aide ?

- Documentation : `/docs` dans le repo
- Issues GitHub : https://github.com/beateur/ninoWash/issues
- Contact équipe : [À remplir]

---

**Bienvenue dans l'équipe Nino Wash ! 🚀**
