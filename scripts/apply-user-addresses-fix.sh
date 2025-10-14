#!/bin/bash

# Script: Apply user_addresses foreign key fix
# Description: Fixes the foreign key constraint to point to auth.users instead of public.users
# Usage: ./apply-user-addresses-fix.sh

set -e  # Exit on error

echo "🔧 Fixing user_addresses foreign key constraint..."
echo ""

# Check if SUPABASE_DB_URL is set
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Error: SUPABASE_DB_URL environment variable is not set"
  echo ""
  echo "Please set it using:"
  echo "  export SUPABASE_DB_URL='your_database_url'"
  echo ""
  echo "You can find your database URL in:"
  echo "  Supabase Dashboard → Project Settings → Database → Connection string (URI)"
  echo ""
  exit 1
fi

# Migration file
MIGRATION_FILE="supabase/migrations/20250108000000_fix_user_addresses_foreign_key.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "🗄️  Database: $SUPABASE_DB_URL"
echo ""

# Apply the migration
echo "⚙️  Applying migration..."
psql "$SUPABASE_DB_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration applied successfully!"
  echo ""
  echo "📋 Next steps:"
  echo "  1. Test creating a new address in the booking flow"
  echo "  2. Verify the address is saved correctly"
  echo "  3. Check Supabase Dashboard → Table Editor → user_addresses"
  echo ""
else
  echo ""
  echo "❌ Migration failed!"
  echo ""
  echo "Please check the error message above and:"
  echo "  1. Verify your database connection"
  echo "  2. Check if you have the required permissions"
  echo "  3. Try applying the migration manually via Supabase Dashboard SQL Editor"
  echo ""
  exit 1
fi
