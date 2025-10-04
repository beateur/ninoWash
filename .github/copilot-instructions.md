# GitHub Copilot Instructions - Nino Wash

## Project Overview
Modern home laundry service platform (pressing à domicile) built with Next.js 14 App Router, TypeScript, Supabase (PostgreSQL + Auth), and Stripe payments. Features guest bookings, subscriptions, admin dashboard, and PWA capabilities.

**🔥 CRITICAL: This is a FULLSTACK project. Every feature requires frontend + backend + database + DevOps considerations.**

## Fullstack Development Workflow (MANDATORY)

### For ANY new feature or evolution:

1. **📚 Consult Documentation First**
   - Read `docs/architecture.md` for patterns
   - Read `docs/DATABASE_SCHEMA.md` for database structure
   - Read `docs/api-integration-guide.md` for API patterns
   - Check existing similar features for consistency

2. **📋 Create Complete PRD (BEFORE coding)**
   - **Context**: Why? Which user journey?
   - **Goals**: Success criteria (what must work end-to-end)
   - **Scope**: 
     - Frontend: Components, pages, UI states
     - Backend: API routes, business logic
     - Database: Tables, columns, RLS policies, migrations
     - DevOps: Environment variables, Supabase functions, webhooks
   - **Technical Stack**:
     - Frontend components to create/modify
     - API routes to implement
     - Database schema changes (SQL migrations)
     - Validation schemas (Zod)
     - Type definitions (TypeScript)
   - **Data Flow**: Request → Validation → DB → Response → UI update
   - **Security**: Auth guards, RLS policies, input sanitization
   - **Error Handling**: All failure scenarios and user feedback
   - **Testing Strategy**: Unit tests, integration tests, E2E scenarios

3. **✅ Complete Implementation Checklist**
   For each feature, implement ALL layers:
   - [ ] **Frontend**: UI components with loading/error/success states
   - [ ] **Validation**: Zod schemas for all inputs
   - [ ] **API Routes**: Backend endpoints with proper error handling
   - [ ] **Database**: 
     - SQL migration files (if schema changes)
     - RLS policies for security
     - Indexes for performance
   - [ ] **Types**: TypeScript interfaces for request/response
   - [ ] **Tests**: At least basic happy path + error cases
   - [ ] **Documentation**: Update relevant docs with new feature
   - [ ] **DevOps**: Environment variables documented in `.env.example`

### Example: "Annuler une réservation" (Complete Stack)

**❌ WRONG (Frontend only)**:
```tsx
<Button onClick={() => alert("Annulation!")}>Annuler</Button>
```

**✅ CORRECT (Full implementation)**:

1. **PRD Section**:
   ```markdown
   ## Feature: Cancel Booking
   - Frontend: Cancel button + confirmation dialog
   - Backend: POST /api/bookings/[id]/cancel
   - Database: Add cancellation_reason, cancelled_at columns
   - Validation: Zod schema for cancel request
   - Security: User can only cancel their own bookings
   - Business Rules: Only pending/confirmed bookings can be cancelled
   ```

2. **Frontend**: 
   - `components/booking/cancel-dialog.tsx` (UI)
   - API call with error handling

3. **Validation**:
   - `lib/validations/booking.ts`:
     ```typescript
     export const cancelBookingSchema = z.object({
       reason: z.string().min(10).max(500),
     })
     ```

4. **API Route**:
   - `app/api/bookings/[id]/cancel/route.ts`:
     ```typescript
     export async function POST(req, { params }) {
       // Auth check
       // Validation
       // Business logic
       // DB update
       // Return response
     }
     ```

5. **Database Migration**:
   - `supabase/migrations/YYYYMMDDHHMMSS_add_booking_cancellation.sql`:
     ```sql
     ALTER TABLE bookings 
       ADD COLUMN cancellation_reason TEXT,
       ADD COLUMN cancelled_at TIMESTAMPTZ;
     ```

6. **Testing**:
   - Test API endpoint
   - Test UI flow
   - Test edge cases (already cancelled, not owner, etc.)

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

### UI Requests Policy (PRD-first + Fullstack)
- For ANY UI-related request (feature evolution or UI debugging), start with a comprehensive Product Requirements Document (PRD) BEFORE writing any code.
- **UI changes always impact the backend**: Even simple UI changes often require API modifications, database updates, or new validation rules.
- The PRD must cover the COMPLETE stack: Frontend, Backend, Database, DevOps, Testing.
- Break down complex requests into clearly separated concerns.

**PRD Template (Fullstack - MANDATORY for all features)**:

```markdown
# Feature: [Name]

## 1. Context
- Why this change?
- Which user journey is impacted?
- Business value / user pain point

## 2. Goals (Success Criteria)
- What must be true to consider it done (end-to-end)?
- [ ] User can perform action X
- [ ] Data is persisted correctly
- [ ] Errors are handled gracefully
- [ ] Performance is acceptable (<2s response time)

## 3. Scope

### Frontend
- **Components to create/modify**: List all React components
- **Pages affected**: List all routes
- **UI States**: loading, empty, error, success
- **User flows**: Step-by-step interaction
- **Responsive behavior**: Desktop vs mobile
- **Accessibility**: ARIA labels, keyboard navigation

### Backend
- **API Routes to create**: List all endpoints with HTTP methods
  - POST /api/resource
  - GET /api/resource/[id]
  - etc.
- **Business logic**: Rules and constraints
- **External APIs**: Stripe, email service, etc.

### Database
- **Schema changes**: New tables, columns, indexes
- **Migrations**: SQL files to create
- **RLS Policies**: Security rules
- **Data relationships**: Foreign keys, joins

### Validation
- **Input validation**: Zod schemas for all user inputs
- **Business rules**: Status transitions, permissions

### Security
- **Authentication**: Which routes require auth?
- **Authorization**: Who can access what?
- **RLS Policies**: Database-level security
- **Input sanitization**: XSS prevention

### DevOps
- **Environment variables**: New secrets or configs
- **Supabase functions**: Edge functions needed
- **Webhooks**: External integrations

## 4. Technical Implementation Plan

### Step 1: Database (if schema changes)
- [ ] Create migration file
- [ ] Add RLS policies
- [ ] Test in local Supabase

### Step 2: Validation Schemas
- [ ] Create Zod schemas
- [ ] Export TypeScript types

### Step 3: API Routes
- [ ] Implement endpoints
- [ ] Add error handling
- [ ] Test with curl/Postman

### Step 4: Frontend
- [ ] Create/modify components
- [ ] Integrate API calls
- [ ] Handle loading/error states
- [ ] Add optimistic updates (if needed)

### Step 5: Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for API
- [ ] E2E tests for critical flows

### Step 6: Documentation
- [ ] Update architecture docs
- [ ] Add API documentation
- [ ] Update README if needed

## 5. Data Flow
```
User Action → Frontend Component → API Route → Validation → 
Database → Response → Frontend Update → User Feedback
```

## 6. Error Scenarios
- Network failure
- Validation errors
- Database errors
- Permission denied
- Rate limiting
- Timeout

## 7. Edge Cases
- Concurrent updates
- Large datasets (pagination)
- Offline mode
- Browser compatibility

## 8. Testing Strategy
- Unit tests: Business logic
- Integration tests: API + DB
- E2E tests: User flows
- Manual testing: Edge cases

## 9. Rollout Plan
- Feature flags (if phased rollout)
- Monitoring/logging
- Rollback strategy
- Performance metrics

## 10. Out of Scope (Explicitly)
- List what is NOT included in this iteration
```

**Decomposition Guideline**:
When one request mixes multiple features:
- Split by **layer**: Frontend → Backend → Database → DevOps
- Split by **surface**: Header/Sidebar/Modal/Page
- Split by **flow**: Create/Read/Update/Delete
- Split by **user role**: Guest/User/Admin
- Each sub-scope gets its own mini-PRD

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
- [ ] **PRD Created**: Complete PRD covering Frontend + Backend + Database + DevOps
- [ ] **Documentation Consulted**: Read relevant docs before coding
- [ ] **All Layers Implemented**:
  - [ ] Frontend components with all UI states
  - [ ] API routes with error handling
  - [ ] Database migrations (if schema changes)
  - [ ] Zod validation schemas
  - [ ] TypeScript types
  - [ ] RLS policies (security)
  - [ ] Tests (at least happy path)
- [ ] **Security Verified**:
  - [ ] Auth guards in place
  - [ ] RLS policies tested
  - [ ] Input sanitization done
- [ ] **Error Handling Complete**:
  - [ ] All failure scenarios covered
  - [ ] User-friendly error messages
  - [ ] Proper HTTP status codes
- [ ] **TypeScript strict mode compliance** (`pnpm tsc --noEmit`)
- [ ] **Tested locally** with `pnpm dev`
- [ ] **Documentation updated** if architecture changed

## Common Pitfalls

- ❌ **Frontend-only implementations** (missing backend/database)
- ❌ **Skipping the PRD** (jumping straight to code)
- ❌ **Forgetting database migrations** (schema out of sync)
- ❌ **Missing RLS policies** (security vulnerability)
- ❌ Importing `@/lib/supabase/server` in Client Components
- ❌ Forgetting Zod validation before database operations
- ❌ Client-side admin checks (always server-side with `requireAdmin()`)
- ❌ Using `npm` or `yarn` instead of `pnpm`
- ❌ Creating new documentation files instead of updating existing ones
- ❌ **Not consulting existing documentation** before implementing

## Quick Reference

- **Guest bookings**: Supported via anonymous Supabase sessions
- **Subscriptions**: Stripe webhooks sync to Supabase (see `app/api/webhooks/stripe/`)
- **Mobile**: PWA with bottom navigation (`components/mobile/bottom-nav.tsx`)
- **Admin dashboard**: Protected by middleware + server-side guards
- **CORS**: Configured via `lib/config/cors.ts` for API routes
