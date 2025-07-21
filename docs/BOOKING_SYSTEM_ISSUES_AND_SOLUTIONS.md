# Booking System Issues and Solutions

## 1. ❌ venue_slots Not Generated for Upcoming Days
**Problem:**
- If no rows exist in `venue_slots` for the venue and date range, the calendar shows those dates as unavailable—even if `weekly_availability` is set.

**Solution:**
- Ensure that after venue creation or update, a backend script or cron job generates all needed slots in `venue_slots` for the next N days, based on `weekly_availability`.
- This can be done via a backend API endpoint, admin panel action, or scheduled job.

---

## 2. ⚠️ Frontend dummyAvailability Used (No API)
**Problem:**
- The frontend is using a hardcoded `dummyAvailability` object instead of fetching real data from the backend.

**Solution:**
- Remove all dummy/hardcoded availability.
- Fetch real slot/availability data from the backend API (Supabase or your own endpoint).
- Example:
  ```js
  const response = await fetch(`/api/venue/${venueId}/slots?month=07&year=2025`);
  const availability = await response.json();
  ```

---

## 3. 🧠 Calendar Logic Assumes Unavailable if Date Not in Availability
**Problem:**
- If a date is not present in the availability map, it is assumed fully booked, even if it’s available in `weekly_availability`.

**Solution:**
- On the backend, merge `weekly_availability` with `venue_slots` to create a complete availability map for the frontend.
- For each date in the next N days:
  - If the day is available in `weekly_availability` but no slots exist, mark as “full” or “unavailable”.
  - If slots exist and are available, mark as “available”.
- Send this merged map to the frontend.

---

## 4. 📅 Date Mismatch (Timezone/Format)
**Problem:**
- Date format or timezone mismatches can cause off-by-one errors or incorrect slot display.

**Solution:**
- Normalize all dates to the same format (e.g., `yyyy-MM-dd`) in both backend and frontend.
- Use UTC or a consistent timezone everywhere.
- Use date-fns or luxon for all date handling.

---

## Implementation Plan

### Backend:
- Add/ensure a slot generation script or endpoint that creates slots in `venue_slots` for the next N days after venue creation/update.
- Add an API endpoint that returns a merged availability map for a venue, combining `weekly_availability` and `venue_slots`.

### Frontend:
- Remove all dummy/hardcoded availability.
- Fetch the merged availability map from the backend.
- Use this map to render the calendar and slots.
- Normalize all date handling to `yyyy-MM-dd` and UTC.

---

*Last updated: 2024-07-21* 