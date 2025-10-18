#!/bin/bash
# =============================================================================
# NINO WASH - Stripe Webhook Local Testing Script
# =============================================================================
# This script starts the Stripe CLI webhook listener for local development
#
# Prerequisites:
# 1. Stripe CLI installed: brew install stripe/stripe-cli/stripe
# 2. Stripe account with test mode enabled
# 3. Next.js dev server running on localhost:3000
# 4. .env.local configured with STRIPE_WEBHOOK_SECRET
#
# Usage:
#   chmod +x start-stripe-webhook.sh
#   ./start-stripe-webhook.sh

set -e

echo "🎯 NINO WASH - Stripe Webhook Listener"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}❌ Stripe CLI not found${NC}"
    echo "Install it with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

# Check if Next.js is running
echo -e "${BLUE}🔍 Checking if Next.js is running on localhost:3000...${NC}"
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Next.js doesn't seem to be running${NC}"
    echo "Start it with: pnpm dev"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start Stripe listener
echo ""
echo -e "${GREEN}✅ Starting Stripe webhook listener...${NC}"
echo -e "${BLUE}📍 Forwarding webhooks to: http://localhost:3000/api/webhooks/stripe${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "   1. A new webhook signing secret will be displayed"
echo "   2. Copy it and update .env.local:"
echo "      STRIPE_WEBHOOK_SECRET=whsec_..."
echo "   3. Restart Next.js dev server (pnpm dev)"
echo ""
echo -e "${BLUE}Running command:${NC}"
echo "  stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo ""
echo "------------ Stripe CLI Output Below -----------"
echo ""

# Run Stripe listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

echo ""
echo "------------ Stripe CLI Output Above -----------"
echo ""
echo -e "${GREEN}✅ Stripe webhook listener started!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. You'll see a webhook signing secret above (whsec_...)"
echo "2. Update STRIPE_WEBHOOK_SECRET in .env.local"
echo "3. Restart Next.js: pnpm dev"
echo "4. Now test webhooks:"
echo ""
echo "   # Create test invoice (triggers payment email)"
echo "   stripe trigger invoice.created"
echo ""
echo "   # Create test subscription (triggers confirmation)"
echo "   stripe trigger customer.subscription.updated"
echo ""
echo -e "${YELLOW}Keep this terminal open while testing!${NC}"
echo ""
