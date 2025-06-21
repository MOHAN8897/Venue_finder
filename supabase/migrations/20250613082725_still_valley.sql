-- Enhanced authentication and security features

-- Create function to log authentication attempts
CREATE OR REPLACE FUNCTION log_auth_attempt(
  user_email text,
  attempt_type text,
  success boolean,
  ip_address text DEFAULT NULL,
  user_agent text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO auth_logs (
    email,
    attempt_type,
    success,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    user_email,
    attempt_type,
    success,
    ip_address,
    user_agent,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth_logs table for tracking authentication attempts
CREATE TABLE IF NOT EXISTS auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempt_type text NOT NULL, -- 'login', 'register', 'password_reset', 'otp_verify'
  success boolean NOT NULL,
  ip_address text,
  user_agent text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for auth_logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_email ON auth_logs(email);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_attempt_type ON auth_logs(attempt_type);

-- Create password_reset_tokens table for OTP management
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for password_reset_tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Create function to generate and store OTP
CREATE OR REPLACE FUNCTION generate_password_reset_token(user_email text)
RETURNS text AS $$
DECLARE
  new_token text;
BEGIN
  -- Generate 6-digit OTP
  new_token := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
  
  -- Invalidate any existing tokens for this email
  UPDATE password_reset_tokens 
  SET used = true 
  WHERE email = user_email AND used = false;
  
  -- Insert new token
  INSERT INTO password_reset_tokens (email, token, expires_at)
  VALUES (user_email, new_token, now() + interval '10 minutes');
  
  RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify OTP
CREATE OR REPLACE FUNCTION verify_password_reset_token(user_email text, input_token text)
RETURNS boolean AS $$
DECLARE
  token_record password_reset_tokens%ROWTYPE;
BEGIN
  -- Get the token record
  SELECT * INTO token_record
  FROM password_reset_tokens
  WHERE email = user_email 
    AND token = input_token 
    AND used = false 
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check attempt limit
  IF token_record.attempts >= 3 THEN
    -- Mark as used to prevent further attempts
    UPDATE password_reset_tokens 
    SET used = true 
    WHERE id = token_record.id;
    RETURN false;
  END IF;
  
  -- Increment attempts
  UPDATE password_reset_tokens 
  SET attempts = attempts + 1 
  WHERE id = token_record.id;
  
  -- Mark as used since verification was successful
  UPDATE password_reset_tokens 
  SET used = true 
  WHERE id = token_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < now() - interval '1 day';
  
  DELETE FROM auth_logs 
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(user_email text, attempt_type text, time_window interval DEFAULT '15 minutes', max_attempts integer DEFAULT 5)
RETURNS boolean AS $$
DECLARE
  attempt_count integer;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM auth_logs
  WHERE email = user_email 
    AND attempt_type = check_rate_limit.attempt_type
    AND success = false
    AND created_at > now() - time_window;
  
  RETURN attempt_count < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced user profile trigger with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role user_role;
  user_name text;
BEGIN
  -- Extract and validate role
  BEGIN
    user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role);
  EXCEPTION WHEN OTHERS THEN
    user_role := 'user'::user_role;
  END;
  
  -- Extract name with fallbacks
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Insert profile with comprehensive error handling
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
      google_id,
      verified
    )
    VALUES (
      NEW.id,
      NEW.email,
      user_name,
      COALESCE(NEW.raw_user_meta_data->>'phone', null),
      user_role,
      COALESCE(NEW.raw_user_meta_data->>'business_name', null),
      COALESCE(NEW.raw_user_meta_data->>'description', null),
      COALESCE(
        NEW.raw_user_meta_data->>'picture',
        NEW.raw_user_meta_data->>'avatar_url',
        null
      ),
      COALESCE(NEW.raw_user_meta_data->>'sub', null),
      CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
    );
    
    -- Log successful registration
    PERFORM log_auth_attempt(NEW.email, 'register', true);
    
  EXCEPTION WHEN OTHERS THEN
    -- Log failed registration
    PERFORM log_auth_attempt(NEW.email, 'register', false);
    RAISE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for new tables
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only super admins can view auth logs
CREATE POLICY "Super admins can view auth logs" ON auth_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- No direct access to password reset tokens (only through functions)
CREATE POLICY "No direct access to reset tokens" ON password_reset_tokens FOR ALL USING (false);

-- Create scheduled job to clean up expired tokens (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

-- Add some default test data for development
DO $$
BEGIN
  -- Only insert if no super admin exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@venuefinder.com') THEN
    -- This would typically be done through the application signup flow
    -- but we're adding it here for development purposes
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'superadmin@venuefinder.com',
      crypt('superadmin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"name": "Super Admin", "role": "super_admin"}',
      false
    );
  END IF;
END $$;

-- Add email templates table for customizable email content
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL UNIQUE, -- 'welcome', 'password_reset', 'otp', 'venue_approved', etc.
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text NOT NULL,
  variables jsonb DEFAULT '{}', -- Available template variables
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default email templates
INSERT INTO email_templates (template_type, subject, html_content, text_content, variables) VALUES
('password_reset_otp', 'Password Reset Code - VenueFinder', 
 '<h2>Password Reset Request</h2><p>Your password reset code is: <strong>{{otp}}</strong></p><p>This code will expire in 10 minutes.</p>',
 'Your password reset code is: {{otp}}. This code will expire in 10 minutes.',
 '{"otp": "6-digit code"}'),
('welcome', 'Welcome to VenueFinder!',
 '<h2>Welcome to VenueFinder, {{name}}!</h2><p>Thank you for joining our platform. Start exploring amazing venues today!</p>',
 'Welcome to VenueFinder, {{name}}! Thank you for joining our platform.',
 '{"name": "User name"}'),
('venue_approved', 'Your Venue Has Been Approved!',
 '<h2>Congratulations {{owner_name}}!</h2><p>Your venue "{{venue_name}}" has been approved and is now live on VenueFinder.</p>',
 'Congratulations {{owner_name}}! Your venue "{{venue_name}}" has been approved.',
 '{"owner_name": "Owner name", "venue_name": "Venue name"}')
ON CONFLICT (template_type) DO NOTHING;

-- Enable RLS for email templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage email templates
CREATE POLICY "Super admins can manage email templates" ON email_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Anyone can read active email templates (for sending emails)
CREATE POLICY "Anyone can read active email templates" ON email_templates FOR SELECT USING (active = true);