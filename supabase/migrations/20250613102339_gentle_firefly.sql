-- Create user_preferences table for storing detailed user preferences
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

-- Create RLS policies for user_preferences
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

-- Create function to update profile status when preferences are completed
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_status_on_preferences TO authenticated;

-- Update existing demo users to have incomplete status initially
UPDATE public.profiles 
SET profile_status = 'incomplete'
WHERE email IN (
  'user@example.com',
  'owner@example.com', 
  'admin@venuefinder.com',
  'superadmin@venuefinder.com'
) AND profile_status IS NULL;

-- Create function to get user preferences with fallback
CREATE OR REPLACE FUNCTION public.get_user_preferences(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  user_prefs jsonb;
BEGIN
  SELECT preferences INTO user_prefs
  FROM public.user_preferences
  WHERE user_id = target_user_id AND completed = true
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Return empty object if no preferences found
  RETURN COALESCE(user_prefs, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_preferences TO authenticated;

-- Create function to check if user has completed preferences
CREATE OR REPLACE FUNCTION public.has_completed_preferences(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.user_preferences
    WHERE user_id = target_user_id AND completed = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.has_completed_preferences TO authenticated;