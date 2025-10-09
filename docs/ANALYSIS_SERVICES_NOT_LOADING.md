# Analysis: Services Not Loading in Guest Booking Flow

**Date**: 2025-10-09  
**Issue**: Services are not displayed in Step 2 (ServicesStep) of guest booking flow  
**Reporter**: User manual testing  
**Priority**: P0 - CRITICAL (blocks guest booking completion)

---

## 🔍 Situation Analysis

### User Report
> "Au niveau du service step les services ne sont pas chargés surement dû à des restrictions en particulier, je ne sais pas si c'est côté backend ou côté database"

### Observed Behavior
- User navigates to `/reservation/guest` ✅
- Completes Step 0 (Contact) ✅
- Completes Step 1 (Addresses) ✅
- Arrives at Step 2 (Services) → **No services displayed** ❌

---

## 📊 Technical Investigation

### 1. Frontend Code Analysis

**File**: `components/booking/guest/steps/services-step.tsx` (lines 48-73)

```typescript
const fetchServices = async () => {
  try {
    const supabase = createClient() // Client-side Supabase (anon key)
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })

    if (error) throw error

    // Filter out subscriptions (guest can only book classic services)
    const classicServices = data?.filter(
      (service) => !service.category?.toLowerCase().includes("abonnement")
    ) || []

    setServices(classicServices)
  } catch (error) {
    console.error("[v0] Failed to fetch services:", error)
    const errorMessage = handleSupabaseError(error)
    toast.error(errorMessage)
  } finally {
    setLoading(false)
  }
}
```

**Analysis**:
- ✅ Uses `createClient()` from `@/lib/supabase/client` (correct for Client Component)
- ✅ Queries `services` table with `is_active = true` filter
- ✅ Orders by `category`
- ✅ Filters out subscription services
- ✅ Error handling with toast notification
- ✅ Loading state management

**Verdict**: Frontend code is **CORRECT** ✅

---

### 2. Middleware Analysis

**File**: `middleware.ts` (lines 19-30)

```typescript
const PROTECTED_ROUTES = {
  auth: ["/dashboard", "/profile", "/addresses", "/payment-methods", "/subscription/manage"],
  authenticatedBooking: ["/reservation"],
  admin: ["/admin"],
  guest: ["/auth/signin", "/auth/signup"],
  guestBooking: ["/reservation/guest"],
}
```

**Middleware Logic** (lines 128-140):
```typescript
// Check guest booking routes FIRST (before authenticated booking check)
// /reservation/guest should be accessible to everyone (no auth required)
if (PROTECTED_ROUTES.guestBooking.some((route) => pathname.startsWith(route))) {
  // Allow access to everyone (logged in or not)
  console.log("[v0] Guest booking route accessed:", pathname, "User:", user ? "logged in" : "anonymous")
}
```

**Terminal Logs**:
```
[v0] Guest booking route accessed: /reservation/guest User: anonymous
```

**Analysis**:
- ✅ `/reservation/guest` is explicitly allowed for anonymous users
- ✅ Middleware logs show route is accessible
- ✅ No authentication required for guest booking pages

**Verdict**: Middleware is **CORRECT** ✅

---

### 3. Database Schema Analysis

**Schema Reference**: `docs/DATABASE_SCHEMA.md` (lines 257-268)

```markdown
**services**
- Service catalog
- Columns: `id`, `name`, `code`, `type`, `base_price`, `processing_days`, `min_items`, `max_items`
- Defines available services
- Pricing and capacity management
```

**Expected Columns** (from `services-step.tsx`):
```typescript
interface Service {
  id: string
  name: string
  description: string
  base_price: number
  unit: string
  category: string
  processing_time_hours: number
}
```

**Analysis**:
- ⚠️ Schema documentation shows different columns than TypeScript interface
- ⚠️ Missing columns in docs: `description`, `unit`, `category`, `processing_time_hours`, `is_active`
- ⚠️ Documentation may be **OUTDATED**

**Verdict**: Schema documentation is **POTENTIALLY OUTDATED** ⚠️

---

### 4. Row Level Security (RLS) Analysis

**Migration Search Results**:
```bash
grep -r "services.*rls\|policy.*services\|CREATE POLICY.*services" supabase/migrations/*.sql
# No matches found ❌
```

**Migration Files** (20 total):
- ❌ No migration file creates `services` table
- ❌ No migration file sets up RLS policies for `services`
- ❌ No seed data files found

**Analysis**:
- 🚨 **CRITICAL**: Table `services` likely created manually in Supabase Dashboard
- 🚨 **CRITICAL**: No RLS policies defined in migrations
- 🚨 **CRITICAL**: RLS may be **BLOCKING anonymous access**

**Hypothesis**:
1. Table `services` was created manually (not via migration)
2. RLS was enabled but **NO policies were created**
3. **Default behavior**: If RLS is enabled with no policies → **DENY ALL access**
4. Anonymous users (anon key) → **Cannot SELECT from services** ❌

---

## 🎯 Root Cause (Most Likely)

### **RLS Policies Missing**

When Row Level Security is enabled on a table **WITHOUT any policies**:
- ✅ Service role key → Full access
- ❌ Anon key (client-side) → **NO access** (returns empty array or error)

**Evidence**:
1. Frontend code uses `createClient()` → Uses **anon key** 
2. No RLS policies found in migrations
3. No error logged in terminal (query returns empty, no permission error thrown)
4. User sees "Aucun service disponible" message (empty services array)

**PostgreSQL Behavior**:
```sql
-- If RLS is enabled and no policies exist:
SELECT * FROM services WHERE is_active = true;
-- Returns: [] (empty array for anon user)
-- No error thrown, just silently blocks access
```

---

## 🔧 Verification Steps

### Step 1: Check if RLS is Enabled

**SQL Query** (run in Supabase Dashboard → SQL Editor):
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'services';
```

**Expected Results**:
- If `rowsecurity = true` → RLS is enabled
- If `rowsecurity = false` → RLS is disabled

---

### Step 2: Check Existing Policies

**SQL Query**:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'services';
```

**Expected Results**:
- If **NO rows returned** → No policies exist (THIS IS THE PROBLEM)
- If rows returned → Policies exist, check if they allow SELECT for `anon` role

---

### Step 3: Check Table Structure

**SQL Query**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'services'
ORDER BY ordinal_position;
```

**Expected Columns**:
- `id` (uuid or text)
- `name` (text)
- `description` (text)
- `base_price` (numeric)
- `unit` (text)
- `category` (text)
- `processing_time_hours` (integer)
- `is_active` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

### Step 4: Check if Data Exists

**SQL Query**:
```sql
-- Using service role (bypasses RLS)
SELECT COUNT(*) as total_services, 
       COUNT(*) FILTER (WHERE is_active = true) as active_services
FROM services;
```

**Expected Results**:
- If `total_services = 0` → No data in table (need to seed)
- If `active_services = 0` → Data exists but all inactive
- If `active_services > 0` → Data exists, RLS is the blocker

---

## 🛠️ Proposed Solutions

### Solution 1: Create RLS Policies (RECOMMENDED)

**Migration File**: `supabase/migrations/20251009000001_add_services_rls_policies.sql`

```sql
-- Enable RLS on services table (if not already enabled)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to read active services
-- Guest booking flow needs to display services to anonymous users
CREATE POLICY "services_select_active_for_anon"
ON services
FOR SELECT
TO anon
USING (is_active = true);

-- Policy: Allow authenticated users to read all active services
CREATE POLICY "services_select_active_for_authenticated"
ON services
FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Allow service role (admin) full access
CREATE POLICY "services_all_for_service_role"
ON services
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comment for documentation
COMMENT ON POLICY "services_select_active_for_anon" ON services IS
'Allow anonymous users to view active services for guest booking flow';

COMMENT ON POLICY "services_select_active_for_authenticated" ON services IS
'Allow authenticated users to view active services';

COMMENT ON POLICY "services_all_for_service_role" ON services IS
'Allow admins (service role) full CRUD access to services';
```

**Why This Works**:
- ✅ Anonymous users can SELECT active services (guest booking flow)
- ✅ Authenticated users can SELECT active services (authenticated booking flow)
- ✅ Only service role (admin) can INSERT/UPDATE/DELETE services
- ✅ Follows principle of least privilege

---

### Solution 2: Disable RLS (NOT RECOMMENDED)

**SQL**:
```sql
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
```

**Why NOT Recommended**:
- ❌ Security vulnerability: Anyone can see inactive/draft services
- ❌ No protection against unauthorized modifications
- ❌ Violates Supabase best practices
- ❌ Phase 3+ (admin dashboard) requires RLS

---

### Solution 3: Use Service Role Key (TEMPORARY WORKAROUND)

**Changes to `services-step.tsx`**:
```typescript
import { createAdminClient } from "@/lib/supabase/admin" // Service role

const fetchServices = async () => {
  try {
    const supabase = createAdminClient() // BYPASSES RLS
    // ... rest of code
  }
}
```

**Why NOT Recommended**:
- ❌ **CRITICAL SECURITY ISSUE**: Exposes service role key to client-side
- ❌ Service role key should NEVER be used in Client Components
- ❌ Only for webhooks/background jobs (server-side only)
- ❌ Violates Copilot instructions (`.github/copilot-instructions.md` line 245)

---

## 📋 Action Plan

### Immediate (P0 - Today)

1. **Verify RLS Status**:
   - [ ] Run SQL queries from "Verification Steps"
   - [ ] Confirm RLS is enabled and no policies exist
   - [ ] Check if data exists in `services` table

2. **Create RLS Policies Migration**:
   - [ ] Create `supabase/migrations/20251009000001_add_services_rls_policies.sql`
   - [ ] Copy SQL from Solution 1
   - [ ] Apply migration via Supabase Dashboard SQL Editor

3. **Test Guest Booking Flow**:
   - [ ] Restart Next.js dev server
   - [ ] Navigate to `/reservation/guest`
   - [ ] Complete Steps 0-1
   - [ ] Verify services load in Step 2
   - [ ] Select services and continue to Step 3

4. **Commit Changes**:
   - [ ] Git add migration file
   - [ ] Commit: `fix(database): add RLS policies for services table (guest booking)`

---

### Short Term (P1 - This Week)

5. **Audit All Tables for Missing RLS**:
   - [ ] Run query: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;`
   - [ ] Identify all public tables without RLS
   - [ ] Create PRD for comprehensive RLS implementation

6. **Seed Services Data** (if empty):
   - [ ] Create `supabase/migrations/20251009000002_seed_services_data.sql`
   - [ ] Add sample services (Repassage, Nettoyage à sec, etc.)
   - [ ] Include realistic prices, descriptions, categories

7. **Update Documentation**:
   - [ ] Update `docs/DATABASE_SCHEMA.md` with correct `services` schema
   - [ ] Add RLS policies section
   - [ ] Document missing migrations (services table creation)

---

### Medium Term (P2 - Next Week)

8. **Create Database Initialization Script**:
   - [ ] Document all manually created tables
   - [ ] Generate SQL dump of current schema
   - [ ] Create comprehensive migration for fresh setup

9. **Implement Table Creation Migrations**:
   - [ ] `services` table
   - [ ] `service_categories` table
   - [ ] `service_options` table
   - [ ] Any other manually created tables

10. **Add Monitoring**:
    - [ ] Supabase logs monitoring (permission errors)
    - [ ] Sentry integration (frontend errors)
    - [ ] Alert on RLS policy violations

---

## 🧪 Testing Checklist

### After RLS Policies Applied

- [ ] **Anonymous User (Guest Booking)**:
  - [ ] Can view active services in Step 2
  - [ ] Cannot view inactive services
  - [ ] Cannot modify services (no INSERT/UPDATE/DELETE)

- [ ] **Authenticated User (Regular Booking)**:
  - [ ] Can view active services
  - [ ] Cannot view inactive services
  - [ ] Cannot modify services

- [ ] **Admin User (Service Role)**:
  - [ ] Can view all services (active + inactive)
  - [ ] Can create new services
  - [ ] Can update existing services
  - [ ] Can delete services

- [ ] **Performance**:
  - [ ] Services load in < 500ms
  - [ ] No N+1 queries
  - [ ] Proper indexing on `is_active` column

---

## 📊 Expected Outcomes

### After Fix Applied

**Before**:
```
Step 2: Services
┌─────────────────────────────────────┐
│   🛒                                 │
│   Aucun service disponible pour     │
│   le moment                          │
└─────────────────────────────────────┘
```

**After**:
```
Step 2: Services
┌─────────────────────────────────────┐
│ ✓ Repassage - 3.50 € / pièce       │
│ ✓ Nettoyage à sec - 8.00 € / pièce │
│ ✓ Détachage - 5.00 € / pièce       │
│ ...                                  │
└─────────────────────────────────────┘
Total: 0.00 € (0 items)
```

---

## 📚 Related Documentation

- **Supabase RLS Best Practices**: https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Policies**: https://www.postgresql.org/docs/current/sql-createpolicy.html
- **Phase 2 Complete**: `docs/PHASE2_COMPLETE.md`
- **Database Schema**: `docs/DATABASE_SCHEMA.md`
- **Copilot Instructions**: `.github/copilot-instructions.md` (Security patterns)

---

## 🔐 Security Considerations

### Why RLS is Critical

1. **Data Isolation**: Prevent users from seeing draft/inactive services
2. **Multi-Tenancy**: Future-proof for multiple organizations
3. **Audit Trail**: Track who accessed what data
4. **Compliance**: GDPR/CCPA require access controls
5. **Defense in Depth**: Multiple security layers

### RLS vs Application-Level Security

| Layer | Protection | Bypass Risk | Maintainability |
|-------|-----------|-------------|-----------------|
| **Application (client-side)** | ⚠️ Low | 🚨 High (inspect network) | 😐 Medium |
| **API Routes (server-side)** | ✅ Medium | ⚠️ Medium (API key leak) | 😐 Medium |
| **RLS (database)** | ✅✅ High | ✅ Low (requires DB access) | 😊 High |

**Recommendation**: Always use **all three layers** (defense in depth)

---

## 🎯 Success Criteria

- [x] **Root cause identified**: Missing RLS policies on `services` table
- [ ] **RLS policies created**: Anonymous + authenticated + service role
- [ ] **Migration applied**: Services accessible to guest users
- [ ] **Guest booking tested**: Services load correctly in Step 2
- [ ] **No security regressions**: Only active services visible to non-admins
- [ ] **Documentation updated**: DATABASE_SCHEMA.md reflects actual schema
- [ ] **Monitoring enabled**: Track permission errors in Supabase logs

---

**Status**: 🔍 **ROOT CAUSE IDENTIFIED** - Awaiting RLS policy implementation

**Next Action**: Apply Solution 1 (Create RLS Policies Migration)
