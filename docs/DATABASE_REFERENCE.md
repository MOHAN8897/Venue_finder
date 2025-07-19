# Venue Finder Database Schema Reference

This document summarizes the current schema, RLS policies, functions, triggers, and indexes as defined in all migration files up to now. Use this as a reference for future migrations or to recreate the schema in a new environment.

---

## Tables, Enums, and Types

- All tables (profiles, venues, venue_slots, bookings, favorites, venue_amenities, amenities, reviews, admin_logs, user_preferences, user_bookings, etc.)
- Enum types: `user_role`, `venue_type`, `booking_status`, `payment_status`, `venue_status`

## Example Table Definition
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  role user_role DEFAULT 'user',
  profile_picture text,
  business_name text,
  description text,
  verified boolean DEFAULT false,
  google_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Functions & Triggers
- `handle_new_user()` (auto-create profile on signup)
- `update_profile_status_on_preferences()` (trigger for profile completion)
- `get_user_activity_summary()` (user activity stats)
- `save_user_preferences()` (save preferences with validation)
- Triggers for updating profile status, logging auth attempts, etc.

---

## Indexes
- `idx_user_preferences_user_id` on `user_preferences(user_id)`
- `idx_user_preferences_completed` on `user_preferences(completed)`
- `idx_user_bookings_user_id` on `user_bookings(user_id)`
- `idx_profiles_google_id` on `profiles(google_id)`
- ...and others for performance

---

## RLS Policies (Sample)
- RLS enabled on all main tables
- Example for `profiles`:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
- Similar policies for bookings, favorites, reviews, admin_logs, amenities, user_preferences, user_bookings, etc.

---

## Example Policy for Bookings
```sql
CREATE POLICY "Users can view their own bookings" ON public.user_bookings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookings" ON public.user_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.user_bookings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookings" ON public.user_bookings
    FOR DELETE USING (auth.uid() = user_id);
```

---

## Notes
- All schema, RLS, and function definitions are based on the latest migration files in `supabase/migrations/`.
- For full SQL, see the migration files directly.
- Use this document as a reference to recreate or migrate the schema to another Supabase project.

# DATABASE REFERENCE & SYNC MAP

## 1. Database Tables & Columns

### profiles
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- email (text)
- name (text)
- full_name (text)
- avatar_url (text)
- phone (text)
- date_of_birth (date)
- gender (text)
- address (text)
- city (text)
- state (text)
- country (text)
- preferences (jsonb)
- notification_settings (jsonb)
- created_at (timestamptz)
- updated_at (timestamptz)

### venues
- id (uuid, PK)
- owner_id (uuid, FK to auth.users)
- name (text)
- description (text)
- venue_type (text)
- address (text)
- city (text)
- state (text)
- pincode (text)
- latitude (numeric)
- longitude (numeric)
- capacity (integer)
- area (text)
- hourly_rate (integer)
- daily_rate (integer)
- image_urls (text[])
- amenities (text[])
- status (text)
- is_approved (boolean)
- is_active (boolean)
- is_featured (boolean)
- rating (numeric)
- total_reviews (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
- approved_at (timestamp)
- rejected_at (timestamp)

### user_favorites
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- venue_id (uuid, FK to venues)
- created_at (timestamptz)

### user_bookings
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- venue_id (uuid, FK to venues)
- booking_date (date)
- start_time (time)
- end_time (time)
- total_price (numeric)
- status (text)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

### user_reviews
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- venue_id (uuid, FK to venues)
- rating (integer)
- review_text (text)
- created_at (timestamptz)
- updated_at (timestamptz)

### Subvenues (sub-venue/space management)
- id: uuid (PK)
- venue_id: uuid (FK to venues.id)
- subvenue_name: text
- subvenue_description: text
- subvenue_features: text[]
- subvenue_images: text[]
- subvenue_videos: text[]
- subvenue_amenities: text[]
- subvenue_capacity: integer
- subvenue_type: text
- subvenue_status: subvenue_status (enum: active, inactive, maintenance)
- created_at: timestamptz
- updated_at: timestamptz

**Note:** All sub-venue/space management uses this table. All columns are prefixed with `subvenue_` for clarity. Linked to main venue by `venue_id`. Migration performed 2024-08-02.

## 2. Database Functions (RPC)

### get_user_profile
- Returns: JSONB (single user profile row for auth.uid())

### get_user_favorites
- Returns: TABLE (id, user_id, venue_id, created_at, venue JSONB)
- venue JSONB: { id, name, address, city, image_urls, rating, hourly_rate }

### get_user_bookings
- Returns: TABLE (id, user_id, venue_id, booking_date, start_time, end_time, total_price, status, created_at, venue JSONB)
- venue JSONB: { id, name, address, image_urls }

### get_user_dashboard_stats
- Returns: JSONB (totalBookings, totalFavorites, totalReviews, totalVenues, recentBookings, recentFavorites)


## 3. Frontend Object Keys & Usage

### UserProfile (frontend)
- id
- user_id
- email
- name
- full_name
- avatar_url
- phone
- date_of_birth
- gender
- address
- city
- state
- country
- preferences
- notification_settings
- created_at
- updated_at

### UserFavorite (frontend)
- id
- user_id
- venue_id
- created_at
- venue: { id, name, address, city, image_urls, rating, hourly_rate }

### UserBooking (frontend)
- id
- user_id
- venue_id
- booking_date
- start_time
- end_time
- total_price
- status
- created_at
- venue: { id, name, address, image_urls }

### UserReview (frontend)
- id
- user_id
- venue_id
- rating
- review_text
- created_at
- updated_at
- venue: { id, name, address }


## 4. Mapping & Notes
- profiles.user_id <-> frontend UserProfile.user_id
- venues.id <-> user_favorites.venue_id, user_bookings.venue_id, user_reviews.venue_id
- All RPC functions use auth.uid() to filter for the current user
- All frontend pages expect nested venue objects in favorites/bookings/reviews
- All date/time fields are expected as ISO strings or JS Date-compatible

---

# Use this file as a reference for all backend/frontend sync, object key mapping, and debugging.
# If you add new columns, functions, or change object keys, update this file!

## [2024-08-02] Database Schema, Functions, and RLS Policies Audit

### Tables
- **profiles**: User profiles, owner/admin roles, RLS enabled.
- **venues**: Venue listings, all fields for List/Manage Venue, RLS enabled (owners manage their own, public can view approved/active).
- **venue_approval_logs**: Audit log for venue approval/rejection, RLS enabled (super admin only).
- **user_favorites**: User favorite venues, RLS enabled.
- **user_reviews**: Venue reviews, RLS enabled.
- **user_bookings**: Venue bookings, RLS enabled.
- **venue_drafts**: Drafts for venue submission, RLS enabled.
- **activity_logs**: General activity logs, RLS enabled.
- **contact_messages**: User contact form, RLS enabled.
- **Other tables**: amenities, payments, notifications, etc. (all with RLS as per docs).

### Functions
- **submit_venue(venue_data jsonb)**: Inserts venue, logs submission, RLS enforced.
- **approve_venue(venue_uuid, admin_notes)**: Approves venue, updates user role, logs action.
- **reject_venue(venue_uuid, reason, admin_notes)**: Rejects venue, logs action.
- **update_venue_submission, delete_venue_submission**: For editing/deleting pending venues.
- **Other utility/auth functions**: As per sql_commands.md.

### RLS Policies
- RLS enabled for all user/venue-specific tables.
- Owners can manage their own venues; public can view approved/active venues.
- Super admins have access to approval logs.
- All policies are documented in sql_commands.md and local_schema.sql.

### Notes
- This file is the single source of truth for the current database structure, functions, and security policies.
- All future migrations/changes must be logged here before being applied.

## [2024-08-02] Venue Media & Amenities DB Integration
- On venue submission, all images/videos are saved to venue_media table (with type, order, alt_text, metadata).
- Facilities/amenities are saved to venue_amenities table (and amenities table if new).
- See code for default structure and logic.

# Venues Table (Updated 2024-08-01)

- Columns: id (uuid), name (text), type (venue_type), user_id (uuid), status (venue_status: pending, approved, rejected), approved_at (timestamp), rejected_at (timestamp)
- RLS: Only authenticated users can insert/select their own venues.
- Submission logic:
  - User can only submit one venue if status is pending.
  - If status is rejected, user can resubmit.
  - If status is approved, user can submit more venues.
- Status changes (by Super Admin):
  - If status changes to 'approved', user sees 'Manage Your Venues' and can submit more.
  - If status changes to 'rejected', user can resubmit.
- These columns are used to display approval/rejection times in the Super Admin dashboard and user UI.
- See CODE_CHANGE_LOG.md for SQL commands and policy details. 

## 2024-08-01: Venue Approval, Owner Management, and Logging System

- See `database/sql_commands.md` for the full migration SQL and explanations.
- Includes: venues approval columns, approval logs, super admin credentials, owner management, all required indexes, RLS policies, triggers, and functions for approve/reject/delete/resubmit/fetch logs. 