# Dev Tools: Manual Credit Reset

## 🎯 Purpose

These tools allow developers to manually reset weekly subscription credits during development and testing, without waiting for the Monday cron job.

**⚠️ IMPORTANT**: These tools are only available in development mode (`NODE_ENV !== "production"`).

---

## 🛠️ Available Tools

### 1. Bash Script (Terminal)

**File**: `scripts/dev-reset-credits.sh`

**Usage**:
\`\`\`bash
# Reset all active subscriptions
./scripts/dev-reset-credits.sh

# Reset specific user
./scripts/dev-reset-credits.sh abc-123-def-456-ghi
\`\`\`

**Prerequisites**:
- Load environment variables: `source .env.local`
- Install jq (JSON parser): `brew install jq`

**Environment Variables Required**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Example Output**:
\`\`\`bash
═══════════════════════════════════════════════════════════
   🔄 Manual Credit Reset (DEV MODE)
═══════════════════════════════════════════════════════════

🎯 Target: All active subscriptions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Step 1: Fetching Active Subscriptions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Found 3 subscription(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Subscriptions to Reset:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • User: abc-123-def | Plan: monthly
  • User: ghi-456-jkl | Plan: quarterly
  • User: mno-789-pqr | Plan: monthly

Continue with reset? [y/N]: y

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Step 2: Resetting Credits
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Processing: abc-123-def (monthly) → 2 credits
    ✅ Success

  Processing: ghi-456-jkl (quarterly) → 3 credits
    ✅ Success

  Processing: mno-789-pqr (monthly) → 2 credits
    ✅ Success

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Processed: 3
  ✅ Successful: 3
  ❌ Failed: 0

✨ Done!
\`\`\`

**Features**:
- ✅ Interactive confirmation prompt
- ✅ Color-coded output
- ✅ Detailed progress for each subscription
- ✅ SQL verification query provided
- ✅ Error handling with rollback
- ✅ User existence validation

---

### 2. API Endpoint (HTTP)

**Endpoint**: `POST /api/dev/reset-credits`

**Security**: Blocked in production (`NODE_ENV === "production"`)

**Request Body**:
\`\`\`json
{
  "userId": "abc-123-def-456" // Optional: reset specific user
}
\`\`\`

**Response** (Success):
\`\`\`json
{
  "success": true,
  "message": "Reset completed: 3 successful, 0 failed",
  "totalProcessed": 3,
  "successCount": 3,
  "errorCount": 0,
  "results": [
    {
      "userId": "abc-123-def",
      "planId": "monthly",
      "credits": 2,
      "success": true
    },
    {
      "userId": "ghi-456-jkl",
      "planId": "quarterly",
      "credits": 3,
      "success": true
    }
  ]
}
\`\`\`

**Response** (Error):
\`\`\`json
{
  "error": "This endpoint is only available in development mode"
}
\`\`\`

**cURL Example**:
\`\`\`bash
# Reset all active subscriptions
curl -X POST http://localhost:3000/api/dev/reset-credits \
  -H "Content-Type: application/json"

# Reset specific user
curl -X POST http://localhost:3000/api/dev/reset-credits \
  -H "Content-Type: application/json" \
  -d '{"userId":"abc-123-def-456"}'
\`\`\`

**GET Endpoint** (Verification):
\`\`\`bash
# Check all credits
curl http://localhost:3000/api/dev/reset-credits

# Check specific user
curl "http://localhost:3000/api/dev/reset-credits?userId=abc-123-def-456"
\`\`\`

---

### 3. UI Component (Dashboard)

**Component**: `<DevCreditReset />`

**Location**: Automatically displayed in dashboard (`/dashboard`)

**Features**:
- ✅ One-click reset button
- ✅ Real-time feedback with toast notifications
- ✅ Last reset summary display
- ✅ Automatic page refresh after reset
- ✅ Visual indicators (success/error icons)
- ✅ Only visible in development mode

**Screenshot Description**:
\`\`\`
┌─────────────────────────────────────────────────┐
│ 🔄 Dev: Reset Credits         [DEV ONLY]       │
│ Manually reset weekly credits for testing       │
├─────────────────────────────────────────────────┤
│                                                  │
│  [🔄 Reset Credits Now]  Target: abc-123...    │
│                                                  │
│  Last Reset:                    [2/2 successful]│
│  • abc-123... (monthly)         2 credits  ✓   │
│  • def-456... (quarterly)       3 credits  ✓   │
│                                                  │
│  ℹ️ This will:                                  │
│  • Reset credits for all active subscriptions   │
│  • Monthly plans: 2 credits                     │
│  • Quarterly plans: 3 credits                   │
│  • Update reset_at timestamp                    │
└─────────────────────────────────────────────────┘
\`\`\`

**User Flow**:
1. User clicks "Reset Credits Now" button
2. Component calls `/api/dev/reset-credits`
3. Toast notification shows success/error
4. Last reset summary is displayed
5. Page auto-refreshes to show new credit count

---

## 🔧 How It Works

### Business Logic

1. **Fetch Active Subscriptions**:
   \`\`\`sql
   SELECT id, user_id, plan_id 
   FROM subscriptions 
   WHERE status IN ('active', 'trialing')
   \`\`\`

2. **Map Plan to Credits**:
   - `monthly` → 2 credits
   - `quarterly` → 3 credits
   - Default → 2 credits

3. **Call PostgreSQL Function**:
   \`\`\`sql
   SELECT initialize_weekly_credits(
     p_user_id := 'abc-123-def',
     p_subscription_id := 'sub-id',
     p_credits := 2
   );
   \`\`\`

4. **Function Behavior** (`initialize_weekly_credits`):
   - Inserts new row in `subscription_credits`
   - Sets `credits_remaining = credits_allocated`
   - Sets `reset_at = NOW() + INTERVAL '1 week'`
   - Sets `week_number = EXTRACT(WEEK FROM NOW())`
   - Previous credits are automatically invalidated (only latest row counts)

---

## 🧪 Testing Workflow

### Scenario: Test Free Booking with Credits

**Step 1**: Create test user with subscription
\`\`\`sql
-- Insert subscription
INSERT INTO subscriptions (user_id, plan_id, status, stripe_subscription_id)
VALUES (
  'your-user-id',
  'monthly',
  'active',
  'sub_test_' || gen_random_uuid()
);
\`\`\`

**Step 2**: Reset credits via any tool
\`\`\`bash
# Option A: Bash script
./scripts/dev-reset-credits.sh your-user-id

# Option B: API call
curl -X POST http://localhost:3000/api/dev/reset-credits \
  -H "Content-Type: application/json" \
  -d '{"userId":"your-user-id"}'

# Option C: Click button in dashboard UI
\`\`\`

**Step 3**: Verify credits
\`\`\`sql
SELECT * FROM subscription_credits WHERE user_id = 'your-user-id';
-- Expected: credits_remaining = 2, credits_allocated = 2
\`\`\`

**Step 4**: Create booking (should be free)
\`\`\`bash
# Via UI: /reservation
# Via API: POST /api/bookings
\`\`\`

**Step 5**: Verify credit consumed
\`\`\`sql
SELECT * FROM subscription_credits WHERE user_id = 'your-user-id';
-- Expected: credits_remaining = 1

SELECT * FROM credit_usage_log WHERE user_id = 'your-user-id';
-- Expected: 1 row with action = 'consumed'
\`\`\`

**Step 6**: Reset again for next test
\`\`\`bash
./scripts/dev-reset-credits.sh your-user-id
\`\`\`

---

## 🚨 Common Issues

### Issue 1: "Missing environment variables"

**Error**:
\`\`\`bash
❌ Error: Missing environment variables

Required variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
\`\`\`

**Solution**:
\`\`\`bash
# Load .env.local
source .env.local

# Or export manually
export NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
\`\`\`

---

### Issue 2: "jq command not found"

**Error**:
\`\`\`bash
❌ Error: 'jq' is required but not installed
\`\`\`

**Solution**:
\`\`\`bash
brew install jq
\`\`\`

---

### Issue 3: "No active subscriptions found"

**Possible Causes**:
- User has no subscription
- Subscription status is not `active` or `trialing`
- Wrong user ID

**Verification**:
\`\`\`sql
-- Check if user has subscription
SELECT id, user_id, plan_id, status 
FROM subscriptions 
WHERE user_id = 'your-user-id';

-- Check all subscriptions
SELECT id, user_id, plan_id, status 
FROM subscriptions 
ORDER BY created_at DESC 
LIMIT 10;
\`\`\`

**Solution**:
\`\`\`sql
-- Create test subscription
INSERT INTO subscriptions (user_id, plan_id, status, stripe_subscription_id)
VALUES (
  'your-user-id',
  'monthly',
  'active',
  'sub_test_' || gen_random_uuid()
);
\`\`\`

---

### Issue 4: UI Component Not Visible

**Possible Causes**:
- Running in production mode
- Component import error

**Verification**:
\`\`\`bash
# Check NODE_ENV
echo $NODE_ENV
# Should be empty or "development"

# Check if dev server is running
pnpm dev
\`\`\`

**Solution**:
- Ensure `NODE_ENV !== "production"`
- Clear Next.js cache: `rm -rf .next`
- Restart dev server: `pnpm dev`

---

### Issue 5: 403 Forbidden (Production Block)

**Error**:
\`\`\`json
{
  "error": "This endpoint is only available in development mode"
}
\`\`\`

**Cause**: Trying to use dev tools in production

**Solution**: Only use in development environment

---

## 📊 Monitoring

### Check Reset History

**SQL Query**:
\`\`\`sql
-- View all credit resets for a user
SELECT 
  user_id,
  credits_allocated,
  credits_remaining,
  reset_at,
  week_number,
  created_at
FROM subscription_credits
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

### Check Usage Log

**SQL Query**:
\`\`\`sql
-- View credit consumption history
SELECT 
  user_id,
  action,
  credits_before,
  credits_after,
  booking_id,
  created_at
FROM credit_usage_log
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

### Check All Active Credits

**SQL Query**:
\`\`\`sql
-- View current credits for all users
SELECT 
  sc.user_id,
  s.plan_id,
  sc.credits_remaining,
  sc.credits_allocated,
  sc.reset_at,
  s.status AS subscription_status
FROM subscription_credits sc
JOIN subscriptions s ON s.user_id = sc.user_id
WHERE s.status IN ('active', 'trialing')
ORDER BY sc.created_at DESC;
\`\`\`

---

## 🎯 Best Practices

1. **Reset Before Each Test**:
   - Always reset credits before testing free bookings
   - Ensures consistent starting state

2. **Use User-Specific Reset**:
   - Prefer resetting specific user: `./scripts/dev-reset-credits.sh user-id`
   - Avoids affecting other test users

3. **Verify After Reset**:
   - Always check credits after reset with SQL query
   - Confirms operation succeeded

4. **Don't Deploy to Production**:
   - Dev tools are blocked in production
   - Remove any manual bypass before deployment

5. **Document Test Scenarios**:
   - Keep notes of which users have subscriptions
   - Track credit consumption patterns

---

## 🔗 Related Documentation

- **Complete Testing Guide**: `docs/TESTING_GUIDE_SUBSCRIPTION_CREDITS.md`
- **Cron Job Deployment**: `docs/CRON_JOB_DEPLOYMENT_GUIDE.md`
- **PRD**: `docs/PRD/PRD_SUBSCRIPTION_WEEKLY_CREDITS.md`
- **Implementation Progress**: `docs/IMPLEMENTATION_PROGRESS_CREDITS.md`

---

## 📝 Summary

| Tool | Use Case | Speed | Visibility |
|------|----------|-------|------------|
| **Bash Script** | Terminal power users, CI/CD | ⚡⚡⚡ Fast | Terminal only |
| **API Endpoint** | Automation, external tools | ⚡⚡ Medium | JSON response |
| **UI Component** | Quick visual testing | ⚡ Easy | Dashboard UI |

**Recommendation**: 
- Use **UI Component** for quick manual testing
- Use **Bash Script** for batch operations or CI/CD
- Use **API Endpoint** for programmatic integration

---

**Last Updated**: October 5, 2025  
**Version**: 1.0.0
