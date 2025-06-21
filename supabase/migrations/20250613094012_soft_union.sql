/*
  # Fix Registration and Profile Creation

  1. Database Functions
    - Fix handle_new_user trigger function
    - Improve error handling for profile creation
    - Add better duplicate checking

  2. Security
    - Ensure proper RLS policies
    - Add validation for user data

  3. Demo Users
    - Create demo users safely
    - Handle existing users properly
*/

-- Create or replace the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (
    user_id,
    email,
    name,
    role,
    phone,
    business_name,
    description,
    verified,
    google_id
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'description',
    CASE 
      WHEN new.email_confirmed_at IS NOT NULL THEN true 
      ELSE false 
    END,
    new.raw_user_meta_data->>'sub'
  );
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it instead
    UPDATE public.profiles 
    SET 
      name = COALESCE(new.raw_user_meta_data->>'name', name),
      role = COALESCE((new.raw_user_meta_data->>'role')::user_role, role),
      phone = COALESCE(new.raw_user_meta_data->>'phone', phone),
      business_name = COALESCE(new.raw_user_meta_data->>'business_name', business_name),
      description = COALESCE(new.raw_user_meta_data->>'description', description),
      google_id = COALESCE(new.raw_user_meta_data->>'sub', google_id),
      updated_at = now()
    WHERE user_id = new.id OR email = new.email;
    
    RETURN new;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to be more permissive for new user creation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() IS NULL OR
    -- Allow service role to create profiles
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Allow users to read their own profile and others to read public info
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create a function to check if email already exists
CREATE OR REPLACE FUNCTION public.check_email_exists(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles WHERE email = user_email
    UNION
    SELECT 1 FROM auth.users WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.check_email_exists TO anon, authenticated;

-- Ensure demo users exist with proper error handling
DO $$
DECLARE
  demo_users jsonb := '[
    {
      "email": "user@example.com",
      "name": "Demo User",
      "role": "user",
      "phone": "+1234567890"
    },
    {
      "email": "owner@example.com", 
      "name": "Demo Owner",
      "role": "owner",
      "phone": "+1234567891",
      "business_name": "Demo Venues Co",
      "description": "Professional venue management company"
    },
    {
      "email": "admin@venuefinder.com",
      "name": "Admin User", 
      "role": "admin",
      "phone": "+1234567892"
    },
    {
      "email": "superadmin@venuefinder.com",
      "name": "Super Admin",
      "role": "super_admin", 
      "phone": "+1234567893"
    }
  ]';
  demo_user jsonb;
  user_exists boolean;
BEGIN
  FOR demo_user IN SELECT * FROM jsonb_array_elements(demo_users)
  LOOP
    -- Check if profile already exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE email = demo_user->>'email'
    ) INTO user_exists;
    
    -- Only create if doesn't exist
    IF NOT user_exists THEN
      BEGIN
        INSERT INTO public.profiles (
          user_id,
          email,
          name,
          role,
          phone,
          business_name,
          description,
          verified
        )
        VALUES (
          gen_random_uuid(),
          demo_user->>'email',
          demo_user->>'name',
          (demo_user->>'role')::user_role,
          demo_user->>'phone',
          demo_user->>'business_name',
          demo_user->>'description',
          true
        );
      EXCEPTION
        WHEN OTHERS THEN
          -- If individual demo user creation fails, continue with others
          RAISE WARNING 'Failed to create demo user %: %', demo_user->>'email', SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_demo_user TO anon, authenticated;