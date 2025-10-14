#!/bin/bash

##############################################################################
# DEV ONLY: Manual Credit Reset Script
##############################################################################
# This script manually resets weekly credits for testing purposes.
# In production, this is handled automatically by the cron job every Monday.
#
# Usage:
#   ./scripts/dev-reset-credits.sh [user_id]
#
# Examples:
#   ./scripts/dev-reset-credits.sh                    # Reset all active subscriptions
#   ./scripts/dev-reset-credits.sh abc-123-def        # Reset specific user
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="${NEXT_PUBLIC_SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$PROJECT_REF" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo -e "${RED}❌ Error: Missing environment variables${NC}"
  echo ""
  echo "Required variables:"
  echo "  - NEXT_PUBLIC_SUPABASE_URL"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
  echo ""
  echo "Make sure your .env.local is loaded:"
  echo "  source .env.local"
  exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo "$PROJECT_REF" | sed 's|https://||' | sed 's|.supabase.co||')

USER_ID="${1:-}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🔄 Manual Credit Reset (DEV MODE)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ -n "$USER_ID" ]; then
  echo -e "${YELLOW}🎯 Target: User ${USER_ID}${NC}"
else
  echo -e "${YELLOW}🎯 Target: All active subscriptions${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE} Step 1: Fetching Active Subscriptions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Build query filter
if [ -n "$USER_ID" ]; then
  QUERY_FILTER="user_id=eq.${USER_ID}&status=in.(active,trialing)"
else
  QUERY_FILTER="status=in.(active,trialing)"
fi

# Fetch subscriptions
SUBSCRIPTIONS=$(curl -s -X GET \
  "https://${PROJECT_REF}.supabase.co/rest/v1/subscriptions?${QUERY_FILTER}&select=id,user_id,plan_id" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${RED}❌ Error: 'jq' is required but not installed${NC}"
  echo "Install with: brew install jq"
  exit 1
fi

# Parse subscription count
SUB_COUNT=$(echo "$SUBSCRIPTIONS" | jq '. | length')

if [ "$SUB_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}⚠️  No active subscriptions found${NC}"
  
  if [ -n "$USER_ID" ]; then
    echo ""
    echo "Checking if user exists..."
    USER_CHECK=$(curl -s -X GET \
      "https://${PROJECT_REF}.supabase.co/rest/v1/subscriptions?user_id=eq.${USER_ID}&select=id,status" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")
    
    USER_EXISTS=$(echo "$USER_CHECK" | jq '. | length')
    
    if [ "$USER_EXISTS" -eq 0 ]; then
      echo -e "${RED}❌ User has no subscriptions at all${NC}"
    else
      echo -e "${YELLOW}User has subscriptions but none are active/trialing${NC}"
      echo "$USER_CHECK" | jq '.'
    fi
  fi
  
  exit 0
fi

echo -e "${GREEN}✅ Found ${SUB_COUNT} subscription(s)${NC}"
echo ""

# Display subscriptions
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE} Subscriptions to Reset:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "$SUBSCRIPTIONS" | jq -r '.[] | "  • User: \(.user_id) | Plan: \(.plan_id)"'
echo ""

# Confirm reset
read -p "$(echo -e ${YELLOW}Continue with reset? [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Cancelled${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE} Step 2: Resetting Credits${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SUCCESS_COUNT=0
ERROR_COUNT=0

# Process each subscription
echo "$SUBSCRIPTIONS" | jq -c '.[]' | while read -r sub; do
  SUB_ID=$(echo "$sub" | jq -r '.id')
  SUB_USER_ID=$(echo "$sub" | jq -r '.user_id')
  PLAN_ID=$(echo "$sub" | jq -r '.plan_id')
  
  # Determine credit count based on plan
  case "$PLAN_ID" in
    "monthly")
      CREDITS=2
      ;;
    "quarterly")
      CREDITS=3
      ;;
    *)
      CREDITS=2
      ;;
  esac
  
  echo -e "  ${YELLOW}Processing: ${SUB_USER_ID} (${PLAN_ID}) → ${CREDITS} credits${NC}"
  
  # Call initialize_weekly_credits function
  RESULT=$(curl -s -X POST \
    "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/initialize_weekly_credits" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"p_user_id\": \"${SUB_USER_ID}\",
      \"p_subscription_id\": \"${SUB_ID}\",
      \"p_credits_total\": ${CREDITS}
    }")
  
  # Check for errors in response
  ERROR_MSG=$(echo "$RESULT" | jq -r '.message // empty' 2>/dev/null || echo "")
  
  if [ -n "$ERROR_MSG" ] && [ "$ERROR_MSG" != "null" ]; then
    echo -e "    ${RED}❌ Error: ${ERROR_MSG}${NC}"
    ((ERROR_COUNT++))
  else
    echo -e "    ${GREEN}✅ Success${NC}"
    ((SUCCESS_COUNT++))
  fi
  echo ""
done

# Final summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE} Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Total Processed: ${SUB_COUNT}"
echo -e "  ${GREEN}✅ Successful: ${SUCCESS_COUNT}${NC}"
echo -e "  ${RED}❌ Failed: ${ERROR_COUNT}${NC}"
echo ""

# Verification SQL query
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE} Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Run this SQL query to verify credits:"
echo ""
echo -e "${YELLOW}SELECT "
echo "  sc.user_id,"
echo "  s.plan_id,"
echo "  sc.credits_remaining,"
echo "  sc.credits_allocated,"
echo "  sc.reset_at,"
echo "  sc.created_at"
echo "FROM subscription_credits sc"
echo "JOIN subscriptions s ON s.id = sc.subscription_id"

if [ -n "$USER_ID" ]; then
  echo "WHERE sc.user_id = '${USER_ID}'"
fi

echo "ORDER BY sc.created_at DESC"
echo -e "LIMIT 10;${NC}"
echo ""

# Check current credits via API
if [ -n "$USER_ID" ]; then
  echo -e "${BLUE}Current credits for user:${NC}"
  echo ""
  
  CREDITS_CHECK=$(curl -s -X GET \
    "https://${PROJECT_REF}.supabase.co/rest/v1/subscription_credits?user_id=eq.${USER_ID}&order=created_at.desc&limit=1&select=*" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")
  
  echo "$CREDITS_CHECK" | jq '.'
  echo ""
fi

echo -e "${GREEN}✨ Done!${NC}"
echo ""
