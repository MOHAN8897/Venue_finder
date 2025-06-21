/*
  # Complete Authentication System Migration

  1. Database Functions
    - Authentication and rate limiting functions
    - Password validation and OTP management
    - User profile creation and management
    - Security and audit logging functions

  2. Demo Data
    - Create demo users in auth.users table
    - Create corresponding profiles
    - Add email templates for notifications

  3. Security
    - Comprehensive rate limiting
    - Password strength validation
    - Input sanitization
    - Audit logging
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enhanced rate limiting function
CREATE OR REPLACE FUNCTION check_auth_rate_limit(
  user_email text, 
  attempt_type text DEFAULT 'login',
  max_attempts integer DEFAULT 5,
  time_window interval DEFAULT '15 minutes'
)
RETURNS jsonb AS $$
DECLARE
  attempt_count integer;
  last_attempt timestamptz;
  lockout_until timestamptz;
  result jsonb;
BEGIN
  -- Count failed attempts in the time window
  SELECT COUNT(*), MAX(created_at) INTO attempt_count, last_attempt
  FROM auth_logs
  WHERE email = user_email 
    AND attempt_type = check_auth_rate_limit.attempt_type
    AND success = false
    AND created_at > now() - time_window;
  
  -- Calculate lockout time if needed
  IF attempt_count >= max_attempts THEN
    lockout_until := last_attempt + time_window;
    result := jsonb_build_object(
      'allowed', false,
      'attempts_remaining', 0,
      'lockout_until', lockout_until,
      'retry_after_seconds', EXTRACT(EPOCH FROM (lockout_until - now()))
    );
  ELSE
    result := jsonb_build_object(
      'allowed', true,
      'attempts_remaining', max_attempts - attempt_count,
      'lockout_until', null,
      'retry_after_seconds', 0
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate password strength
CREATE OR REPLACE FUNCTION validate_password_strength(password text)
RETURNS jsonb AS $$
DECLARE
  score integer := 0;
  errors text[] := '{}';
  result jsonb;
BEGIN
  -- Check length
  IF length(password) >= 8 THEN
    score := score + 1;
  ELSE
    errors := array_append(errors, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check for uppercase
  IF password ~ '[A-Z]' THEN
    score := score + 1;
  ELSE
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase
  IF password ~ '[a-z]' THEN
    score := score + 1;
  ELSE
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for numbers
  IF password ~ '[0-9]' THEN
    score := score + 1;
  ELSE
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Check for special characters
  IF password ~ '[^A-Za-z0-9]' THEN
    score := score + 1;
  ELSE
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  result := jsonb_build_object(
    'score', score,
    'max_score', 5,
    'is_strong', score >= 4,
    'is_valid', score >= 3,
    'errors', errors,
    'strength', CASE 
      WHEN score < 2 THEN 'weak'
      WHEN score < 4 THEN 'medium'
      ELSE 'strong'
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sanitize input
CREATE OR REPLACE FUNCTION sanitize_input(input text, max_length integer DEFAULT 255)
RETURNS text AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Trim whitespace and limit length
  RETURN substring(trim(regexp_replace(input, '[<>]', '', 'g')), 1, max_length);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enhanced OTP management
CREATE OR REPLACE FUNCTION generate_secure_otp(user_email text, otp_type text DEFAULT 'password_reset')
RETURNS jsonb AS $$
DECLARE
  new_otp text;
  expires_at timestamptz;
  result jsonb;
BEGIN
  -- Generate 6-digit OTP
  new_otp := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
  expires_at := now() + interval '10 minutes';
  
  -- Invalidate existing OTPs for this email and type
  UPDATE password_reset_tokens 
  SET used = true 
  WHERE email = user_email AND used = false;
  
  -- Insert new OTP
  INSERT INTO password_reset_tokens (email, token, expires_at)
  VALUES (user_email, new_otp, expires_at);
  
  result := jsonb_build_object(
    'otp', new_otp,
    'expires_at', expires_at,
    'expires_in_minutes', 10
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced OTP verification with detailed response
CREATE OR REPLACE FUNCTION verify_otp_secure(user_email text, input_otp text)
RETURNS jsonb AS $$
DECLARE
  token_record password_reset_tokens%ROWTYPE;
  result jsonb;
BEGIN
  -- Get the most recent unused token
  SELECT * INTO token_record
  FROM password_reset_tokens
  WHERE email = user_email 
    AND token = input_otp 
    AND used = false
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if token exists
  IF NOT FOUND THEN
    result := jsonb_build_object(
      'valid', false,
      'error', 'invalid_otp',
      'message', 'Invalid or expired OTP'
    );
    RETURN result;
  END IF;
  
  -- Check if expired
  IF token_record.expires_at < now() THEN
    UPDATE password_reset_tokens SET used = true WHERE id = token_record.id;
    result := jsonb_build_object(
      'valid', false,
      'error', 'expired_otp',
      'message', 'OTP has expired'
    );
    RETURN result;
  END IF;
  
  -- Check attempt limit
  IF token_record.attempts >= 3 THEN
    UPDATE password_reset_tokens SET used = true WHERE id = token_record.id;
    result := jsonb_build_object(
      'valid', false,
      'error', 'too_many_attempts',
      'message', 'Too many failed attempts'
    );
    RETURN result;
  END IF;
  
  -- Mark as used and return success
  UPDATE password_reset_tokens 
  SET used = true, attempts = attempts + 1
  WHERE id = token_record.id;
  
  result := jsonb_build_object(
    'valid', true,
    'message', 'OTP verified successfully'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create comprehensive user profile
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id uuid,
  user_email text,
  user_data jsonb
)
RETURNS jsonb AS $$
DECLARE
  profile_id uuid;
  result jsonb;
BEGIN
  -- Insert profile with sanitized data
  INSERT INTO profiles (
    user_id,
    email,
    name,
    phone,
    role,
    business_name,
    description,
    profile_picture,
    google_id,
    verified
  ) VALUES (
    user_id,
    sanitize_input(user_email),
    sanitize_input(user_data->>'name'),
    sanitize_input(user_data->>'phone'),
    COALESCE((user_data->>'role')::user_role, 'user'::user_role),
    sanitize_input(user_data->>'business_name'),
    sanitize_input(user_data->>'description', 1000),
    sanitize_input(user_data->>'profile_picture'),
    sanitize_input(user_data->>'google_id'),
    COALESCE((user_data->>'verified')::boolean, false)
  ) RETURNING id INTO profile_id;
  
  result := jsonb_build_object(
    'success', true,
    'profile_id', profile_id,
    'message', 'Profile created successfully'
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to create profile'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced cleanup function
CREATE OR REPLACE FUNCTION cleanup_auth_data()
RETURNS jsonb AS $$
DECLARE
  expired_tokens integer;
  old_logs integer;
  result jsonb;
BEGIN
  -- Clean up expired tokens
  DELETE FROM password_reset_tokens 
  WHERE expires_at < now() - interval '1 day';
  GET DIAGNOSTICS expired_tokens = ROW_COUNT;
  
  -- Clean up old auth logs (keep 30 days)
  DELETE FROM auth_logs 
  WHERE created_at < now() - interval '30 days';
  GET DIAGNOSTICS old_logs = ROW_COUNT;
  
  result := jsonb_build_object(
    'expired_tokens_removed', expired_tokens,
    'old_logs_removed', old_logs,
    'cleanup_date', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create comprehensive audit log function
CREATE OR REPLACE FUNCTION log_user_activity(
  user_id uuid,
  activity_type text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_logs (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    created_at
  ) VALUES (
    user_id,
    activity_type,
    'user_activity',
    user_id,
    details || jsonb_build_object('ip_address', ip_address, 'timestamp', now()),
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create demo user with profile
CREATE OR REPLACE FUNCTION create_demo_user(
  user_email text,
  user_password text,
  user_name text,
  user_role user_role DEFAULT 'user',
  business_name text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  new_user_id uuid;
  profile_result jsonb;
  result jsonb;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Create user in auth.users table
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated'
  ) ON CONFLICT (email) DO NOTHING;
  
  -- Create profile
  INSERT INTO profiles (
    id,
    user_id,
    email,
    name,
    role,
    business_name,
    verified
  ) VALUES (
    new_user_id,
    new_user_id,
    user_email,
    user_name,
    user_role,
    business_name,
    true
  ) ON CONFLICT (email) DO NOTHING;
  
  result := jsonb_build_object(
    'success', true,
    'user_id', new_user_id,
    'message', 'Demo user created successfully'
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to create demo user'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create demo users and profiles
DO $$
DECLARE
  demo_result jsonb;
BEGIN
  -- Create demo users with profiles
  SELECT create_demo_user('user@example.com', 'user123', 'Demo User', 'user') INTO demo_result;
  SELECT create_demo_user('owner@example.com', 'owner123', 'Demo Owner', 'owner', 'Demo Venues Ltd') INTO demo_result;
  SELECT create_demo_user('admin@venuefinder.com', 'admin123', 'Demo Admin', 'admin') INTO demo_result;
  SELECT create_demo_user('superadmin@venuefinder.com', 'superadmin123', 'Super Admin', 'super_admin') INTO demo_result;
END $$;

-- Add additional email templates
INSERT INTO email_templates (template_type, subject, html_content, text_content, variables) VALUES
('password_reset', 'Password Reset - VenueFinder',
 '<h2>Password Reset Request</h2><p>Your OTP for password reset is: <strong>{{otp}}</strong></p><p>This OTP will expire in 10 minutes.</p>',
 'Your OTP for password reset is: {{otp}}. This OTP will expire in 10 minutes.',
 '{"otp": "6-digit OTP code"}'),
('email_verification', 'Verify Your Email - VenueFinder',
 '<h2>Welcome to VenueFinder!</h2><p>Please verify your email by clicking the link below:</p><p><a href="{{verification_link}}">Verify Email</a></p>',
 'Welcome to VenueFinder! Please verify your email by visiting: {{verification_link}}',
 '{"verification_link": "Verification URL"}'),
('booking_confirmation', 'Booking Confirmed - VenueFinder',
 '<h2>Booking Confirmed!</h2><p>Your booking for {{venue_name}} on {{date}} has been confirmed.</p><p>Booking ID: {{booking_id}}</p>',
 'Booking Confirmed! Your booking for {{venue_name}} on {{date}} has been confirmed. Booking ID: {{booking_id}}',
 '{"venue_name": "Venue name", "date": "Booking date", "booking_id": "Booking ID"}'),
('venue_approved', 'Venue Approved - VenueFinder',
 '<h2>Congratulations!</h2><p>Your venue "{{venue_name}}" has been approved and is now live on VenueFinder.</p>',
 'Congratulations! Your venue "{{venue_name}}" has been approved and is now live on VenueFinder.',
 '{"venue_name": "Venue name"}'),
('venue_rejected', 'Venue Application Update - VenueFinder',
 '<h2>Venue Application Status</h2><p>Unfortunately, your venue "{{venue_name}}" was not approved. Reason: {{reason}}</p>',
 'Your venue "{{venue_name}}" was not approved. Reason: {{reason}}',
 '{"venue_name": "Venue name", "reason": "Rejection reason"}')
ON CONFLICT (template_type) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_auth_logs_email_type ON auth_logs(email, attempt_type);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email_used ON password_reset_tokens(email, used);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_auth_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_password_strength TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sanitize_input TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_secure_otp TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_otp_secure TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION create_demo_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_auth_data TO authenticated;