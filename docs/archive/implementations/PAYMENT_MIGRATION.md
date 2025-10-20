# Payment System Migration - Complete Documentation

**Status**: PHASE 1 ✅ + PHASE 3 ✅ | PHASE 2 (In Progress)

## Overview

Complete migration from inline Stripe checkout to asynchronous email-based payment links.

**Key Benefits:**
- Reduced friction for guest bookings (confirm first, pay later)
- Better user experience with dedicated payment page
- Email confirmation trail for accountability
- Flexible payment timing (48-hour window)
- Easier to add payment retry logic later

## Architecture

### Before (Old System)
```
Booking Summary → Inline Stripe Payment Form
                           ↓
                  Payment processed immediately
                           ↓
                   Booking confirmed
                           ↓
                 Redirect to success page
```

### After (New System)
```
Booking Summary → Click "Confirmer ma réservation"
                           ↓
              API creates booking (status='pending_payment')
                           ↓
         Email sent with /booking/[id]/pay link
                           ↓
      User visits /booking/[id]/pay page
                           ↓
          Clicks "Payer maintenant" button
                           ↓
         Creates Stripe Checkout Session
                           ↓
      Redirects to Stripe Hosted Checkout
                           ↓
                 User completes payment
                           ↓
           Stripe webhook: payment_intent.succeeded
                           ↓
       Updates booking: status='confirmed'
                           ↓
      Confirmation email sent to customer
                           ↓
       Redirects to /booking/[id]/success
```

## Database Schema Changes

### New Columns on `bookings` Table

```sql
ALTER TABLE bookings ADD COLUMN
  payment_status VARCHAR(50) DEFAULT 'pending',        -- pending|succeeded|failed
  payment_intent_id TEXT,                              -- Stripe Payment Intent ID
  stripe_session_id TEXT,                              -- Stripe Checkout Session ID
  paid_at TIMESTAMPTZ,                                 -- When payment confirmed
  total_amount_cents INTEGER;                          -- Amount in cents
```

**Indices created:**
```sql
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_stripe_session_id ON bookings(stripe_session_id);
CREATE INDEX idx_bookings_payment_intent_id ON bookings(payment_intent_id);
```

## API Routes

### 1. POST /api/bookings (Modified)

**Before:**
- Created booking with status='confirmed'
- Immediately created Stripe Payment Intent
- Blocked until payment completed

**After:**
- Creates booking with status='pending_payment'
- Sets payment_status='pending'
- Returns immediately with booking ID
- No payment processing here

**Request Body:**
```json
{
  "guestContact": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "0123456789"
  },
  "guestPickupAddress": {...},
  "guestDeliveryAddress": {...},
  "items": [
    {
      "serviceId": "uuid",
      "quantity": 5,
      "specialInstructions": "Optional"
    }
  ],
  "pickupDate": "2025-10-25",
  "pickupTimeSlot": "09:00-12:00"
}
```

**Response:**
```json
{
  "id": "booking-uuid",
  "booking_number": "BK-20251017-XXXXXX",
  "status": "pending_payment",
  "payment_status": "pending",
  "total_amount_cents": 5000
}
```

### 2. POST /api/bookings/[id]/create-payment-intent (New)

**Purpose:** Create Stripe Checkout Session on-demand

**Called From:** `/booking/[id]/pay` page button click

**Flow:**
1. Fetch booking from database
2. Verify status='pending_payment'
3. Build line items from booking_items
4. Create Stripe Checkout Session
5. Store stripe_session_id in database
6. Return checkoutUrl

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_...",
  "sessionId": "cs_..."
}
```

**Key Metadata:**
```typescript
metadata: {
  booking_id: bookingId,      // Link to database booking
  guest: booking.user_id ? "false" : "true"
}
```

### 3. POST /api/webhooks/stripe (Modified)

**New Handlers:**

#### payment_intent.succeeded
```typescript
case "payment_intent.succeeded": {
  const bookingId = paymentIntent.metadata.booking_id
  
  // Update booking
  await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "succeeded",
      paid_at: new Date().toISOString(),
      payment_intent_id: paymentIntent.id
    })
    .eq("id", bookingId)
  
  // TODO: Call Edge Function to send confirmation email
}
```

#### payment_intent.payment_failed
```typescript
case "payment_intent.payment_failed": {
  const bookingId = paymentIntent.metadata.booking_id
  
  // Update booking
  await supabase
    .from("bookings")
    .update({
      payment_status: "failed",
      payment_intent_id: paymentIntent.id
    })
    .eq("id", bookingId)
  
  // TODO: Call Edge Function to send retry email
}
```

## Frontend Pages

### /booking/[id]/pay (New)

**Type:** Server Component (async)

**Shows:**
- Booking recap with addresses, services, dates
- Total amount due
- Payment method information
- "Payer maintenant" button

**Flow:**
1. Fetch booking details
2. Verify status='pending_payment'
3. Display recap
4. On button click → POST /api/bookings/[id]/create-payment-intent
5. Redirect to Stripe Hosted Checkout

**Features:**
- Shows loading state during session creation
- Handles errors (booking not found, already paid, etc.)
- Redirects to success page if already paid
- Responsive design for mobile/desktop

### /booking/[id]/success (New)

**Type:** Server Component (async)

**Shows:**
- Confirmation badge with booking number
- Payment confirmation status
- Booking details (addresses, dates, amount)
- 4-step timeline (Payment → Collection → Cleaning → Delivery)
- Links to dashboard and home page

**Flow:**
1. Fetch booking details
2. Verify session_id matches (security)
3. Display confirmation

**Features:**
- Shows "Payment confirmed" status
- Clear next steps for customer
- Next steps card explains the process

## Components Changes

### SummaryStep (Guest) - Modified

**Removed:**
- `<StripePayment/>` component
- Inline payment form
- showPayment state

**Added:**
- "Confirmer ma réservation" button
- Booking creation logic
- Error handling card
- Info card explaining 4-step flow

**New Logic:**
```typescript
async function handleConfirmBooking() {
  // 1. Validate all data
  // 2. Prepare booking payload
  // 3. Validate with Zod schema
  // 4. POST /api/bookings
  // 5. Toast: "Réservation créée ! Un email de paiement a été envoyé."
  // 6. Redirect to /booking/[id]/pay
}
```

### SummaryStep (Authenticated) - Modified

**Changes:**
- Redirects to `/booking/[id]/pay` instead of `/reservation/success`
- Same flow as guest bookings
- Consistent user experience

## Validation Schemas

### createBookingSchema (lib/validations/booking.ts)

Used to validate booking payload before API submission.

```typescript
export const createBookingSchema = z
  .object({
    // Addresses (for authenticated users)
    pickupAddressId: z.string().uuid().optional(),
    deliveryAddressId: z.string().uuid().optional(),
    
    // Addresses (for guest bookings)
    guestPickupAddress: guestAddressSchema.optional(),
    guestDeliveryAddress: guestAddressSchema.optional(),
    guestContact: guestContactSchema.optional(),
    
    // Items & scheduling
    items: z.array(bookingItemSchema).min(1),
    pickupDate: z.string().optional(),
    pickupTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"]).optional(),
    pickupSlotId: z.string().uuid().optional(),
    deliverySlotId: z.string().uuid().optional(),
    
    // Optional
    specialInstructions: z.string().optional(),
    subscriptionId: z.string().uuid().optional(),
  })
```

### createPaymentIntentSchema (New)

```typescript
export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid("ID de réservation invalide"),
})
```

## Types

### Booking Type (lib/types/booking.ts)

```typescript
export type PaymentStatus = "pending" | "succeeded" | "failed"
export type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "completed"

export interface Booking {
  id: string
  booking_number: string
  status: BookingStatus
  payment_status: PaymentStatus
  
  // Payment tracking
  payment_intent_id: string | null
  stripe_session_id: string | null
  paid_at: string | null
  total_amount_cents: number
  
  // ... other fields
}
```

## Email System (PHASE 2)

### Two Email Edge Functions

#### send-booking-payment-email
- **Triggered:** On booking INSERT with status='pending_payment'
- **Recipient:** Guest email or authenticated user email
- **Content:**
  - Booking recap with total amount
  - Payment link: `/booking/[id]/pay`
  - Security info (Stripe payment, link valid 48h)
  - Support contact

#### send-booking-confirmation-email
- **Triggered:** By webhook after payment_intent.succeeded
- **Recipient:** Customer email
- **Content:**
  - Confirmation with booking number
  - 4-step timeline of service
  - Dashboard link for tracking
  - Support contact

### Deployment

See [EDGE_FUNCTIONS_SETUP.md](./EDGE_FUNCTIONS_SETUP.md) for detailed setup instructions.

## Error Handling

### Booking Creation Errors

| Error | Handling | User Message |
|-------|----------|-------------|
| Missing contact info | Return 400 | "Données de réservation incomplètes" |
| Invalid email | Return 400 | "Email invalide" |
| No services selected | Return 400 | "Aucun service sélectionné" |
| Validation error | Return 400 | Zod error messages |

### Payment Creation Errors

| Error | Handling | User Message |
|-------|----------|-------------|
| Booking not found | Return 404 | "Réservation introuvable" |
| Not pending_payment | Return 400 | "Cette réservation n'est pas en attente de paiement" |
| Already paid | Return 400 | "Cette réservation a déjà été payée" |
| Stripe error | Return 500 | "Erreur lors de la création de la session de paiement" |

### Webhook Errors

| Event | Error | Handling |
|-------|-------|----------|
| payment_intent.succeeded | Booking not found | Log + continue (eventual consistency) |
| payment_intent.succeeded | Update fails | Log + retry via webhook replay |
| payment_intent.payment_failed | Email fails | Log (don't block confirmation) |

## Testing Checklist

### Guest Booking Flow
- [ ] Create guest booking via `/reservation/guest`
- [ ] Fill all details and click "Confirmer ma réservation"
- [ ] Verify booking created with status='pending_payment'
- [ ] Receive email with payment link
- [ ] Click link → Redirected to `/booking/[id]/pay`
- [ ] See full recap with correct addresses, services, dates
- [ ] Click "Payer maintenant" → Redirected to Stripe
- [ ] Complete Stripe payment with test card `4242 4242 4242 4242`
- [ ] Webhook fires → booking.status='confirmed'
- [ ] Redirected to `/booking/[id]/success`
- [ ] See confirmation message with booking number
- [ ] Receive confirmation email

### Authenticated Booking Flow
- [ ] Sign in
- [ ] Create booking via `/reservation`
- [ ] Fill all details and click button
- [ ] Same flow as guest booking (steps above)

### Error Cases
- [ ] Booking not found → Show 404
- [ ] Already paid → Redirect to success
- [ ] Expired session → Show error message
- [ ] Payment failed → Show error + retry link
- [ ] Network error → Graceful fallback

## Migration Path

### Phase 1: Backend ✅
- Database migrations
- API routes (booking creation, payment intent creation)
- Webhook handlers
- Validation schemas
- Type definitions

### Phase 2: Email (In Progress)
- Edge Functions for email sending
- Database triggers setup
- Resend API integration
- Email templates

### Phase 3: Frontend ✅
- Summary step components (guest + authenticated)
- Payment page (/booking/[id]/pay)
- Success page (/booking/[id]/success)
- Error handling

### Phase 4: Testing
- Unit tests for validation schemas
- Integration tests for API routes
- E2E tests for complete flows
- Manual testing with Stripe test cards

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email Service
RESEND_API_KEY=

# Application URLs
NEXT_PUBLIC_APP_URL=https://app.ninowash.com
NEXT_PUBLIC_ADMIN_URL=https://gestion.ninowash.com
```

## Monitoring & Maintenance

### Key Metrics to Track

- Booking creation success rate
- Payment intent creation success rate
- Stripe webhook success rate
- Email delivery rate
- Payment success rate
- Avg time from booking creation to payment

### Common Issues

1. **Email not sent**
   - Check RESEND_API_KEY configured
   - Check Edge Function logs
   - Verify sender domain whitelisted

2. **Webhook not firing**
   - Check webhook signature verification
   - Verify booking has correct metadata
   - Check Stripe webhook settings

3. **Payment session expired**
   - User has 24-hour window to pay
   - Stripe session valid for 24 hours
   - Consider adding retry email after 12 hours

## Future Enhancements

- [ ] Payment retry emails (after 12 hours)
- [ ] Multiple payment methods (bank transfer, etc.)
- [ ] Partial payment support
- [ ] Payment schedule for large orders
- [ ] Guest booking email verification
- [ ] SMS notifications
- [ ] Payment analytics dashboard
