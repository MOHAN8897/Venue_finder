# Venue Finder - Complete SQL Database Setup

This file contains all the necessary SQL commands for setting up a complete Venue Finder database with authentication, user profiles, preferences, wishlist, and favorites.

## 🚀 Complete Database Setup

### 1. User Profiles Table (Enhanced)

-- Create user_profiles table to store additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{
        "email_notifications": true,
        "sms_notifications": false,
        "marketing_emails": true,
        "booking_reminders": true,
        "new_venue_alerts": true
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, phone, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

### 2. Venues Table (Enhanced with all required fields)

-- Enhanced table for storing listed venues with comprehensive fields
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  venue_type text NOT NULL CHECK (venue_type IN ('cricket-box', 'farmhouse', 'banquet-hall', 'sports-complex', 'party-hall', 'conference-room')),
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  latitude numeric,
  longitude numeric,
  capacity integer NOT NULL,
  area text NOT NULL,
  hourly_rate integer NOT NULL,
  daily_rate integer,
  specific_options jsonb,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  image_urls text[],
  video_urls text[],
  amenities text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_approved boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Create policies for venues
CREATE POLICY "Anyone can view approved and active venues" ON venues
    FOR SELECT USING (is_approved = true AND is_active = true);

CREATE POLICY "Users can view their own venues" ON venues
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create venues" ON venues
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own venues" ON venues
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own venues" ON venues
    FOR DELETE USING (auth.uid() = owner_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_rating ON venues(rating DESC);
CREATE INDEX IF NOT EXISTS idx_venues_created_at ON venues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_is_approved ON venues(is_approved);
CREATE INDEX IF NOT EXISTS idx_venues_is_active ON venues(is_active);
CREATE INDEX IF NOT EXISTS idx_venues_is_featured ON venues(is_featured);

### 3. User Favorites Table

-- Create user_favorites table for wishlist functionality
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, venue_id)
);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user_favorites
CREATE POLICY "Users can view their own favorites" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_venue_id ON user_favorites(venue_id);

### 4. User Reviews Table

-- Create user_reviews table for venue reviews and ratings
CREATE TABLE IF NOT EXISTS user_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, venue_id)
);

-- Enable RLS
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for user_reviews
CREATE POLICY "Anyone can view reviews" ON user_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON user_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON user_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON user_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_reviews_venue_id ON user_reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_rating ON user_reviews(rating);

### 5. Bookings Table (Enhanced)

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Venue owners can view bookings for their venues" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM venues 
            WHERE venues.id = bookings.venue_id 
            AND venues.owner_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Venue owners can update bookings for their venues" ON bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM venues 
            WHERE venues.id = bookings.venue_id 
            AND venues.owner_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON bookings(start_date);

### 6. Contact Messages Table

-- Table for storing contact us messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contact messages
CREATE POLICY "Anyone can create contact messages" ON contact_messages
    FOR INSERT WITH CHECK (true);

-- Only allow authenticated users to view contact messages (for admin purposes)
CREATE POLICY "Authenticated users can view contact messages" ON contact_messages
    FOR SELECT USING (auth.role() = 'authenticated');

### 7. Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for venues
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for user_reviews
CREATE TRIGGER update_user_reviews_updated_at BEFORE UPDATE ON user_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for bookings
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update venue rating when reviews are added/updated
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE venues 
    SET 
        rating = (
            SELECT AVG(rating)::numeric(3,2)
            FROM user_reviews 
            WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM user_reviews 
            WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
        )
    WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for venue rating updates
CREATE TRIGGER update_venue_rating_on_review_insert
    AFTER INSERT ON user_reviews
    FOR EACH ROW EXECUTE FUNCTION update_venue_rating();

CREATE TRIGGER update_venue_rating_on_review_update
    AFTER UPDATE ON user_reviews
    FOR EACH ROW EXECUTE FUNCTION update_venue_rating();

CREATE TRIGGER update_venue_rating_on_review_delete
    AFTER DELETE ON user_reviews
    FOR EACH ROW EXECUTE FUNCTION update_venue_rating();

### 8. Storage Buckets Setup

-- Create bucket for venue images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('venue-images', 'venue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for venue videos  
INSERT INTO storage.buckets (id, name, public) 
VALUES ('venue-videos', 'venue-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for venue-images bucket
CREATE POLICY "Public Access to venue images" ON storage.objects 
    FOR SELECT USING (bucket_id = 'venue-images');

CREATE POLICY "Authenticated users can upload venue images" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

CREATE POLICY "Venue owners can update their venue images" ON storage.objects 
    FOR UPDATE USING (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

CREATE POLICY "Venue owners can delete their venue images" ON storage.objects 
    FOR DELETE USING (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

-- Set up storage policies for venue-videos bucket
CREATE POLICY "Public Access to venue videos" ON storage.objects 
    FOR SELECT USING (bucket_id = 'venue-videos');

CREATE POLICY "Authenticated users can upload venue videos" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'venue-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Venue owners can update their venue videos" ON storage.objects 
    FOR UPDATE USING (bucket_id = 'venue-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Venue owners can delete their venue videos" ON storage.objects 
    FOR DELETE USING (bucket_id = 'venue-videos' AND auth.role() = 'authenticated');

-- Set up storage policies for user-avatars bucket
CREATE POLICY "Public Access to user avatars" ON storage.objects 
    FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatar" ON storage.objects 
    FOR UPDATE USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own avatar" ON storage.objects 
    FOR DELETE USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

## 🔐 Google OAuth Setup Instructions

### Step 1: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Identity API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (for development)
7. Copy the Client ID and Client Secret

### Step 2: Supabase Configuration
1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Providers"
3. Enable Google provider
4. Enter your Google Client ID and Client Secret
5. Save the configuration

### Step 3: Environment Variables
Add these to your `.env.local` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📧 Email Authentication Setup

### Step 1: Supabase Email Settings
1. Go to Supabase Dashboard → "Authentication" → "Settings"
2. Configure email templates for:
   - Email confirmation
   - Password reset
   - Magic link
3. Set up SMTP settings if you want custom email sending

### Step 2: Email Confirmation
- Users will receive confirmation emails when they sign up
- Email confirmation is required by default
- You can disable this in Supabase settings if needed

## 🧪 Testing the Setup

### Test Google OAuth
1. Run your application
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify user profile is created in database

### Test Email Authentication
1. Try signing up with email/password
2. Check for confirmation email
3. Verify user profile creation
4. Test password reset functionality

## 📊 Database Queries for User Management

### Get User Profile with Stats

SELECT 
    up.*,
    COUNT(DISTINCT uf.venue_id) as favorite_count,
    COUNT(DISTINCT b.id) as booking_count,
    COUNT(DISTINCT ur.id) as review_count
FROM user_profiles up
LEFT JOIN user_favorites uf ON up.id = uf.user_id
LEFT JOIN bookings b ON up.id = b.user_id
LEFT JOIN user_reviews ur ON up.id = ur.user_id
WHERE up.id = auth.uid()
GROUP BY up.id;

### Get User Favorites

SELECT 
    v.*,
    uf.created_at as favorited_at
FROM user_favorites uf
JOIN venues v ON uf.venue_id = v.id
WHERE uf.user_id = auth.uid()
ORDER BY uf.created_at DESC;

### Get User Bookings

SELECT 
    b.*,
    v.name as venue_name,
    v.address as venue_address,
    v.image_urls[1] as venue_image
FROM bookings b
JOIN venues v ON b.venue_id = v.id
WHERE b.user_id = auth.uid()
ORDER BY b.created_at DESC;

### Get User Reviews

SELECT 
    ur.*,
    v.name as venue_name,
    v.address as venue_address
FROM user_reviews ur
JOIN venues v ON ur.venue_id = v.id
WHERE ur.user_id = auth.uid()
ORDER BY ur.created_at DESC;

### Get User's Venues

SELECT 
    v.*,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT ur.id) as total_reviews
FROM venues v
LEFT JOIN bookings b ON v.id = b.venue_id
LEFT JOIN user_reviews ur ON v.id = ur.venue_id
WHERE v.owner_id = auth.uid()
GROUP BY v.id
ORDER BY v.created_at DESC;

## 🔍 Verification Queries

### Check if tables were created successfully

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'venues', 'user_favorites', 'user_reviews', 'bookings', 'contact_messages');

### Check RLS policies

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND table_name IN ('user_profiles', 'venues', 'user_favorites', 'user_reviews', 'bookings', 'contact_messages');

### Check storage buckets

-- Check storage buckets exist
SELECT * FROM storage.buckets WHERE id IN ('venue-images', 'venue-videos', 'user-avatars');

## ✅ Complete Feature List

This setup provides:
- ✅ Google OAuth authentication
- ✅ Email/password authentication
- ✅ User profiles with preferences
- ✅ Wishlist/favorites functionality
- ✅ User reviews and ratings
- ✅ Booking system
- ✅ File uploads for images/videos
- ✅ Row Level Security (RLS)
- ✅ Automatic profile creation
- ✅ Rating calculations
- ✅ Complete user dashboard data
- ✅ Notification settings
- ✅ User preferences storage
- ✅ Secure file storage
- ✅ Real-time data updates
- ✅ Contact form functionality
- ✅ Venue management for owners
- ✅ Booking management
- ✅ Review system
- ✅ Dashboard statistics
- ✅ Venue type validation
- ✅ Amenities support
- ✅ Featured venues functionality
- ✅ Venue approval system

## 🚨 Important Notes

1. **Run SQL commands in order** - The tables have dependencies, so run them in the sequence provided
2. **Check for errors** - If any command fails, check the error message and fix the issue before continuing
3. **Test thoroughly** - After setup, test all features to ensure they work correctly
4. **Backup your data** - Before making changes to production, always backup your existing data
5. **Monitor logs** - Check Supabase logs for any authentication or database errors

## 🔧 Troubleshooting

### Common Issues:
1. **RLS Policy Errors**: Make sure all policies are created correctly
2. **Storage Bucket Errors**: Verify bucket names match exactly
3. **Trigger Errors**: Check if functions exist before creating triggers
4. **Permission Errors**: Ensure authenticated users have proper permissions

### Reset Database (Development Only):

-- Drop all tables (WARNING: This will delete all data)
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS user_reviews CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_venue_rating() CASCADE;

Then re-run all the SQL commands above.