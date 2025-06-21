/*
  # Enhanced User Authentication and Profile Management

  1. Updates
    - Enhanced handle_new_user function to capture comprehensive Google OAuth data
    - Added profile sync functionality for Google profile updates
    - Improved data extraction from raw_user_meta_data

  2. Security
    - Functions use SECURITY DEFINER for proper permissions
    - Triggers ensure data consistency across auth and profiles tables

  3. Features
    - Automatic profile picture sync from Google
    - Business information capture for venue owners
    - Google ID storage for future reference
    - Real-time profile updates when Google data changes
*/

-- Drop triggers first (they depend on the functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS sync_google_profile_updates();

-- Enhanced function to handle new user signup with comprehensive data extraction
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email, 
    name, 
    phone, 
    role, 
    business_name, 
    description, 
    profile_picture, 
    google_id
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'name', 
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    COALESCE(new.raw_user_meta_data->>'phone', null),
    COALESCE(
      (new.raw_user_meta_data->>'role')::user_role, 
      'user'::user_role
    ),
    COALESCE(new.raw_user_meta_data->>'business_name', null),
    COALESCE(new.raw_user_meta_data->>'description', null),
    COALESCE(
      new.raw_user_meta_data->>'picture',
      new.raw_user_meta_data->>'avatar_url',
      null
    ),
    COALESCE(new.raw_user_meta_data->>'sub', null)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync Google profile updates
CREATE OR REPLACE FUNCTION sync_google_profile_updates()
RETURNS trigger AS $$
BEGIN
  -- Update profile picture and name if they've changed from Google
  IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
    UPDATE public.profiles 
    SET 
      name = COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        profiles.name
      ),
      profile_picture = COALESCE(
        NEW.raw_user_meta_data->>'picture',
        NEW.raw_user_meta_data->>'avatar_url',
        profiles.profile_picture
      ),
      updated_at = now()
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the triggers (after functions are created)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_google_profile_updates();