/*
  # VenueFinder Database Schema

  1. New Tables
    - `profiles` - User profiles with role-based access
    - `venues` - Venue listings with detailed information
    - `venue_slots` - Available time slots for venues
    - `bookings` - User bookings with payment status
    - `favorites` - User favorite venues
    - `venue_amenities` - Junction table for venue amenities
    - `amenities` - Master list of available amenities
    - `reviews` - User reviews for venues
    - `admin_logs` - Admin activity tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure admin operations

  3. Functions
    - Auto-create profile on user signup
    - Update venue ratings based on reviews
    - Generate booking statistics
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'owner', 'admin', 'super_admin');
CREATE TYPE venue_type AS ENUM ('cricket-box', 'farmhouse', 'banquet-hall', 'sports-complex', 'party-hall', 'conference-room');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE venue_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');

-- Profiles table
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

-- Amenities master table
CREATE TABLE IF NOT EXISTS amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text,
  category text,
  created_at timestamptz DEFAULT now()
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  type venue_type NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  images text[] DEFAULT '{}',
  videos text[] DEFAULT '{}',
  capacity integer NOT NULL,
  area text NOT NULL,
  dimensions text,
  hourly_rate decimal(10, 2) NOT NULL,
  currency text DEFAULT 'INR',
  rating decimal(3, 2) DEFAULT 0,
  review_count integer DEFAULT 0,
  status venue_status DEFAULT 'pending',
  verified boolean DEFAULT false,
  contact_name text,
  contact_phone text,
  contact_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Venue amenities junction table
CREATE TABLE IF NOT EXISTS venue_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  amenity_id uuid REFERENCES amenities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, amenity_id)
);

-- Venue slots table
CREATE TABLE IF NOT EXISTS venue_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  available boolean DEFAULT true,
  price decimal(10, 2) NOT NULL,
  booked_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, date, start_time)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  slot_ids uuid[] NOT NULL,
  total_amount decimal(10, 2) NOT NULL,
  booking_status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  event_date date NOT NULL,
  event_duration text,
  special_requests text,
  payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, venue_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Venues policies
CREATE POLICY "Anyone can view approved venues" ON venues FOR SELECT USING (status = 'approved');
CREATE POLICY "Owners can view own venues" ON venues FOR SELECT USING (
  owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Owners can insert venues" ON venues FOR INSERT WITH CHECK (
  owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'owner')
);
CREATE POLICY "Owners can update own venues" ON venues FOR UPDATE USING (
  owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all venues" ON venues FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Venue amenities policies
CREATE POLICY "Anyone can view venue amenities" ON venue_amenities FOR SELECT USING (true);
CREATE POLICY "Venue owners can manage amenities" ON venue_amenities FOR ALL USING (
  venue_id IN (
    SELECT id FROM venues WHERE owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Venue slots policies
CREATE POLICY "Anyone can view available slots" ON venue_slots FOR SELECT USING (true);
CREATE POLICY "Venue owners can manage slots" ON venue_slots FOR ALL USING (
  venue_id IN (
    SELECT id FROM venues WHERE owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Venue owners can view venue bookings" ON bookings FOR SELECT USING (
  venue_id IN (
    SELECT id FROM venues WHERE owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Favorites policies
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Admin logs policies
CREATE POLICY "Admins can view logs" ON admin_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can create logs" ON admin_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Amenities policies
CREATE POLICY "Anyone can view amenities" ON amenities FOR SELECT USING (true);
CREATE POLICY "Admins can manage amenities" ON amenities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update venue ratings
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE venues 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM reviews 
      WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM reviews 
      WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
    )
  WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for rating updates
CREATE OR REPLACE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_venue_rating();

-- Insert default amenities
INSERT INTO amenities (name, icon, category) VALUES
('WiFi', 'wifi', 'connectivity'),
('Parking', 'car', 'convenience'),
('AC', 'snowflake', 'comfort'),
('Security', 'shield', 'safety'),
('Washrooms', 'bath', 'facilities'),
('Kitchen', 'chef-hat', 'catering'),
('Sound System', 'volume-2', 'entertainment'),
('Projector', 'projector', 'technology'),
('Stage', 'music', 'entertainment'),
('Dance Floor', 'music', 'entertainment'),
('Bar', 'wine', 'catering'),
('Garden', 'trees', 'outdoor'),
('Swimming Pool', 'waves', 'recreation'),
('Gym', 'dumbbell', 'fitness'),
('Spa', 'heart', 'wellness'),
('Floodlights', 'lightbulb', 'sports'),
('Changing Rooms', 'shirt', 'facilities'),
('Equipment Storage', 'package', 'storage'),
('Seating Area', 'armchair', 'comfort'),
('Water Facility', 'droplets', 'facilities'),
('Catering Service', 'utensils', 'catering'),
('Decoration Service', 'palette', 'services'),
('Photography Area', 'camera', 'services'),
('Valet Parking', 'car', 'premium'),
('LED Lighting', 'zap', 'technology'),
('BBQ Area', 'flame', 'outdoor'),
('Bonfire Area', 'flame', 'outdoor'),
('Organic Garden', 'leaf', 'outdoor'),
('Sunset Point', 'sun', 'scenic'),
('Traditional Kitchen', 'chef-hat', 'cultural'),
('Cricket Nets', 'target', 'sports'),
('Badminton Courts', 'zap', 'sports'),
('Fitness Center', 'activity', 'fitness'),
('Locker Rooms', 'lock', 'facilities'),
('Cafeteria', 'coffee', 'dining'),
('First Aid', 'heart-pulse', 'safety'),
('International Pitch', 'target', 'sports'),
('Pavilion', 'home', 'sports'),
('Scoreboard', 'monitor', 'sports'),
('Training Nets', 'target', 'sports'),
('Equipment Room', 'package', 'sports'),
('Medical Room', 'heart-pulse', 'medical')
ON CONFLICT (name) DO NOTHING;