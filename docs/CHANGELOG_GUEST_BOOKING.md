# Changelog: Guest Booking Flow

All notable changes to the Guest Booking Flow feature will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Phase 2 Day 1-2] - 2025-01-13 ✅ COMPLETED

### ✅ Added - Stripe Payment Integration (496 lines)

#### Payment Intent API (`create-payment-intent/route.ts` - 157 lines)
- **POST endpoint**: `/api/bookings/guest/create-payment-intent`
- **Zod validation**: Contact, services, addresses, datetime
- **Amount calculation**: `sum(quantity × basePrice)` → cents for Stripe
- **Stripe Payment Intent**: 
  - Currency: EUR
  - Automatic payment methods enabled
  - Metadata storage: Full booking data (guest info, services, addresses, dates)
  - Return: `clientSecret` to frontend
- **Error handling**: StripeCardError, StripeInvalidRequestError, generic errors
- **Security**: Server-only STRIPE_SECRET_KEY usage
- **Logging**: `[v0]` prefix for debugging

#### Stripe Payment Component (`stripe-payment.tsx` - 295 lines)
- **StripePayment wrapper**: 
  - loadStripe with `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Elements wrapper with French locale (`locale: "fr"`)
  - Auto-create Payment Intent on mount
  - Loading state (Loader2 spinner)
  
- **PaymentForm component**:
  - Stripe Elements integration (PaymentElement)
  - `stripe.confirmPayment()` with `redirect: "if_required"`
  - Success callback: `onSuccess(paymentIntentId)`
  - Error callback: `onError(errorMessage)`
  - Processing state (button disabled during payment)
  
- **UX Features**:
  - French error messages
  - Loading states (intent creation + payment processing)
  - Icons: CreditCard, Lock (security)
  - Toast notifications integration

#### Summary Step Integration (`summary-step.tsx` - +42 lines)
- **Service fetch**: useEffect to fetch full service details from Supabase
  - Extract serviceIds from `bookingData.items`
  - Query: `supabase.from("services").select("id, name, base_price").in("id", serviceIds)`
  - Store in local state: `services: Array<{id, name, base_price}>`
  
- **Data transformation**: GuestBookingState → StripePaymentProps format
  - Contact: `firstName + lastName` → `fullName`
  - Addresses: Map `pickupAddress` + `deliveryAddress`
  - Items: Pass through
  - Services: Enriched from Supabase fetch
  
- **Loading state**: Button disabled during service fetch
  - Loader2 spinner + "Chargement..." text
  - Stripe Elements rendered only when `!loadingServices`
  
- **Payment flow**:
  - `showPayment = false` → Button "Procéder au paiement"
  - `showPayment = true` → Stripe Elements modal
  - `onSuccess` → Call `onComplete()` (next step)
  - `onError` → Show error + reset to button

#### Stripe API Version Fix
- **Updated**: `lib/stripe.ts` → `apiVersion: "2025-09-30.clover"`
- **Updated**: `lib/stripe/config.ts` → `apiVersion: "2025-09-30.clover"`
- **Fixed**: TypeScript error (old version not assignable)

### 🐛 Fixed
- **TypeScript Error**: "Property 'services' missing in GuestBookingState"
  - **Root Cause**: StripePayment expects `services: Array<{id, name, base_price}>` but GuestBookingState only has `items: Array<{serviceId, quantity}>`
  - **Solution**: Fetch services from Supabase in Summary Step, transform data format
  
- **Stripe API Version Error**: "2024-12-18.acacia" not assignable to "2025-09-30.clover"
  - **Solution**: Updated both `lib/stripe.ts` and `lib/stripe/config.ts`

### 📝 Documentation
- **Created**: `PHASE2_DAY1-2_COMPLETION.md` (comprehensive Phase 2 Day 1-2 summary)
  - Technical implementation details
  - API documentation
  - Test scenarios (manual + curl)
  - Security guidelines
  - Known bugs & limitations
  - Next steps roadmap

### 🎯 Progress
- **Phase 2 Completion**: 60% (Day 1-2 done)
- **Remaining**:
  - Day 3-4: Backend orchestration API + retry logic + SQL migration
  - Day 5: Success page + email templates

---

## [Phase 1 Day 5] - 2025-01-12 ✅ COMPLETED

### ✅ Added - Polish & Testing (624 lines)

#### Loading Skeletons (`service-card-skeleton.tsx` - 78 lines)
- **ServiceCardSkeleton**: Individual service card skeleton
  - Mimics real card structure (header, description, price, quantity buttons)
  - Shimmer animation using Shadcn Skeleton component
  
- **ServicesSkeleton**: Full page skeleton (4 cards grid)
  - Header skeleton
  - Instructions skeleton
  - 4 service card skeletons (2x2 grid on desktop, 1 col mobile)
  - Bottom bar skeleton (total amount placeholder)

#### Error Boundaries (`error-boundary.tsx` - 146 lines)
- **GuestBookingErrorBoundary**: React Error Boundary class component
  - Catches errors in guest booking steps
  - User-friendly error UI (AlertTriangle icon, message, actions)
  - Retry button: Reloads window
  - Home button: Redirects to `/`
  - Contact email: Support link
  
- **handleSupabaseError()**: Error parser utility
  - Parses Supabase errors → French messages
  - Error types handled:
    - Network errors: "Problème de connexion"
    - Auth/JWT errors: "Session expirée"
    - Permission errors: "Accès refusé"
    - Database errors (PGRST codes): "Erreur serveur"
  - Fallback: Generic error message

#### Mobile Testing Guide (`MOBILE_TESTING_GUIDE.md` - 400+ lines)
- **Test Devices**:
  - iOS: iPhone 14 Pro Max, 14 Pro, SE, iPad Pro, iPad Air
  - Android: Galaxy S23, Pixel 7, Galaxy A54, OnePlus 11
  
- **Test Checklist** (60+ test points):
  - Layout: Responsive, scroll, safe areas
  - Interactions: Touch targets, gestures, keyboard
  - Validation: Error messages, toast notifications
  - Navigation: Stepper, buttons, back button (Android)
  - Persistance: SessionStorage, page reload
  - Performance: Lighthouse, Core Web Vitals
  
- **iOS-specific tests**: Safari quirks, gestures, input zoom
- **Android-specific tests**: Keyboard viewport, back button, touch ripple
- **Tools**: Chrome DevTools, Safari iOS Simulator, ngrok, Lighthouse CLI
- **Templates**: Test results, issues found, fixes applied

### 🔧 Modified
- **guest-booking-container.tsx**: Wrapped all 5 steps in `<GuestBookingErrorBoundary>`
- **services-step.tsx**: 
  - Replaced Loader2 spinner with `<ServicesSkeleton />`
  - Added `handleSupabaseError()` for Supabase fetch failures
  - Toast notifications for errors

### 📝 Commit
- **Hash**: 7ad7031
- **Files**: 5 changed, 597 insertions, 57 deletions

---

## [Phase 1 Day 3-4] - 2025-01-10

### ✅ Added - Steps 1-4 Complete (1057 lines)

#### Step 1: Addresses (`addresses-step.tsx` - 356 lines)
- **Pickup address form**: Full React Hook Form with Zod validation
- **Delivery address form**: Conditional rendering based on checkbox
- **Checkbox**: "Utiliser la même adresse pour la livraison"
- **Validation**: Paris postal code (regex `/^75[0-9]{3}$/`)
- **Optional fields**: Building info, access instructions
- **Error handling**: Real-time validation with error messages
- **Notifications**: Toast feedback for user actions

#### Step 2: Services Selection (`services-step.tsx` - 221 lines)
- **Service fetch**: From Supabase `services` table
- **Filtering**: Exclude subscriptions (category !includes 'abonnement')
- **Quantity selector**: 0-50 per service, +/- buttons
- **Real-time total**: Σ (quantity × base_price)
- **Special instructions**: Textarea with 500 chars limit
- **Summary bar**: Total amount display (€)
- **Responsive design**: 1 col mobile, 2 cols desktop

#### Step 3: Date & Time (`datetime-step.tsx` - 213 lines)
- **Calendar**: React Day Picker with French locale (date-fns)
- **Time slots**: 3 options (morning, afternoon, evening)
- **Validation rules**:
  - Disable past dates
  - Disable Sundays
  - Minimum booking: tomorrow (J+1)
- **Delivery estimate**: Pickup date + 72h (3 days)
- **Summary card**: Formatted dates in French

#### Step 4: Summary & Payment Preview (`summary-step.tsx` - 267 lines)
- **Contact display**: Name, email, phone
- **Addresses display**: Pickup + delivery (with "same address" badge)
- **Services list**: All selected items with quantities
- **Date/Time display**: Pickup + delivery estimate
- **Total amount**: Large display with itemized breakdown
- **Stripe payment**: ✅ **INTEGRATED** in Phase 2 Day 1-2
- **Dev-only test button**: Simulates completion for testing

\`\`\`

#### Container Integration (`guest-booking-container.tsx`)
- **Step imports**: All 5 components imported
- **Type imports**: `GuestAddress`, `GuestBookingItem`
- **State callbacks**: Connected `updateAddresses()`, `updateServices()`, `updateDateTime()`
- **Type safety**: Explicit type annotations for handlers

### 🔧 Fixed - TypeScript Strict Mode Errors (10 files)

#### Existing Components Fixed
1. **`app/api/admin/stats/route.ts`**: Added types to reduce callback
2. **`app/api/subscriptions/sync/route.ts`**: Cast Stripe subscription properties
3. **`components/booking/datetime-step.tsx`**: Cast Calendar props
4. **`components/forms/address-form.tsx`**: Renamed fields to match schema
   - `apartment` → `buildingInfo`
   - `deliveryInstructions` → `accessInstructions`
   - Removed `accessCode`
5. **`components/forms/auth-form.tsx`**: Cast conditional form errors
6. **`components/theme-provider.tsx`**: Added `children` prop type
7. **`components/ui/breadcrumb.tsx`**: Cast props for Slot compatibility
8. **`components/ui/button.tsx`**: Cast props for Slot compatibility
9. **`components/ui/sidebar.tsx`**: Auto-fixed 7 occurrences of `{...props}`
10. **`lib/monitoring.ts`**: Cast `window.gtag` for Google Analytics

#### Build Status
- **Before**: 10 TypeScript errors blocking build
- **After**: ✅ **`pnpm build` passes successfully**
- **Next.js**: 14.2.16
- **TypeScript**: 5.x strict mode

### 📊 Progress Update

**Phase 1 Status**: **95% Complete**
- ✅ Day 1-2: Foundation + Step 0 (40%)
- ✅ Day 3-4: Steps 1-4 (55%)
- ⏳ Day 5: Polish + tests (pending)

**Project Overall**: **~25%** (Phase 1: 95/100, Phases 2-4: pending)

### 🎯 Technical Highlights

**State Management**:
- SessionStorage persistence (24h expiry)
- Type-safe updates with Zod validation
- All steps use `useGuestBooking()` hook

**Validation**:
- Frontend: Zod schemas
- Paris postal: `/^75[0-9]{3}$/`
- Service quantities: 0-50 range
- Required: Contact + pickup address + min 1 service + date/time

**UI/UX**:
- Consistent design with Step 0
- Loading states (services fetch)
- Error handling with Toast
- Responsive layout (mobile-first)
- French locale for dates

**Performance**:
- Client-side Supabase fetch (cached)
- Real-time calculations (no API calls)
- Optimistic UI updates

### 📝 Related PRD
- **PRD**: `docs/PRD/PRD_GUEST_BOOKING_FLOW.md` (Section 4.2 - Day 3-4)

### 🚀 Next Steps: Phase 2 - Stripe Payment (Week 2)

**Day 1-2: Stripe Integration**
- [ ] Install Stripe packages
- [ ] Create Payment Intent API route
- [ ] Replace placeholder button with Stripe Elements
- [ ] Test with Stripe test cards

**Day 3-4: Backend Orchestration**
- [ ] Implement `/api/bookings/guest` route (3-step flow)
- [ ] Add retry logic (3 retries + exponential backoff)
- [ ] Database logging (failed operations tables)

---

## [Phase 1 Day 1-2] - 2025-01-09

### ✅ Added - Foundation Complete (11 files, 1073 lines)

#### Step 0: Contact Form (`contact-step.tsx` - 179 lines)
- **Fields**: Full name, email, phone, RGPD consent
- **Validation**: Zod schema with email format check
- **Email verification API**: Check if email already exists
- **Error handling**: Toast notifications with retry logic
- **Accessibility**: ARIA labels, keyboard navigation

#### State Management (`use-guest-booking.ts` - 215 lines)
- **Hook**: `useGuestBooking()` with SessionStorage persistence
- **Methods**:
  - `updateContact()`: Save contact info
  - `updateAddresses()`: Save pickup + delivery addresses
  - `updateServices()`: Save selected services
  - `updateDateTime()`: Save booking date/time
  - `updatePayment()`: Save Stripe payment ID (Phase 2)
  - `goToStep()`: Navigate between steps
  - `reset()`: Clear all booking data
- **Expiry**: 24h automatic cleanup
- **Type safety**: TypeScript interfaces for all states

#### Validation Schemas (2 files, 201 lines)
- **`guest-contact.ts`** (89 lines): Contact form validation
  - Email format + regex
  - Phone format (French 06/07)
  - RGPD consent required
- **`guest-booking.ts`** (112 lines): Full booking validation
  - Address schema (Paris postal code)
  - Service items schema (quantity 0-50)
  - Complete booking schema (all steps combined)

#### API Routes (1 file, 84 lines)
- **`/api/bookings/guest/check-email`**: Email existence verification
  - Queries Supabase `auth.users` table
  - Returns `exists: boolean` + `message`
  - Security: Rate limited, no sensitive data exposed

#### Database Migrations (1 file, 85 lines)
- **`20250109000001_add_failed_operations_tables.sql`**
  - `failed_account_creations` table: Track Supabase Auth failures
  - `failed_bookings` table: Track booking creation failures
  - RLS policies: Admin-only access
  - Indexes: Performance optimization
  - **Status**: ⚠️ **File created, not applied** (apply in Phase 2)

#### Documentation (5 files, 2400+ lines)
1. **PRD** (`PRD_GUEST_BOOKING_FLOW.md` - 1300 lines):
   - Complete product requirements
   - User journey (8 steps)
   - Technical scope (Frontend + Backend + DB + DevOps)
   - 4-week roadmap with milestones
   - Risk & mitigation (updated with retry logic)

2. **Implementation Log** (`IMPLEMENTATION_GUEST_BOOKING_PHASE1.md` - 600 lines):
   - Day-by-day progress tracker
   - Files created + line counts
   - Testing procedures
   - Troubleshooting guide

3. **Quick Start Guide** (`QUICK_START_GUEST_BOOKING.md` - 250 lines):
   - Developer onboarding (5 minutes)
   - File structure overview
   - Common workflows
   - Debugging tips

4. **Phase 1 Summary** (`PHASE1_COMPLETION_SUMMARY.md` - 150 lines):
   - Completion checklist
   - Verification steps
   - Next steps roadmap

5. **Changelog** (this file):
   - Comprehensive change history

### 🔧 Changed

#### Stepper Component (`guest-stepper.tsx`)
- **Step count**: Updated to 5 steps (Contact, Addresses, Services, DateTime, Summary)
- **Step labels**: French labels for all steps
- **Navigation**: Click-to-navigate enabled for completed steps

#### Container Component (`guest-booking-container.tsx`)
- **Initial creation**: Main orchestrator for 5-step flow
- **State management**: Integrated `useGuestBooking()` hook
- **Step 0**: Wired Contact component
- **Steps 1-4**: Placeholder `<div>` (implemented in Day 3-4)

### 📊 Progress Tracking

**Phase 1 Status**: **40% Complete** (Day 1-2)
- ✅ Foundation infrastructure
- ✅ Step 0 (Contact)
- ✅ State management
- ✅ Validation schemas
- ✅ API routes
- ✅ Database migrations (files)
- ✅ Documentation
- ⏳ Steps 1-4 (pending Day 3-4)

**Project Overall**: **~10%** (Phase 1: 40/100, Phases 2-4: pending)

### 🎯 Technical Decisions

**Why SessionStorage?**
- Guest users have no account → Can't use database
- Survives page refresh (better UX than useState)
- 24h expiry prevents stale data
- No backend calls until final submission

**Why Zod validation?**
- Type-safe validation (TypeScript integration)
- Reusable schemas (frontend + backend)
- Detailed error messages for UX
- Industry standard (Next.js ecosystem)

**Why separate API route for email check?**
- Real-time feedback (before final submission)
- Security: Prevents duplicate accounts
- UX: Warns user before completing booking
- Performance: Lightweight query (no full user data)

### 📝 Commits Created (3 commits)

1. **`feat(guest-booking): Phase 1 Day 1-2 - Foundation + Step 0`**
   - All 11 foundation files
   - Step 0 (Contact) complete
   - 1073 lines added

2. **`docs(guest-booking): add Phase 1 completion summary and changelog`**
   - 2 documentation files
   - Progress tracking
   - Next steps roadmap

3. **`docs(guest-booking): add quick start guide for Phase 1 Day 3-4`**
   - Quick start guide
   - Developer onboarding
   - Common workflows

### 🚀 Next Steps (Day 3-4)

**Immediate Tasks**:
- [ ] Create Step 1: Addresses (`addresses-step.tsx`)
- [ ] Create Step 2: Services (`services-step.tsx`)
- [ ] Create Step 3: DateTime (`datetime-step.tsx`)
- [ ] Create Step 4: Summary (`summary-step.tsx`)
- [ ] Wire all 4 steps into container
- [ ] Test end-to-end flow (Step 0 → Step 4)

**Remaining Phase 1** (5%):
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Mobile responsive testing
- [ ] Update documentation

---

## [Phase 0 - Planning] - 2025-01-08

### 📋 Added - PRD Initial Draft

#### PRD Creation (`PRD_GUEST_BOOKING_FLOW.md`)
- **Section 1**: Context & Goals
- **Section 2**: User Journey (8 steps)
- **Section 3**: UI/UX Specifications
- **Section 4**: Technical Architecture
- **Section 5**: Backend API Design
- **Section 6**: Data Flow Diagrams
- **Section 7**: Error Handling Strategy
- **Section 8**: Security & Privacy
- **Section 9**: Testing Strategy
- **Section 10**: 4-Week Roadmap
- **Section 11**: Out of Scope
- **Section 12**: Risk & Mitigation

#### PRD Review & Updates
- **User Request**: Updated Risk & Mitigation section
- **Changes**:
  - Added sequential orchestration flow (payment → account → booking)
  - Detailed retry logic (3 retries + exponential backoff)
  - Database logging requirements (failed operations tables)
  - Error scenarios matrix (9 scenarios)
  - Monitoring & alerting specifications

#### Approval
- **Date**: 2025-01-09
- **Status**: ✅ Approved by user
- **Next Action**: Begin implementation (Phase 1 Day 1-2)

---

## Legend

- **[Phase X Day Y]**: Development phase and day
- **✅ Added**: New features, files, or components
- **🔧 Changed/Fixed**: Modifications to existing code
- **⚠️ Deprecated**: Features marked for removal
- **❌ Removed**: Deleted files or features
- **📊 Progress**: Completion percentages and metrics
- **🎯 Technical**: Architecture decisions and rationale
- **🚀 Next Steps**: Upcoming tasks and priorities
- **📝 Commits**: Git commit references

---

## Project Status Summary

| Phase | Status | Completion | Duration |
|-------|--------|-----------|----------|
| **Phase 0** | ✅ Complete | 100% | 1 day |
| **Phase 1** | 🔄 In Progress | 95% | 4/5 days |
| **Phase 2** | ⏳ Pending | 0% | 4 days |
| **Phase 3** | ⏳ Pending | 0% | 5 days |
| **Phase 4** | ⏳ Pending | 0% | 5 days |
| **TOTAL** | 🔄 In Progress | ~25% | 19/23 days |

**Last Updated**: 2025-01-10
**Current Focus**: Phase 1 Day 3-4 (Steps 1-4 implementation)
**Next Milestone**: Phase 2 Stripe Payment Integration

---

_For detailed implementation logs, see `docs/IMPLEMENTATION_GUEST_BOOKING_PHASE1.md`_  
_For quick start guide, see `docs/QUICK_START_GUEST_BOOKING.md`_  
_For PRD, see `docs/PRD/PRD_GUEST_BOOKING_FLOW.md`_
