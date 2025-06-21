/*
  # Complete User Flow and Preferences System

  1. Enhanced User Preferences
    - Comprehensive user_preferences table with JSONB storage
    - Support for both venue seekers and venue owners
    - Profile completion tracking

  2. Improved Profile Management
    - Profile status tracking (incomplete/complete)
    - Better role management
    - Enhanced Google OAuth integration

  3. Security and Performance
    - Proper RLS policies
    - Optimized indexes
    - Secure functions for data access
*/

-- Ensure user_preferences table exists with proper structure
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_completed ON public.user_preferences(completed);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON public.user_preferences(updated_at);

-- Add profile_status column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'profile_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_status text DEFAULT 'incomplete';
  END IF;
END $$;

-- Enable RLS on user_preferences table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- Create comprehensive RLS policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create or replace function to update profile status when preferences are completed
CREATE OR REPLACE FUNCTION public.update_profile_status_on_preferences()
RETURNS trigger AS $$
BEGIN
  -- Update profile status when preferences are marked as completed
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    UPDATE public.profiles 
    SET 
      profile_status = 'complete',
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating profile status
DROP TRIGGER IF EXISTS on_preferences_completed ON public.user_preferences;
CREATE TRIGGER on_preferences_completed
  AFTER INSERT OR UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_status_on_preferences();

-- Create function to save user preferences with validation
CREATE OR REPLACE FUNCTION public.save_user_preferences(
  target_user_id uuid,
  user_preferences jsonb,
  is_completed boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  result_record record;
BEGIN
  -- Upsert user preferences
  INSERT INTO public.user_preferences (
    user_id,
    preferences,
    completed,
    updated_at
  )
  VALUES (
    target_user_id,
    user_preferences,
    is_completed,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    preferences = EXCLUDED.preferences,
    completed = EXCLUDED.completed,
    updated_at = EXCLUDED.updated_at
  RETURNING * INTO result_record;
  
  -- Update user role based on preferences if specified
  IF user_preferences ? 'primary_purpose' THEN
    UPDATE public.profiles
    SET 
      role = CASE 
        WHEN user_preferences->>'primary_purpose' = 'register_venue' THEN 'owner'::user_role
        ELSE 'user'::user_role
      END,
      profile_status = CASE WHEN is_completed THEN 'complete' ELSE 'incomplete' END,
      updated_at = now()
    WHERE user_id = target_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'preferences', row_to_json(result_record)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user preferences with profile info
CREATE OR REPLACE FUNCTION public.get_user_preferences_with_profile(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  user_prefs jsonb;
  user_profile jsonb;
  result jsonb;
BEGIN
  -- Get user preferences
  SELECT preferences INTO user_prefs
  FROM public.user_preferences
  WHERE user_id = target_user_id AND completed = true
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Get user profile
  SELECT row_to_json(profiles.*) INTO user_profile
  FROM public.profiles
  WHERE user_id = target_user_id;
  
  -- Build result
  result := jsonb_build_object(
    'preferences', COALESCE(user_prefs, '{}'::jsonb),
    'profile', COALESCE(user_profile, '{}'::jsonb),
    'has_preferences', (user_prefs IS NOT NULL)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user needs to complete preferences
CREATE OR REPLACE FUNCTION public.user_needs_preferences_form(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  profile_record record;
  has_prefs boolean;
BEGIN
  -- Get user profile
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE user_id = target_user_id;
  
  -- Check if user has completed preferences
  SELECT EXISTS(
    SELECT 1 FROM public.user_preferences
    WHERE user_id = target_user_id AND completed = true
  ) INTO has_prefs;
  
  -- User needs preferences form if:
  -- 1. They have a role (not null)
  -- 2. But their profile_status is incomplete or null
  -- 3. And they don't have completed preferences
  RETURN (
    profile_record.role IS NOT NULL AND
    (profile_record.profile_status IS NULL OR profile_record.profile_status = 'incomplete') AND
    NOT has_prefs
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_status_on_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_preferences_with_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_needs_preferences_form TO authenticated;

-- Update existing demo users to have proper initial state
UPDATE public.profiles 
SET 
  profile_status = 'complete',
  updated_at = now()
WHERE email IN (
  'user@example.com',
  'owner@example.com', 
  'admin@venuefinder.com',
  'superadmin@venuefinder.com'
) AND (profile_status IS NULL OR profile_status = 'incomplete');

-- Create sample preferences for demo users
DO $$
DECLARE
  demo_user_id uuid;
  demo_owner_id uuid;
BEGIN
  -- Get demo user IDs
  SELECT user_id INTO demo_user_id FROM public.profiles WHERE email = 'user@example.com';
  SELECT user_id INTO demo_owner_id FROM public.profiles WHERE email = 'owner@example.com';
  
  -- Create preferences for demo user (venue seeker)
  IF demo_user_id IS NOT NULL THEN
    INSERT INTO public.user_preferences (user_id, preferences, completed)
    VALUES (
      demo_user_id,
      jsonb_build_object(
        'primary_purpose', 'find_venues',
        'event_types', ARRAY['Wedding', 'Birthday Party', 'Corporate Event'],
        'preferred_locations', ARRAY['Mumbai', 'Delhi', 'Bangalore'],
        'max_budget', 50000,
        'typical_capacity', 100,
        'preferred_amenities', ARRAY['Parking', 'AC', 'Sound System'],
        'booking_frequency', '2-3 times a year'
      ),
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Create preferences for demo owner (venue owner)
  IF demo_owner_id IS NOT NULL THEN
    INSERT INTO public.user_preferences (user_id, preferences, completed)
    VALUES (
      demo_owner_id,
      jsonb_build_object(
        'primary_purpose', 'register_venue',
        'venue_name', 'Demo Elite Venue',
        'venue_type', 'Banquet Hall',
        'venue_address', '123 Demo Street, Demo City, Demo State 123456',
        'contact_phone', '+91-9876543210',
        'contact_email', 'contact@demovenue.com',
        'max_capacity', 200,
        'price_range_min', 2000,
        'price_range_max', 8000,
        'available_amenities', ARRAY['Parking', 'AC', 'Sound System', 'Stage', 'Kitchen'],
        'operating_hours_start', '09:00',
        'operating_hours_end', '23:00',
        'venue_description', 'A premium demo venue perfect for all your event needs.'
      ),
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If demo data creation fails, continue
    NULL;
END $$;

-- Create index on profile_status for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_profile_status ON public.profiles(profile_status);

-- Ensure all necessary permissions are granted
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;