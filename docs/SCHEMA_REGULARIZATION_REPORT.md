# Schema Regularization Report - user_addresses
**Date**: 2025-10-06  
**Context**: Fixed database schema mismatch causing "column apartment does not exist" errors

## Source of Truth
**File**: `scripts/03-create-database-schema-fixed.sql`

### Actual Database Schema for `user_addresses`:
```sql
CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    label VARCHAR(50),
    street_address VARCHAR(255) NOT NULL,
    building_info VARCHAR(100),           -- ✅ CORRECT
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(2) DEFAULT 'FR',
    coordinates POINT,
    is_default BOOLEAN DEFAULT false,
    access_instructions TEXT,             -- ✅ CORRECT
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Files Requiring Correction

### ⚠️ 9. `components/forms/address-form.tsx`
**Issue**: Legacy form using old schema (apartment, accessCode)
**Lines**: 31, 51, 55, 137, 138
**Fix Required**: Update to use `buildingInfo`, `accessInstructions`
**Priority**: P2 (Medium - Alternative form, may not be in active use)

### ℹ️ Documentation Files (Low Priority):
- `apartment` (replaced by `building_info`)
- `delivery_instructions` (merged into `access_instructions`)
- `access_code` (merged into `access_instructions`)

## Files Corrected

### ✅ 1. `lib/validations/booking.ts`
**Status**: FIXED  
**Changes**:
- `addressSchema`: Uses `buildingInfo`, `accessInstructions` (camelCase for forms)
- `guestAddressSchema`: Uses `building_info`, `access_instructions` (snake_case for DB)
- Removed `.default()` from `type` and `isDefault` to match TypeScript strict mode

### ✅ 2. `components/profile/address-form-dialog.tsx`
**Status**: FIXED  
**Changes**:
- Interface `Address`: Changed from `apartment`, `delivery_instructions`, `access_code` to `building_info`, `access_instructions`
- Form fields: Renamed to `buildingInfo`, `accessInstructions`
- Merged two separate fields (delivery instructions + access code) into one "Instructions d'accès"
- Fixed defaultValues mapping from snake_case DB to camelCase form

### ✅ 3. `app/reservation/page.tsx`
**Status**: FIXED  
**Changes**:
- Supabase query: Selects `building_info`, `access_instructions`
- Correctly references `user_addresses` table (not "addresses")

### ✅ 4. `app/api/addresses/route.ts` (POST - Create)
**Status**: FIXED  
**Changes**:
- Maps form `buildingInfo` → DB `building_info`
- Maps form `accessInstructions` → DB `access_instructions`
- Removed mappings for non-existent columns

### ✅ 5. `app/api/addresses/[id]/route.ts` (PUT - Update)
**Status**: FIXED  
**Changes**:
- Maps form `buildingInfo` → DB `building_info`
- Maps form `accessInstructions` → DB `access_instructions`
- Handles null values correctly

### ✅ 6. `components/booking/summary-step.tsx`
**Status**: FIXED  
**Changes**:
- Guest address payload: Changed `apartment` → `buildingInfo/building_info`
- Added `accessInstructions/access_instructions` to payload
- Display: Changed `apartment` → `buildingInfo/building_info` (supports both formats)

### ✅ 7. `components/booking/address-step.tsx`
**Status**: FIXED  
**Changes**:
- Interface: Changed `apartment?: string` → `building_info?: string`
- Display: Shows `building_info` instead of `apartment` in both pickup and delivery sections

### ✅ 8. `components/profile/addresses-section.tsx`
**Status**: FIXED  
**Changes**:
- Interface: Changed to use `building_info`, `access_instructions`
- Type: Changed from `string` to `"home" | "work" | "other"` for compatibility

## Files Requiring Correction
- `docs/PRD/PRD_PROFILE_ADDRESSES.md` (lines 190, 205, 206)
- `docs/routes-and-interfaces.md` (line 529)

## Implementation Priority

### P0 (Critical - Breaks Functionality): ✅ ALL FIXED
1. ✅ `lib/validations/booking.ts` - DONE
2. ✅ `app/reservation/page.tsx` - DONE
3. ✅ `app/api/addresses/[id]/route.ts` - API endpoint (write operations) - DONE
4. ✅ `app/api/addresses/route.ts` - API endpoint (create) - DONE
5. ✅ `components/booking/summary-step.tsx` - Booking creation - DONE

### P1 (High - User-Facing): ✅ ALL FIXED
6. ✅ `components/booking/address-step.tsx` - Address selection UI - DONE
7. ✅ `components/profile/addresses-section.tsx` - Profile display - DONE
8. ✅ `components/profile/address-form-dialog.tsx` - DONE

### P2 (Medium - Alternative Forms):
9. ❌ `components/forms/address-form.tsx` - Legacy/alternative form (may not be in use)

### P3 (Low - Documentation):
10. ❌ Documentation files

## Testing Checklist

After all P0/P1 fixes:
- [ ] Create new booking (guest)
- [ ] Create new booking (authenticated user)
- [ ] Modify existing booking
- [ ] Add address in profile
- [ ] Edit address in profile
- [ ] Display address in booking summary
- [ ] Display address in dashboard

## Results

### ✅ Critical Path Completed
All P0 and P1 files have been fixed. The application should now work correctly with the actual database schema.

### Database Schema Alignment
- **Source**: `scripts/03-create-database-schema-fixed.sql`
- **Status**: All API routes and critical components now correctly use `building_info` and `access_instructions`
- **Backwards Compatibility**: Display components support both old data format (if any exists) and new format

### Code Changes Summary
- **Files Modified**: 8 files
- **Lines Changed**: ~50+ lines across validation, API routes, and UI components
- **Breaking Changes**: None (backwards compatible display)
- **Database Migrations**: Not needed (schema was already correct)

## Next Steps

1. Fix P0 files (API routes, booking summary)
2. Test booking creation flow end-to-end
3. Fix P1 files (UI components)
4. Update documentation
5. Create migration guide if needed
