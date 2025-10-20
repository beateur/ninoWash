# Quick Fix Guide: Apply Services RLS Policies

**Issue**: Services not loading in guest booking flow  
**Root Cause**: Missing RLS policies on `services` table  
**Solution**: Apply migration `20251009000001_add_services_rls_policies.sql`  
**Time Required**: ~2 minutes

---

## 🚀 Step-by-Step Instructions

### Method 1: Supabase Dashboard (RECOMMENDED)

1. **Open Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Click on **"SQL Editor"** in left sidebar

2. **Copy Migration SQL**
   - Open file: `supabase/migrations/20251009000001_add_services_rls_policies.sql`
   - Copy entire file contents (Ctrl+A, Ctrl+C)

3. **Run Migration**
   - Paste SQL into Supabase SQL Editor
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for success message: "Success. No rows returned"

4. **Verify Success**
   - Check for green success notification
   - Should see: "RLS policies successfully created for services table"
   - Expected: "Total policies: 3"

5. **Test Guest Booking Flow**
   - Open: http://localhost:3000/reservation/guest
   - Complete Steps 0-1 (Contact + Addresses)
   - Navigate to Step 2 (Services)
   - **Expected**: Services load correctly ✅

---

### Method 2: Supabase CLI (Alternative)

\`\`\`bash
# Make sure Supabase CLI is installed
supabase --version

# Navigate to project root
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash

# Apply migration
supabase db push

# Or apply specific migration
supabase migration up --file supabase/migrations/20251009000001_add_services_rls_policies.sql
\`\`\`

---

## 🧪 Verification Steps

### 1. Check RLS Status

Run this query in Supabase SQL Editor:

\`\`\`sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'services';
\`\`\`

**Expected Result**:
| tablename | rowsecurity |
|-----------|-------------|
| services  | true        |

---

### 2. Check Policies Created

\`\`\`sql
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'services'
ORDER BY policyname;
\`\`\`

**Expected Result** (3 policies):
| policyname | roles | cmd |
|-----------|-------|-----|
| services_all_for_service_role | service_role | ALL |
| services_select_active_for_anon | anon | SELECT |
| services_select_active_for_authenticated | authenticated | SELECT |

---

### 3. Test Anonymous Access

\`\`\`sql
-- Switch to anon role (simulates client-side query)
SET ROLE anon;

-- This should return active services
SELECT id, name, base_price, is_active 
FROM services 
WHERE is_active = true
LIMIT 5;

-- Switch back to postgres role
RESET ROLE;
\`\`\`

**Expected Result**: Should return rows (if services exist and are active)

---

### 4. Test Frontend

1. Open browser: http://localhost:3000
2. Click "Réserver maintenant"
3. Fill Step 0 (Contact)
4. Fill Step 1 (Addresses)
5. Navigate to Step 2 (Services)

**Expected Behavior**:
- ✅ Services load (grid of service cards)
- ✅ Each service shows: name, description, price, unit
- ✅ Quantity selectors work
- ✅ Total amount calculates correctly
- ✅ Can click "Suivant →" to proceed to Step 3

**If Still Not Loading**:
- Check browser console for errors (F12 → Console)
- Check network tab for failed requests (F12 → Network → Filter: services)
- Verify data exists in `services` table (see next section)

---

## 🔍 Troubleshooting

### Issue 1: "Aucun service disponible pour le moment"

**Cause**: No data in `services` table OR all services are `is_active = false`

**Fix**: Check data exists

\`\`\`sql
-- Count services
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE is_active = true) as active
FROM services;
\`\`\`

If `total = 0`:
- **Problem**: No services in database
- **Solution**: Seed data (see "Seed Services Data" section below)

If `active = 0`:
- **Problem**: All services are inactive
- **Solution**: Activate at least one service:
\`\`\`sql
UPDATE services SET is_active = true WHERE id = 'YOUR_SERVICE_ID';
\`\`\`

---

### Issue 2: "Permission denied for table services"

**Cause**: RLS policies not applied correctly

**Fix**: Re-apply migration

\`\`\`sql
-- Drop policies
DROP POLICY IF EXISTS "services_select_active_for_anon" ON services;
DROP POLICY IF EXISTS "services_select_active_for_authenticated" ON services;
DROP POLICY IF EXISTS "services_all_for_service_role" ON services;

-- Recreate (copy from migration file)
-- ... paste policy creation SQL ...
\`\`\`

---

### Issue 3: Migration fails with "policy already exists"

**Cause**: Policies already exist (migration re-run)

**Solution**: Migration includes `DROP POLICY IF EXISTS` → Safe to re-run

If still fails:
\`\`\`sql
-- Force drop all policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'services')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON services';
    END LOOP;
END $$;

-- Then re-run migration
\`\`\`

---

## 🌱 Seed Services Data (Optional)

If `services` table is empty, create sample services:

\`\`\`sql
-- Insert sample services
INSERT INTO services (id, name, description, base_price, unit, category, processing_time_hours, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Repassage', 'Repassage professionnel de vos vêtements', 3.50, 'pièce', 'Pressing', 24, true, NOW(), NOW()),
    (gen_random_uuid(), 'Nettoyage à sec', 'Nettoyage à sec pour tissus délicats', 8.00, 'pièce', 'Pressing', 48, true, NOW(), NOW()),
    (gen_random_uuid(), 'Détachage', 'Traitement spécial pour taches tenaces', 5.00, 'pièce', 'Pressing', 24, true, NOW(), NOW()),
    (gen_random_uuid(), 'Lavage chemise', 'Lavage et repassage de chemises', 6.50, 'pièce', 'Pressing', 24, true, NOW(), NOW()),
    (gen_random_uuid(), 'Lavage pantalon', 'Lavage et repassage de pantalons', 7.00, 'pièce', 'Pressing', 24, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verify data inserted
SELECT id, name, base_price, is_active FROM services;
\`\`\`

**Note**: Adjust columns to match your actual `services` table schema.

---

## ✅ Success Checklist

After applying migration:

- [ ] Migration executed successfully (no errors)
- [ ] RLS is enabled on `services` table
- [ ] 3 policies exist (anon, authenticated, service_role)
- [ ] SQL test query returns services (as anon role)
- [ ] Frontend loads services in Step 2
- [ ] Can select services and see total amount update
- [ ] Can proceed to Step 3 (Date & Time)
- [ ] No errors in browser console
- [ ] No errors in Next.js terminal

---

## 📊 Before vs After

### Before Fix

\`\`\`
Frontend Query:
  SELECT * FROM services WHERE is_active = true
  ↓
RLS Check:
  - Role: anon
  - Policies: [] (none)
  - Result: DENIED (empty array)
  ↓
UI:
  "Aucun service disponible pour le moment" ❌
\`\`\`

### After Fix

\`\`\`
Frontend Query:
  SELECT * FROM services WHERE is_active = true
  ↓
RLS Check:
  - Role: anon
  - Policy: services_select_active_for_anon
  - Condition: is_active = true ✅
  - Result: ALLOWED
  ↓
UI:
  Service cards displayed ✅
  - Repassage - 3.50 €
  - Nettoyage à sec - 8.00 €
  - Détachage - 5.00 €
\`\`\`

---

## 🔗 Related Files

- **Analysis**: `docs/ANALYSIS_SERVICES_NOT_LOADING.md`
- **Migration**: `supabase/migrations/20251009000001_add_services_rls_policies.sql`
- **Frontend**: `components/booking/guest/steps/services-step.tsx`
- **Schema Docs**: `docs/DATABASE_SCHEMA.md`

---

## 🆘 Still Having Issues?

Check these files for additional context:
1. Browser console (F12 → Console)
2. Network tab (F12 → Network → Filter: services)
3. Next.js terminal (check for Supabase errors)
4. Supabase Dashboard → Logs → Check for RLS violations

If services still don't load after migration:
1. Verify data exists in `services` table
2. Check column names match TypeScript interface
3. Verify `is_active` column exists and has `true` values
4. Check Supabase project URL and anon key are correct in `.env.local`

---

**Time to apply**: ~2 minutes  
**Expected result**: Services load in guest booking flow ✅
