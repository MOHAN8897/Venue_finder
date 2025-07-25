# Errors and Fixes Log

## 2024-12-19 - Calendar Availability Color Issue Fixed

### Issue Description
Dates that should be unavailable according to weekly availability settings were showing in green color in both hourly and daily booking venues. The calendar was not properly respecting the venue's weekly availability configuration.

### Root Cause Analysis
1. **`availableDates` state was never populated** - The `BookingCalendar` component initialized `availableDates` as an empty Set but never populated it with actual available dates based on the venue's weekly availability.

2. **Weekly availability check was missing** - The component relied on `availableDates.has(dateStr)` in `getTileClassName`, but since `availableDates` was always empty, all dates appeared as unavailable.

3. **`useDynamicSlots` hook had incomplete availability logic** - The hook only checked the new `weekly_availability` format but didn't handle the old `availability` array format properly.

### Solution Implemented
1. **Added availability calculation logic** - Implemented `isDateAvailable` and `generateAvailableDates` functions to properly calculate available dates based on venue's weekly availability.

2. **Updated `useDynamicSlots` hook** - Enhanced the hook to handle both new `weekly_availability` format and old `availability` array format.

3. **Fixed calendar color mapping** - Updated `getTileClassName` function to properly apply distinct CSS classes for different date states.

4. **Added proper date selection validation** - Enhanced `handleDateClick` to prevent selection of unavailable dates.

### Files Modified
- `src/components/venue-detail/BookingCalendar.tsx`
- `src/hooks/useDynamicSlots.ts`

---

## 2024-12-19 - Calendar Color Mapping and Class Conflict Issue Fixed

### Issue Description
The date 27 was showing in blue (selected) color when it should be unavailable for the SD venue according to its weekly availability settings. The calendar color mapping and availability logic were not properly synchronized, and CSS classes were conflicting between different calendar states.

### Root Cause Analysis
1. **CSS Class Conflicts** - The original `getTileClassName` function used generic Tailwind classes that could conflict with other calendar components and didn't provide enough specificity.

2. **Availability Logic Flaw** - The calendar was allowing selection of dates that should be unavailable according to the venue's weekly availability settings.

3. **Inconsistent Color Mapping** - The color scheme wasn't distinct enough to clearly differentiate between available, unavailable, selected, and past dates.

4. **Missing Container Scoping** - Calendar styles weren't properly scoped, leading to potential conflicts with other calendar components.

### Solution Implemented
1. **Created Distinct CSS Classes** - Implemented venue-specific CSS classes with `venue-calendar-` prefix to prevent conflicts:
   - `venue-calendar-available` - Green background for available dates
   - `venue-calendar-unavailable` - Red background for unavailable dates  
   - `venue-calendar-selected` - Blue background for selected dates
   - `venue-calendar-past` - Gray background for past dates
   - `venue-calendar-today` - Blue ring for today's date

2. **Added Custom CSS File** - Created `venue-calendar.css` with scoped styles using `!important` declarations to ensure proper precedence.

3. **Enhanced Availability Checking** - Improved the `handleDateClick` function to prevent selection of unavailable dates with better error messages.

4. **Added Container Wrapper** - Wrapped the ReactCalendar component with `venue-calendar-container` class for proper CSS scoping.

5. **Updated Calendar Legend** - Updated the legend to match the new color scheme and added a "Past" indicator.

6. **Added Debug Logging** - Implemented console logging to help track availability calculations and date state for debugging.

### Files Modified
- `src/components/venue-detail/BookingCalendar.tsx`
- `src/components/venue-detail/venue-calendar.css` (new file)

### Technical Details
- **CSS Specificity**: Used `!important` declarations to override default react-calendar styles
- **Class Naming**: Used `venue-calendar-` prefix to prevent conflicts with other components
- **State Management**: Enhanced availability checking to prevent invalid date selections
- **User Experience**: Added clear visual indicators and improved error messages

### Testing
- Verified that unavailable dates (Friday, Sunday, Saturday for SD venue) now show in red
- Confirmed that available dates show in green
- Tested that selected dates show in blue with proper visual hierarchy
- Ensured past dates are properly disabled and grayed out

---

## 2024-12-19 - Razorpay Order Initialization Error Fixed

### Issue Description
Payment was failing with "Invalid order data" error when trying to initialize Razorpay payment. The error occurred in `initializeRazorpayPayment` function, causing payment flow to fail.

### Root Cause Analysis
1. **Incorrect Order Object Passing** - The backend Edge Function was returning an object with structure `{ order: {...}, success: true }`, but the frontend was passing the entire response object to `initializeRazorpayPayment` instead of just the `order` property.

2. **Type Validation Failure** - The `initializeRazorpayPayment` function validates that the order object has `id` and `amount` properties, but was receiving the wrapped response object which didn't match the expected `RazorpayOrder` interface.

3. **Data Structure Mismatch** - The frontend expected the order object directly, but the backend was wrapping it in a response object.

### Solution Implemented
1. **Fixed Order Object Extraction** - Updated the payment initialization call to extract the order object from the response:
   ```typescript
   // Before
   initializeRazorpayPayment(order, userDetails, ...)
   
   // After  
   initializeRazorpayPayment(order.order, userDetails, ...)
   ```

2. **Added Debug Logging** - Added console log to track the order object being passed to `initializeRazorpayPayment` for better debugging.

3. **Fixed Type Issues** - Resolved TypeScript errors by using `Number()` instead of `parseInt()` for type conversion to ensure proper number types.

### Files Modified
- `src/pages/PaymentPage.tsx`

### Technical Details
- **Backend Response Structure**: `{ order: RazorpayOrder, success: boolean }`
- **Frontend Expectation**: `RazorpayOrder` object directly
- **Fix Applied**: Extract `order.order` from response before passing to payment initialization
- **Type Safety**: Ensured proper number type conversion for `guestCount` and `venueAmount`

### Testing
- Verified that order object is properly extracted from backend response
- Confirmed that `initializeRazorpayPayment` receives the correct order structure
- Tested that payment flow proceeds without "Invalid order data" error
- Ensured TypeScript compilation passes without errors

### Error Logs Before Fix
```
razorpayService.ts:127 Razorpay order created successfully: Object
order: {amount: 54000, amount_due: 54000, ...}
success: true

razorpayService.ts:176 Error initializing Razorpay payment: Error: Invalid order data
```

### Error Logs After Fix
```
Order created successfully: { order: {...}, success: true }
Order object to pass to initializeRazorpayPayment: { id: "...", amount: 54000, ... }
```

---

## [2024-08-02] Payment 409 Error, Trigger, and Profile Row Fix
- Fixed Razorpay receipt generation to prevent 409 errors.
- Dropped and recreated booking/payment triggers to avoid conflicts and ensure correct payment status update.
- Verified booking user_id maps to correct profile row.
- See database/sql_commands.md for SQL and docs/CODE_CHANGE_LOG.md for summary.

---

## [2024-08-02] Profile/Booking RLS and Priority Fix
- Fixed RLS and API mismatch by ensuring bookings always use the correct profile row id.
- Added ensure_user_profile() function (high priority) to guarantee profile exists before booking.
- See database/sql_commands.md for SQL and docs/CODE_CHANGE_LOG.md for summary.

---

## [2024-08-01] Venue Submission Not Working (Form Stuck, No Success Message)

**Summary:**
- When submitting the venue form, the UI gets stuck and no success message is shown.
- Console errors include: user is null, image upload/storage errors, Supabase insert errors, and failed resource loads (400/404).

**Possible Causes:**
- User context is not loaded or is null when submitting the form.
- Supabase Storage bucket `venue-images` does not exist or has incorrect permissions.
- Supabase insert fails due to missing/invalid fields or RLS policy.
- Network or API errors (400/404) from Supabase endpoints.

**Troubleshooting Steps:**
1. Check that the user is logged in and the user object is available in context before submitting.
2. Ensure the Supabase Storage bucket `venue-images` exists and is public or has correct RLS policy for uploads.
3. Check Supabase logs for any insert or RLS errors on the `venues` table.
4. Add detailed error logging in the form (done in code) to capture and display all errors.
5. Check browser console for any additional errors or failed network requests.
6. Test form submission with and without images to isolate the issue.

**Status:**
- Error logging added to form. Further investigation required based on new logs and console output.

---

## 2024-07-31
- **File corruption in EditVenue.tsx**: Fixed by deleting and recreating the file with valid UTF-8 code.
- **Infinite update loop in AuthContext.tsx**: Fixed by refactoring useEffect dependencies and logic.
- **Supabase 400 Bad Request**: Fixed by correcting the column name in the select query in Header.tsx.
- **ReferenceError: handleUserLogout is not defined**: Fixed by moving function definitions back to top-level in AuthContext.tsx.

## 2024-08-01
### Issue: Manage Venues Page Not Loading for Owner (mohansairallapalli@gmail.com)
**Timestamp:** 2024-08-01 19:30:00

**Description:**
User `mohansairallapalli@gmail.com` (user_id: `de560a67-bb7a-4df1-8328-15d0944d9550`) is unable to see their approved venue on the "Manage Venues" page, despite database checks confirming:
1. User role is `owner` and `owner_verified` is `true` in `public.profiles`.
2. Their submitted venue (`d2c34f53-cb1b-48cf-8378-c6a5d4dda909`) has `approval_status: approved` and `owner_id` is correctly set to their `user_id`.

Frontend `ManageVenues.tsx` calls `venueService.getVenuesForOwner(user.id)`, which internally queries `public.venues` with `.or(`owner_id.eq.${ownerId},submitted_by.eq.${ownerId}`).

**Suspected Cause:** Row Level Security (RLS) policy on the `public.venues` table preventing `mohansairallapalli@gmail.com` from accessing their own data. The `venueService` function itself appears correct, and the database contains the expected data. This implies an authorization layer is blocking the data retrieval. 