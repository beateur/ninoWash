# Supabase Key Rotation Procedure

## Overview
This document provides step-by-step instructions for rotating Supabase keys as part of Sprint P0 security requirements.

## Prerequisites
- Access to Supabase project dashboard
- Access to Vercel project settings
- Staging environment for testing
- Rollback plan prepared

## Rotation Steps

### 1. Prepare for Rotation

**Before starting:**
- [ ] Notify team of planned maintenance window
- [ ] Ensure staging environment is available for testing
- [ ] Have rollback plan ready
- [ ] Backup current environment variables

### 2. Rotate Service Role Key

**In Supabase Dashboard:**

1. Navigate to Project Settings > API
2. Under "Project API keys", locate "service_role" key
3. Click "Regenerate" next to service_role key
4. Copy the new service_role key (it will only be shown once)
5. Store securely in password manager

**In Vercel Dashboard:**

1. Go to Project Settings > Environment Variables
2. Find `SUPABASE_SERVICE_ROLE_KEY`
3. Click "Edit" and paste the new service_role key
4. Select environments: Production, Preview, Development
5. Save changes

### 3. Rotate Anon Key

**In Supabase Dashboard:**

1. Navigate to Project Settings > API
2. Under "Project API keys", locate "anon" key
3. Click "Regenerate" next to anon key
4. Copy the new anon key

**In Vercel Dashboard:**

1. Go to Project Settings > Environment Variables
2. Find `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click "Edit" and paste the new anon key
4. Select environments: Production, Preview, Development
5. Save changes

### 4. Test in Staging

**Deploy to staging:**
\`\`\`bash
# Trigger staging deployment
vercel --prod --scope=your-team
\`\`\`

**Run validation tests:**
- [ ] Test user authentication (login/logout)
- [ ] Test admin access to `/admin/*` routes
- [ ] Test Stripe webhook processing
- [ ] Test subscription sync
- [ ] Verify API routes function correctly
- [ ] Check database queries work with new keys

### 5. Deploy to Production

**If staging tests pass:**
\`\`\`bash
# Deploy to production
vercel --prod
\`\`\`

**Monitor for issues:**
- [ ] Watch error logs for authentication failures
- [ ] Monitor Stripe webhook success rate
- [ ] Check admin access logs
- [ ] Verify no 401/403 spikes in metrics

### 6. Invalidate Old Keys

**In Supabase Dashboard:**

1. Confirm new keys are working in production (wait 15-30 minutes)
2. Old keys are automatically invalidated when regenerated
3. Verify old keys no longer work by testing in isolated environment

### 7. Update Documentation

- [ ] Update `.env.example` if it exists
- [ ] Update team documentation with rotation date
- [ ] Log rotation in security audit trail
- [ ] Update incident response runbook

## Rollback Procedure

**If issues occur after rotation:**

1. **Immediate rollback:**
   - Revert Vercel environment variables to old keys
   - Redeploy previous version
   - Regenerate keys again in Supabase to get old keys back (if needed)

2. **Investigate:**
   - Check error logs for specific failures
   - Identify which services are affected
   - Determine if issue is key-related or deployment-related

3. **Retry:**
   - Fix identified issues
   - Test thoroughly in staging
   - Attempt rotation again

## Security Best Practices

- **Never commit keys to git**
- **Use environment variables only**
- **Rotate keys quarterly** (or after any suspected compromise)
- **Test in staging first**
- **Monitor for 24-48 hours after rotation**
- **Keep old keys for 24 hours** before final invalidation (if possible)

## Verification Checklist

After rotation is complete:

- [ ] All authentication flows work
- [ ] Admin routes accessible to admins only
- [ ] Stripe webhooks processing successfully
- [ ] Database queries functioning
- [ ] No service role key in client bundle (run bundle analyzer)
- [ ] No authentication errors in logs
- [ ] Monitoring dashboards show normal metrics

## Emergency Contacts

- **Tech Lead:** [Name/Contact]
- **Security Team:** [Contact]
- **DevOps On-Call:** [Contact]
- **Supabase Support:** support@supabase.io

## Audit Trail

| Date | Rotated By | Reason | Status |
|------|------------|--------|--------|
| YYYY-MM-DD | [Name] | Sprint P0 Security | Pending |

---

**Last Updated:** 2025-02-10
**Next Scheduled Rotation:** 2025-05-10 (Quarterly)
