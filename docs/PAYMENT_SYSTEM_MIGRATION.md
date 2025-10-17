# Payment System Migration - Implementation Guide

## Overview

This document guides the complete migration from inline Stripe checkout to asynchronous email-based payment links using Deno Edge Functions.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ GUEST BOOKING CREATION (/reservation/guest)                         │
│ POST /api/bookings                                                  │
│ ✅ Status: pending_payment                                          │
│ ✅ Payment: Not yet charged                                         │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ DATABASE INSERT TRIGGER                                             │
│ Detects: status = 'pending_payment'                                 │
│ Calls: Edge Function send-booking-payment-email                     │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ EDGE FUNCTION: send-booking-payment-email                           │
│ • Extracts guest contact email from metadata                        │
│ • Builds payment link: /booking/[id]/pay                            │
│ • Sends HTML email via Resend API                                   │
│ • Logs success/failure                                              │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               ▼ (user receives email)
┌─────────────────────────────────────────────────────────────────────┐
│ USER CLICKS EMAIL LINK                                              │
│ GET /booking/[id]/pay                                               │
│ ✅ Displays booking recap                                           │
│ ✅ Button: "Payer maintenant"                                       │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               ▼ (user clicks button)
┌─────────────────────────────────────────────────────────────────────┐
│ CREATE PAYMENT INTENT                                               │
│ POST /api/bookings/[id]/create-payment-intent                       │
│ • Validates: booking.status = pending_payment                      │
│ • Creates: Stripe Checkout Session                                  │
│ • Stores: stripe_session_id in database                             │
│ • Returns: checkoutUrl                                              │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               ▼ (redirect to Stripe)
┌─────────────────────────────────────────────────────────────────────┐
│ STRIPE HOSTED CHECKOUT                                              │
│ • Redirects to Stripe form                                          │
│ • User enters card details                                          │
│ • User completes payment                                            │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               ▼ (payment complete)
┌─────────────────────────────────────────────────────────────────────┐
│ STRIPE WEBHOOK: payment_intent.succeeded                            │
│ POST /api/webhooks/stripe                                           │
│ • Finds booking via metadata.booking_id                             │
│ • Updates: booking.status = 'confirmed'                             │
│ • Updates: payment_status = 'succeeded'                             │
│ • Sets: paid_at timestamp                                           │
│ • Calls: Edge Function send-booking-confirmation-email              │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ EDGE FUNCTION: send-booking-confirmation-email                      │
│ • Sends confirmation email to customer                              │
│ • Includes: booking number, amount, next steps                      │
│ • Non-blocking: Logs errors but doesn't fail webhook                │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               ▼ (Stripe redirects)
┌─────────────────────────────────────────────────────────────────────┐
│ SUCCESS PAGE                                                         │
│ GET /booking/[id]/success?session_id=...                            │
│ ✅ Displays: "Paiement confirmé"                                    │
│ ✅ Shows: Booking number + confirmation                             │
│ ✅ Lists: Next steps                                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Status

### ✅ PHASE 1: Backend (COMPLETE)
- [x] Database migration (payment fields)
- [x] Modified booking creation (status='pending_payment')
- [x] Create payment intent route
- [x] Webhook handlers (payment_intent.succeeded/failed)
- [x] Validation schemas
- [x] Booking types

### 🔄 PHASE 2: Edge Functions (IN PROGRESS)

#### send-booking-payment-email/index.ts
**Purpose**: Send email with payment link when booking created

**Trigger**: Database INSERT on `bookings` where `status = 'pending_payment'`

**Payload**:
```json
{
  "type": "INSERT",
  "record": {
    "id": "booking-uuid",
    "booking_number": "BK-20251017-XXXXXX",
    "user_id": null,
    "status": "pending_payment",
    "total_amount_cents": 5000,
    "metadata": {
      "guest_contact": {
        "email": "guest@example.com",
        "first_name": "Alex",
        "last_name": "Martin"
      }
    }
  }
}
```

**Action**:
1. Extract guest email from metadata or user table
2. Build payment link: `{APP_URL}/booking/{bookingId}/pay`
3. Render HTML + plain text email templates
4. POST to Resend API
5. Store messageId in logs

**Email Template Structure**:
- Header: "Finalisez votre paiement"
- Booking recap: Number, amount
- Payment button with link
- Footer: Support contact

#### send-booking-confirmation-email/index.ts
**Purpose**: Send confirmation email after payment confirmed

**Trigger**: Called from webhook handler after `payment_intent.succeeded`

**Payload**:
```json
{
  "bookingId": "booking-uuid",
  "bookingNumber": "BK-20251017-XXXXXX",
  "email": "customer@example.com",
  "totalAmount": "50.00",
  "paymentIntentId": "pi_xxxxx"
}
```

**Action**:
1. Receive from webhook handler
2. Validate required fields
3. Render confirmation email
4. POST to Resend API
5. Return success (non-blocking - don't fail if email fails)

**Email Template Structure**:
- Header: "✓ Paiement confirmé"
- Confirmation badge with checkmark
- Booking details: Number, amount, status
- Next steps: Collection, cleaning, delivery timeline
- Footer: Support contact

### 🔄 PHASE 3: Frontend (PARTIALLY DONE)

#### Pages Created
- [x] `/booking/[id]/pay` - Checkout page with recap
- [x] `/booking/[id]/success` - Success confirmation

#### Components to Modify
- [ ] `components/booking/guest/steps/summary-step.tsx` - Remove <StripePayment/>
- [ ] `components/booking/summary-step.tsx` - Same changes for auth users
- [ ] Remove `components/booking/guest/stripe-payment.tsx` (deprecated)

#### Flow Changes
**Old Flow (Inline Payment)**:
```
Summary Step → <StripePayment/> component → Inline form → Payment on same page
```

**New Flow (Async Payment)**:
```
Summary Step → "Confirmer" button → POST /api/bookings → Redirect to /booking/[id]/pay
→ Click "Payer maintenant" → Create Stripe session → Redirect to Stripe → Payment
→ Webhook updates booking → Redirect to /booking/[id]/success
```

## Testing Guide

### 1. Local Deno Testing

```bash
# Setup
cd supabase/functions/send-booking-payment-email
cp .env.example .env
# (fill in RESEND_API_KEY=test_key and SUPABASE credentials)

# Run tests
deno test -A --env

# Run dev server
deno run -A --env --watch index.ts

# Test with curl
curl -X POST http://localhost:8000 \
  -H 'Content-Type: application/json' \
  -d '{"type":"INSERT","record":{"id":"B1","booking_number":"BK-1","user_id":null,"status":"pending_payment","total_amount_cents":5000,"metadata":{"guest_contact":{"email":"test@example.com","first_name":"John","last_name":"Doe"}}}}'
```

### 2. Integration Testing (Supabase CLI)

```bash
# Start Supabase locally
supabase start

# Deploy functions
supabase functions deploy send-booking-payment-email --no-verify-jwt
supabase functions deploy send-booking-confirmation-email --no-verify-jwt

# Test via Supabase URL
curl -X POST https://your-project.supabase.co/functions/v1/send-booking-payment-email \
  -H 'Authorization: Bearer eyJhbGc...' \
  -H 'Content-Type: application/json' \
  -d '...'
```

### 3. End-to-End Testing

```bash
# 1. Create guest booking via /reservation/guest
# 2. Check Resend/email service for payment email
# 3. Click payment link in email
# 4. Verify /booking/[id]/pay displays correctly
# 5. Click "Payer maintenant"
# 6. Complete Stripe payment with test card
# 7. Verify webhook fires (check logs)
# 8. Verify booking.status changes to 'confirmed'
# 9. Verify success page redirects correctly
# 10. Check confirmation email received
```

### Test Stripe Cards

```
# Success
4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits

# Decline
4000 0000 0000 0002
Exp: Any future date
CVC: Any 3 digits

# Require authentication
4000 0025 0000 3155
Exp: Any future date
CVC: Any 3 digits
```

## Environment Variables

### Required for Edge Functions
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://app.ninowash.com (or http://localhost:3000 for dev)
```

### Stripe Configuration
```bash
# Already in main app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Database Triggers (to be created)

### Trigger 1: Send payment email when booking created

```sql
CREATE TRIGGER send_payment_email_trigger
AFTER INSERT ON bookings
FOR EACH ROW
WHEN (NEW.status = 'pending_payment')
EXECUTE FUNCTION handle_new_booking_payment_email();

CREATE FUNCTION handle_new_booking_payment_email()
RETURNS trigger AS $$
BEGIN
  -- Call Edge Function
  SELECT
    net.http_post(
      url:='https://your-project.supabase.co/functions/v1/send-booking-payment-email',
      body:=json_build_object('type', 'INSERT', 'record', to_jsonb(NEW)),
      headers:=json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    ) INTO _;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

> **Note**: This uses `pgsql-http` extension. Check if available in your Supabase project.

## Database Schema Changes

```sql
-- Already applied via migration 20251017_add_payment_fields_to_bookings.sql

ALTER TABLE bookings ADD COLUMN:
  - payment_status VARCHAR(50) DEFAULT 'pending'
  - payment_intent_id TEXT
  - stripe_session_id TEXT
  - paid_at TIMESTAMPTZ
  - total_amount_cents INTEGER

-- Indices for performance
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_stripe_session_id ON bookings(stripe_session_id);
CREATE INDEX idx_bookings_payment_intent_id ON bookings(payment_intent_id);
```

## Webhook Event Mapping

### Stripe → Booking State

| Event | Before | After | Email |
|-------|--------|-------|-------|
| payment_intent.succeeded | pending_payment | confirmed | Confirmation |
| payment_intent.payment_failed | pending_payment | pending_payment | Retry notification |
| charge.refunded | confirmed | refunded | Refund notification |

## Security Considerations

### 1. Email Validation
- Guest bookings: Validate email format in booking schema
- Authenticated users: Use user's email from auth table
- Resend: Validates recipient email format

### 2. Payment Link Expiration
- Email mention: "Lien valide pendant 48 heures"
- Implementation: API route checks booking.status = 'pending_payment'
- After payment: booking.status = 'confirmed' (link becomes invalid)

### 3. RLS Policies
- Only owner can access their booking payment page
- Guest bookings: Verify metadata.guest_contact.email matches request
- Admin: Can view all bookings (for support purposes)

### 4. Webhook Signature Verification
- Already implemented in `/api/webhooks/stripe`
- Uses `STRIPE_WEBHOOK_SECRET` to verify request origin
- All webhook handlers must validate signatures

## Error Handling

### Email Service Failures
**send-booking-payment-email**:
- Booking created ✓
- Email fails ✗
- User cannot pay (missing email)
- **Fix**: Resend payment email via dashboard or support

**send-booking-confirmation-email**:
- Booking confirmed ✓
- Email fails ✗
- User informed via Stripe redirect
- **Fix**: Non-blocking - confirmation still sent to webhook response

### Payment Failures
**payment_intent.payment_failed**:
- Webhook handler updates: payment_status = 'failed'
- Booking remains in pending_payment state
- User can retry payment
- Email: "Retry notification" (future feature)

### Database Issues
- Booking creation fails: POST /api/bookings returns error
- Session storage fails: Email sent but no session_id stored (can retry)
- Update fails: Webhook logged but booking not updated (manual fix needed)

## Performance Optimization

### Edge Function Response Time
- Target: < 2s per email (Resend API is fast)
- Database: Minimal queries (only fetch what's needed)
- Caching: Not applicable for one-time emails

### Webhook Processing
- Async: Webhook returns 200 before email sent
- Timeout: 10 seconds per webhook
- Retry: Stripe retries failed webhooks

### Database Indices
```sql
-- Create for faster queries
CREATE INDEX idx_bookings_user_id_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
```

## Deployment Checklist

### Pre-Deployment
- [ ] All PHASE 1 changes merged to main
- [ ] PHASE 3 frontend changes complete
- [ ] Tests pass: E2E, unit tests, integration tests
- [ ] Environment variables configured in Supabase
- [ ] Resend account active + API key generated
- [ ] Stripe webhook endpoint registered

### Deployment Steps
1. Apply database migration to production
2. Deploy Edge Functions to Supabase
3. Create database triggers (if using pgsql-http)
4. Update environment variables in production
5. Test with real Stripe keys (test mode first!)
6. Monitor webhook logs for first 24h
7. Update documentation
8. Notify users of new payment flow

### Post-Deployment
- [ ] Monitor error logs
- [ ] Track email delivery rates (via Resend dashboard)
- [ ] Verify webhook processing
- [ ] Test payment recovery procedures
- [ ] Document any issues found

## Future Enhancements

1. **Payment Retry Logic**
   - Auto-send retry emails after failed payments
   - Limit retries to 3 attempts
   - Escalate to support after failures

2. **Email Templates**
   - Support multiple languages (EN, FR, DE)
   - Dynamic content based on booking type
   - Branded email headers (company logo)

3. **Payment Status Dashboard**
   - User can see payment status in dashboard
   - Admin can force payment status change (for refunds)
   - Export payment reports

4. **Refund Handling**
   - Stripe refund webhook support
   - Automatic refund notifications
   - Refund reason tracking

5. **SMS Notifications**
   - SMS reminder before collection
   - SMS with tracking number after delivery
   - SMS payment reminder (24h before expiration)

## Troubleshooting

### Email Not Received
**Checklist**:
- [ ] RESEND_API_KEY configured
- [ ] Email function deployed
- [ ] Booking created with status='pending_payment'
- [ ] Guest email is valid
- [ ] Check Resend dashboard for delivery status
- [ ] Check spam folder

### Webhook Not Firing
**Checklist**:
- [ ] Stripe webhook endpoint registered
- [ ] STRIPE_WEBHOOK_SECRET configured
- [ ] Test event sent from Stripe dashboard
- [ ] Check webhook logs: Settings → Webhooks → View events
- [ ] Verify `payment_intent.succeeded` event selected

### Payment Page Not Loading
**Checklist**:
- [ ] Booking ID is valid UUID
- [ ] Booking exists in database
- [ ] Booking status is exactly 'pending_payment'
- [ ] User has network access
- [ ] Session timeout (24h booking expiration)

## Support

For issues or questions:
1. Check logs: `/api/webhooks/stripe` for webhook errors
2. Check Resend dashboard for email delivery
3. Check Stripe dashboard for payment events
4. Review database records: `SELECT * FROM bookings WHERE id = '...'`
5. Contact support: support@ninowash.com
