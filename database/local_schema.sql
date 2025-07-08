-- ENUM TYPES
CREATE TYPE user_role AS ENUM ('user', 'owner', 'admin', 'super_admin');
CREATE TYPE venue_type AS ENUM ('cricket-box', 'farmhouse', 'banquet-hall', 'sports-complex', 'party-hall', 'conference-room');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE venue_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  date_of_birth date,
  gender text,
  address text,
  city text,
  state text,
  country text,
  preferences jsonb DEFAULT '{}',
  notification_settings jsonb DEFAULT '{}',
  role user_role DEFAULT 'user',
  profile_picture text,
  business_name text,
  description text,
  verified boolean DEFAULT false,
  google_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  profile_status text DEFAULT 'incomplete',
  password text
);

-- VENUES TABLE
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  venue_type venue_type,
  address text,
  city text,
  state text,
  pincode text,
  latitude numeric,
  longitude numeric,
  capacity integer,
  area text,
  hourly_rate integer,
  daily_rate integer,
  image_urls text[],
  amenities text[],
  status venue_status DEFAULT 'pending',
  is_approved boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  rating numeric,
  total_reviews integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  website text,
  price_per_hour integer,
  price_per_day integer,
  country text,
  zip_code text
);

-- USER FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- USER BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  total_price numeric(10,2) NOT NULL,
  status booking_status DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- USER REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.user_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  review_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_user_bookings_user_id ON public.user_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookings_venue_id ON public.user_bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON public.profiles(google_id);
CREATE INDEX IF NOT EXISTS idx_venues_status ON public.venues(status);
CREATE INDEX IF NOT EXISTS idx_venues_type ON public.venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_city ON public.venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_rating ON public.venues(rating);
CREATE INDEX IF NOT EXISTS idx_venues_created_at ON public.venues(created_at);
CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON public.venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_is_approved ON public.venues(is_approved);
CREATE INDEX IF NOT EXISTS idx_venues_is_active ON public.venues(is_active);
CREATE INDEX IF NOT EXISTS idx_venues_is_featured ON public.venues(is_featured);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_venue_id ON public.user_favorites(venue_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_venue_id ON public.user_reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON public.user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_rating ON public.user_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_user_bookings_status ON public.user_bookings(status);
CREATE INDEX IF NOT EXISTS idx_user_bookings_start_date ON public.user_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_completed ON public.user_preferences(completed);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON public.user_preferences(updated_at);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_status ON public.profiles(profile_status);
CREATE INDEX IF NOT EXISTS idx_venues_venue_type ON public.venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_country ON public.venues(country);
CREATE INDEX IF NOT EXISTS idx_venues_zip_code ON public.venues(zip_code);
CREATE INDEX IF NOT EXISTS idx_profiles_email_password ON public.profiles(email, password);

-- RLS POLICIES FOR ALL USER-FACING TABLES

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- VENUES
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view venues" ON public.venues;
CREATE POLICY "Anyone can view venues" ON public.venues
    FOR SELECT USING (is_active = true AND is_approved = true);
DROP POLICY IF EXISTS "Venue owners can manage their venues" ON public.venues;
CREATE POLICY "Venue owners can manage their venues" ON public.venues
    FOR ALL USING (auth.uid() = owner_id);

-- USER_FAVORITES
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage own favorites" ON public.user_favorites
    FOR ALL USING (auth.uid() = user_id);

-- USER_BOOKINGS
ALTER TABLE public.user_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.user_bookings;
CREATE POLICY "Users can view their own bookings" ON public.user_bookings
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.user_bookings;
CREATE POLICY "Users can create their own bookings" ON public.user_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.user_bookings;
CREATE POLICY "Users can update their own bookings" ON public.user_bookings
    FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.user_bookings;
CREATE POLICY "Users can delete their own bookings" ON public.user_bookings
    FOR DELETE USING (auth.uid() = user_id);

-- USER_REVIEWS
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view reviews" ON public.user_reviews;
CREATE POLICY "Users can view reviews" ON public.user_reviews
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own reviews" ON public.user_reviews;
CREATE POLICY "Users can manage own reviews" ON public.user_reviews
    FOR ALL USING (auth.uid() = user_id);

-- USER_PREFERENCES
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- CONTACT_MESSAGES
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can create contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can view contact messages" ON public.contact_messages;
CREATE POLICY "Authenticated users can view contact messages" ON public.contact_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- FUNCTIONS & TRIGGERS
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for venues
CREATE TRIGGER IF NOT EXISTS update_venues_updated_at BEFORE UPDATE ON public.venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for user_reviews
CREATE TRIGGER IF NOT EXISTS update_user_reviews_updated_at BEFORE UPDATE ON public.user_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for user_bookings
CREATE TRIGGER IF NOT EXISTS update_bookings_updated_at BEFORE UPDATE ON public.user_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update venue rating when reviews are added/updated
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.venues
    SET rating = (
        SELECT AVG(rating)::numeric(3,2)
        FROM public.user_reviews
        WHERE venue_id = NEW.venue_id
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM public.user_reviews
        WHERE venue_id = NEW.venue_id
    )
    WHERE id = NEW.venue_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update venue rating on review insert/update/delete
CREATE TRIGGER IF NOT EXISTS update_venue_rating_on_insert
AFTER INSERT ON public.user_reviews
FOR EACH ROW EXECUTE FUNCTION update_venue_rating();
CREATE TRIGGER IF NOT EXISTS update_venue_rating_on_update
AFTER UPDATE ON public.user_reviews
FOR EACH ROW EXECUTE FUNCTION update_venue_rating();
CREATE TRIGGER IF NOT EXISTS update_venue_rating_on_delete
AFTER DELETE ON public.user_reviews
FOR EACH ROW EXECUTE FUNCTION update_venue_rating();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''))
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to save user preferences
CREATE OR REPLACE FUNCTION public.save_user_preferences(
  target_user_id uuid,
  user_preferences jsonb,
  is_completed boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  result_record record;
BEGIN
  UPDATE public.user_preferences
  SET preferences = user_preferences, completed = is_completed, updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO result_record;
  IF NOT FOUND THEN
    INSERT INTO public.user_preferences (user_id, preferences, completed)
    VALUES (target_user_id, user_preferences, is_completed)
    RETURNING * INTO result_record;
  END IF;
  RETURN row_to_json(result_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user preferences with profile
CREATE OR REPLACE FUNCTION public.get_user_preferences_with_profile()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'profile', p,
    'preferences', up.preferences,
    'completed', up.completed
  )
  INTO result
  FROM public.profiles p
  LEFT JOIN public.user_preferences up ON p.user_id = up.user_id
  WHERE p.user_id = auth.uid();
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user needs to fill preferences form
CREATE OR REPLACE FUNCTION public.user_needs_preferences_form()
RETURNS boolean AS $$
DECLARE
  needs_form boolean := true;
BEGIN
  SELECT NOT COALESCE(up.completed, false) INTO needs_form
  FROM public.user_preferences up
  WHERE up.user_id = auth.uid();
  RETURN needs_form;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile status update on preferences completion
CREATE OR REPLACE FUNCTION public.update_profile_status_on_preferences()
RETURNS trigger AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    UPDATE public.profiles 
    SET profile_status = 'complete', updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_preferences_completed ON public.user_preferences;
CREATE TRIGGER on_preferences_completed
  AFTER INSERT OR UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_status_on_preferences();

-- Remove password column and index for Supabase Auth
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password;
DROP INDEX IF EXISTS idx_profiles_email_password;

-- Ensure phone column exists and is not unique
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
-- Remove unique constraint on phone if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_type = 'UNIQUE' AND constraint_name = 'profiles_phone_key'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_phone_key;
  END IF;
END $$; 