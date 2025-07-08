# ERRORS AND FIXES LOG

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