> **IMPORTANT:**
> All backend changes listed in this document must be implemented in close alignment with the corresponding frontend components, logic, and user flows that have already been developed.
> - Before applying any schema, function, or policy change, review the latest frontend code and UI to ensure data structures, field names, and business logic match exactly.
> - Test each backend update with the real frontend to confirm seamless integration.
> - Log any mismatches, required adjustments, or additional backend needs in `sql_commands.md` and the relevant code/documentation logs.

# 🗄️ Dynamic Slots & Venue Management - Supabase Backend Requirements

_Last updated: 2025-01-27_

This document lists all required backend (Supabase) updates to fully support the new dynamic slot, blockout, booking management, and advanced venue management frontend.  
**All SQL changes should be logged in `sql_commands.md` and applied via Supabase MCP or SQL Editor.**

---

## 🔗 Frontend–Backend Feature Mapping

| Frontend Feature/Component                | Backend Requirement(s)                                                                                 |
|-------------------------------------------|--------------------------------------------------------------------------------------------------------|
| VenueAvailabilityController, BlockoutManager, QuickBlockActions | `venue_blockouts` table, RLS, recurring support, blockout CRUD functions                                |
| DynamicSlotViewer, useDynamicSlots        | `get_venue_availability_for_period` function, `weekly_availability` in `venues`, slot calculation logic|
| BookingManagementDashboard, useBookingManagement | `bookings` table, RLS, booking CRUD, status, analytics, cancellation, stats functions                  |
| MultiVenueSelector, Owner Dashboard       | Multi-venue support in `venues`, RLS, user/owner relationships, dashboard stats functions              |
| VenuePerformanceDashboard                 | Analytics tables/functions (e.g., `venue_analytics`), stats RPCs, view/conversion tracking             |
| NotificationCenter, ActivityLogViewer     | `notifications` table, `activity_logs` table, RLS, notification triggers                              |
| VenueVisibilityToggle                     | `is_published`/`visibility` in `venues`, RLS, toggle API                                              |
| ReviewManagement, BookingApprovalManager  | `reviews` table, `auto_approve_bookings` in `venues`, approval logic                                  |
| MediaManager, EnhancedImageCarousel       | Supabase Storage buckets, media metadata, storage policies                                             |
| Multi-Manager Support                     | `venue_managers` table, RLS, manager CRUD, dashboard switching                                        |
| Advanced Unavailability                   | `venue_unavailability` table, RLS, recurring/holiday support                                          |
| Drafts & Approval Logs                    | `venue_drafts`, `venue_approval_logs` tables, RLS, draft/approval RPCs                                |
| Discounts/Promotions                      | `discounts` table, RLS, booking flow integration                                                      |
| Messaging/Conversations                   | `conversations`, `messages` tables, RLS, real-time support                                            |
| Payments                                  | `payments` table, RLS, payment/invoice tracking                                                       |

---

## 1. New Tables & Schema Changes

### 1.1. `venue_blockouts` Table

```sql
-- Table to store all blockout periods for venues (maintenance, events, personal, etc.)
-- Supports both full-day and partial-day blocks, and recurring patterns
CREATE TABLE IF NOT EXISTS public.venue_blockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE, -- Link to venue
  start_date date NOT NULL, -- Start of blockout
  end_date date NOT NULL,   -- End of blockout
  start_time time,          -- Optional: for partial-day blockouts
  end_time time,            -- Optional: for partial-day blockouts
  reason text,              -- Reason for blockout (shown in UI)
  block_type text CHECK (block_type IN ('maintenance', 'personal', 'event', 'other')), -- Type of blockout
  is_recurring boolean DEFAULT false, -- Recurring blockout support
  recurrence_pattern jsonb, -- JSON for recurrence rules (if any)
  created_by uuid REFERENCES public.profiles(id), -- Who created the blockout
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
**Purpose:** Supports all blockout management features in the owner dashboard, including recurring and partial-day blockouts.

---

### 1.2. `venue_blockouts` Indexes

```sql
-- Index for fast lookup by venue and date range
CREATE INDEX IF NOT EXISTS idx_venue_blockouts_venue_date
  ON public.venue_blockouts (venue_id, start_date, end_date);

-- Index for fast lookup by date range (for analytics, search, etc.)
CREATE INDEX IF NOT EXISTS idx_venue_blockouts_date_range
  ON public.venue_blockouts (start_date, end_date);
```
**Purpose:** Optimizes queries for blockouts by venue and date range for all blockout-related frontend components.

---

### 1.3. `venues` Table Updates

- Ensure `weekly_availability` column exists (type: `jsonb`) for storing weekly open/close hours (used by DynamicSlotViewer, useDynamicSlots, etc.).
- If not present, add:
  ```sql
  -- Stores weekly open/close hours for each venue (used for dynamic slot calculation)
  ALTER TABLE public.venues
    ADD COLUMN IF NOT EXISTS weekly_availability jsonb;
  ```
- Add `auto_approve_bookings` (boolean) for automated booking approval logic (used by BookingApprovalManager).
- Add `is_published` (boolean) or `visibility` field for VenueVisibilityToggle.

---

### 1.4. `bookings` Table (if not already present)

```sql
-- Table to store all bookings for venues, supporting time-based bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Who made the booking
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE, -- Which venue
  booking_date date NOT NULL, -- Date of booking
  start_time time NOT NULL,   -- Start time of booking
  end_time time NOT NULL,     -- End time of booking
  total_price numeric NOT NULL, -- Price for the booking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')), -- Booking status
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')), -- Payment status
  notes text, -- Optional notes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
**Purpose:** Supports all booking management, slot selection, and analytics features in the frontend.

---

### 1.5. `bookings` Indexes

```sql
-- Index for fast lookup of bookings by venue/date/time
CREATE INDEX IF NOT EXISTS idx_bookings_venue_date
  ON public.bookings (venue_id, booking_date, start_time, end_time);

-- Index for fast lookup of bookings by user
CREATE INDEX IF NOT EXISTS idx_bookings_user
  ON public.bookings (user_id);
```
**Purpose:** Fast lookup for bookings by venue/date and by user for BookingManagementDashboard, analytics, and user dashboards.

---

### 1.6. `venue_analytics` Table (Recommended for Analytics Dashboard)

```sql
-- Table to store analytics for each venue (views, conversions, etc.)
CREATE TABLE IF NOT EXISTS public.venue_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  date date NOT NULL,
  views integer DEFAULT 0,
  bookings integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
**Purpose:** Enables VenuePerformanceDashboard and analytics features in the frontend.

---

### 1.7. `activity_logs` Table (Recommended for Audit Trail)

```sql
-- Table to store activity logs for all venue actions (edits, blockouts, bookings, etc.)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
```
**Purpose:** Supports ActivityLogViewer and audit trail features in the owner dashboard.

---

### 1.8. `notifications` Table (Recommended for NotificationCenter)

```sql
-- Table to store in-app and email notifications for users/owners
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- e.g., 'booking', 'blockout', 'admin', etc.
  title text,
  message text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```
**Purpose:** Enables NotificationCenter and user feedback features in the frontend.

---

### 1.9. `venue_media` Table (Recommended for Media Management)

```sql
-- Table to store metadata for venue images/videos
CREATE TABLE IF NOT EXISTS public.venue_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text CHECK (type IN ('image', 'video')),
  alt_text text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```
**Purpose:** Supports VenueMediaManager, EnhancedImageCarousel, and media ordering/metadata in the frontend.

---

### 1.10. `venue_managers` Table
```sql
-- Table for multi-manager support (owners can add other users as managers)
CREATE TABLE IF NOT EXISTS public.venue_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'manager' CHECK (role IN ('manager', 'co-owner', 'admin')),
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
-- RLS: Only owners and managers can view/manage their venues
```sql
ALTER TABLE public.venue_managers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venue owners/managers can manage managers"
  ON public.venue_managers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = venue_managers.venue_id
        AND (venues.owner_id = auth.uid() OR venue_managers.user_id = auth.uid())
    )
  );
```

### 1.11. `venue_unavailability` Table
```sql
-- Table for advanced/recurring unavailability (holidays, special cases)
CREATE TABLE IF NOT EXISTS public.venue_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb,
  reason text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
-- RLS: Only owners/managers can manage unavailability
```sql
ALTER TABLE public.venue_unavailability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venue owners/managers can manage unavailability"
  ON public.venue_unavailability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = venue_unavailability.venue_id
        AND (venues.owner_id = auth.uid())
    )
  );
```

### 1.12. `payments` Table
```sql
-- Table for payment/invoice tracking
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method text,
  transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
-- RLS: Only users/owners can view their own payments
```sql
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users/owners can view their own payments"
  ON public.payments
  FOR SELECT
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.venues WHERE venues.id = payments.venue_id AND venues.owner_id = auth.uid()
    )
  );
```

### 1.13. `venue_drafts` Table
```sql
-- Table for draft support (venue submission, editing)
CREATE TABLE IF NOT EXISTS public.venue_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  form_data jsonb NOT NULL,
  step_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  is_active boolean DEFAULT true
);
```
-- RLS: Only the draft owner can access their draft
```sql
ALTER TABLE public.venue_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Draft owner can manage their draft"
  ON public.venue_drafts
  FOR ALL
  USING (email = auth.email());
```

### 1.14. `venue_approval_logs` Table
```sql
-- Table for audit trail of venue approval/rejection
CREATE TABLE IF NOT EXISTS public.venue_approval_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('approved', 'rejected', 'pending_review')),
  reason text,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);
```
-- RLS: Only super admins can access
```sql
ALTER TABLE public.venue_approval_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view approval logs"
  ON public.venue_approval_logs
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.super_admin_credentials WHERE super_admin_credentials.admin_id = auth.uid()));
```

### 1.15. `discounts` Table
```sql
-- Table for venue discounts/promotions
CREATE TABLE IF NOT EXISTS public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed')),
  value numeric NOT NULL,
  start_date date,
  end_date date,
  usage_limit integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
-- RLS: Only owners/managers can manage their venue's discounts
```sql
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venue owners/managers can manage discounts"
  ON public.discounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.venues WHERE venues.id = discounts.venue_id AND venues.owner_id = auth.uid()
    )
  );
```

### 1.16. `conversations` and `messages` Tables
```sql
-- Table for owner-admin/user messaging
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id),
  admin_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id),
  message text NOT NULL,
  sent_at timestamptz DEFAULT now()
);
```
-- RLS: Only participants can view/send messages
```sql
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view conversations"
  ON public.conversations
  FOR SELECT
  USING (
    owner_id = auth.uid() OR admin_id = auth.uid()
  );

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view/send messages"
  ON public.messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND (conversations.owner_id = auth.uid() OR conversations.admin_id = auth.uid())
    )
  );
```

---

## 2. Row-Level Security (RLS) Policies

### 2.1. `venue_blockouts` RLS

```sql
ALTER TABLE public.venue_blockouts ENABLE ROW LEVEL SECURITY;

-- Only the owner of a venue can create, update, or delete blockouts for their venues
CREATE POLICY "Venue owners can manage blockouts"
  ON public.venue_blockouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = venue_blockouts.venue_id
        AND venues.owner_id = auth.uid()
    )
  );
```
**Purpose:** Secures all blockout management features for venue owners only.

---

### 2.2. `bookings` RLS

```sql
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings
  FOR SELECT
  USING (user_id = auth.uid());

-- Venue owners can view bookings for their venues
CREATE POLICY "Venue owners can view bookings for their venues"
  ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = bookings.venue_id
        AND venues.owner_id = auth.uid()
    )
  );

-- Users can insert their own bookings
CREATE POLICY "Users can create their own bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Venue owners can update/cancel bookings for their venues
CREATE POLICY "Venue owners can update bookings for their venues"
  ON public.bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = bookings.venue_id
        AND venues.owner_id = auth.uid()
    )
  );
```
**Purpose:** Secures all booking management and dashboard features for users and venue owners.

---

### 2.3. RLS for Analytics, Activity Logs, Notifications, Media

- Enable RLS for all new tables (`venue_analytics`, `activity_logs`, `notifications`, `venue_media`).
- Owners can access their own venue's analytics, logs, media; users can access their own notifications.

---

## 3. Functions & Triggers

### 3.1. Dynamic Slot Calculation Function

```sql
-- Function to return available slots for a venue for a given date range
-- Used by DynamicSlotViewer, useDynamicSlots, and booking flows
CREATE OR REPLACE FUNCTION get_venue_availability_for_period(
  p_venue_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  slot_date date,
  start_time time,
  end_time time,
  is_blocked boolean,
  is_booked boolean,
  price numeric
) AS $$
-- Implement logic to:
-- 1. Use venue's weekly_availability JSONB
-- 2. Exclude times blocked in venue_blockouts
-- 3. Exclude times already booked in bookings
-- 4. Return available slots for each day in range
BEGIN
  -- (Implementation required)
END;
$$ LANGUAGE plpgsql STABLE;
```
**Purpose:** Backend support for all dynamic slot and availability features in the frontend.

---

### 3.2. Booking/Blockout/Analytics/Notification Triggers

- **Auto-update `updated_at` on change:**
  ```sql
  -- Trigger to keep updated_at in sync on every update
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER update_venue_blockouts_updated_at
    BEFORE UPDATE ON public.venue_blockouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  ```
- Add similar triggers for `bookings`, `venue_analytics`, `activity_logs`, `venue_media` as needed.

---

## 4. Foreign Key Relationships

- `venue_blockouts.venue_id` → `venues.id` -- Each blockout is linked to a venue
- `venue_blockouts.created_by` → `profiles.id` -- Tracks who created the blockout
- `bookings.venue_id` → `venues.id` -- Each booking is linked to a venue
- `bookings.user_id` → `auth.users.id` -- Each booking is linked to a user
- `venue_analytics.venue_id` → `venues.id` -- Analytics per venue
- `activity_logs.venue_id` → `venues.id` -- Logs per venue
- `notifications.user_id` → `auth.users.id` -- Notifications per user
- `venue_media.venue_id` → `venues.id` -- Media per venue
- `venue_managers.venue_id` → `venues.id` -- Managers per venue
- `venue_unavailability.venue_id` → `venues.id` -- Unavailability per venue
- `payments.booking_id` → `bookings.id` -- Payments per booking
- `payments.user_id` → `auth.users.id` -- Payments per user
- `payments.venue_id` → `venues.id` -- Payments per venue
- `venue_drafts.email` → `auth.users.email` -- Drafts per user
- `venue_approval_logs.venue_id` → `venues.id` -- Approval logs per venue
- `discounts.venue_id` → `venues.id` -- Discounts per venue
- `conversations.venue_id` → `venues.id` -- Conversations per venue
- `conversations.owner_id` → `auth.users.id` -- Conversations per owner
- `conversations.admin_id` → `auth.users.id` -- Conversations per admin
- `messages.conversation_id` → `conversations.id` -- Messages per conversation
- `messages.sender_id` → `auth.users.id` -- Messages per sender

**Purpose:** Ensures referential integrity for all venue/booking/blockout/analytics/media/notification/manager/unavailability/payment/draft/approval/discount/conversation/message operations.

---

## 5. Supabase Storage & Policies

- **Buckets:** `venue-images`, `venue-videos` -- Used for storing venue media
- **Policies:** Public read for images/videos, authenticated upload, owner-only delete.

---

## 6. Additional Recommendations

- **Payments:** Add a `payments` table for payment/invoice tracking (optional, for future monetization).
- **Multi-Manager:** Add a `venue_managers` table for shared management (if frontend supports multiple managers).
- **Advanced Unavailability:** Add/extend `venue_unavailability` for holidays, recurring, and special cases.
- **Drafts:** Ensure `venue_drafts` table and RPCs are present for draft support.

---

## 7. Comments & Explanations

- All new tables and columns are **additive** (no breaking changes).
- RLS policies are strict: only owners and users can access their own data.
- All changes must be logged in `sql_commands.md` and tested before production.
- Use Supabase Studio or CLI to apply migrations and verify schema.
- **Always cross-check backend changes with the latest frontend code and UI to ensure seamless integration.**

---

## 8. Required RPCs/Functions (Stubs)

```sql
-- Draft management
CREATE OR REPLACE FUNCTION save_venue_draft(email text, form_data jsonb, step_completed integer)
RETURNS void AS $$ BEGIN -- implementation END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION get_venue_draft(email text)
RETURNS jsonb AS $$ BEGIN -- implementation END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION delete_venue_draft(email text)
RETURNS void AS $$ BEGIN -- implementation END; $$ LANGUAGE plpgsql;

-- Approval workflow
CREATE OR REPLACE FUNCTION approve_venue(venue_uuid uuid, admin_notes text)
RETURNS void AS $$ BEGIN -- implementation END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION reject_venue(venue_uuid uuid, rejection_reason text, admin_notes text)
RETURNS void AS $$ BEGIN -- implementation END; $$ LANGUAGE plpgsql;

-- Analytics
CREATE OR REPLACE FUNCTION get_venue_analytics(venue_id uuid, start_date date, end_date date)
RETURNS jsonb AS $$ BEGIN -- implementation END; $$ LANGUAGE plpgsql;

-- Booking approval logic
CREATE OR REPLACE FUNCTION auto_approve_booking(venue_id uuid, booking_id uuid)
RETURNS boolean AS $$ BEGIN -- implementation END; $$ LANGUAGE plpgsql;
```

---

# ✅ Use this file as a migration and implementation checklist for Supabase backend updates. 