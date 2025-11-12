# Changelog - Guest Booking Flow

## [Phase 1 - Foundation] - 2025-01-09

### ✨ Added
- **Route**: `/reservation/guest` - Entry point for non-authenticated booking
- **Step 0**: Contact information form (email, firstName, lastName, phone, RGPD)
- **API Endpoint**: `POST /api/bookings/guest/check-email` - Email uniqueness validation
- **Hook**: `useGuestBooking()` - State management with SessionStorage (24h expiry)
- **Component**: `GuestStepper` - Visual progress indicator (5 steps)
- **Component**: `GuestBookingContainer` - Main orchestrator
- **Component**: `ContactStep` - Step 0 implementation
- **Component**: `LoadingSpinner` - Reusable loading indicator
- **Validation**: Zod schemas for contact info and full booking flow
- **Database**: Migration for `failed_account_creations` table (not applied)
- **Database**: Migration for `failed_bookings` table (not applied)

### 📚 Documentation
- `docs/PRD/PRD_GUEST_BOOKING_FLOW.md` - Complete Product Requirements Document (1000+ lines)
- `docs/IMPLEMENTATION_GUEST_BOOKING_PHASE1.md` - Phase 1 implementation log
- `docs/PHASE1_COMPLETION_SUMMARY.md` - Phase 1 completion checklist
- `docs/REMOVE_CONTACT_PAGE_REFERENCES.md` - Contact page cleanup documentation

### 🔧 Technical
- TypeScript strict mode compliant
- React Hook Form + Zod validation
- Responsive design (desktop + mobile)
- SessionStorage persistence (privacy-first)
- Error handling with retry logic (3 attempts + exponential backoff)
- RLS policies for admin-only access

### 📊 Stats
- **Files created**: 11
- **Lines of code**: 1,073
- **SQL migrations**: 1 (pending application)
- **Test coverage**: Manual testing only (E2E in Phase 3)

### ⏭️ Next
- Phase 1 Day 3-4: Addresses + Services steps
- Phase 1 Day 5: DateTime + Summary steps (no payment yet)

---

## [Previous Changes] - 2025-01-09

### 🔄 Modified
- Updated delivery time from 48h → 72h (6 files)
- Changed email domain to `contact@ninowash.fr` (5 files)
- Removed broken `/contact` page links (7 occurrences)
- Redesigned footer social links (Instagram only)

### 📝 Documentation
- `docs/REMOVE_CONTACT_PAGE_REFERENCES.md` - Contact page cleanup

---

**Version**: Phase 1 Day 1-2 (40% complete)  
**Branch**: `dev`  
**Commit**: `cf046f9`  
**Status**: ✅ Ready for next phase
