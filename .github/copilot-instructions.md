# GitHub Copilot Instructions - Nino Wash

## Project Overview
Modern home laundry service platform (pressing à domicile) built with Next.js 14 App Router, TypeScript, Supabase (PostgreSQL + Auth), and Stripe payments. Features guest bookings, subscriptions, admin dashboard, and PWA capabilities.

## Critical Architecture Rules

### Server/Client Component Boundary
- **Server Components (default)**: Use `@/lib/supabase/server` with `cookies()` from `next/headers`
- **Client Components (hooks/interactivity)**: Use `@/lib/supabase/client` with `createBrowserClient`
- **Never mix**: Server imports in client components will break SSR

### Mandatory Patterns

1. **Validation**: ALL user inputs MUST use Zod schemas (from `lib/validations/`)
   ```typescript
   const result = schema.safeParse(data)
   if (!result.success) return { error: "Validation failed", issues: result.error.issues }
   ```

2. **Error Handling**: Structured try/catch with proper HTTP codes
   ```typescript
   try {
     // operation
   } catch (error) {
     return NextResponse.json({ error: "Message" }, { status: 500 })
   }
   ```

3. **Admin Protection**: Server-side guards only
   ```typescript
   import { requireAdmin } from "@/lib/auth/route-guards"
   await requireAdmin() // In Server Components/API routes
   ```

4. **Documentation**: Update existing docs (avoid creating new ones unless necessary)

## Tech Stack Reference

- **Framework**: Next.js 14.2.25 (App Router), React 19, TypeScript 5
- **Database**: Supabase 2.58.0 (@supabase/ssr 0.7.0 for SSR)
- **Payments**: Stripe 18.5.0 (subscriptions + webhooks)
- **Validation**: Zod 3.25.67 (mandatory for all inputs)
- **UI**: Shadcn/ui + Tailwind CSS 4.1.9 + Radix UI
- **Forms**: React Hook Form 7.60.0
- **Package Manager**: pnpm (standardized)

## Common Workflows

### Development
```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm lint             # ESLint check
pnpm tsc --noEmit     # TypeScript check
pnpm test             # Run Vitest tests
```

### UI Requests Policy (PRD-first)
- For ANY UI-related request (feature evolution or UI debugging), start with a lightweight Product Requirements Document (PRD) before writing code.
- The PRD must break down the request into clearly separated concerns when multiple UI elements are involved within the same ask.
- Keep it short but complete; the goal is alignment, not bureaucracy.

PRD template to use in comments of the PR or in the task description:
- Context: Why this change? Which user journey is impacted?
- Goals (success criteria): What must be true to consider it done?
- Scope (in/out): List UI elements included and explicitly excluded
- UX changes: Navigation, layouts, responsive behavior, accessibility
- States: loading/empty/error/success
- Data contract: inputs/outputs, API calls, validation (Zod), error modes
- Edge cases: auth, permissions, large lists, timeouts, offline
- Visual references: links or brief description (no heavy attachments required)
- Rollout/Tracking: flags, metrics, logs (if any)

Decomposition guideline (when one ask mixes multiple UI evolutions):
- Split by surface: header/sidebar/footer/page/section/modal/toast
- Split by flow: create/edit/delete/view/list/detail
- Split by platform: desktop vs. mobile differences
- Each sub-scope should have its own acceptance criteria and tests

### Admin Pattern
```typescript
// app/admin/page.tsx (Server Component wrapper)
import { requireAdmin } from "@/lib/auth/route-guards"
import DashboardClient from "./dashboard-client"

export default async function AdminPage() {
  await requireAdmin()
  return <DashboardClient />
}

// dashboard-client.tsx (Client Component for UI)
"use client"
export default function DashboardClient() { /* hooks, state */ }
```

### API Route Pattern
```typescript
// app/api/route/route.ts
import { createClient } from "@/lib/supabase/server"
import { schema } from "@/lib/validations/schema"

export async function POST(request: Request) {
  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  
  const supabase = await createClient()
  const { data, error } = await supabase.from("table").insert(result.data)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

## Key Files

- `middleware.ts` - Auth verification, admin/auth route protection
- `lib/supabase/server.ts` - Server-side Supabase client (async)
- `lib/supabase/client.ts` - Client-side Supabase client
- `lib/auth/route-guards.ts` - `requireAdmin()`, `requireAuth()`
- `lib/validations/` - Zod schemas for all entities
- `docs/architecture.md` - Detailed architecture patterns
- `docs/QUICK_START.md` - Developer onboarding guide

## Testing & Validation Checklist

Before completing any task:
- [ ] For UI tasks: PRD created, reviewed, and checked against acceptance criteria
- [ ] All inputs validated with Zod schemas
- [ ] Proper Server/Client component separation verified
- [ ] Error handling with correct HTTP status codes
- [ ] TypeScript strict mode compliance (`pnpm tsc --noEmit`)
- [ ] Updated existing documentation if architecture changed
- [ ] Tested locally with `pnpm dev`

## Common Pitfalls

- ❌ Importing `@/lib/supabase/server` in Client Components
- ❌ Forgetting Zod validation before database operations
- ❌ Client-side admin checks (always server-side with `requireAdmin()`)
- ❌ Using `npm` or `yarn` instead of `pnpm`
- ❌ Creating new documentation files instead of updating existing ones

## Quick Reference

- **Guest bookings**: Supported via anonymous Supabase sessions
- **Subscriptions**: Stripe webhooks sync to Supabase (see `app/api/webhooks/stripe/`)
- **Mobile**: PWA with bottom navigation (`components/mobile/bottom-nav.tsx`)
- **Admin dashboard**: Protected by middleware + server-side guards
- **CORS**: Configured via `lib/config/cors.ts` for API routes
