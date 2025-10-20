# 🚀 Next Steps to Production Deployment

## Timeline Overview

```
TODAY (Oct 18)           ✅ COMPLETE
├─ Implement payment system
├─ Create Edge Functions
├─ Build tests & documentation
└─ Deploy servers locally

TOMORROW (Oct 19)        ⏳ IMMEDIATE
├─ [ ] Apply database migration to Supabase
├─ [ ] Deploy Edge Functions to Supabase
└─ [ ] Configure Stripe webhook

NEXT WEEK (Oct 20-22)    ⏳ SHORT-TERM
├─ [ ] E2E testing in Supabase environment
├─ [ ] Manual Stripe test cards
├─ [ ] Verify email delivery
└─ [ ] Monitor webhook processing

WEEK 2 (Oct 25+)         ⏳ PRODUCTION
├─ [ ] Merge code to main branch
├─ [ ] Deploy to production servers
├─ [ ] Update environment variables
└─ [ ] Monitor first transactions
```

---

## Phase 1: Database Migration (Oct 19 Morning)

### Step 1: Navigate to Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Login to your project
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Apply Migration
```sql
-- Copy the entire migration from supabase/migrations/20250115_add_payment_fields.sql
-- Paste into Supabase SQL Editor
-- Click RUN

-- The migration creates:
-- - New columns on bookings table
-- - RLS policies for security
-- - Indexes for performance
```

**File Location**: `/supabase/migrations/20250115_add_payment_fields.sql`

### Step 3: Verify Migration
```sql
-- In SQL Editor, run:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings'
LIMIT 20;

-- Should show: stripe_payment_intent_id, payment_status, payment_processed_at, etc.
```

### Expected Output
✅ Columns added successfully  
✅ RLS policies active  
✅ Indexes created

---

## Phase 2: Deploy Edge Functions (Oct 19 Afternoon)

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
# Follow the browser popup to authenticate
```

### Step 3: Link Your Project
```bash
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
supabase link --project-ref YOUR_PROJECT_REF
# Get YOUR_PROJECT_REF from Supabase Dashboard URL
```

### Step 4: Deploy Functions
```bash
# Deploy payment email function
supabase functions deploy send-booking-payment-email --no-verify-jwt

# Deploy confirmation email function
supabase functions deploy send-booking-confirmation-email --no-verify-jwt
```

### Expected Output
```
✓ Function deployed successfully
  Function URL: https://YOUR_PROJECT.functions.supabase.co/send-booking-payment-email
```

### Step 5: Set Environment Variables
In Supabase Dashboard:
1. Go to **Settings → Edge Functions**
2. Add environment variables:
   ```
   RESEND_API_KEY = re_xxxxxxxxxxxxx
   ```

### Step 6: Test Functions
```bash
# In your terminal
curl -X POST https://YOUR_PROJECT.functions.supabase.co/send-booking-payment-email \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type":"INSERT",
    "record":{
      "id":"test-id",
      "metadata":{"guest_contact":{"email":"test@example.com"}}
    }
  }'
```

---

## Phase 3: Configure Stripe Webhook (Oct 19 Evening)

### Step 1: Get Stripe Webhook Signing Secret
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers → Webhooks**
3. Click **Add Endpoint**

### Step 2: Configure Endpoint
```
URL: https://your-domain.com/api/webhooks/stripe
Events to listen to:
  ✓ payment_intent.succeeded
  ✓ payment_intent.payment_failed
```

### Step 3: Get Signing Secret
1. After creating endpoint, click **Reveal**
2. Copy the **Signing Secret** (starts with `whsec_`)

### Step 4: Update Environment
Add to `.env.production`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 5: Test Webhook
```bash
# Stripe CLI way (optional):
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
# Copy the signing secret and test locally
```

---

## Phase 4: End-to-End Testing (Oct 20-22)

### Test 1: Create Guest Booking
```bash
# Open http://localhost:3000/reservation/guest
# Fill in form:
# - Service: Wash & Press
# - Pickup Date: Tomorrow
# - Delivery: Select slot
# - Enter address and contact info
# Click "Réserver et payer"
```

### Expected Results
✅ Booking created with status: `pending_payment`  
✅ Payment email received  
✅ Redirected to `/booking/[id]/pay`

### Test 2: Complete Payment
```bash
# On payment page (/booking/[id]/pay)
# Click "Payer maintenant"
# Stripe card form appears
# Enter test card: 4242 4242 4242 4242
# Expiry: 12/25
# CVC: 123
# Click "Pay"
```

### Expected Results
✅ Payment processed successfully  
✅ Redirected to success page  
✅ Confirmation email received  
✅ Booking status: `completed` in database

### Test 3: Verify Webhooks
```bash
# In Stripe Dashboard → Developers → Webhooks
# Click your endpoint
# Check "Events"
# Should see:
#   ✓ payment_intent.succeeded
#   ✓ (processed at specific time)
```

### Test 4: Check Emails
```bash
# Inbox should contain 2 emails:
# 1. "Finalisez votre paiement - Réservation BK-..."
#    - Contains payment link
#    - Links to /booking/[id]/pay
#
# 2. "Paiement confirmé - Réservation BK-..."
#    - Shows next steps timeline
#    - Confirms payment received
```

### Test 5: Database Verification
```bash
# In Supabase Dashboard → SQL Editor
SELECT 
  id, 
  booking_number, 
  status, 
  stripe_payment_intent_id,
  total_amount_cents
FROM bookings
ORDER BY created_at DESC
LIMIT 5;

-- Should show:
-- ✓ status = 'completed'
-- ✓ stripe_payment_intent_id = 'pi_xxxxx'
-- ✓ total_amount_cents = 5000
```

---

## Phase 5: Production Deployment (Week 2)

### Step 1: Code Merge
```bash
# Switch to main branch
git checkout main

# Merge from cleanup branch
git merge cleanup/remove-admin-code

# Push to GitHub
git push origin main
```

### Step 2: Deploy Next.js App

**If using Vercel:**
```bash
vercel deploy --prod
```

**If using another provider:**
- Push to main branch
- Configure auto-deploy from `main`
- Check deployment logs

### Step 3: Update Production Environment

Set in your hosting provider (Vercel, Netlify, etc.):
```env
# .env.production
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Supabase (if different from dev)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 4: Verify Production Endpoints
```bash
# Test each endpoint
curl -X GET https://your-domain.com/

# Check webhooks are receiving
# Create test payment in production Stripe
# Verify booking status updates
```

### Step 5: Monitor

**Day 1: Intensive Monitoring**
- Check Stripe webhook events every hour
- Monitor email delivery logs
- Check application error logs
- Verify database inserts

**Week 1: Regular Monitoring**
- Check daily dashboard
- Review transaction volumes
- Monitor error rates
- Check email deliverability

**Ongoing: Routine Checks**
- Weekly reports
- Monthly analytics
- Customer support tickets

---

## Troubleshooting Checklist

### Payment Not Processing
```
[ ] Check Stripe API keys in .env.production
[ ] Verify webhook URL in Stripe dashboard
[ ] Check Stripe webhook events for errors
[ ] Review Next.js API logs
[ ] Test with valid test card: 4242 4242 4242 4242
```

### Email Not Received
```
[ ] Check Resend API key in Supabase Edge Functions settings
[ ] Verify email address in booking metadata
[ ] Check Edge Function logs in Supabase
[ ] Test Resend API directly
[ ] Check spam folder
```

### Webhook Not Processing
```
[ ] Verify STRIPE_WEBHOOK_SECRET in .env.production
[ ] Check Stripe dashboard for failed events
[ ] Review Next.js API logs for webhook endpoint
[ ] Test webhook manually with curl/postman
[ ] Check webhook URL is publicly accessible
```

### Database Errors
```
[ ] Verify migration was applied correctly
[ ] Check RLS policies are enabled
[ ] Verify column names match schema
[ ] Check for NULL constraint violations
[ ] Review Supabase database logs
```

---

## Commands Quick Reference

### Database
```bash
# Apply migration
# Go to Supabase SQL Editor and run supabase/migrations/*.sql

# View migration status
# Supabase Dashboard → SQL Editor → Run: SELECT * FROM schema_migrations;
```

### Edge Functions
```bash
# Login
supabase login

# Link project
supabase link --project-ref <REF>

# Deploy functions
supabase functions deploy send-booking-payment-email --no-verify-jwt
supabase functions deploy send-booking-confirmation-email --no-verify-jwt

# View logs
supabase functions logs send-booking-payment-email

# Delete function (if needed)
supabase functions delete send-booking-payment-email
```

### Local Testing
```bash
# Run Deno tests
deno test -A --env --no-check supabase/functions/**/*.test.ts

# Start dev servers
pnpm dev              # Terminal 1
deno run -A --env supabase/functions/send-booking-payment-email/index.ts  # Terminal 2

# Run E2E test
./e2e-payment-test.sh
```

### Git
```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "message"

# Push
git push origin main

# View logs
git log --oneline -10
```

---

## Success Criteria

Payment system is successfully deployed when:

✅ **Database**
- [ ] Migration applied to Supabase
- [ ] New columns present in bookings table
- [ ] RLS policies active

✅ **Edge Functions**
- [ ] Both functions deployed to Supabase
- [ ] Environment variables set
- [ ] Functions responding to requests

✅ **Stripe**
- [ ] Webhook endpoint configured
- [ ] Events being processed
- [ ] Test payment successful

✅ **Emails**
- [ ] Payment emails delivering
- [ ] Confirmation emails delivering
- [ ] No bounce/delivery failures

✅ **End-to-End**
- [ ] Guest can book
- [ ] Payment processed
- [ ] Confirmation received
- [ ] Database updated correctly

✅ **Production**
- [ ] Code merged to main
- [ ] App deployed
- [ ] Environment configured
- [ ] Monitoring active

---

## Support Contacts

- **Stripe Support**: https://support.stripe.com
- **Supabase Docs**: https://supabase.com/docs
- **Resend API**: https://resend.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## Important Files Reference

- **Database Migration**: `supabase/migrations/20250115_add_payment_fields.sql`
- **Payment Email Function**: `supabase/functions/send-booking-payment-email/index.ts`
- **Confirmation Function**: `supabase/functions/send-booking-confirmation-email/index.ts`
- **Webhook Handler**: `app/api/webhooks/stripe/route.ts`
- **Payment Intent Route**: `app/api/bookings/[id]/create-payment-intent/route.ts`
- **Testing Docs**: `docs/EDGE_FUNCTIONS_LOCAL_TESTING.md`
- **Deployment Guide**: `docs/DELIVERY_CHECKLIST.md`

---

**Good Luck with deployment!** 🚀  
All the hard work is done. Now it's just a matter of applying migrations and deploying.

For any questions, refer to the comprehensive documentation in `docs/`.
