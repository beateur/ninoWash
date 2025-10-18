# Fix Summary - user_addresses Foreign Key Error

**Date**: 8 janvier 2025  
**Error**: `insert or update on table "user_addresses" violates foreign key constraint "user_addresses_user_id_fkey"`  
**Root Cause**: Foreign key points to `public.users` instead of `auth.users`  
**Status**: ✅ **FIXED**

---

## 📋 What Was Created

### 1. Migration File
- **Path**: `supabase/migrations/20250108000000_fix_user_addresses_foreign_key.sql`
- **Action**: Drops old FK constraint and creates new one pointing to `auth.users`

### 2. Application Script
- **Path**: `scripts/apply-user-addresses-fix.sh`
- **Usage**: `./scripts/apply-user-addresses-fix.sh` (requires `SUPABASE_DB_URL`)

### 3. Documentation
- **Full guide**: `docs/troubleshooting/FIX_USER_ADDRESSES_FOREIGN_KEY.md`
- **Quick guide**: `QUICK_FIX_USER_ADDRESSES.md` (root)

---

## 🚀 How to Apply

### Option 1: Supabase Dashboard (Easiest - 1 min)

1. Go to [app.supabase.com](https://app.supabase.com) → Your Project → SQL Editor
2. Copy/paste from `supabase/migrations/20250108000000_fix_user_addresses_foreign_key.sql`
3. Click "Run"
4. ✅ Done!

### Option 2: Command Line

\`\`\`bash
# Set your database URL
export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres'

# Run the script
./scripts/apply-user-addresses-fix.sh
\`\`\`

---

## ✅ Verification

After applying the fix:

\`\`\`sql
-- Check the constraint now points to auth.users
SELECT 
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_addresses'
  AND tc.constraint_name = 'user_addresses_user_id_fkey';
\`\`\`

**Expected result**:
- `foreign_table_schema`: `auth`
- `foreign_table_name`: `users`

---

## 🧪 Test

1. Start dev server: `pnpm dev`
2. Go to: http://localhost:3000/reservation
3. Add new address in booking flow
4. ✅ Should work without error

---

## 📝 Technical Details

### Before
\`\`\`sql
user_addresses.user_id → public.users(id)  ❌ (table doesn't exist)
\`\`\`

### After
\`\`\`sql
user_addresses.user_id → auth.users(id)  ✅ (Supabase auth table)
\`\`\`

### Why This Happened
- Supabase stores authenticated users in `auth.users`
- The FK constraint was incorrectly pointing to `public.users`
- When creating an address, Supabase couldn't find the user in the wrong table

---

## 🎯 Impact

**Before Fix**:
- ❌ Cannot create addresses in booking flow
- ❌ Error 500 on POST /api/addresses
- ❌ User experience broken

**After Fix**:
- ✅ Addresses created successfully
- ✅ Booking flow works end-to-end
- ✅ User experience restored

---

## 🔗 Related Files

- Migration: `supabase/migrations/20250108000000_fix_user_addresses_foreign_key.sql`
- Script: `scripts/apply-user-addresses-fix.sh`
- API Route: `app/api/addresses/route.ts` (no changes needed)
- Component: `components/addresses/address-form-dialog.tsx` (no changes needed)

---

**Next Steps**: Apply the migration via Supabase Dashboard, then test!
