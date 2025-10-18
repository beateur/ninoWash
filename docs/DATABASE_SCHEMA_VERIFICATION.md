# Database Schema Verification Guide

## 🚨 CRITICAL: Source of Truth

**The ONLY reliable source of truth for the database schema is the LIVE Supabase database.**

### ❌ DO NOT TRUST These Files:
- `databaseschema.json` - Only contains `auth.*` tables, missing ALL `public.*` tables
- `scripts/*.sql` - May be outdated or never applied
- Migration files - May not have been executed yet
- Documentation files - May be outdated

### ✅ ALWAYS Verify Using:
1. **Supabase SQL Editor** - Direct query to `information_schema`
2. **Supabase Table Editor** - Visual inspection of tables/columns

## Verification Workflow

### Before ANY database-related work:

#### 1. Check if Table Exists
\`\`\`sql
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'YOUR_TABLE_NAME';
\`\`\`

#### 2. Get ALL Columns for a Table
\`\`\`sql
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'YOUR_TABLE_NAME'
ORDER BY ordinal_position;
\`\`\`

#### 3. Check if Specific Column Exists
\`\`\`sql
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'YOUR_TABLE_NAME'
    AND column_name = 'YOUR_COLUMN_NAME'
) AS column_exists;
\`\`\`

#### 4. Get Foreign Key Relationships
\`\`\`sql
SELECT
  tc.table_name AS from_table, 
  kcu.column_name AS from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'YOUR_TABLE_NAME';
\`\`\`

## Common Schema Errors & Fixes

### Error: "column does not exist"

**Root Cause:** Assuming column names from outdated files

**Fix:**
1. Open Supabase SQL Editor
2. Run column verification query (see above)
3. Use exact column name from query result

### Error: Wrong table relationship

**Root Cause:** Not checking foreign keys before JOIN

**Fix:**
1. Query foreign key constraints (see above)
2. Verify relationship exists
3. Use correct column names

### Error: Case sensitivity issues

**Root Cause:** Database uses snake_case, code uses camelCase

**Fix:**
- Database columns: ALWAYS `snake_case` (e.g., `plan_id`, `building_info`)
- TypeScript types: `camelCase` (e.g., `planId`, `buildingInfo`)
- Map between them in API routes

## Real Examples from This Project

### ✅ CORRECT: Verified from Live Database
\`\`\`typescript
// subscriptions table
interface Subscription {
  id: string
  user_id: string
  plan_id: string  // ✅ FK to subscription_plans.id
  status: string
  stripe_subscription_id: string
  stripe_customer_id: string
  current_period_start: string
  current_period_end: string
}

// user_addresses table
interface UserAddress {
  id: string
  user_id: string
  street: string
  city: string
  postal_code: string
  building_info: string      // ✅ NOT "apartment"
  access_instructions: string // ✅ NOT "delivery_instructions"
}
\`\`\`

### ❌ WRONG: Assumed from Old Scripts
\`\`\`typescript
// ❌ This column doesn't exist!
interface Subscription {
  plan_type: string  // WRONG - column is "plan_id"
}

// ❌ These columns don't exist!
interface UserAddress {
  apartment: string           // WRONG - column is "building_info"
  delivery_instructions: string // WRONG - column is "access_instructions"
  access_code: string         // WRONG - doesn't exist
}
\`\`\`

## Emergency Schema Check

If you're unsure about ANY table structure, run this comprehensive query:

\`\`\`sql
-- Get complete schema for a table with all constraints
SELECT 
  c.column_name,
  c.data_type,
  c.character_maximum_length,
  c.is_nullable,
  c.column_default,
  tc.constraint_type,
  kcu.constraint_name
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu
  ON c.table_schema = kcu.table_schema
  AND c.table_name = kcu.table_name
  AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc
  ON kcu.constraint_name = tc.constraint_name
WHERE c.table_schema = 'public' 
  AND c.table_name = 'YOUR_TABLE_NAME'
ORDER BY c.ordinal_position;
\`\`\`

## Automated Schema Export

Use the provided script to export current schema:

\`\`\`bash
# Execute in Supabase SQL Editor
cat scripts/get-real-schema.sql
# Copy output and save as documentation
\`\`\`

## Prevention Checklist

Before committing ANY database-related code:

- [ ] I verified the table exists in live database
- [ ] I verified ALL column names using `information_schema`
- [ ] I verified foreign key relationships
- [ ] I tested the query in Supabase SQL Editor
- [ ] I documented any schema assumptions
- [ ] I updated types to match exact column names

## When to Update This Guide

Update this guide when:
- New tables are added
- Column names change
- Common errors are discovered
- Schema verification methods improve

---

**Last Updated:** 2025-10-06  
**Verified Against:** Live Supabase Database (Production)
