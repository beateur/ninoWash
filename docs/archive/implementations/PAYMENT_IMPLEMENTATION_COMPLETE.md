# 💰 Payment System Implementation - Complete Documentation

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Phases](#implementation-phases)
3. [File Structure](#file-structure)
4. [Quick Start](#quick-start)
5. [Testing Guide](#testing-guide)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## Architecture Overview

### 🏗️ System Architecture

```
┌─────────────────┐
│   Guest User    │
└────────┬────────┘
         │
         ├─→ POST /api/bookings
         │   (Creates booking with status='pending_payment')
         │
         ├─→ Database Trigger
         │   (INSERT on bookings table)
         │
         ├─→ Edge Function: send-booking-payment-email
         │   (Sends payment link to guest)
         │
         ├─→ User clicks payment link
         │   (Redirects to /booking/[id]/pay)
         │
         ├─→ POST /api/bookings/[id]/create-payment-intent
         │   (Creates Stripe payment intent)
         │
         ├─→ Stripe Hosted Checkout
         │   (User enters payment details)
         │
         ├─→ Payment Success
         │   (Stripe webhook: payment_intent.succeeded)
         │
         ├─→ POST /api/webhooks/stripe
         │   (Updates booking to status='completed')
         │
         └─→ Edge Function: send-booking-confirmation-email
             (Sends confirmation to user)
```

### 🔄 Data Flow

```
BOOKING CREATION
│
├─ Guest fills form → /reservation/guest
├─ API validates (Zod) → /api/bookings
├─ DB creates booking → bookings table
│  (status: 'pending_payment')
│
PAYMENT EMAIL
├─ Trigger fires (INSERT) → send-booking-payment-email
├─ Extract guest email from metadata
├─ Generate payment link → /booking/[id]/pay
├─ Send via Resend API
│
PAYMENT PROCESSING
├─ User clicks payment link
├─ Page fetches booking data
├─ POST create-payment-intent
├─ Stripe returns client_secret
├─ Load Stripe.js with payment element
├─ User enters card details
├─ Submit payment
│
WEBHOOK PROCESSING
├─ Stripe fires payment_intent.succeeded
├─ POST /api/webhooks/stripe
├─ Verify signature (critical!)
├─ Update booking to 'completed'
├─ Database trigger fires (UPDATE)
├─ Send confirmation email
│
CONFIRMATION
└─ Redirect to /booking/[id]/success
   Display confirmation + next steps
```

---

## Implementation Phases

### ✅ Phase 1: Backend Infrastructure (COMPLETE)

**Files Created/Modified:**

1. **supabase/migrations/20250115_add_payment_fields.sql**
   - Added payment tracking fields to bookings table
   - Created payment_intents table for audit trail
   - Added RLS policies for security

2. **app/api/bookings/route.ts**
   - Modified POST handler to return `status: 'pending_payment'`
   - Generates unique booking_number
   - Stores guest metadata

3. **app/api/bookings/[id]/create-payment-intent/route.ts**
   - Creates Stripe PaymentIntent
   - Returns client_secret for frontend
   - Stores intent_id in bookings table

4. **app/api/webhooks/stripe/route.ts**
   - Verifies Stripe signature (security-critical)
   - Handles payment_intent.succeeded events
   - Handles payment_intent.payment_failed events
   - Updates booking status and calls Edge Functions

5. **lib/types/booking.ts**
   - Centralized booking types
   - Payment status enum
   - API response types

6. **lib/validations/booking.ts**
   - createBookingSchema with guest fields
   - createPaymentIntentSchema
   - Zod validation for all inputs

### ✅ Phase 2: Edge Functions (COMPLETE)

**Files Created/Modified:**

1. **supabase/functions/send-booking-payment-email/index.ts**
   - Exportable handler function
   - Extracts guest email from metadata
   - Generates payment link: `${APP_URL}/booking/${id}/pay`
   - Sends HTML + plain text email via Resend
   - Non-blocking (returns success even if email fails)

2. **supabase/functions/send-booking-payment-email/index.test.ts**
   - 6 comprehensive unit tests
   - Mocks fetch API for Resend calls
   - Tests CORS, validation, error scenarios
   - Ready for `deno test -A --env`

3. **supabase/functions/send-booking-confirmation-email/index.ts**
   - Simplified handler (was 502 lines)
   - Called after payment_intent.succeeded
   - Green theme (vs blue for payment)
   - Displays next steps timeline

4. **deno.json**
   - Defines `deno task dev` for watch mode
   - Defines `deno task test` for unit tests
   - Lint/fmt rules

5. **.env.deno**
   - Local environment template
   - Resend API key
   - Supabase credentials
   - App URL

### ✅ Phase 3: Frontend (COMPLETE)

**Files Created/Modified:**

1. **app/booking/[id]/pay/page.tsx**
   - Server component that loads booking data
   - Renders payment element
   - Handles client-side payment processing
   - Status: Loading → Error → Ready → Processing → Success/Error

2. **app/booking/[id]/success/page.tsx**
   - Success confirmation page
   - Shows booking details
   - Next steps timeline
   - Support contact info

3. **components/booking/guest/steps/summary-step.tsx**
   - Removed inline <StripePayment/> component
   - Added "Confirmer réservation" button
   - Redirects to /booking/[id]/pay after creation
   - Shows loading state while booking is created

4. **components/booking/summary-step.tsx**
   - Same modifications for authenticated users
   - Respects existing flow

---

## File Structure

```
ninoWash/
├── app/
│   ├── api/
│   │   ├── bookings/
│   │   │   ├── route.ts                    # POST /api/bookings
│   │   │   └── [id]/
│   │   │       ├── create-payment-intent/
│   │   │       │   └── route.ts            # POST /api/bookings/[id]/create-payment-intent
│   │   │       └── ...
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts                # POST /api/webhooks/stripe
│   │   └── ...
│   ├── booking/
│   │   ├── [id]/
│   │   │   ├── pay/
│   │   │   │   └── page.tsx                # Payment checkout page
│   │   │   ├── success/
│   │   │   │   └── page.tsx                # Success confirmation
│   │   │   └── ...
│   │   └── ...
│   └── ...
│
├── components/
│   ├── booking/
│   │   ├── guest/
│   │   │   ├── steps/
│   │   │   │   └── summary-step.tsx        # Modified for new flow
│   │   │   └── ...
│   │   ├── summary-step.tsx                # Modified for new flow
│   │   └── ...
│   └── ...
│
├── lib/
│   ├── types/
│   │   └── booking.ts                      # Booking types with payment fields
│   ├── validations/
│   │   └── booking.ts                      # Booking validation schemas
│   ├── stripe.ts                           # Stripe utilities
│   └── ...
│
├── supabase/
│   ├── functions/
│   │   ├── send-booking-payment-email/
│   │   │   ├── index.ts                    # Payment email function
│   │   │   └── index.test.ts               # Unit tests
│   │   ├── send-booking-confirmation-email/
│   │   │   └── index.ts                    # Confirmation email function
│   │   └── ...
│   ├── migrations/
│   │   ├── 20250115_add_payment_fields.sql # Payment schema
│   │   └── ...
│   └── ...
│
├── docs/
│   ├── PAYMENT_SYSTEM_MIGRATION.md         # Architecture & testing
│   ├── EDGE_FUNCTIONS_LOCAL_TESTING.md     # Local dev guide
│   ├── PAYMENT_IMPLEMENTATION_COMPLETE.md  # This file
│   └── ...
│
├── deno.json                               # Deno configuration
├── .env.deno                               # Deno environment template
├── setup-deno-functions.sh                 # Setup script
├── e2e-payment-test.sh                     # E2E test script
└── ...
```

---

## Quick Start

### 1️⃣ Prerequisites

```bash
# Install Deno (if not already installed)
brew install deno

# Verify installation
deno --version
```

### 2️⃣ Setup Environment

```bash
# Run setup script
chmod +x setup-deno-functions.sh
./setup-deno-functions.sh

# Edit .env.deno with your credentials
nano .env.deno
```

Required credentials:
- `RESEND_API_KEY` from https://resend.com
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` from Supabase
- `NEXT_PUBLIC_APP_URL` (your app URL)

### 3️⃣ Run Servers

**Terminal 1: Next.js App**
```bash
pnpm dev
# Runs on http://localhost:3000
```

**Terminal 2: Deno Edge Functions**
```bash
deno task dev
# Or: deno run -A --env --watch supabase/functions/send-booking-payment-email/index.ts
# Runs on http://localhost:8000
```

### 4️⃣ Run Tests

```bash
# Unit tests for Edge Functions
deno test -A --env supabase/functions/**/*.test.ts

# E2E payment flow test
chmod +x e2e-payment-test.sh
./e2e-payment-test.sh
```

---

## Testing Guide

### 🧪 Level 1: Unit Tests (Deno)

Test Edge Functions in isolation with mocked dependencies.

```bash
deno test -A --env supabase/functions/**/*.test.ts
```

**Tests Included:**
- ✅ CORS headers response
- ✅ Invalid payload handling
- ✅ Guest booking email send
- ✅ Missing email validation
- ✅ Missing API key handling
- ✅ Zero amount booking edge case

### 🧪 Level 2: Local Integration (Manual cURL)

Test Edge Functions with real payloads.

```bash
# Terminal 1: Start Deno server
deno task dev

# Terminal 2: Send test payload
curl -X POST http://localhost:8000 \
  -H 'Content-Type: application/json' \
  -d '{
    "type":"INSERT",
    "record":{
      "id":"test-id-123",
      "booking_number":"BK-20250115-0001",
      "total_amount_cents":5000,
      "metadata":{
        "guest_contact":{
          "email":"test@example.com",
          "first_name":"John"
        }
      }
    }
  }'
```

### 🧪 Level 3: End-to-End (Full Flow)

Test complete booking → payment → confirmation flow.

```bash
chmod +x e2e-payment-test.sh
./e2e-payment-test.sh
```

**What it tests:**
1. Creates guest booking via API
2. Verifies booking in pending_payment status
3. Creates payment intent with Stripe
4. Triggers payment email via Edge Function
5. Simulates payment success webhook
6. Verifies booking is completed

### 🧪 Level 4: Manual Stripe Testing

Test with real Stripe test cards.

**Setup:**
1. Get Stripe test keys from dashboard
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   ```

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication: `4000 0025 0000 3155`

**Flow:**
1. Create guest booking at `/reservation/guest`
2. Click payment link in email
3. Enter test card details
4. Verify webhook processes payment
5. Check confirmation email

---

## Deployment

### 🚀 Phase 1: Test Thoroughly

```bash
# 1. Run all unit tests
deno test -A --env supabase/functions/**/*.test.ts

# 2. Run E2E tests
./e2e-payment-test.sh

# 3. Manual testing with Stripe test cards
# (see Testing Guide - Level 4)
```

### 🚀 Phase 2: Deploy Edge Functions

```bash
# Install Supabase CLI if not already
npm install -g supabase

# Login to Supabase
supabase login

# Deploy payment email function
supabase functions deploy send-booking-payment-email --no-verify-jwt

# Deploy confirmation email function
supabase functions deploy send-booking-confirmation-email --no-verify-jwt

# Verify in Supabase dashboard
# Settings → Edge Functions → Check both functions are deployed
```

### 🚀 Phase 3: Configure Database Triggers

In Supabase SQL Editor, create triggers:

```sql
-- Trigger for payment email on booking INSERT
CREATE OR REPLACE FUNCTION trigger_send_payment_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending_payment' THEN
    -- Call Edge Function
    SELECT net.http_post(
      url := current_setting('app.functions_url') || 
             '/functions/v1/send-booking-payment-email',
      body := jsonb_build_object(
        'type', 'INSERT',
        'record', to_jsonb(NEW)
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.functions_key')
      )
    ) INTO NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_payment_email_trigger
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_send_payment_email();

-- Trigger for confirmation email on booking UPDATE
CREATE OR REPLACE FUNCTION trigger_send_confirmation_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Call Edge Function
    SELECT net.http_post(
      url := current_setting('app.functions_url') || 
             '/functions/v1/send-booking-confirmation-email',
      body := jsonb_build_object(
        'bookingId', NEW.id,
        'bookingNumber', NEW.booking_number,
        'email', (NEW.metadata->>'guest_contact'->>'email')::text,
        'totalAmount', NEW.total_amount,
        'paymentIntentId', NEW.stripe_payment_intent_id
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.functions_key')
      )
    ) INTO NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_confirmation_email_trigger
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_send_confirmation_email();
```

### 🚀 Phase 4: Configure Environment Variables

In Supabase Settings → Edge Functions, add:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

And in `.env.production`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

### 🚀 Phase 5: Monitor & Verify

```bash
# Check webhook logs in Stripe dashboard
# Settings → Webhooks → View Events

# Check Edge Function logs in Supabase
# Logs → Functions → send-booking-payment-email

# Check email delivery in Resend dashboard
# Logs → Emails

# Manually test with test Stripe card
# See Testing Guide - Level 4
```

---

## Troubleshooting

### ❌ "Deno not found"

```bash
brew install deno
deno --version
```

### ❌ "Port 8000 already in use"

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
deno run -A --env --watch supabase/functions/send-booking-payment-email/index.ts --port 8001
```

### ❌ "RESEND_API_KEY not set"

```bash
# Check .env.deno exists
ls -la .env.deno

# Verify key is set
cat .env.deno | grep RESEND_API_KEY

# For testing without real emails, use: test_key_dev
```

### ❌ "Payment email not sent"

```bash
# Check Deno server logs (Terminal 2)
# Look for: [PAYMENT_EMAIL] Processing booking...

# Check if .env.deno has RESEND_API_KEY
# Check if guest email is in metadata

# Test manually:
curl -X POST http://localhost:8000 \
  -H 'Content-Type: application/json' \
  -d '{"type":"INSERT","record":{"metadata":{"guest_contact":{"email":"test@example.com"}}}}'
```

### ❌ "Webhook signature verification failed"

```bash
# In .env.local, ensure STRIPE_WEBHOOK_SECRET is correct
# Get from: Stripe Dashboard → Developers → Webhooks → Signing Secret

# For testing locally with Stripe CLI:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the signing secret and set in .env.local
```

### ❌ "Booking stuck in pending_payment"

```bash
# Check if webhook was received
# Stripe Dashboard → Developers → Events → Check payment_intent.succeeded

# Check webhook handler logs in Next.js terminal
# Look for: [webhooks/stripe] Processing event...

# Manual test:
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H 'Content-Type: application/json' \
  -H 'Stripe-Signature: test_signature' \
  -d '{"type":"payment_intent.succeeded","data":{"object":{"id":"pi_test","metadata":{"booking_id":"YOUR_BOOKING_ID"}}}}'
```

### ❌ "TypeScript errors in test files"

This is expected! Test files use Deno syntax (`Deno.test`, `import.meta`, etc.) which Next.js TypeScript doesn't recognize.

```bash
# Tests run fine under Deno
deno test -A --env supabase/functions/**/*.test.ts

# Next.js build ignores test files (excluded in tsconfig.json)
pnpm build  # Should succeed with zero errors
```

---

## API Reference

### POST /api/bookings

Create a new guest or authenticated booking.

**Request:**
```json
{
  "service_type": "wash_and_press",
  "weight_kg": 5.0,
  "pickup_date": "2025-01-25",
  "pickup_time": "09:00",
  "delivery_date": "2025-01-27",
  "delivery_time": "18:00",
  
  // For guest bookings
  "guestContact": {
    "email": "guest@example.com",
    "first_name": "Jean",
    "last_name": "Dupont",
    "phone": "+33612345678"
  },
  "guestPickupAddress": {
    "street": "123 Rue de Test",
    "city": "Paris",
    "zip": "75001",
    "country": "FR"
  },
  "guestDeliveryAddress": {
    "street": "456 Avenue de Test",
    "city": "Paris",
    "zip": "75002",
    "country": "FR"
  }
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "uuid",
    "booking_number": "BK-20250115-0001",
    "status": "pending_payment",
    "total_amount": "50.00",
    "total_amount_cents": 5000,
    "user_id": null,
    "metadata": {
      "guest_contact": {...}
    }
  }
}
```

### POST /api/bookings/[id]/create-payment-intent

Create a Stripe PaymentIntent for checkout.

**Request:**
```json
{}
```

**Response (200 OK):**
```json
{
  "client_secret": "pi_xxx_secret_yyy",
  "publishable_key": "pk_test_xxx"
}
```

### POST /api/webhooks/stripe

Handle Stripe webhook events (signature-verified).

**Expected Events:**
- `payment_intent.succeeded` - Updates booking to `completed`
- `payment_intent.payment_failed` - Updates booking to `payment_failed`

**Request (auto-verified by Stripe):**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "status": "succeeded",
      "metadata": {
        "booking_id": "uuid"
      }
    }
  }
}
```

**Response (200 OK):**
```json
{
  "received": true
}
```

### Edge Function: send-booking-payment-email

Sends payment link to guest when booking is created.

**Trigger:** Database INSERT on `bookings` table with `status='pending_payment'`

**Payload:**
```json
{
  "type": "INSERT",
  "record": {
    "id": "uuid",
    "booking_number": "BK-20250115-0001",
    "total_amount_cents": 5000,
    "metadata": {
      "guest_contact": {
        "email": "guest@example.com",
        "first_name": "Jean",
        "last_name": "Dupont"
      }
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "messageId": "uuid",
  "email": "guest@example.com"
}
```

### Edge Function: send-booking-confirmation-email

Sends confirmation when payment succeeds.

**Trigger:** Webhook handler after `payment_intent.succeeded`

**Payload:**
```json
{
  "bookingId": "uuid",
  "bookingNumber": "BK-20250115-0001",
  "email": "guest@example.com",
  "totalAmount": "50.00",
  "paymentIntentId": "pi_xxx"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "email": "guest@example.com"
}
```

---

## 📊 Status Summary

| Component | Status | Location |
|-----------|--------|----------|
| Backend API Routes | ✅ Complete | `app/api/bookings/*` |
| Database Migration | ✅ Complete | `supabase/migrations/*` |
| Edge Functions | ✅ Complete | `supabase/functions/*` |
| Frontend Pages | ✅ Complete | `app/booking/[id]/*` |
| Validation Schemas | ✅ Complete | `lib/validations/booking.ts` |
| Type Definitions | ✅ Complete | `lib/types/booking.ts` |
| Unit Tests | ✅ Complete | `supabase/functions/**/*.test.ts` |
| Documentation | ✅ Complete | `docs/*` |
| Local Setup | ✅ Complete | `setup-deno-functions.sh` |
| E2E Tests | ✅ Complete | `e2e-payment-test.sh` |
| Deno Config | ✅ Complete | `deno.json` |

---

## 📞 Support

For issues or questions:

1. Check **Troubleshooting** section above
2. Review **PAYMENT_SYSTEM_MIGRATION.md** for architecture details
3. Check **EDGE_FUNCTIONS_LOCAL_TESTING.md** for local dev issues
4. Review logs in respective terminals:
   - Next.js terminal for API routes
   - Deno terminal for Edge Functions
   - Stripe dashboard for webhook events
   - Resend dashboard for email delivery

---

**Last Updated**: January 2025  
**Status**: Production Ready ✅  
**Version**: 1.0.0
