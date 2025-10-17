#!/bin/bash

# setup-deno-functions.sh - Setup script for local Deno testing
# Usage: ./setup-deno-functions.sh

set -e

echo "🚀 Setting up Deno Edge Functions testing environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo -e "${RED}✗ Deno is not installed${NC}"
    echo "Install from: https://deno.land/"
    exit 1
fi

echo -e "${GREEN}✓ Deno $(deno --version)${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env.deno ]; then
    echo -e "${YELLOW}Creating .env.deno file...${NC}"
    cat > .env.deno << 'EOF'
# Resend Email Service (for testing, use a test key or empty)
RESEND_API_KEY=test_key_dev

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Note: For local testing without sending real emails, use test_key_dev
# To test with real Resend, fill in your actual API key
EOF
    echo -e "${GREEN}✓ Created .env.deno (fill in your credentials)${NC}"
else
    echo -e "${GREEN}✓ .env.deno already exists${NC}"
fi

# Create deno.json if it doesn't exist
if [ ! -f deno.json ]; then
    echo -e "${YELLOW}Creating deno.json...${NC}"
    cat > deno.json << 'EOF'
{
  "tasks": {
    "dev": "deno run -A --env --watch supabase/functions/send-booking-payment-email/index.ts",
    "test": "deno test -A --env supabase/functions/**/*.test.ts"
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  },
  "fmt": {
    "useTabs": false,
    "lineWidth": 100
  }
}
EOF
    echo -e "${GREEN}✓ Created deno.json${NC}"
else
    echo -e "${GREEN}✓ deno.json already exists${NC}"
fi

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "📖 Next steps:"
echo ""
echo "1️⃣  Fill in credentials in .env.deno:"
echo "   RESEND_API_KEY (from https://resend.com)"
echo "   SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "2️⃣  Run tests:"
echo "   deno test -A --env supabase/functions/**/*.test.ts"
echo ""
echo "3️⃣  Start dev server:"
echo "   deno run -A --env --watch supabase/functions/send-booking-payment-email/index.ts"
echo ""
echo "4️⃣  Test with curl (in another terminal):"
echo "   curl -X POST http://localhost:8000 \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"type\":\"INSERT\",\"record\":{\"id\":\"B1\",\"booking_number\":\"BK-1\",\"user_id\":null,\"status\":\"pending_payment\",\"total_amount_cents\":5000,\"metadata\":{\"guest_contact\":{\"email\":\"test@example.com\",\"first_name\":\"John\",\"last_name\":\"Doe\"}}}}'"
echo ""
echo "📚 Documentation:"
echo "   - PAYMENT_SYSTEM_MIGRATION.md (architecture & testing guide)"
echo "   - supabase/functions/send-booking-payment-email/index.test.ts (unit tests)"
echo ""
