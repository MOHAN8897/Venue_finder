-- Enhanced Google OAuth and Role Selection Setup

-- Update the handle_new_user function to better handle Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile for new user with enhanced Google OAuth support
  INSERT INTO public.profiles (
    user_id,
    email,
    name,
    role,
    phone,
    business_name,
    description,
    verified,
    google_id,
    profile_picture
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name', 
      split_part(new.email, '@', 1)
    ),
    -- For Google OAuth users, don't set a default role - let them choose
    CASE 
      WHEN new.app_metadata->>'provider' = 'google' THEN NULL
      ELSE COALESCE((new.raw_user_meta_data->>'role')::user_role, 'user'::user_role)
    END,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'description',
    CASE 
      WHEN new.email_confirmed_at IS NOT NULL THEN true 
      WHEN new.app_metadata->>'provider' = 'google' THEN true -- Google users are pre-verified
      ELSE false 
    END,
    new.raw_user_meta_data->>'sub',
    new.raw_user_meta_data->>'picture'
  );
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it instead
    UPDATE public.profiles 
    SET 
      name = COALESCE(
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'full_name',
        name
      ),
      profile_picture = COALESCE(new.raw_user_meta_data->>'picture', profile_picture),
      google_id = COALESCE(new.raw_user_meta_data->>'sub', google_id),
      verified = CASE 
        WHEN new.app_metadata->>'provider' = 'google' THEN true
        WHEN new.email_confirmed_at IS NOT NULL THEN true
        ELSE verified
      END,
      updated_at = now()
    WHERE user_id = new.id OR email = new.email;
    
    RETURN new;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user role (for role selection)
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id uuid,
  new_role user_role
)
RETURNS jsonb AS $$
DECLARE
  updated_profile record;
BEGIN
  -- Update the user's role
  UPDATE public.profiles 
  SET 
    role = new_role,
    updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO updated_profile;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profile not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'profile', row_to_json(updated_profile)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.update_user_role TO authenticated;

-- Update RLS policies to handle role selection
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO public
  USING (
    auth.uid() = user_id OR
    -- Allow updating role for new users who don't have one yet
    (auth.uid() = user_id AND role IS NULL)
  )
  WITH CHECK (
    auth.uid() = user_id OR
    -- Allow setting role for new users
    (auth.uid() = user_id AND role IS NULL)
  );

-- Create a policy for role selection
DROP POLICY IF EXISTS "Users can select initial role" ON public.profiles;
CREATE POLICY "Users can select initial role"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND role IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Ensure the profiles table has the correct structure
DO $$
BEGIN
  -- Add profile_picture column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'profile_picture'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_picture text;
  END IF;
  
  -- Add google_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'google_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN google_id text;
  END IF;
END $$;

-- Create index on google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON public.profiles(google_id);

-- Update demo users to have proper structure
UPDATE public.profiles 
SET 
  verified = true,
  updated_at = now()
WHERE email IN (
  'user@example.com',
  'owner@example.com', 
  'admin@venuefinder.com',
  'superadmin@venuefinder.com'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role TO authenticated;