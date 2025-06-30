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