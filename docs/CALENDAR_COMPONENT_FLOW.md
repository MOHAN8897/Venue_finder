# BookingCalendar Component Flow & Design

## Overview
The `BookingCalendar` component is a core UI element for venue booking. It allows users to select dates (and, for hourly venues, time slots) for booking a venue. It supports both daily and hourly booking types, handles slot availability, and integrates with the payment flow.

---

## Main Features
- **Date selection:** Users can select one or more dates for booking, depending on the venue's booking type.
- **Slot selection:** For hourly/both venues, users can select one or more consecutive hourly slots after picking a date.
- **Color-coded availability:** Dates and slots are color-coded (green/yellow/red/gray) to indicate availability, partial booking, full booking, pending, or past.
- **Popover UI:** The calendar appears in a popover for compact, mobile-friendly interaction.
- **Legend:** A legend explains the color codes for users.
- **Responsive:** The calendar is mobile-first and adapts to different screen sizes.

---

## Booking Types
- **Daily:**
  - Users can select multiple dates (multi-select calendar mode).
  - Each selected date is highlighted (yellow).
  - Booked/unavailable dates are disabled (red/gray).
  - On payment, all selected dates are included in the booking payload.
- **Hourly/Both:**
  - Users select a single date, then pick one or more consecutive hourly slots.
  - Available slots are green, booked/pending are disabled.
  - On payment, the selected date and slot times are included in the booking payload.

---

## State & Props
- `bookingType`: 'daily' | 'hourly' | 'both' (controls calendar mode and slot UI)
- `selectedDates`: string[] (YYYY-MM-DD, for daily)
- `selectedDate`: string (for hourly)
- `selectedSlots`: array of slot objects (for hourly)
- `dateStatusMap`: maps date string to 'available' | 'partial' | 'booked' | 'pending'
- `availableSlots`: array of slot objects for the selected date
- `popoverOpen`: controls calendar popover visibility
- `venue`, `user`: context for booking

---

## Color Logic
- **Green:** Fully available (all slots/dates available)
- **Yellow:** Partially booked (some slots booked/pending, at least one available)
- **Red/Gray:** Fully booked/unavailable
- **Yellow (selected):** User-selected dates
- **Gray:** Past dates (dimmed/disabled)

---

## Payment Flow Integration
- When the user clicks "Book Now" or "Make Payment":
  - For daily: All selected dates are included in the booking payload (with guest count, special requests, etc.)
  - For hourly: The selected date and slot times are included in the payload
  - The payload is saved to localStorage and the user is navigated to the payment page
  - The payment page uses this payload to create a Razorpay order and complete the payment

---

## Supabase Integration
- Fetches slot/date availability from Supabase (`venue_slots` table)
- Updates slot status after booking/payment
- Uses Supabase for user/venue context

---

## UI/UX Details
- Calendar is shown in a popover for compactness
- Date numbers are centered in each box
- Color legend is shown below the calendar
- Today is highlighted with a blue ring
- Disabled dates are dimmed and unclickable
- Slot grid for hourly venues is shown below the calendar
- All interactions are mobile-friendly

---

## Notes for Rewrite
- All selection, color, and payment logic must be preserved
- UI should remain responsive and accessible
- Integration with Supabase and payment flow must be seamless
- Code should be clean, modular, and easy to maintain 