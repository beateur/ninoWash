#!/bin/bash

# Script: Apply ALL user foreign key fixes
# Description: Fixes ALL user_id foreign keys to point to auth.users
# Usage: ./apply-all-user-fk-fix.sh

set -e  # Exit on error

echo ""
echo "🔧 ========================================"
echo "   FIXING ALL USER FOREIGN KEYS"
echo "=========================================="
echo ""

# Check if SUPABASE_DB_URL is set
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Error: SUPABASE_DB_URL environment variable is not set"
  echo ""
  echo "Please set it using:"
  echo "  export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres'"
  echo ""
  echo "You can find your database URL in:"
  echo "  Supabase Dashboard → Project Settings → Database → Connection string (URI)"
  echo ""
  echo "Or apply manually via Dashboard (faster):"
  echo "  1. Go to https://app.supabase.com → SQL Editor"
  echo "  2. Copy/paste content from: supabase/migrations/20250108000001_fix_all_user_foreign_keys.sql"
  echo "  3. Click Run"
  echo ""
  exit 1
fi

# Migration file
MIGRATION_FILE="supabase/migrations/20250108000001_fix_all_user_foreign_keys.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration: $MIGRATION_FILE"
echo "🗄️  Database: ${SUPABASE_DB_URL%%@*}@***"  # Hide password
echo ""
echo "📋 This migration will fix foreign keys for:"
echo "   • user_addresses"
echo "   • bookings"
echo "   • subscriptions"
echo "   • payments"
echo "   • payment_methods"
echo "   • subscription_credits"
echo "   • credit_transactions"
echo "   • subscription_audit_log"
echo ""

# Confirmation
read -p "⚠️  Continue with migration? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Migration cancelled"
  exit 0
fi

echo ""
echo "⚙️  Applying migration..."
echo ""

# Apply the migration
psql "$SUPABASE_DB_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "=========================================="
  echo "✅ MIGRATION SUCCESSFUL!"
  echo "=========================================="
  echo ""
  echo "🎉 All foreign keys now point to auth.users"
  echo ""
  echo "📋 Next steps:"
  echo "  1. Restart your dev server: pnpm dev"
  echo "  2. Test address creation: http://localhost:3000/addresses"
  echo "  3. Test booking creation: http://localhost:3000/reservation"
  echo "  4. Verify in Supabase Dashboard → Table Editor"
  echo ""
  echo "📚 Documentation:"
  echo "  • Quick guide: QUICK_FIX_USER_ADDRESSES.md"
  echo "  • Full docs: docs/CRITICAL_FIX_FOREIGN_KEYS.md"
  echo ""
else
  echo ""
  echo "=========================================="
  echo "❌ MIGRATION FAILED!"
  echo "=========================================="
  echo ""
  echo "Please try applying manually via Supabase Dashboard:"
  echo "  1. Go to https://app.supabase.com → SQL Editor"
  echo "  2. Copy/paste content from: $MIGRATION_FILE"
  echo "  3. Click Run"
  echo ""
  echo "If error persists, check:"
  echo "  • Database connection (permissions, network)"
  echo "  • User has ALTER TABLE privileges"
  echo "  • Tables exist (user_addresses, bookings, etc.)"
  echo ""
  exit 1
fi
