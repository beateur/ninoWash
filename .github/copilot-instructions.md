# GitHub Copilot Instructions - Nino Wash

## Project Overview
Modern home laundry service platform (pressing à domicile) built with Next.js 14 App Router, TypeScript, Supabase (PostgreSQL + Auth), and Stripe payments. Features guest bookings, subscriptions with credit system, admin dashboard, and PWA capabilities.

**🔥 CRITICAL: This is a FULLSTACK project. Every feature requires frontend + backend + database + DevOps considerations.**

## Business Context
- **Guest Bookings**: Anonymous users can book without account (via `guestContact` + `guestPickupAddress`/`guestDeliveryAddress` in booking schema)
- **Credit System**: Subscriptions grant weekly credits (tracked in `subscription_credits` table) - use `canUseCredit()` and `consumeCredit()` from `lib/services/subscription-credits`
  - **Weekly Reset**: Cron job runs weekly to reset credits (see `supabase/migrations/*_setup_credit_reset_cron.sql`)
- **Stripe Sync**: Webhooks at `/api/webhooks/stripe` sync subscription status automatically - never modify subscription status manually
- **Admin Subdomain**: Admin users are redirected to `gestion.domain` (NOT `/admin` on main domain) - auth redirects based on role
  - Regular users → `app.domain`
  - Admin users → `gestion.domain`
- **Admin Role**: Stored in `user_metadata.role === "admin"` OR `app_metadata.role === "admin"` - check BOTH locations
- **Email Service**: Not yet implemented (planned post-dev phase)

## Fullstack Development Workflow (MANDATORY)

### For ANY new feature or evolution:

1. **📚 Consult Documentation First**
   - Read `docs/architecture.md` for patterns
   - Read `docs/DATABASE_SCHEMA.md` for database structure
   - Read `docs/api-integration-guide.md` for API patterns
   - Check existing similar features for consistency

2. **📋 Create Complete PRD (BEFORE coding)**
   - **File Location**: All PRDs must be saved in `docs/PRD/` directory
   - **Naming Convention**: `PRD_FEATURE_NAME.md` (e.g., `PRD_BOOKING_CANCELLATION.md`)
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

### Server/Client Component Boundary (STRICT ENFORCEMENT)
- **Server Components (default)**: Use `createClient()` from `@/lib/supabase/server` - ALWAYS `await createClient()` (async)
- **Client Components (hooks/interactivity)**: Use `createClient()` from `@/lib/supabase/client` (synchronous)
- **Never mix**: Importing `@/lib/supabase/server` in Client Components will break SSR
- **Middleware**: Uses `@supabase/ssr` with `createServerClient()` directly (see `middleware.ts`)

### Authentication Patterns

**In Server Components/Pages:**
```typescript
import { requireAuth, requireAdmin } from "@/lib/auth/route-guards"

// For authenticated pages
const { user, supabase } = await requireAuth()

// For admin-only pages
const { user, supabase } = await requireAdmin()
```

**In API Routes:**
```typescript
import { apiRequireAuth } from "@/lib/auth/api-guards"

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await apiRequireAuth(request)
  if (error) return error // Returns 401 NextResponse
  // Continue with authenticated logic...
}
```

**Middleware Protection & Subdomain Routing:**
- `middleware.ts` protects routes AND handles subdomain-based redirects
- **Admin Subdomain**: Admin users MUST be redirected to `gestion.domain` (NOT `/admin` path)
  - After successful auth, check role and redirect:
    - `user.role === "admin"` → `https://gestion.domain`
    - Regular user → `https://app.domain`
- Auth routes: `/dashboard`, `/profile`, `/reservation`, `/subscription/manage`
- Guest routes: `/auth/signin`, `/auth/signup` (redirects if logged in)

### Database Migrations
- **Location**: `supabase/migrations/*.sql`
- **Naming**: `YYYYMMDDHHMMSS_description.sql` (timestamp-based)
- **Application**: Run via Supabase Dashboard SQL Editor OR use `apply-migration.sh` script
- **CRITICAL**: Always include RLS policies in migration files (security-first)

### Mandatory Patterns

1. **Validation**: ALL user inputs MUST use Zod schemas (from `lib/validations/`)
   ```typescript
   import { createBookingSchema } from "@/lib/validations/booking"
   
   const result = createBookingSchema.safeParse(body)
   if (!result.success) {
     return NextResponse.json({ 
       error: "Validation échouée", 
       issues: result.error.issues 
     }, { status: 400 })
   }
   // Use result.data (typed and validated)
   ```

2. **Error Handling**: Structured try/catch with proper HTTP codes
   ```typescript
   try {
     // operation
   } catch (error) {
     console.error("[v0] Context description:", error)
     return NextResponse.json({ error: "Message utilisateur" }, { status: 500 })
   }
   ```

3. **Logging**: Use `[v0]` prefix for console logs to differentiate from Next.js logs
   ```typescript
   console.log("[v0] Booking payload:", JSON.stringify(body))
   console.error("[v0] Database error:", error)
   ```

4. **Guest Bookings**: Check for user existence before requiring authentication
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   const isGuestBooking = !user
   
   if (isGuestBooking) {
     // Validate guestContact + guestPickupAddress + guestDeliveryAddress
   } else {
     // Use user_id + pickupAddressId + deliveryAddressId
   }
   ```

5. **Subscription Credits**: Never manipulate directly - use service functions
   ```typescript
   import { canUseCredit, consumeCredit } from "@/lib/services/subscription-credits"
   
   if (user && await canUseCredit(user.id)) {
     await consumeCredit(user.id, bookingWeightKg)
     // Apply discount logic
   }
   ```

## Tech Stack Reference

- **Framework**: Next.js 14.2.25 (App Router), React 19, TypeScript 5
- **Database**: Supabase 2.58.0 (@supabase/ssr 0.7.0 for SSR)
- **Payments**: Stripe 18.5.0 (subscriptions + webhooks)
- **Validation**: Zod 3.25.67 (mandatory for all inputs)
- **UI**: Shadcn/ui + Tailwind CSS 4.1.9 + Radix UI
- **Forms**: React Hook Form 7.60.0
- **Package Manager**: pnpm (standardized)

## Security & Environment Variables

### Environment Variables Policy
- **CRITICAL**: NO environment variables should be publicly exposed in client-side code
- **Server-only secrets**: All sensitive keys (Stripe secret, Supabase service role, webhook secrets) MUST only be accessed server-side
- **Public variables**: Only use `NEXT_PUBLIC_*` prefix for truly public data (Supabase URL, Stripe publishable key)
- **Validation**: Always validate that sensitive operations use server-side env vars only

### Required Environment Variables
```bash
# ⚠️ SERVER-ONLY (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=         # Database admin operations
STRIPE_SECRET_KEY=                  # Stripe API calls
STRIPE_WEBHOOK_SECRET=              # Webhook signature verification

# ✅ PUBLIC (safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Row-level security enforced key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Client-side Stripe.js

# 🔧 DEPLOYMENT
NEXT_PUBLIC_APP_URL=                # Main app domain (app.domain)
NEXT_PUBLIC_ADMIN_URL=              # Admin subdomain (gestion.domain)
```

### Admin Client Pattern
Use `createAdminClient()` (with service role key) ONLY for:
- Webhook handlers that bypass RLS (e.g., Stripe webhooks)
- Background jobs (e.g., credit reset cron)
- Admin operations that need to override user permissions

**Never use admin client for user-facing operations** - always rely on RLS policies with regular client.

## Common Workflows

### Development
```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm lint             # ESLint check
pnpm tsc --noEmit     # TypeScript check
pnpm test             # Run Vitest tests
pnpm test:ui          # Vitest UI (interactive)
pnpm test:coverage    # Test coverage report
```

### Database Operations
```bash
# Local Supabase (if using)
supabase start        # Start local instance
supabase db reset     # Reset and re-run migrations
supabase migration new <name>  # Create new migration file

# Apply migration manually
cd supabase/migrations
./apply-migration.sh <migration_file.sql>
```

### Performance & Security Audits
```bash
pnpm performance:audit  # Lighthouse audit
pnpm security:audit     # npm audit
pnpm build:analyze      # Bundle size analysis
```

### Stripe Webhook Testing (Local)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy webhook secret to .env.local as STRIPE_WEBHOOK_SECRET
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

## Key Files

- `middleware.ts` - Auth verification, admin/auth route protection, subdomain routing
- `lib/supabase/server.ts` - Server-side Supabase client (async)
- `lib/supabase/client.ts` - Client-side Supabase client
- `lib/supabase/admin.ts` - Admin client with service role (webhooks/cron only)
- `lib/auth/route-guards.ts` - `requireAdmin()`, `requireAuth()`
- `lib/auth/api-guards.ts` - `apiRequireAuth()` for API routes
- `lib/validations/` - Zod schemas for all entities
- `app/api/webhooks/stripe/route.ts` - Stripe webhook handler (syncs subscriptions)
- `lib/services/subscription-credits.ts` - Credit system logic
- `supabase/migrations/*_setup_credit_reset_cron.sql` - Weekly credit reset cron job
- `docs/architecture.md` - Detailed architecture patterns
- `docs/QUICK_START.md` - Developer onboarding guide
- `docs/DATABASE_SCHEMA.md` - Complete database schema reference
- `docs/PRD/` - Product Requirements Documents (PRD-first workflow)

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
- ❌ **Importing `@/lib/supabase/server` in Client Components** (breaks SSR)
- ❌ **Forgetting `await` on `createClient()` in server components** (server.ts is async)
- ❌ **Forgetting Zod validation** before database operations
- ❌ **Client-side admin checks** (always server-side with `requireAdmin()`)
- ❌ **Using `npm` or `yarn`** instead of `pnpm`
- ❌ **Creating new documentation files** instead of updating existing ones
- ❌ **Not consulting existing documentation** before implementing
- ❌ **Hardcoding Stripe subscription logic** (use webhook sync instead)

## Quick Reference

- **Guest bookings**: Supported via anonymous Supabase sessions
- **Subscriptions**: Stripe webhooks sync to Supabase (see `app/api/webhooks/stripe/`)
- **Mobile**: PWA with bottom navigation (`components/mobile/bottom-nav.tsx`)
- **Admin dashboard**: Protected by middleware + server-side guards
- **CORS**: Configured via `lib/config/cors.ts` for API routes
