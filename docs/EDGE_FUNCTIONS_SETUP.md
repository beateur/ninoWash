# Edge Functions & Database Triggers Setup

This document explains how to set up the email Edge Functions and database triggers for the async payment system.

## Overview

Two Edge Functions handle email notifications:

1. **send-booking-payment-email** - Sends payment link email when booking created
2. **send-booking-confirmation-email** - Sends confirmation email after successful payment

## Prerequisites

- Supabase project with Edge Functions enabled
- RESEND_API_KEY configured in Supabase environment variables
- Next.js app deployed with payment pages (/booking/[id]/pay, /booking/[id]/success)

## Step 1: Deploy Edge Functions

### Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Deploy functions
supabase functions deploy send-booking-payment-email
supabase functions deploy send-booking-confirmation-email
```

### Using Supabase Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function"
3. Name: `send-booking-payment-email`
4. Copy content from `supabase/functions/send-booking-payment-email/index.ts`
5. Deploy
6. Repeat for `send-booking-confirmation-email`

## Step 2: Configure Environment Variables

In Supabase project settings → Edge Functions → Secrets:

```
RESEND_API_KEY = your-resend-api-key-here
NEXT_PUBLIC_APP_URL = https://app.ninowash.com (or your app URL)
```

## Step 3: Create Database Triggers

The email triggers need to be set up in Supabase SQL Editor.

### Trigger 1: Send Payment Email on Booking Creation

```sql
-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS booking_created_send_payment_email ON bookings;
DROP FUNCTION IF EXISTS public.handle_booking_created();

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_booking_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function to send payment email
  SELECT
    net.http_post(
      url := 'https://{project-id}.functions.supabase.co/functions/v1/send-booking-payment-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer {service-role-key}'
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'record', row_to_json(NEW)
      )
    ) as request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new pending_payment bookings
CREATE TRIGGER booking_created_send_payment_email
AFTER INSERT ON bookings
FOR EACH ROW
WHEN (NEW.status = 'pending_payment')
EXECUTE FUNCTION public.handle_booking_created();
```

### Trigger 2: Send Confirmation Email After Webhook

The confirmation email is sent directly from the webhook handler in `/api/webhooks/stripe` - no database trigger needed.

In the webhook at line ~290:
```typescript
case "payment_intent.succeeded": {
  // After updating booking to 'confirmed':
  
  // Call Edge Function to send confirmation email
  await fetch(
    `${process.env.SUPABASE_URL}/functions/v1/send-booking-confirmation-email`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        email: customerEmail,
        totalAmount: (booking.total_amount_cents / 100).toFixed(2),
        paymentIntentId: paymentIntent.id,
      }),
    }
  )
}
```

## Step 4: Set Environment Variables in Webhook

Update `/app/api/webhooks/stripe/route.ts` to add the confirmation email call:

```typescript
import { NextRequest, NextResponse } from "next/server"

async function sendConfirmationEmail(bookingId: string, email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-booking-confirmation-email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          bookingNumber: booking.booking_number,
          email,
          totalAmount: (booking.total_amount_cents / 100).toFixed(2),
          paymentIntentId: paymentIntent.id,
        }),
      }
    )

    if (!response.ok) {
      console.warn(`[v0] Failed to send confirmation email: ${response.statusText}`)
    }
  } catch (error) {
    console.error('[v0] Error sending confirmation email:', error)
  }
}
```

## Step 5: Test the Setup

### Test Trigger 1: Payment Email

```bash
# Create a test booking via API
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "guestContact": {
      "first_name": "Test",
      "last_name": "User",
      "email": "test@example.com",
      "phone": "0123456789"
    },
    "guestPickupAddress": {
      "street_address": "123 Main St",
      "city": "Paris",
      "postal_code": "75001",
      "label": "Home"
    },
    "guestDeliveryAddress": {
      "street_address": "123 Main St",
      "city": "Paris",
      "postal_code": "75001",
      "label": "Home"
    },
    "items": [
      {
        "serviceId": "{service-id}",
        "quantity": 5,
        "specialInstructions": "Handle with care"
      }
    ],
    "pickupDate": "2025-10-25",
    "pickupTimeSlot": "09:00-12:00"
  }'

# Check Supabase logs for Edge Function execution
# Go to Supabase Dashboard → Edge Functions → Logs
```

### Test Trigger 2: Confirmation Email

```bash
# Simulate Stripe webhook
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "stripe-signature: $(stripe_signature)" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_123",
        "status": "succeeded",
        "metadata": {
          "booking_id": "{booking-id}",
          "guest": "true"
        }
      }
    }
  }'

# Check Supabase Edge Function logs
```

## Environment Variables Checklist

- [ ] `RESEND_API_KEY` configured in Supabase
- [ ] `NEXT_PUBLIC_APP_URL` set to correct domain
- [ ] `SUPABASE_URL` available in API routes
- [ ] `SUPABASE_SERVICE_ROLE_KEY` available in API routes
- [ ] `STRIPE_WEBHOOK_SECRET` configured for local testing
- [ ] Webhook calls to Edge Functions properly authenticated

## Troubleshooting

### Edge Function returns 401 Unauthorized

- Check service role key is correct in Authorization header
- Verify key is in `SUPABASE_SERVICE_ROLE_KEY` format
- Ensure Edge Function has permission to read `bookings` table

### Emails not being sent

- Check RESEND_API_KEY is valid and not expired
- Verify Resend API allows sending from `paiement@ninowash.com` domain
- Check Supabase Edge Function logs for specific errors
- Test Resend API directly: `curl -X POST https://api.resend.com/emails...`

### Trigger not firing

- Verify trigger is created in SQL: `SELECT * FROM pg_trigger WHERE tgname LIKE '%booking%'`
- Check booking has `status = 'pending_payment'` when inserted
- Verify Edge Function URL is correct
- Check Supabase firewall rules allow outbound HTTP calls

## Email Template Notes

### send-booking-payment-email

- Sent immediately when booking created
- Contains unique `/booking/[id]/pay` link
- Valid for 48 hours
- Includes booking number and amount
- Plain text + HTML versions

### send-booking-confirmation-email

- Sent after payment confirmed by webhook
- Includes 4-step timeline of service
- Links to dashboard for booking tracking
- Payment receipt information

## Deployment Checklist

- [ ] Edge Functions deployed to production
- [ ] RESEND_API_KEY configured
- [ ] Database triggers created
- [ ] Webhook updated with confirmation email call
- [ ] Environment variables set on production server
- [ ] Email domain verified in Resend
- [ ] Test bookings created and emails received
- [ ] Error handling in place for failed emails
- [ ] Logs monitored for issues

## References

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend API](https://resend.com/docs)
- [Supabase Database Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
