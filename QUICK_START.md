# ⚡ Quick Start: Payment System Deployment

**Last Updated**: October 18, 2024  
**Status**: 🟢 Production Ready  
**Deployment Time**: ~60 minutes  

---

## 🎯 The Essentials (TL;DR)

You have a complete, tested, production-ready payment system. Here are the 3 key steps:

### Step 1: Database (10 min)
1. Go to Supabase Dashboard → SQL Editor
2. Copy file: `supabase/migrations/20251017_add_payment_fields_to_bookings.sql`
3. Paste and RUN in Supabase
4. Done! ✅

### Step 2: Edge Functions (10 min)
```bash
cd /Users/bilel/Documents/websites/ninoWebsite/ninoWash
supabase login
supabase link --project-ref [YOUR_PROJECT_REF]
supabase functions deploy send-booking-payment-email --no-verify-jwt
supabase functions deploy send-booking-confirmation-email --no-verify-jwt
```
In Supabase Dashboard, set environment variable:
- Key: `RESEND_API_KEY`
- Value: Your Resend API key

### Step 3: Stripe Webhook (5 min)

**For Local Development (Stripe CLI - Recommended):**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the signing secret displayed
```

**For Production (Stripe Dashboard):**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add Endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Events: `payment_intent.succeeded` + `payment_intent.payment_failed`
4. Copy signing secret
5. Add to environment: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

---

## 📁 Key Files You Need

| File | Purpose | Action |
|------|---------|--------|
| `supabase/migrations/20251017_add_payment_fields_to_bookings.sql` | Database schema | Copy to Supabase SQL Editor, RUN |
| `supabase/functions/send-booking-payment-email/index.ts` | Email function | Auto-deployed by `supabase functions deploy` |
| `supabase/functions/send-booking-confirmation-email/index.ts` | Confirmation email | Auto-deployed by `supabase functions deploy` |
| `app/api/webhooks/stripe/route.ts` | Webhook handler | Auto-deployed with Next.js |
| `.env.production` | Production secrets | Update with live keys |

---

## ✅ Verification Commands

```bash
# Test database migration
curl https://[project].supabase.co/rest/v1/bookings?limit=1 \
  -H "Authorization: Bearer [ANON_KEY]"

# Test Edge Functions
curl -X POST https://[project].functions.supabase.co/send-booking-payment-email \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","record":{"id":"test","metadata":{"guest_contact":{"email":"test@example.com"}}}}'

# Test webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{}'
# Should return 400 (invalid payload), NOT 404 (endpoint doesn't exist)
```

---

## 🧪 Local Testing (Before Production)

```bash
# Start dev servers
pnpm dev                              # Terminal 1
deno run -A --env supabase/functions/send-booking-payment-email/index.ts  # Terminal 2

# Run tests
deno test -A --env --no-check supabase/functions/**/*.test.ts

# E2E test
./e2e-payment-test.sh

# Build verification
pnpm build  # Must show 0 errors
```

---

## 🔴 Common Issues & Fixes

### "Migration column already exists"
**Solution**: Skip migration (it's already applied)

### "Emails not sending"
**Checklist**:
- [ ] `RESEND_API_KEY` set in Supabase
- [ ] Key is not expired
- [ ] Email address in booking is valid
- [ ] Check Resend dashboard for failures

### "Webhook not processing"
**Checklist**:
- [ ] Webhook URL is publicly accessible
- [ ] `STRIPE_WEBHOOK_SECRET` matches exactly
- [ ] Endpoint URL in Stripe matches exactly (no trailing slash)
- [ ] Check Next.js logs: `grep webhook logs`

### "Payment form not showing"
**Checklist**:
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- [ ] Key is for correct environment (test/live)
- [ ] Stripe JavaScript loaded (check browser console)

---

## 📊 Environment Variables Needed

### For Development
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxx
```

### For Production
```env
# Environment variables in your hosting provider
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
STRIPE_SECRET_KEY=sk_live_xxx        # ⚠️ LIVE KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx  # ⚠️ LIVE KEY
STRIPE_WEBHOOK_SECRET=whsec_live_xxx # ⚠️ FROM LIVE WEBHOOK
```

---

## 🚀 5-Minute Quick Check

Before deployment, run these checks:

```bash
# 1. Code quality
pnpm tsc --noEmit                     # Should show 0 errors
pnpm lint                              # Should show 0 errors

# 2. Tests
deno test -A --env --no-check supabase/functions/**/*.test.ts
# Should show: ok | 6 passed | 0 failed

# 3. Build
pnpm build                             # Should show 0 errors, success message

# 4. Git status
git status                             # Should be clean or ready to commit

# 5. Database (on Supabase)
# Query: SELECT COUNT(*) FROM bookings;
# Should return: (1) or more rows
```

✅ All pass? **You're ready to deploy!**

---

## 📈 Expected Results

### After Database Migration
```sql
SELECT column_name FROM information_schema.columns WHERE table_name='bookings';
-- Should include: stripe_payment_intent_id, payment_status, payment_processed_at
```

### After Payment
```sql
SELECT status, payment_status, stripe_payment_intent_id 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 1;
-- Result: completed | succeeded | pi_1234567890
```

### Stripe Events
Dashboard should show:
- ✅ payment_intent.succeeded (when payment completes)
- ✅ payment_intent.payment_failed (if payment fails)

### Emails Sent
1. "Finalisez votre paiement" (with payment link)
2. "Paiement confirmé" (after successful payment)

---

## 🆘 Emergency Contacts

| Issue | Action |
|-------|--------|
| 🔴 Database down | Check Supabase status page |
| 🔴 Payments failing | Check Stripe dashboard for errors |
| 🔴 Emails not sending | Check Resend dashboard → logs |
| 🔴 App not loading | Check deployment logs in hosting provider |

---

## 📚 Full Documentation

For detailed information, see:
- `docs/DEPLOYMENT_STEPS.md` - Detailed step-by-step guide
- `DEPLOYMENT_CHECKLIST.md` - Complete checklist with troubleshooting
- `docs/PAYMENT_SYSTEM_MIGRATION.md` - Architecture details
- `docs/EDGE_FUNCTIONS_LOCAL_TESTING.md` - Function testing guide

---

## ✨ Success Criteria

System is working when:

```
Guest creates booking
           ↓
Payment email sent (check inbox)
           ↓
Guest clicks link
           ↓
Payment form shows
           ↓
Guest enters test card (4242 4242 4242 4242)
           ↓
Payment processes
           ↓
Success page shown
           ↓
Confirmation email sent
           ↓
Database updated with payment info
           ↓
✅ SYSTEM WORKING
```

---

## 🎉 You're All Set!

The payment system is **100% complete and tested locally**.

**Your next steps**:
1. Deploy database migration (10 min)
2. Deploy Edge Functions (10 min)  
3. Configure Stripe webhook (5 min)
4. Test end-to-end (15 min)
5. Deploy to production (30 min)

**Total time**: ~60-90 minutes

**Questions?** Check the docs or deployment checklist.

**Ready?** Start with Step 1! 🚀
