# Supabase Database Schema Snapshot

**Last updated:** 2024-08-01

---

## 1. Enums

```
-- booking_status: pending, confirmed, cancelled, completed
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- payment_status: pending, paid, refunded, failed
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- user_role: user, owner, admin, super_admin
CREATE TYPE public.user_role AS ENUM ('user', 'owner', 'admin', 'super_admin');

-- venue_status: pending, approved, rejected, inactive
CREATE TYPE public.venue_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');

-- venue_type: cricket-box, farmhouse, banquet-hall, sports-complex, party-hall, conference-room
CREATE TYPE public.venue_type AS ENUM ('cricket-box', 'farmhouse', 'banquet-hall', 'sports-complex', 'party-hall', 'conference-room');
```

---

## 2. Tables

### Example (see full file for all tables):

#### `venues`
```
CREATE TABLE public.venues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
  name text NOT NULL,
  description text NOT NULL,
    type public.venue_type NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    images text[] DEFAULT '{}'::text[],
    videos text[] DEFAULT '{}'::text[],
  capacity integer NOT NULL,
  area text NOT NULL,
    dimensions text,
    hourly_rate numeric(10,2) NOT NULL,
    currency text DEFAULT 'INR'::text,
    rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    status public.venue_status DEFAULT 'pending'::public.venue_status,
    verified boolean DEFAULT false,
    contact_name text,
    contact_phone text,
    contact_email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    zip_code text,
    country text DEFAULT 'India'::text,
    price_per_hour numeric(10,2),
    price_per_day numeric(10,2),
    website text,
    image_urls text[] DEFAULT '{}'::text[],
    is_approved boolean DEFAULT true,
  is_active boolean DEFAULT true,
    submitted_by uuid,
    approval_status text DEFAULT 'pending'::text,
    approval_date timestamp with time zone,
    approved_by uuid,
    rejection_reason text,
    submission_date timestamp with time zone DEFAULT now(),
    CONSTRAINT venues_approval_status_check CHECK ((approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);
```

---

## 3. Functions

```
-- Example:
CREATE FUNCTION public.approve_venue(venue_uuid uuid, admin_notes text DEFAULT NULL::text) RETURNS jsonb ...
-- (See full file for all functions)
```

---

## 4. Triggers

```
CREATE TRIGGER on_preferences_completed AFTER INSERT OR UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_profile_status_on_preferences();
CREATE TRIGGER on_review_change AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();
CREATE TRIGGER trigger_assign_owner_id BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.assign_owner_id();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_reviews_updated_at BEFORE UPDATE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_venue_rating_on_review_delete AFTER DELETE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();
CREATE TRIGGER update_venue_rating_on_review_insert AFTER INSERT ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();
CREATE TRIGGER update_venue_rating_on_review_update AFTER UPDATE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 5. Indexes

```
CREATE INDEX idx_admin_logs_admin_id ON public.admin_logs USING btree (admin_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs USING btree (created_at);
CREATE INDEX idx_auth_logs_attempt_type ON public.auth_logs USING btree (attempt_type);
CREATE INDEX idx_auth_logs_created_at ON public.auth_logs USING btree (created_at);
CREATE INDEX idx_auth_logs_email ON public.auth_logs USING btree (email);
CREATE INDEX idx_auth_logs_email_type ON public.auth_logs USING btree (email, attempt_type);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages USING btree (created_at);
CREATE INDEX idx_contact_messages_status ON public.contact_messages USING btree (status);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens USING btree (email);
CREATE INDEX idx_password_reset_tokens_email_used ON public.password_reset_tokens USING btree (email, used);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX idx_profiles_google_id ON public.profiles USING btree (google_id);
CREATE INDEX idx_profiles_profile_status ON public.profiles USING btree (profile_status);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);
CREATE INDEX idx_user_bookings_user_id ON public.user_bookings USING btree (user_id);
CREATE INDEX idx_user_bookings_venue_id ON public.user_bookings USING btree (venue_id);
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites USING btree (user_id);
CREATE INDEX idx_user_favorites_venue_id ON public.user_favorites USING btree (venue_id);
CREATE INDEX idx_user_preferences_completed ON public.user_preferences USING btree (completed);
CREATE INDEX idx_user_preferences_updated_at ON public.user_preferences USING btree (updated_at);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);
CREATE INDEX idx_user_reviews_rating ON public.user_reviews USING btree (rating);
CREATE INDEX idx_user_reviews_user_id ON public.user_reviews USING btree (user_id);
CREATE INDEX idx_user_reviews_venue_id ON public.user_reviews USING btree (venue_id);
CREATE INDEX idx_venues_approval_date ON public.venues USING btree (approval_date);
CREATE INDEX idx_venues_approval_status ON public.venues USING btree (approval_status);
CREATE INDEX idx_venues_submitted_by ON public.venues USING btree (submitted_by);
```

---

## 6. Policies (RLS)

```
-- Example:
CREATE POLICY "Owners can insert venues" ON public.venues FOR INSERT WITH CHECK ((owner_id IN ( SELECT profiles.id FROM public.profiles WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'owner'::public.user_role))));
-- (See full file for all policies)
```

---

## Notes
- This file is a snapshot of the current Supabase public schema, including all tables, columns, types, functions, triggers, indexes, and policies.
- If any RLS or policy is not present in this dump, please run `SELECT * FROM pg_policies WHERE schemaname = 'public';` in the SQL editor and paste the result here.