--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'refunded',
    'failed'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'owner',
    'admin',
    'super_admin'
);


--
-- Name: venue_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.venue_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'inactive'
);


--
-- Name: venue_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.venue_type AS ENUM (
    'cricket-box',
    'farmhouse',
    'banquet-hall',
    'sports-complex',
    'party-hall',
    'conference-room'
);


--
-- Name: approve_venue(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.approve_venue(venue_uuid uuid, admin_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    venue_record public.venues;
    user_profile public.profiles;
    result jsonb;
BEGIN
    -- Get venue details
    SELECT * INTO venue_record FROM public.venues WHERE id = venue_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venue not found');
    END IF;
    
    -- Get user profile
    SELECT * INTO user_profile FROM public.profiles WHERE user_id = venue_record.submitted_by;
    
    -- Update venue status
    UPDATE public.venues 
    SET approval_status = 'approved',
        approval_date = now(),
        approved_by = auth.uid(),
        is_approved = true,
        is_active = true
    WHERE id = venue_uuid;
    
    -- Update user role to owner if not already
    IF user_profile.role != 'owner' THEN
        UPDATE public.profiles 
        SET role = 'owner',
            owner_verified = true,
            owner_verification_date = now()
        WHERE user_id = venue_record.submitted_by;
    END IF;
    
    -- Log the approval
    INSERT INTO public.venue_approval_logs (
        venue_id, admin_id, action, admin_notes
    ) VALUES (
        venue_uuid, auth.uid(), 'approved', admin_notes
    );
    
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Venue approved successfully',
        'venue_id', venue_uuid
    );
END;
$$;


--
-- Name: assign_owner_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_owner_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.role = 'owner' AND OLD.role != 'owner' THEN
        NEW.owner_id := 'OWNER_' || substr(NEW.user_id::text, 1, 8);
        NEW.owner_verified := false;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: authenticate_demo_user(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.authenticate_demo_user(user_email text, user_password text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  demo_users jsonb := '[
    {"email": "user@example.com", "password": "user123"},
    {"email": "owner@example.com", "password": "owner123"},
    {"email": "admin@venuefinder.com", "password": "admin123"},
    {"email": "superadmin@venuefinder.com", "password": "superadmin123"}
  ]';
  demo_user jsonb;
BEGIN
  -- Check if the email and password match any demo user
  FOR demo_user IN SELECT * FROM jsonb_array_elements(demo_users)
  LOOP
    IF demo_user->>'email' = user_email AND demo_user->>'password' = user_password THEN
      RETURN true;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$;


--
-- Name: check_auth_rate_limit(text, text, integer, interval); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_auth_rate_limit(user_email text, attempt_type text DEFAULT 'login'::text, max_attempts integer DEFAULT 5, time_window interval DEFAULT '00:15:00'::interval) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: check_email_exists(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_email_exists(user_email text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles WHERE email = user_email
    UNION
    SELECT 1 FROM auth.users WHERE email = user_email
  );
END;
$$;


--
-- Name: check_rate_limit(text, text, interval, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_rate_limit(user_email text, attempt_type text, time_window interval DEFAULT '00:15:00'::interval, max_attempts integer DEFAULT 5) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: cleanup_auth_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_auth_data() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: cleanup_expired_tokens(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_tokens() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < now() - interval '1 day';
  
  DELETE FROM auth_logs 
  WHERE created_at < now() - interval '30 days';
END;
$$;


--
-- Name: create_demo_user(text, text, text, public.user_role, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_demo_user(user_email text, user_password text, user_name text, user_role public.user_role DEFAULT 'user'::public.user_role, business_name text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: create_user_profile(uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_user_profile(user_id uuid, user_email text, user_data jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: generate_password_reset_token(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_password_reset_token(user_email text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: generate_secure_otp(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_secure_otp(user_email text, otp_type text DEFAULT 'password_reset'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  otp_code text;
  expires_at timestamptz;
  result jsonb;
BEGIN
  -- Generate 6-digit OTP
  otp_code := LPAD(floor(random() * 1000000)::text, 6, '0');
  expires_at := now() + interval '10 minutes';
  
  -- Clean up old OTPs for this email
  DELETE FROM public.password_reset_tokens 
  WHERE email = user_email AND expires_at < now();
  
  -- Insert new OTP
  INSERT INTO public.password_reset_tokens (
    email,
    token,
    expires_at,
    used,
    attempts
  )
  VALUES (
    user_email,
    otp_code,
    expires_at,
    false,
    0
  );
  
  result := jsonb_build_object(
    'otp', otp_code,
    'expires_at', expires_at,
    'success', true
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- If password_reset_tokens table doesn't exist, return error
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to generate OTP'
    );
END;
$$;


--
-- Name: get_pending_venues(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pending_venues() RETURNS TABLE(venue_id uuid, venue_name text, venue_type text, submitted_by uuid, submitter_email text, submitter_name text, submission_date timestamp with time zone, description text, address text, city text, state text, capacity integer, hourly_rate numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        v.id as venue_id,
        v.name as venue_name,
        v.venue_type,
        v.submitted_by,
        p.email as submitter_email,
        p.full_name as submitter_name,
        v.submission_date,
        v.description,
        v.address,
        v.city,
        v.state,
        v.capacity,
        v.hourly_rate
    FROM public.venues v
    JOIN public.profiles p ON v.submitted_by = p.user_id
    WHERE v.approval_status = 'pending'
    ORDER BY v.submission_date DESC;
END;
$$;


--
-- Name: get_user_dashboard_data(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_dashboard_data(user_uuid uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  profile_data jsonb;
  favorites_data jsonb;
  reviews_data jsonb;
  bookings_data jsonb;
  venues_data jsonb;
  stats_data jsonb;
  result jsonb;
BEGIN
  -- Get profile data
  SELECT row_to_json(p.*) INTO profile_data
  FROM profiles p
  WHERE p.user_id = user_uuid;
  
  -- Get favorites data (from user_favorites table)
  SELECT jsonb_agg(row_to_json(uf.*)) INTO favorites_data
  FROM user_favorites uf
  WHERE uf.user_id IN (SELECT id FROM profiles WHERE user_id = user_uuid);
  
  -- Get reviews data (from user_reviews table)
  SELECT jsonb_agg(row_to_json(ur.*)) INTO reviews_data
  FROM user_reviews ur
  WHERE ur.user_id IN (SELECT id FROM profiles WHERE user_id = user_uuid);
  
  -- Get bookings data (from existing bookings table)
  SELECT jsonb_agg(row_to_json(b.*)) INTO bookings_data
  FROM bookings b
  WHERE b.user_id IN (SELECT id FROM profiles WHERE user_id = user_uuid);
  
  -- Get user's venues (if they're an owner)
  SELECT jsonb_agg(row_to_json(v.*)) INTO venues_data
  FROM venues v
  WHERE v.owner_id IN (SELECT id FROM profiles WHERE user_id = user_uuid);
  
  -- Calculate stats
  SELECT jsonb_build_object(
    'totalBookings', COALESCE((SELECT COUNT(*) FROM bookings WHERE user_id IN (SELECT id FROM profiles WHERE user_id = user_uuid)), 0),
    'totalFavorites', COALESCE((SELECT COUNT(*) FROM user_favorites WHERE user_id IN (SELECT id FROM profiles WHERE user_id = user_uuid)), 0),
    'totalReviews', COALESCE((SELECT COUNT(*) FROM user_reviews WHERE user_id IN (SELECT id FROM profiles WHERE user_id = user_uuid)), 0),
    'totalVenues', COALESCE((SELECT COUNT(*) FROM venues WHERE owner_id IN (SELECT id FROM profiles WHERE user_id = user_uuid)), 0),
    'recentBookings', COALESCE((SELECT jsonb_agg(row_to_json(b.*)) FROM bookings b WHERE b.user_id IN (SELECT id FROM profiles WHERE user_id = user_uuid) ORDER BY b.created_at DESC LIMIT 5), '[]'::jsonb),
    'recentFavorites', COALESCE((SELECT jsonb_agg(row_to_json(uf.*)) FROM user_favorites uf WHERE uf.user_id IN (SELECT id FROM profiles WHERE user_id = user_uuid) ORDER BY uf.created_at DESC LIMIT 5), '[]'::jsonb)
  ) INTO stats_data;
  
  -- Combine all data
  result := jsonb_build_object(
    'profile', COALESCE(profile_data, '{}'::jsonb),
    'favorites', COALESCE(favorites_data, '[]'::jsonb),
    'reviews', COALESCE(reviews_data, '[]'::jsonb),
    'bookings', COALESCE(bookings_data, '[]'::jsonb),
    'venues', COALESCE(venues_data, '[]'::jsonb),
    'stats', COALESCE(stats_data, '{}'::jsonb)
  );
  
  RETURN result;
END;
$$;


--
-- Name: get_user_dashboard_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_dashboard_stats(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'totalBookings', (SELECT COUNT(*) FROM public.user_bookings WHERE user_id = p_user_id),
        'totalFavorites', (SELECT COUNT(*) FROM public.user_favorites WHERE user_id = p_user_id),
        'totalReviews', (SELECT COUNT(*) FROM public.user_reviews WHERE user_id = p_user_id),
        'totalVenues', (SELECT COUNT(*) FROM public.venues WHERE owner_id = p_user_id),
        'recentBookings', (
            SELECT COALESCE(jsonb_agg(b.*), '[]'::jsonb)
            FROM (
                SELECT ub.id as booking_id, v.name as venue_name, ub.booking_date
                FROM public.user_bookings ub
                JOIN public.venues v ON ub.venue_id = v.id
                WHERE ub.user_id = p_user_id
                ORDER BY ub.created_at DESC
                LIMIT 3
            ) b
        ),
        'recentFavorites', (
            SELECT COALESCE(jsonb_agg(f.*), '[]'::jsonb)
            FROM (
                SELECT uf.id as favorite_id, v.name as venue_name, uf.created_at
                FROM public.user_favorites uf
                JOIN public.venues v ON uf.venue_id = v.id
                WHERE uf.user_id = p_user_id
                ORDER BY uf.created_at DESC
                LIMIT 3
            ) f
        )
    )
    INTO stats;
    
    RETURN stats;
END;
$$;


--
-- Name: get_user_preferences(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_preferences(target_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: get_user_preferences_with_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_preferences_with_profile(target_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: get_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_profile() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    profile JSONB;
BEGIN
    SELECT row_to_json(p)
    INTO profile
    FROM public.profiles p
    WHERE p.user_id = auth.uid();
    RETURN profile;
END;
$$;


--
-- Name: get_user_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_profile(user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  profile_data jsonb;
BEGIN
  SELECT row_to_json(p.*) INTO profile_data
  FROM profiles p
  WHERE p.user_id = user_id;
  
  RETURN COALESCE(profile_data, '{}'::jsonb);
END;
$$;


--
-- Name: get_user_profile_simple(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_profile_simple(user_uuid uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  profile_data jsonb;
BEGIN
  SELECT row_to_json(p.*) INTO profile_data
  FROM profiles p
  WHERE p.user_id = user_uuid;
  
  RETURN COALESCE(profile_data, '{}'::jsonb);
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, name, full_name, phone, profile_picture, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;


--
-- Name: has_completed_preferences(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_completed_preferences(target_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.user_preferences
    WHERE user_id = target_user_id AND completed = true
  );
END;
$$;


--
-- Name: log_auth_attempt(text, text, boolean, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_auth_attempt(user_email text, attempt_type text, success boolean, ip_address text DEFAULT NULL::text, user_agent text DEFAULT NULL::text, error_message text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.auth_logs (
    email,
    attempt_type,
    success,
    ip_address,
    user_agent,
    error_message
  )
  VALUES (
    user_email,
    attempt_type,
    success,
    ip_address,
    user_agent,
    error_message
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If auth_logs table doesn't exist or insert fails, ignore silently
    NULL;
END;
$$;


--
-- Name: log_user_activity(uuid, text, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_user_activity(user_id uuid, activity_type text, details jsonb DEFAULT '{}'::jsonb, ip_address text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: reject_venue(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reject_venue(venue_uuid uuid, rejection_reason text, admin_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    venue_record public.venues;
    result jsonb;
BEGIN
    -- Get venue details
    SELECT * INTO venue_record FROM public.venues WHERE id = venue_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venue not found');
    END IF;
    
    -- Update venue status
    UPDATE public.venues 
    SET approval_status = 'rejected',
        rejection_reason = rejection_reason,
        is_approved = false,
        is_active = false
    WHERE id = venue_uuid;
    
    -- Log the rejection
    INSERT INTO public.venue_approval_logs (
        venue_id, admin_id, action, reason, admin_notes
    ) VALUES (
        venue_uuid, auth.uid(), 'rejected', rejection_reason, admin_notes
    );
    
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Venue rejected successfully',
        'venue_id', venue_uuid
    );
END;
$$;


--
-- Name: sanitize_input(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sanitize_input(input text, max_length integer DEFAULT 255) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Trim whitespace and limit length
  RETURN substring(trim(regexp_replace(input, '[<>]', '', 'g')), 1, max_length);
END;
$$;


--
-- Name: save_user_preferences(uuid, jsonb, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_user_preferences(target_user_id uuid, user_preferences jsonb, is_completed boolean DEFAULT true) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: sync_google_profile_updates(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_google_profile_updates() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: update_profile_status_on_preferences(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_status_on_preferences() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_user_role(uuid, public.user_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_role(target_user_id uuid, new_role public.user_role) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: update_venue_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_venue_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: user_needs_preferences_form(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_needs_preferences_form(target_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: validate_password_strength(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_password_strength(password text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: verify_otp_secure(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_otp_secure(user_email text, input_otp text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  token_record record;
  result jsonb;
BEGIN
  -- Get the most recent unused token for this email
  SELECT * INTO token_record
  FROM public.password_reset_tokens
  WHERE email = user_email 
    AND used = false 
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'OTP not found or expired'
    );
  END IF;
  
  -- Check if too many attempts
  IF token_record.attempts >= 3 THEN
    -- Mark as used to prevent further attempts
    UPDATE public.password_reset_tokens
    SET used = true
    WHERE id = token_record.id;
    
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Too many failed attempts'
    );
  END IF;
  
  -- Check if OTP matches
  IF token_record.token = input_otp THEN
    -- Mark as used
    UPDATE public.password_reset_tokens
    SET used = true
    WHERE id = token_record.id;
    
    RETURN jsonb_build_object(
      'valid', true,
      'message', 'OTP verified successfully'
    );
  ELSE
    -- Increment attempts
    UPDATE public.password_reset_tokens
    SET attempts = attempts + 1
    WHERE id = token_record.id;
    
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Invalid OTP'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Error verifying OTP'
    );
END;
$$;


--
-- Name: verify_password_reset_token(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_password_reset_token(user_email text, input_token text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    action text NOT NULL,
    target_type text,
    target_id uuid,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: amenities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.amenities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon text,
    category text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: auth_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    attempt_type text NOT NULL,
    success boolean NOT NULL,
    ip_address text,
    user_agent text,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    venue_id uuid,
    slot_ids uuid[] NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    booking_status public.booking_status DEFAULT 'pending'::public.booking_status,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status,
    event_date date NOT NULL,
    event_duration text,
    special_requests text,
    payment_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'unread'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contact_messages_status_check CHECK ((status = ANY (ARRAY['unread'::text, 'read'::text, 'replied'::text])))
);


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_type text NOT NULL,
    subject text NOT NULL,
    html_content text NOT NULL,
    text_content text NOT NULL,
    variables jsonb DEFAULT '{}'::jsonb,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    venue_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    attempts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text NOT NULL,
    name text NOT NULL,
    phone text,
    role public.user_role DEFAULT 'user'::public.user_role,
    profile_picture text,
    business_name text,
    description text,
    verified boolean DEFAULT false,
    google_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    profile_status text DEFAULT 'incomplete'::text,
    full_name text,
    avatar_url text,
    date_of_birth date,
    gender text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India'::text,
    preferences jsonb DEFAULT '{}'::jsonb,
    notification_settings jsonb DEFAULT '{"marketing_emails": true, "new_venue_alerts": true, "booking_reminders": true, "sms_notifications": false, "email_notifications": true}'::jsonb,
    owner_id text,
    owner_verified boolean DEFAULT false,
    owner_verification_date timestamp with time zone,
    CONSTRAINT profiles_date_of_birth_check CHECK (((date_of_birth IS NULL) OR ((date_of_birth)::text ~ '^\\d{4}-\\d{2}-\\d{2}$'::text))),
    CONSTRAINT profiles_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text, 'prefer_not_to_say'::text])))
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    venue_id uuid,
    booking_id uuid,
    rating integer,
    comment text,
    images text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: super_admin_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.super_admin_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id text NOT NULL,
    password_hash text NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    venue_id uuid,
    booking_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    total_price numeric(10,2) NOT NULL,
    status text DEFAULT 'confirmed'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_bookings_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'completed'::text])))
);


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    venue_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    venue_id uuid,
    rating integer NOT NULL,
    review_text text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: venue_amenities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venue_amenities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venue_id uuid,
    amenity_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: venue_approval_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venue_approval_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venue_id uuid,
    admin_id uuid,
    action text NOT NULL,
    reason text,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT venue_approval_logs_action_check CHECK ((action = ANY (ARRAY['approved'::text, 'rejected'::text, 'pending_review'::text])))
);


--
-- Name: venue_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venue_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venue_id uuid,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    available boolean DEFAULT true,
    price numeric(10,2) NOT NULL,
    booked_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: venues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    name text NOT NULL,
    description text NOT NULL,
    type public.venue_type NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    pincode text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    images text[] DEFAULT '{}'::text[],
    videos text[] DEFAULT '{}'::text[],
    capacity integer NOT NULL,
    area text NOT NULL,
    dimensions text,
    hourly_rate numeric(10,2) NOT NULL,
    currency text DEFAULT 'INR'::text,
    rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    status public.venue_status DEFAULT 'pending'::public.venue_status,
    verified boolean DEFAULT false,
    contact_name text,
    contact_phone text,
    contact_email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    zip_code text,
    country text DEFAULT 'India'::text,
    price_per_hour numeric(10,2),
    price_per_day numeric(10,2),
    website text,
    image_urls text[] DEFAULT '{}'::text[],
    is_approved boolean DEFAULT true,
    is_active boolean DEFAULT true,
    submitted_by uuid,
    approval_status text DEFAULT 'pending'::text,
    approval_date timestamp with time zone,
    approved_by uuid,
    rejection_reason text,
    submission_date timestamp with time zone DEFAULT now(),
    CONSTRAINT venues_approval_status_check CHECK ((approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- Name: amenities amenities_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_name_key UNIQUE (name);


--
-- Name: amenities amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_pkey PRIMARY KEY (id);


--
-- Name: auth_logs auth_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_logs
    ADD CONSTRAINT auth_logs_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_template_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_template_type_key UNIQUE (template_type);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_venue_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_venue_id_key UNIQUE (user_id, venue_id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_owner_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_owner_id_key UNIQUE (owner_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: super_admin_credentials super_admin_credentials_admin_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admin_credentials
    ADD CONSTRAINT super_admin_credentials_admin_id_key UNIQUE (admin_id);


--
-- Name: super_admin_credentials super_admin_credentials_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admin_credentials
    ADD CONSTRAINT super_admin_credentials_email_key UNIQUE (email);


--
-- Name: super_admin_credentials super_admin_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admin_credentials
    ADD CONSTRAINT super_admin_credentials_pkey PRIMARY KEY (id);


--
-- Name: user_bookings user_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bookings
    ADD CONSTRAINT user_bookings_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_user_id_venue_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_venue_id_key UNIQUE (user_id, venue_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_reviews user_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reviews
    ADD CONSTRAINT user_reviews_pkey PRIMARY KEY (id);


--
-- Name: user_reviews user_reviews_user_id_venue_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reviews
    ADD CONSTRAINT user_reviews_user_id_venue_id_key UNIQUE (user_id, venue_id);


--
-- Name: venue_amenities venue_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_amenities
    ADD CONSTRAINT venue_amenities_pkey PRIMARY KEY (id);


--
-- Name: venue_amenities venue_amenities_venue_id_amenity_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_amenities
    ADD CONSTRAINT venue_amenities_venue_id_amenity_id_key UNIQUE (venue_id, amenity_id);


--
-- Name: venue_approval_logs venue_approval_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_approval_logs
    ADD CONSTRAINT venue_approval_logs_pkey PRIMARY KEY (id);


--
-- Name: venue_slots venue_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_slots
    ADD CONSTRAINT venue_slots_pkey PRIMARY KEY (id);


--
-- Name: venue_slots venue_slots_venue_id_date_start_time_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_slots
    ADD CONSTRAINT venue_slots_venue_id_date_start_time_key UNIQUE (venue_id, date, start_time);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_logs_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_logs_admin_id ON public.admin_logs USING btree (admin_id);


--
-- Name: idx_admin_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_logs_created_at ON public.admin_logs USING btree (created_at);


--
-- Name: idx_auth_logs_attempt_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_logs_attempt_type ON public.auth_logs USING btree (attempt_type);


--
-- Name: idx_auth_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_logs_created_at ON public.auth_logs USING btree (created_at);


--
-- Name: idx_auth_logs_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_logs_email ON public.auth_logs USING btree (email);


--
-- Name: idx_auth_logs_email_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_logs_email_type ON public.auth_logs USING btree (email, attempt_type);


--
-- Name: idx_contact_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages USING btree (created_at);


--
-- Name: idx_contact_messages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_status ON public.contact_messages USING btree (status);


--
-- Name: idx_password_reset_tokens_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens USING btree (email);


--
-- Name: idx_password_reset_tokens_email_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_email_used ON public.password_reset_tokens USING btree (email, used);


--
-- Name: idx_password_reset_tokens_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_google_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_google_id ON public.profiles USING btree (google_id);


--
-- Name: idx_profiles_profile_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_profile_status ON public.profiles USING btree (profile_status);


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- Name: idx_user_bookings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_bookings_user_id ON public.user_bookings USING btree (user_id);


--
-- Name: idx_user_bookings_venue_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_bookings_venue_id ON public.user_bookings USING btree (venue_id);


--
-- Name: idx_user_favorites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorites_user_id ON public.user_favorites USING btree (user_id);


--
-- Name: idx_user_favorites_venue_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorites_venue_id ON public.user_favorites USING btree (venue_id);


--
-- Name: idx_user_preferences_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_completed ON public.user_preferences USING btree (completed);


--
-- Name: idx_user_preferences_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_updated_at ON public.user_preferences USING btree (updated_at);


--
-- Name: idx_user_preferences_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);


--
-- Name: idx_user_reviews_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_reviews_rating ON public.user_reviews USING btree (rating);


--
-- Name: idx_user_reviews_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_reviews_user_id ON public.user_reviews USING btree (user_id);


--
-- Name: idx_user_reviews_venue_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_reviews_venue_id ON public.user_reviews USING btree (venue_id);


--
-- Name: idx_venues_approval_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_venues_approval_date ON public.venues USING btree (approval_date);


--
-- Name: idx_venues_approval_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_venues_approval_status ON public.venues USING btree (approval_status);


--
-- Name: idx_venues_submitted_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_venues_submitted_by ON public.venues USING btree (submitted_by);


--
-- Name: user_preferences on_preferences_completed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_preferences_completed AFTER INSERT OR UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_profile_status_on_preferences();


--
-- Name: reviews on_review_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_review_change AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();


--
-- Name: profiles trigger_assign_owner_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_assign_owner_id BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.assign_owner_id();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_reviews update_user_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_reviews_updated_at BEFORE UPDATE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_reviews update_venue_rating_on_review_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_venue_rating_on_review_delete AFTER DELETE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();


--
-- Name: user_reviews update_venue_rating_on_review_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_venue_rating_on_review_insert AFTER INSERT ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();


--
-- Name: user_reviews update_venue_rating_on_review_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_venue_rating_on_review_update AFTER UPDATE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();


--
-- Name: venues update_venues_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_logs admin_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: user_bookings user_bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bookings
    ADD CONSTRAINT user_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_bookings user_bookings_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_bookings
    ADD CONSTRAINT user_bookings_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_reviews user_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reviews
    ADD CONSTRAINT user_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_reviews user_reviews_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reviews
    ADD CONSTRAINT user_reviews_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: venue_amenities venue_amenities_amenity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_amenities
    ADD CONSTRAINT venue_amenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(id) ON DELETE CASCADE;


--
-- Name: venue_amenities venue_amenities_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_amenities
    ADD CONSTRAINT venue_amenities_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: venue_approval_logs venue_approval_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_approval_logs
    ADD CONSTRAINT venue_approval_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id);


--
-- Name: venue_approval_logs venue_approval_logs_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_approval_logs
    ADD CONSTRAINT venue_approval_logs_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: venue_slots venue_slots_booked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_slots
    ADD CONSTRAINT venue_slots_booked_by_fkey FOREIGN KEY (booked_by) REFERENCES public.profiles(id);


--
-- Name: venue_slots venue_slots_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_slots
    ADD CONSTRAINT venue_slots_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: venues venues_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: venues venues_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: venues venues_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id);


--
-- Name: admin_logs Admins can create logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create logs" ON public.admin_logs FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: venues Admins can manage all venues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all venues" ON public.venues USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: amenities Admins can manage amenities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage amenities" ON public.amenities USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: admin_logs Admins can view logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view logs" ON public.admin_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role]))))));


--
-- Name: contact_messages Anyone can create contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: email_templates Anyone can read active email templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read active email templates" ON public.email_templates FOR SELECT USING ((active = true));


--
-- Name: amenities Anyone can view amenities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view amenities" ON public.amenities FOR SELECT USING (true);


--
-- Name: venues Anyone can view approved venues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved venues" ON public.venues FOR SELECT USING ((status = 'approved'::public.venue_status));


--
-- Name: venue_slots Anyone can view available slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view available slots" ON public.venue_slots FOR SELECT USING (true);


--
-- Name: reviews Anyone can view reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);


--
-- Name: user_reviews Anyone can view reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view reviews" ON public.user_reviews FOR SELECT USING (true);


--
-- Name: venue_amenities Anyone can view venue amenities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view venue amenities" ON public.venue_amenities FOR SELECT USING (true);


--
-- Name: contact_messages Authenticated users can view contact messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view contact messages" ON public.contact_messages FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: password_reset_tokens No direct access to reset tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No direct access to reset tokens" ON public.password_reset_tokens USING (false);


--
-- Name: venues Owners can insert venues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can insert venues" ON public.venues FOR INSERT WITH CHECK ((owner_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'owner'::public.user_role)))));


--
-- Name: venues Owners can update own venues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can update own venues" ON public.venues FOR UPDATE USING ((owner_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: venues Owners can view own venues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view own venues" ON public.venues FOR SELECT USING ((owner_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: super_admin_credentials Super admin credentials are private; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin credentials are private" ON public.super_admin_credentials USING (false);


--
-- Name: venue_approval_logs Super admins can insert approval logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can insert approval logs" ON public.venue_approval_logs FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'super_admin'::public.user_role)))));


--
-- Name: email_templates Super admins can manage email templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage email templates" ON public.email_templates USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'super_admin'::public.user_role)))));


--
-- Name: venue_approval_logs Super admins can view all approval logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can view all approval logs" ON public.venue_approval_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'super_admin'::public.user_role)))));


--
-- Name: auth_logs Super admins can view auth logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can view auth logs" ON public.auth_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'super_admin'::public.user_role)))));


--
-- Name: user_favorites Users can add to their favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add to their favorites" ON public.user_favorites FOR INSERT WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: bookings Users can create bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: reviews Users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: user_reviews Users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reviews" ON public.user_reviews FOR INSERT WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: user_bookings Users can create their own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own bookings" ON public.user_bookings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_bookings Users can delete their own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own bookings" ON public.user_bookings FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_reviews Users can delete their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reviews" ON public.user_reviews FOR DELETE USING ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: user_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: favorites Users can manage own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own favorites" ON public.favorites USING ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: user_favorites Users can remove from their favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove from their favorites" ON public.user_favorites FOR DELETE USING ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: profiles Users can select initial role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select initial role" ON public.profiles FOR UPDATE TO authenticated USING (((auth.uid() = user_id) AND (role IS NULL))) WITH CHECK ((auth.uid() = user_id));


--
-- Name: bookings Users can update own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: user_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: reviews Users can update own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: user_bookings Users can update their own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own bookings" ON public.user_bookings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_reviews Users can update their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reviews" ON public.user_reviews FOR UPDATE USING ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: bookings Users can view own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: user_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: user_bookings Users can view their own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own bookings" ON public.user_bookings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_favorites Users can view their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own favorites" ON public.user_favorites FOR SELECT USING ((user_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.user_id = auth.uid()))));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: venue_amenities Venue owners can manage amenities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Venue owners can manage amenities" ON public.venue_amenities USING ((venue_id IN ( SELECT venues.id
   FROM public.venues
  WHERE (venues.owner_id IN ( SELECT profiles.id
           FROM public.profiles
          WHERE (profiles.user_id = auth.uid()))))));


--
-- Name: venue_slots Venue owners can manage slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Venue owners can manage slots" ON public.venue_slots USING ((venue_id IN ( SELECT venues.id
   FROM public.venues
  WHERE (venues.owner_id IN ( SELECT profiles.id
           FROM public.profiles
          WHERE (profiles.user_id = auth.uid()))))));


--
-- Name: bookings Venue owners can view venue bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Venue owners can view venue bookings" ON public.bookings FOR SELECT USING ((venue_id IN ( SELECT venues.id
   FROM public.venues
  WHERE (venues.owner_id IN ( SELECT profiles.id
           FROM public.profiles
          WHERE (profiles.user_id = auth.uid()))))));


--
-- Name: admin_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: amenities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

--
-- Name: auth_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: email_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: password_reset_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: super_admin_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.super_admin_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: user_bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: venue_amenities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venue_amenities ENABLE ROW LEVEL SECURITY;

--
-- Name: venue_approval_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venue_approval_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: venue_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venue_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: venues; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

