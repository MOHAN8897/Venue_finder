# Backend Booking System Flow (Hourly & Both Types)

## 1. Overview
This document describes how the backend booking system works for venues with **hourly** and **both** (hourly + daily) booking types. It covers the flow from slot generation, availability, booking creation, and payment, and lists all relevant tables and backend logic.

---

## 2. Key Tables & Their Roles

### - `venues`
- Stores venue details, including `booking_type`, `weekly_availability` (JSONB), and `availability` (array).
- `weekly_availability` defines which days/times are available for booking.

### - `venue_slots`
- Stores all bookable slots for each venue, date, and time.
- Columns: `venue_id`, `date`, `start_time`, `end_time`, `available`, `price`, `booked_by`, etc.
- Slots are generated based on the venue's weekly availability and booking type.

### - `bookings` / `user_bookings`
- Stores each booking made by a user.
- Columns: `id`, `user_id`, `venue_id`, `slot_ids`, `total_amount`, `booking_status`, `payment_status`, `event_date`, etc.
- Links to the slots booked (for hourly bookings).

### - `payments`
- Stores payment records for each booking.
- Columns: `id`, `booking_id`, `user_id`, `amount`, `currency`, `status`, etc.

---

## 3. Hourly Booking Flow

1. **Slot Generation**
   - When a venue is created/updated, slots are generated in `venue_slots` for each available day/time in the next N days (e.g., 30 days), based on `weekly_availability`.
   - Each slot is a row with `venue_id`, `date`, `start_time`, `end_time`, `available: true`.

2. **User Browsing**
   - The frontend fetches available slots for the selected venue and date from `venue_slots`.
   - The calendar only enables days that are both available in `weekly_availability` and have at least one available slot in `venue_slots`.

3. **Booking Creation**
   - User selects one or more available slots and submits a booking.
   - Backend creates a new row in `bookings`/`user_bookings` with the selected slot IDs, user ID, venue ID, total price, etc.
   - The corresponding slots in `venue_slots` are marked as `available: false` or linked to the booking.

4. **Payment**
   - A payment record is created in `payments` for the booking.
   - User is redirected to the payment gateway (e.g., Razorpay).
   - On success, `payment_status` is updated to `paid` and `booking_status` to `confirmed`.

---

## 4. Both Booking Type Flow
- If a venue supports both hourly and daily bookings, the user can choose the type.
- The hourly flow is as above.
- The daily flow (per-day booking) is similar but may not use slots; it blocks out the whole day.

---

## 5. Weekly Availability & Slot Availability
- Only days marked as available in `weekly_availability` are enabled in the calendar.
- For hourly bookings, only days with at least one available slot in `venue_slots` are enabled.
- If no slots exist for a day, it is blocked in the calendar, even if the weekly schedule says it should be available.

---

## 6. Backend Functions & Services
- **Slot Generation:** Handled by backend logic or admin scripts when a venue is created/updated.
- **Booking Creation:** Handled by `createBookingWithPayment` and related service functions.
- **Slot Fetching:** The frontend queries `venue_slots` for available slots for a venue and date.
- **Payment:** Handled by the `payments` table and payment service integration.

---

## 7. Important Notes
- If slots are not generated for a venue, no days will be available for booking, regardless of weekly availability.
- All booking and payment status changes are tracked in the `bookings` and `payments` tables.
- The system is designed to be extensible for additional booking types or slot logic.

---

*Last updated: 2024-07-21* 