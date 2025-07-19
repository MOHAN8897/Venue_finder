# Supabase SQL Commands & Schema Reference

## Venue Submission & Super Admin Management System (2025-01-27)

### 1. Update Venues Table for Approval System
**Purpose:** Enhanced venues table to support approval workflow and owner management.

```sql
-- Add missing columns to venues table for approval system
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approval_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS submission_date timestamp with time zone DEFAULT now();

-- Update existing venues to have proper approval status
UPDATE public.venues 
SET approval_status = 'approved', 
    approval_date = created_at,
    submitted_by = owner_id
WHERE is_approved = true AND approval_status IS NULL;

-- Add indexes for approval workflow
CREATE INDEX IF NOT EXISTS idx_venues_approval_status ON public.venues(approval_status);
CREATE INDEX IF NOT EXISTS idx_venues_submitted_by ON public.venues(submitted_by);
CREATE INDEX IF NOT EXISTS idx_venues_approval_date ON public.venues(approval_date);
```

### 2. Create Super Admin Authentication Table
**Purpose:** Secure super admin authentication system with database verification.

```sql
-- Create super admin credentials table
CREATE TABLE IF NOT EXISTS public.super_admin_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for super admin credentials
CREATE POLICY "Super admin credentials are private" ON public.super_admin_credentials
    FOR ALL USING (false);

-- Insert default super admin (password: SuperAdmin123!)
INSERT INTO public.super_admin_credentials (
    admin_id, 
    password_hash, 
    email, 
    full_name
) VALUES (
    'superadmin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- SuperAdmin123!
    'superadmin@venuefinder.com',
    'Super Administrator'
) ON CONFLICT (admin_id) DO NOTHING;
```

### 3. Create Venue Approval Logs Table
**Purpose:** Track all venue approval/rejection actions for audit trail.

```sql
-- Create venue approval logs table
CREATE TABLE IF NOT EXISTS public.venue_approval_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
    admin_id uuid REFERENCES auth.users(id),
    action text NOT NULL CHECK (action IN ('approved', 'rejected', 'pending_review')),
    reason text,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.venue_approval_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for venue approval logs
CREATE POLICY "Super admins can view all approval logs" ON public.venue_approval_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert approval logs" ON public.venue_approval_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );
```

### 4. Update Profiles Table for Owner Management
**Purpose:** Enhanced profiles table to support owner role management.

```sql
-- Add owner-specific fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS owner_id text UNIQUE,
ADD COLUMN IF NOT EXISTS owner_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS owner_verification_date timestamp with time zone;

-- Create function to automatically assign owner_id when user becomes owner
CREATE OR REPLACE FUNCTION public.assign_owner_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'owner' AND OLD.role != 'owner' THEN
        NEW.owner_id := 'OWNER_' || substr(NEW.user_id::text, 1, 8);
        NEW.owner_verified := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic owner_id assignment
DROP TRIGGER IF EXISTS trigger_assign_owner_id ON public.profiles;
CREATE TRIGGER trigger_assign_owner_id
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.assign_owner_id();
```

### 5. Create Venue Management Functions
**Purpose:** Functions for venue approval workflow and owner management.

```sql
-- Function to approve a venue
CREATE OR REPLACE FUNCTION public.approve_venue(
    venue_uuid uuid,
    admin_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a venue
CREATE OR REPLACE FUNCTION public.reject_venue(
    venue_uuid uuid,
    rejection_reason text,
    admin_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending venues for approval
CREATE OR REPLACE FUNCTION public.get_pending_venues()
RETURNS TABLE (
    venue_id uuid,
    venue_name text,
    venue_type text,
    submitted_by uuid,
    submitter_email text,
    submitter_name text,
    submission_date timestamp with time zone,
    description text,
    address text,
    city text,
    state text,
    capacity integer,
    hourly_rate numeric
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        v.id as venue_id,
        v.name as venue_name,
        v.type::text, -- Cast enum to text for broader compatibility
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
$$ LANGUAGE plpgsql;

-- Function to get venue details for approval
CREATE OR REPLACE FUNCTION public.get_venue_approval_details(venue_uuid uuid)
RETURNS jsonb AS $$
DECLARE
    venue_details jsonb;
    submitter_details jsonb;
    result jsonb;
BEGIN
    -- Get venue details
    SELECT to_jsonb(v) INTO venue_details FROM public.venues v WHERE v.id = venue_uuid;
    
    -- Get submitter details
    SELECT jsonb_build_object(
        'full_name', p.full_name,
        'email', p.email,
        'avatar_url', p.avatar_url,
        'created_at', p.created_at
    ) INTO submitter_details 
    FROM public.profiles p
    JOIN public.venues v ON p.user_id = v.submitted_by
    WHERE v.id = venue_uuid;
    
    result := jsonb_build_object(
        'venue', venue_details,
        'submitter', submitter_details
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

### 6. Create Draft Recovery System (2025-01-27)
**Purpose:** Functions and tables to support saving and retrieving venue submission drafts.

```sql
-- Create venue drafts table
CREATE TABLE IF NOT EXISTS public.venue_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  form_data JSONB NOT NULL,
  step_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_venue_drafts_user_id ON public.venue_drafts(user_id);

-- RLS Policy for draft access
ALTER TABLE public.venue_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own drafts" ON public.venue_drafts
  FOR ALL USING (user_id = auth.uid());

-- Function to save draft
CREATE OR REPLACE FUNCTION public.save_venue_draft(
    draft_data jsonb,
    current_step integer
)
RETURNS jsonb AS $$
DECLARE
    draft_id uuid;
BEGIN
    INSERT INTO public.venue_drafts (
        user_id, 
        form_data, 
        step_completed,
        updated_at,
        expires_at
    ) VALUES (
        auth.uid(),
        draft_data,
        current_step,
        now(),
        now() + INTERVAL '30 days'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        form_data = EXCLUDED.form_data,
        step_completed = EXCLUDED.step_completed,
        updated_at = now(),
        expires_at = now() + INTERVAL '30 days'
    RETURNING id INTO draft_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'draft_id', draft_id,
        'message', 'Draft saved successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to retrieve draft
CREATE OR REPLACE FUNCTION public.get_venue_draft()
RETURNS jsonb AS $$
DECLARE
    draft_record public.venue_drafts;
BEGIN
    SELECT * INTO draft_record FROM public.venue_drafts 
    WHERE user_id = auth.uid() AND is_active = true AND expires_at > now();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active draft found');
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'draft_data', draft_record.form_data,
        'step_completed', draft_record.step_completed,
        'updated_at', draft_record.updated_at
    );
END;
$$ LANGUAGE plpgsql;

-- Function to delete draft
CREATE OR REPLACE FUNCTION public.delete_venue_draft()
RETURNS jsonb AS $$
BEGIN
    UPDATE public.venue_drafts 
    SET is_active = false 
    WHERE user_id = auth.uid();
    
    RETURN jsonb_build_object('success', true, 'message', 'Draft deleted successfully');
END;
$$ LANGUAGE plpgsql;
```

### 7. User-Specific Venue Functions (2025-01-27)
**Purpose:** Functions for users to manage and view their own venue submissions.

```sql
-- Function to get all venues submitted by the current user
CREATE OR REPLACE FUNCTION public.get_user_submitted_venues()
RETURNS SETOF public.venues AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.venues 
    WHERE submitted_by = auth.uid()
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's venue statistics
CREATE OR REPLACE FUNCTION public.get_user_venue_stats()
RETURNS jsonb AS $$
DECLARE
    stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE approval_status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE approval_status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE approval_status = 'rejected')
    )
    INTO stats
    FROM public.venues
    WHERE submitted_by = auth.uid();
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to update a user's own venue submission
CREATE OR REPLACE FUNCTION public.update_venue_submission(
    venue_uuid uuid,
    venue_data jsonb
)
RETURNS jsonb AS $$
DECLARE
    venue_record public.venues;
BEGIN
    -- Check if venue exists and belongs to user
    SELECT * INTO venue_record FROM public.venues 
    WHERE id = venue_uuid AND submitted_by = auth.uid();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venue not found or access denied');
    END IF;
    
    -- Only allow updates if venue is pending or rejected
    IF venue_record.approval_status = 'approved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot update approved venue');
    END IF;
    
    -- Update venue with new data
    UPDATE public.venues 
    SET 
        name = COALESCE(venue_data->>'name', name),
        description = COALESCE(venue_data->>'description', description),
        type = COALESCE((venue_data->>'type')::public.venue_type, type),
        address = COALESCE(venue_data->>'address', address),
        city = COALESCE(venue_data->>'city', city),
        state = COALESCE(venue_data->>'state', state),
        pincode = COALESCE(venue_data->>'pincode', pincode),
        latitude = COALESCE((venue_data->>'latitude')::numeric, latitude),
        longitude = COALESCE((venue_data->>'longitude')::numeric, longitude),
        capacity = COALESCE((venue_data->>'capacity')::integer, capacity),
        area = COALESCE(venue_data->>'area', area),
        hourly_rate = COALESCE((venue_data->>'hourly_rate')::numeric, hourly_rate),
        daily_rate = COALESCE((venue_data->>'daily_rate')::numeric, daily_rate),
        specific_options = COALESCE(venue_data->'specific_options', specific_options),
        contact_name = COALESCE(venue_data->>'contact_name', contact_name),
        contact_phone = COALESCE(venue_data->>'contact_phone', contact_phone),
        contact_email = COALESCE(venue_data->>'contact_email', contact_email),
        google_maps_link = COALESCE(venue_data->>'google_maps_link', google_maps_link),
        images = COALESCE(venue_data->'images', images),
        videos = COALESCE(venue_data->'videos', videos),
        -- If a rejected venue is edited, set it back to pending
        approval_status = CASE 
            WHEN venue_record.approval_status = 'rejected' THEN 'pending'::text
            ELSE venue_record.approval_status 
        END,
        rejection_reason = CASE 
            WHEN venue_record.approval_status = 'rejected' THEN NULL
            ELSE venue_record.rejection_reason
        END
    WHERE id = venue_uuid;
    
    RETURN jsonb_build_object('success', true, 'message', 'Venue updated successfully');
END;
$$ LANGUAGE plpgsql;

-- Function to delete a user's own venue submission
CREATE OR REPLACE FUNCTION public.delete_venue_submission(venue_uuid uuid)
RETURNS jsonb AS $$
DECLARE
    venue_record public.venues;
BEGIN
    -- Check if venue exists and belongs to user
    SELECT * INTO venue_record FROM public.venues 
    WHERE id = venue_uuid AND submitted_by = auth.uid();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venue not found or access denied');
    END IF;
    
    -- Only allow deletion if not approved
    IF venue_record.approval_status = 'approved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot delete an approved venue');
    END IF;
    
    DELETE FROM public.venues WHERE id = venue_uuid;
    
    RETURN jsonb_build_object('success', true, 'message', 'Venue deleted successfully');
END;
$$ LANGUAGE plpgsql;
```

### 8. Main Venue Submission Function (2025-01-27)
**Purpose:** The primary function for creating a new venue submission.

```sql
CREATE OR REPLACE FUNCTION public.submit_venue(
    venue_data jsonb
)
RETURNS jsonb AS $$
DECLARE
    user_profile public.profiles;
    venue_id uuid;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile FROM public.profiles WHERE user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;
    
    -- Insert new venue
    INSERT INTO public.venues (
        name,
        description,
        type,
        address,
        city,
        state,
        pincode,
        latitude,
        longitude,
        capacity,
        area,
        hourly_rate,
        daily_rate,
        specific_options,
        contact_name,
        contact_phone,
        contact_email,
        google_maps_link,
        images,
        videos,
        submitted_by,
        approval_status,
        submission_date,
        is_approved,
        is_active
    ) VALUES (
        venue_data->>'name',
        venue_data->>'description',
        (venue_data->>'type')::public.venue_type,
        venue_data->>'address',
        venue_data->>'city',
        venue_data->>'state',
        venue_data->>'pincode',
        (venue_data->>'latitude')::numeric,
        (venue_data->>'longitude')::numeric,
        (venue_data->>'capacity')::integer,
        venue_data->>'area',
        (venue_data->>'hourly_rate')::numeric,
        (venue_data->>'daily_rate')::numeric,
        venue_data->'specific_options',
        venue_data->>'contact_name',
        venue_data->>'contact_phone',
        venue_data->>'contact_email',
        venue_data->>'google_maps_link',
        venue_data->'images',
        venue_data->'videos',
        auth.uid(),
        'pending',
        now(),
        false,
        true -- Active by default, but not approved
    ) RETURNING id INTO venue_id;
    
    -- Log the submission
    INSERT INTO public.venue_approval_logs (
        venue_id, admin_id, action, admin_notes
    ) VALUES (
        venue_id, auth.uid(), 'pending_review', 'Venue submitted for review'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Venue submitted successfully and is pending review',
        'venue_id', venue_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 9. Super Admin Authentication Functions (2025-01-27)
**Purpose:** Secure functions for super admin login and profile management.

```sql
-- Function to authenticate a super admin
CREATE OR REPLACE FUNCTION public.authenticate_super_admin(
    admin_id_input text,
    password_input text
)
RETURNS jsonb AS $$
DECLARE
    admin_record public.super_admin_credentials;
    is_password_valid boolean;
BEGIN
    -- Find admin by admin_id
    SELECT * INTO admin_record FROM public.super_admin_credentials 
    WHERE admin_id = admin_id_input;
    
    IF NOT FOUND OR NOT admin_record.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials or inactive account');
    END IF;
    
    -- Check for lockout
    IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > now() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account is locked. Please try again later.');
    END IF;
    
    -- Verify password
    is_password_valid := crypt(password_input, admin_record.password_hash) = admin_record.password_hash;
    
    IF is_password_valid THEN
        -- Reset login attempts and update last login
        UPDATE public.super_admin_credentials
        SET login_attempts = 0,
            locked_until = NULL,
            last_login = now()
        WHERE id = admin_record.id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Authentication successful',
            'admin_id', admin_record.admin_id,
            'full_name', admin_record.full_name,
            'email', admin_record.email
        );
    ELSE
        -- Increment login attempts and lock if necessary
        UPDATE public.super_admin_credentials
        SET login_attempts = admin_record.login_attempts + 1,
            locked_until = CASE 
                WHEN admin_record.login_attempts + 1 >= 5 THEN now() + interval '15 minutes'
                ELSE NULL
            END
        WHERE id = admin_record.id;
        
        RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create a super admin profile
CREATE OR REPLACE FUNCTION public.create_super_admin(
    p_admin_id text,
    p_password text,
    p_email text,
    p_full_name text
)
RETURNS jsonb AS $$
DECLARE
    password_hash text;
BEGIN
    -- Hash the password
    password_hash := crypt(p_password, gen_salt('bf', 8));
    
    INSERT INTO public.super_admin_credentials (
        admin_id,
        password_hash,
        email,
        full_name
    ) VALUES (
        p_admin_id,
        password_hash,
        p_email,
        p_full_name
    );
    
    RETURN jsonb_build_object('success', true, 'message', 'Super admin created successfully');
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Admin ID or Email already exists');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 10. General Utility Functions (2025-01-27)
**Purpose:** Helper functions for various tasks like input sanitization.

```sql
-- Function to sanitize text input
CREATE OR REPLACE FUNCTION public.sanitize_input(input text, max_length integer DEFAULT 255)
RETURNS text AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Trim whitespace and remove potentially harmful characters
  RETURN substring(trim(regexp_replace(input, '[<>]', '', 'g')), 1, max_length);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 11. Comprehensive User Dashboard Functions (2025-01-27)
**Purpose:** Functions to fetch all relevant data for the user dashboard in a single call.

```sql
-- Function to get user dashboard stats
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'totalBookings', (SELECT COUNT(*) FROM public.bookings WHERE user_id = p_user_id),
        'totalFavorites', (SELECT COUNT(*) FROM public.user_favorites WHERE user_id = p_user_id),
        'totalReviews', (SELECT COUNT(*) FROM public.user_reviews WHERE user_id = p_user_id),
        'totalVenues', (SELECT COUNT(*) FROM public.venues WHERE owner_id = p_user_id),
        'recentBookings', (
            SELECT COALESCE(jsonb_agg(b.*), '[]'::jsonb)
    FROM (
                SELECT ub.id as booking_id, v.name as venue_name, ub.booking_date, ub.total_price, ub.status
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 12. Advanced Activity Log & Audit System (2024-07-31)
**Purpose:** A generic and detailed logging system to track all significant user and admin actions for audit, history, and transparency purposes.

```sql
-- 1. Create the activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- e.g., 'venue.edit', 'venue.visibility.change', 'booking.created'
    target_id UUID, -- The ID of the object being changed (e.g., venue_id, booking_id)
    target_table TEXT, -- The table of the target object (e.g., 'venues', 'bookings')
    details JSONB, -- Stores before/after values for edits, or other relevant metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target_id ON public.activity_logs(target_id);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Policy: Venue owners can see logs related to their own venues.
CREATE POLICY "Venue owners can view their own venue logs"
ON public.activity_logs
FOR SELECT
USING (
    target_table = 'venues' AND
    target_id IN (
        SELECT id FROM public.venues WHERE submitted_by = auth.uid()
    )
);

-- Policy: Super admins can see all logs.
CREATE POLICY "Super admins can view all logs"
ON public.activity_logs
FOR SELECT
USING (
        EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- Policy: Users can insert logs for their own actions.
CREATE POLICY "Users can insert their own activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());


-- 4. Create a helper function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
    p_user_id UUID,
    p_action_type TEXT,
    p_target_id UUID,
    p_target_table TEXT,
    p_details JSONB
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action_type, target_id, target_table, details)
    VALUES (p_user_id, p_action_type, p_target_id, p_target_table, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## [2024-08-02] Supabase Venue Feature Schema Audit

### Current Coverage
- venues
- amenities
- venue_amenities
- venue_slots
- venue_approval_logs
- reviews, user_reviews
- favorites, user_favorites
- profiles
- user_sessions, user_activity_log, page_view_log
- All major venue management, listing, and related features are covered.

### Missing/To Be Added
- [ ] venue_unavailability (advanced unavailability/recurring/holiday support)
- [ ] venue_media (media metadata: alt text, order, type)
- [ ] venue_managers (multi-manager support)
- [ ] notifications (in-app notification persistence)
- [ ] payments (payment/invoice tracking)
- [ ] RLS review for new tables

## [2024-08-02] Added Tables & RLS for Venue Features

### 1. venue_unavailability
```sql
CREATE TABLE IF NOT EXISTS public.venue_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  recurrence text,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.venue_unavailability ENABLE ROW LEVEL SECURITY;
```
- For advanced/recurring/holiday support. RLS to restrict to venue owners/managers/admins.

### 2. venue_media
```sql
CREATE TABLE IF NOT EXISTS public.venue_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text NOT NULL, -- image, video, etc.
  alt_text text,
  order_index integer,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.venue_media ENABLE ROW LEVEL SECURITY;
```
- For media metadata: alt text, order, type. RLS to restrict to venue owners/managers/admins.

### 3. venue_managers
```sql
CREATE TABLE IF NOT EXISTS public.venue_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'manager',
  invited_by uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.venue_managers ENABLE ROW LEVEL SECURITY;
```
- For multi-manager support. RLS to restrict to venue owners/admins.

### 4. notifications
```sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  content text NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
```
- For in-app notification persistence. RLS to restrict to the user.

### 5. payments
```sql
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  invoice_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
```
- For payment/invoice tracking. RLS to restrict to user and admins.

### 12. Helper RPC: Get User Venue Submission Status
```sql
-- Returns the user's venue submission status: 'pending', 'approved', 'rejected', or 'none'
CREATE OR REPLACE FUNCTION public.get_user_venue_submission_status()
RETURNS text AS $$
DECLARE
    status text;
BEGIN
    SELECT approval_status INTO status
    FROM public.venues
    WHERE owner_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1;
    IF status IS NULL THEN
        RETURN 'none';
    END IF;
    RETURN status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

**[2024-08-01]**

- Created/Updated the `submit_venue` function to robustly handle venue submissions from the app. All incoming fields are now cast to the correct types (enum, integer, numeric, arrays) and empty strings are converted to NULL where appropriate. This prevents type errors and ensures all data is saved correctly in the venues table.
- Applied via MCP.

```sql
-- See migration: add_or_update_submit_venue_function
```

---

## [2024-08-01] Manual SQL Applied: Venue Submission Tagging & Status Helper

The following SQL commands were manually applied to the database via the Supabase SQL Editor (not via CLI migration):

### 1. Add submitter_email column to venues table
```sql
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS submitter_email text;
```

### 2. Update submit_venue function to tag with user email
```sql
CREATE OR REPLACE FUNCTION public.submit_venue(venue_data jsonb)
RETURNS jsonb AS $$
DECLARE
    venue_id uuid;
    user_id uuid;
    user_email text;
    venue_record record;
BEGIN
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    SELECT email INTO user_email FROM public.profiles WHERE user_id = user_id;
    IF user_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User email not found');
    END IF;
    INSERT INTO public.venues (
        owner_id,
        submitted_by,
        submitter_email,
        name,
        description,
        venue_type,
        address,
        city,
        state,
        country,
        pincode,
        zip_code,
        capacity,
        area,
        hourly_rate,
        daily_rate,
        price_per_hour,
        price_per_day,
        image_urls,
        amenities,
        website,
        status,
        approval_status,
        submission_date,
        is_approved,
        is_active
    ) VALUES (
        user_id,
        user_id,
        user_email,
        venue_data->>'name',
        venue_data->>'description',
        (venue_data->>'type')::venue_type,
        venue_data->>'address',
        venue_data->>'city',
        venue_data->>'state',
        venue_data->>'country',
        venue_data->>'pincode',
        venue_data->>'zip_code',
        (venue_data->>'capacity')::integer,
        venue_data->>'area',
        (venue_data->>'hourly_rate')::integer,
        CASE WHEN venue_data->>'daily_rate' IS NOT NULL THEN (venue_data->>'daily_rate')::integer ELSE NULL END,
        (venue_data->>'hourly_rate')::integer,
        CASE WHEN venue_data->>'daily_rate' IS NOT NULL THEN (venue_data->>'daily_rate')::integer ELSE NULL END,
        COALESCE(venue_data->'images', '[]'::jsonb),
        COALESCE(venue_data->'amenities', '[]'::jsonb),
        venue_data->>'website',
        'pending'::venue_status,
        'pending',
        now(),
        false,
        true
    ) RETURNING id INTO venue_id;
    UPDATE public.profiles 
    SET role = 'owner',
        owner_verified = true,
        owner_verification_date = now()
    WHERE user_id = user_id AND role != 'owner';
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Venue submitted successfully',
        'venue_id', venue_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Add get_user_venue_submission_status helper function
```sql
CREATE OR REPLACE FUNCTION public.get_user_venue_submission_status()
RETURNS text AS $$
DECLARE
    status text;
BEGIN
    SELECT approval_status INTO status
    FROM public.venues
    WHERE owner_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1;
    IF status IS NULL THEN
        RETURN 'none';
    END IF;
    RETURN status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Context:**
- These changes ensure all venue submissions are tagged to the user's account (user_id and email),
- The system can now enforce first-time submission restrictions and multi-venue logic,
- The frontend can check the user's venue status and update the UI accordingly.

## [2024-08-01] Venue Submission & Super Admin Approval Workflow Overhaul

### 1. Schema Cleanup
- Remove legacy/conflicting columns and tables related to old venue approval workflows.

### 2. ENUM Types
```sql
-- Venue Type ENUM
CREATE TYPE IF NOT EXISTS venue_type AS ENUM ('cricket-box', 'farmhouse', 'banquet-hall', 'sports-complex', 'party-hall', 'conference-room');
-- Venue Status ENUM
CREATE TYPE IF NOT EXISTS venue_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');
```

### 3. Venues Table (Clean Schema)
```sql
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  venue_type venue_type,
  address text,
  city text,
  state text,
  country text,
  zip_code text,
  pincode text,
  capacity integer,
  area text,
  hourly_rate integer,
  daily_rate integer,
  price_per_hour integer,
  price_per_day integer,
  image_urls text[],
  amenities text[],
  website text,
  status venue_status DEFAULT 'pending',
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_date timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  submission_date timestamptz DEFAULT now(),
  is_approved boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  rating numeric,
  total_reviews integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 4. Venue Approval Logs Table
```sql
CREATE TABLE IF NOT EXISTS public.venue_approval_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('approved', 'rejected', 'pending_review')),
  reason text,
  admin_notes text,
  created_at timestamptz DEFAULT now()
);
```

### 5. Supabase Storage
- Ensure a bucket exists for venue images/videos. Store URLs in `image_urls` array.

### 6. RLS Policies
```sql
-- Enable RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_approval_logs ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own venues
CREATE POLICY IF NOT EXISTS "Venue owners can manage their venues" ON public.venues
  FOR ALL USING (auth.uid() = owner_id);

-- Super admins can view/manage all venues
CREATE POLICY IF NOT EXISTS "Super admins can view all venues" ON public.venues
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- Anyone can view approved and active venues
CREATE POLICY IF NOT EXISTS "Anyone can view approved and active venues" ON public.venues
  FOR SELECT USING (is_active = true AND approval_status = 'approved');

-- Super admins can view all approval logs
CREATE POLICY IF NOT EXISTS "Super admins can view all approval logs" ON public.venue_approval_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- Super admins can insert approval logs
CREATE POLICY IF NOT EXISTS "Super admins can insert approval logs" ON public.venue_approval_logs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin'));
```

### 7. Triggers
```sql
-- Update updated_at on change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_venues_updated_at BEFORE UPDATE ON public.venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 8. Approval Functions
```sql
-- Approve Venue
CREATE OR REPLACE FUNCTION public.approve_venue(
    venue_uuid uuid,
    admin_notes text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    venue_record public.venues;
    user_profile public.profiles;
    result jsonb;
BEGIN
    SELECT * INTO venue_record FROM public.venues WHERE id = venue_uuid;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venue not found');
    END IF;
    SELECT * INTO user_profile FROM public.profiles WHERE user_id = venue_record.submitted_by;
    UPDATE public.venues 
    SET approval_status = 'approved',
        approval_date = now(),
        approved_by = auth.uid(),
        is_approved = true,
        is_active = true
    WHERE id = venue_uuid;
    IF user_profile.role != 'owner' THEN
        UPDATE public.profiles 
        SET role = 'owner',
            owner_verified = true,
            owner_verification_date = now()
        WHERE user_id = venue_record.submitted_by;
    END IF;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject Venue
CREATE OR REPLACE FUNCTION public.reject_venue(
    venue_uuid uuid,
    rejection_reason text,
    admin_notes text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    venue_record public.venues;
    result jsonb;
BEGIN
    SELECT * INTO venue_record FROM public.venues WHERE id = venue_uuid;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venue not found');
    END IF;
    UPDATE public.venues 
    SET approval_status = 'rejected',
        rejection_reason = rejection_reason,
        is_approved = false,
        is_active = false
    WHERE id = venue_uuid;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 9. Notes
- All legacy/conflicting schema and policies have been removed or replaced.
- All changes are fully documented and ready for Supabase migration.

### 10. RPC Functions for Venue Submission
```sql
-- Function to submit a new venue
CREATE OR REPLACE FUNCTION public.submit_venue(venue_data jsonb)
RETURNS jsonb AS $$
DECLARE
    venue_id uuid;
    user_id uuid;
    user_email text;
    venue_record record;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    -- Get user email from profiles
    SELECT email INTO user_email FROM public.profiles WHERE user_id = user_id;
    IF user_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User email not found');
    END IF;
    -- Insert venue into database
    INSERT INTO public.venues (
        owner_id,
        submitted_by,
        submitter_email,
        name,
        description,
        venue_type,
        address,
        city,
        state,
        country,
        pincode,
        zip_code,
        capacity,
        area,
        hourly_rate,
        daily_rate,
        price_per_hour,
        price_per_day,
        image_urls,
        amenities,
        website,
        status,
        approval_status,
        submission_date,
        is_approved,
        is_active
    ) VALUES (
        user_id,
        user_id,
        user_email,
        venue_data->>'name',
        venue_data->>'description',
        (venue_data->>'type')::venue_type,
        venue_data->>'address',
        venue_data->>'city',
        venue_data->>'state',
        venue_data->>'country',
        venue_data->>'pincode',
        venue_data->>'zip_code',
        (venue_data->>'capacity')::integer,
        venue_data->>'area',
        (venue_data->>'hourly_rate')::integer,
        CASE WHEN venue_data->>'daily_rate' IS NOT NULL THEN (venue_data->>'daily_rate')::integer ELSE NULL END,
        (venue_data->>'hourly_rate')::integer,
        CASE WHEN venue_data->>'daily_rate' IS NOT NULL THEN (venue_data->>'daily_rate')::integer ELSE NULL END,
        COALESCE(venue_data->'images', '[]'::jsonb),
        COALESCE(venue_data->'amenities', '[]'::jsonb),
        venue_data->>'website',
        'pending'::venue_status,
        'pending',
        now(),
        false,
        true
    ) RETURNING id INTO venue_id;
    -- Update user role to owner if not already
    UPDATE public.profiles 
    SET role = 'owner',
        owner_verified = true,
        owner_verification_date = now()
    WHERE user_id = user_id AND role != 'owner';
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Venue submitted successfully',
        'venue_id', venue_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's submitted venues
CREATE OR REPLACE FUNCTION public.get_user_submitted_venues()
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    type text,
    address text,
    city text,
    state text,
    pincode text,
    capacity integer,
    area text,
    hourly_rate integer,
    daily_rate integer,
    images text[],
    videos text[],
    approval_status text,
    submission_date timestamptz,
    approval_date timestamptz,
    rejection_reason text,
    is_approved boolean,
    is_active boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.description,
        v.venue_type::text,
        v.address,
        v.city,
        v.state,
        v.pincode,
        v.capacity,
        v.area,
        v.hourly_rate,
        v.daily_rate,
        v.image_urls,
        ARRAY[]::text[] as videos, -- Placeholder for videos
        v.approval_status,
        v.submission_date,
        v.approval_date,
        v.rejection_reason,
        v.is_approved,
        v.is_active
    FROM public.venues v
    WHERE v.owner_id = auth.uid()
    ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's venue statistics
CREATE OR REPLACE FUNCTION public.get_user_venue_stats()
RETURNS jsonb AS $$
DECLARE
    stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_submitted', COUNT(*),
        'pending_review', COUNT(*) FILTER (WHERE approval_status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE approval_status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE approval_status = 'rejected'),
        'active_venues', COUNT(*) FILTER (WHERE is_active = true AND approval_status = 'approved')
    ) INTO stats
    FROM public.venues
    WHERE owner_id = auth.uid();
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 11. Tag Venue Submissions with User Sign-in Email
```sql
-- Add submitter_email column to venues table
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS submitter_email text;

-- Update submit_venue function to save user email
CREATE OR REPLACE FUNCTION public.submit_venue(venue_data jsonb)
RETURNS jsonb AS $$
DECLARE
    venue_id uuid;
    user_id uuid;
    user_email text;
    venue_record record;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    -- Get user email from profiles
    SELECT email INTO user_email FROM public.profiles WHERE user_id = user_id;
    IF user_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User email not found');
    END IF;
    -- Insert venue into database
    INSERT INTO public.venues (
        owner_id,
        submitted_by,
        submitter_email,
        name,
        description,
        venue_type,
        address,
        city,
        state,
        country,
        pincode,
        zip_code,
        capacity,
        area,
        hourly_rate,
        daily_rate,
        price_per_hour,
        price_per_day,
        image_urls,
        amenities,
        website,
        status,
        approval_status,
        submission_date,
        is_approved,
        is_active
    ) VALUES (
        user_id,
        user_id,
        user_email,
        venue_data->>'name',
        venue_data->>'description',
        (venue_data->>'type')::venue_type,
        venue_data->>'address',
        venue_data->>'city',
        venue_data->>'state',
        venue_data->>'country',
        venue_data->>'pincode',
        venue_data->>'zip_code',
        (venue_data->>'capacity')::integer,
        venue_data->>'area',
        (venue_data->>'hourly_rate')::integer,
        CASE WHEN venue_data->>'daily_rate' IS NOT NULL THEN (venue_data->>'daily_rate')::integer ELSE NULL END,
        (venue_data->>'hourly_rate')::integer,
        CASE WHEN venue_data->>'daily_rate' IS NOT NULL THEN (venue_data->>'daily_rate')::integer ELSE NULL END,
        COALESCE(venue_data->'images', '[]'::jsonb),
        COALESCE(venue_data->'amenities', '[]'::jsonb),
        venue_data->>'website',
        'pending'::venue_status,
        'pending',
        now(),
        false,
        true
    ) RETURNING id INTO venue_id;
    -- Update user role to owner if not already
    UPDATE public.profiles 
    SET role = 'owner',
        owner_verified = true,
        owner_verification_date = now()
    WHERE user_id = user_id AND role != 'owner';
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Venue submitted successfully',
        'venue_id', venue_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 2024-08-01: Comprehensive Venue Approval, Owner Management, and Logging System Migration

This migration ensures all required columns, triggers, indexes, RLS policies, and functions are present for a robust venue approval and management workflow, including owner promotion, admin logging, and real-time support.

### 1. Venues Table: Approval & Audit Columns
```sql
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approval_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS submission_date timestamp with time zone DEFAULT now();
```

### 2. Venue Approval Logs Table
```sql
CREATE TABLE IF NOT EXISTS public.venue_approval_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
    admin_id uuid REFERENCES auth.users(id),
    action text NOT NULL CHECK (action IN ('approved', 'rejected', 'pending_review')),
    reason text,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now()
);
```

### 3. Super Admin Credentials Table
```sql
CREATE TABLE IF NOT EXISTS public.super_admin_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### 4. Profiles Table: Owner Management Columns
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS owner_id text UNIQUE,
ADD COLUMN IF NOT EXISTS owner_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS owner_verification_date timestamp with time zone;
```

### 5. Indexes for Fast Lookup
```sql
CREATE INDEX IF NOT EXISTS idx_venues_approval_status ON public.venues(approval_status);
CREATE INDEX IF NOT EXISTS idx_venues_submitted_by ON public.venues(submitted_by);
CREATE INDEX IF NOT EXISTS idx_venues_approval_date ON public.venues(approval_date);
CREATE INDEX IF NOT EXISTS idx_venue_approval_logs_venue_id ON public.venue_approval_logs(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_approval_logs_admin_id ON public.venue_approval_logs(admin_id);
```

### 6. RLS Policies
```sql
-- Enable RLS on all relevant tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_approval_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_credentials ENABLE ROW LEVEL SECURITY;

-- Venues: Only owners can update/delete their venues; only admins/super_admins can approve/reject; public can read only approved/active venues
CREATE POLICY "Public can view approved venues" ON public.venues
    FOR SELECT USING (approval_status = 'approved' AND is_active = true);
CREATE POLICY "Owner can manage own venues" ON public.venues
    FOR UPDATE USING (submitted_by = auth.uid());
CREATE POLICY "Owner can delete own venues" ON public.venues
    FOR DELETE USING (submitted_by = auth.uid());
CREATE POLICY "Admins can approve/reject venues" ON public.venues
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Venue Approval Logs: Only super admins can view/insert
CREATE POLICY "Super admins can view all approval logs" ON public.venue_approval_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Super admins can insert approval logs" ON public.venue_approval_logs
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- Super Admin Credentials: Private by default
CREATE POLICY "Super admin credentials are private" ON public.super_admin_credentials
    FOR ALL USING (false);
```

### 7. Triggers for Owner Promotion & Audit
```sql
-- Assign owner_id when user becomes owner
CREATE OR REPLACE FUNCTION public.assign_owner_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'owner' AND OLD.role != 'owner' THEN
        NEW.owner_id := 'OWNER_' || substr(NEW.user_id::text, 1, 8);
        NEW.owner_verified := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_owner_id ON public.profiles;
CREATE TRIGGER trigger_assign_owner_id
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.assign_owner_id();

-- Update venues.updated_at on change
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_venues_updated_at ON public.venues;
CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON public.venues
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### 8. Approval & Rejection Functions
```sql
-- Approve venue
CREATE OR REPLACE FUNCTION public.approve_venue(
    venue_uuid uuid,
    admin_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    venue_record public.venues;
    user_profile public.profiles;
    result jsonb;
BEGIN
    SELECT * INTO venue_record FROM public.venues WHERE id = venue_uuid;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venue not found');
    END IF;
    SELECT * INTO user_profile FROM public.profiles WHERE user_id = venue_record.submitted_by;
    UPDATE public.venues 
    SET approval_status = 'approved',
        approval_date = now(),
        approved_by = auth.uid(),
        is_approved = true,
        is_active = true
    WHERE id = venue_uuid;
    IF user_profile.role != 'owner' THEN
        UPDATE public.profiles 
        SET role = 'owner',
            owner_verified = true,
            owner_verification_date = now()
        WHERE user_id = venue_record.submitted_by;
    END IF;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject venue
CREATE OR REPLACE FUNCTION public.reject_venue(
    venue_uuid uuid,
    rejection_reason text,
    admin_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    venue_record public.venues;
    result jsonb;
BEGIN
    SELECT * INTO venue_record FROM public.venues WHERE id = venue_uuid;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venue not found');
    END IF;
    UPDATE public.venues 
    SET approval_status = 'rejected',
        rejection_reason = rejection_reason,
        is_approved = false,
        is_active = false
    WHERE id = venue_uuid;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 9. Delete, Resubmit, Hide/Unlist Venue Functions
```sql
-- Delete venue (soft delete)
CREATE OR REPLACE FUNCTION public.delete_venue(
    venue_uuid uuid
)
RETURNS jsonb AS $$
BEGIN
    UPDATE public.venues SET is_active = false WHERE id = venue_uuid;
    RETURN jsonb_build_object('success', true, 'message', 'Venue deleted (unlisted)');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resubmit venue (after rejection)
CREATE OR REPLACE FUNCTION public.resubmit_venue(
    venue_uuid uuid
)
RETURNS jsonb AS $$
BEGIN
    UPDATE public.venues 
    SET approval_status = 'pending',
        rejection_reason = NULL,
        submission_date = now(),
        is_active = true
    WHERE id = venue_uuid;
    RETURN jsonb_build_object('success', true, 'message', 'Venue resubmitted for approval');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 10. Activity Log Fetch Function
```sql
-- Fetch activity logs for a venue
CREATE OR REPLACE FUNCTION public.get_venue_activity_logs(
    venue_uuid uuid
)
RETURNS TABLE (
    log_id uuid,
    admin_id uuid,
    action text,
    reason text,
    admin_notes text,
    created_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, admin_id, action, reason, admin_notes, created_at
    FROM public.venue_approval_logs
    WHERE venue_id = venue_uuid
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

**All changes above must be executed in Supabase SQL Editor or via CLI, and this file must be kept as the source of truth.**

**See also:**
- `DATABASE_POLICIES.md` for RLS details
- `DATABASE_TRIGGERS.md` for triggers
- `DATABASE_INDEXES.md` for indexes
- `DATABASE_TABLES.md` for table structure

---

## [2024-08-01] Remove password hashing for super admin login (TEMPORARY)

- Updated `public.super_admin_credentials` to store the password in plain text for the super admin account (`superadmin@venuefinder.com`).
- Updated `public.authenticate_super_admin` function to compare the password as plain text only.
- **TEMPORARY:** Password for superadmin is now: `King1#889790@`
- This is for development/debug only. Revert to hashed passwords before production.

```sql
-- Migration: Remove hashing for super admin login and set plain password
UPDATE public.super_admin_credentials
SET password_hash = 'King1#889790@'
WHERE email = 'superadmin@venuefinder.com';

CREATE OR REPLACE FUNCTION public.authenticate_super_admin(
    admin_id_input text,
    password_input text
)
RETURNS jsonb AS $$
DECLARE
    admin_record public.super_admin_credentials;
    result jsonb;
BEGIN
    -- Get admin credentials
    SELECT * INTO admin_record 
    FROM public.super_admin_credentials 
    WHERE admin_id = admin_id_input AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
    
    -- Check if account is locked
    IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > now() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account is temporarily locked');
    END IF;
    
    -- Verify password (plain text)
    IF admin_record.password_hash = password_input THEN
        -- Reset login attempts and update last login
        UPDATE public.super_admin_credentials 
        SET login_attempts = 0,
            last_login = now(),
            locked_until = NULL
        WHERE id = admin_record.id;
        
        RETURN jsonb_build_object(
            'success', true,
            'admin_id', admin_record.admin_id,
            'email', admin_record.email,
            'full_name', admin_record.full_name
        );
    ELSE
        -- Increment login attempts
        UPDATE public.super_admin_credentials 
        SET login_attempts = login_attempts + 1,
            locked_until = CASE 
                WHEN login_attempts >= 4 THEN now() + interval '15 minutes'
                ELSE NULL 
            END
        WHERE id = admin_record.id;
        
        RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

```

### 9. Update Role Naming and Promotion Logic (2024-08-02)
**Purpose:** Standardize role names and ensure correct role promotion on venue approval.

```sql
-- 1. Rename 'admin' to 'administrator' in user_role enum
ALTER TYPE user_role RENAME VALUE 'admin' TO 'administrator';

-- 2. Update approve_venue function to promote to 'venue_owner' instead of 'owner' or 'admin'
CREATE OR REPLACE FUNCTION public.approve_venue(
    venue_uuid uuid,
    admin_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
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
    -- Update user role to venue_owner if not already
    IF user_profile.role != 'venue_owner' THEN
        UPDATE public.profiles 
        SET role = 'venue_owner',
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Role Naming Conventions:**
- `user`: Normal user
- `venue_owner`: User who has at least one approved venue
- `administrator`: Admin accounts (formerly `admin`)
- `owner`: Website owner or super admin
- `super_admin`: Highest privilege (if used)

## [2024-07-05] Add missing columns to public.venues for new venue listing form

To support all fields collected by the new multi-step venue listing form, add the following columns to the venues table:

```sql
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS location_link text, -- Google Maps link (optional)
  ADD COLUMN IF NOT EXISTS map_embed_code text, -- Google Maps embed HTML (optional)
  ADD COLUMN IF NOT EXISTS videos text[], -- Video URLs (YouTube/Vimeo, optional)
  ADD COLUMN IF NOT EXISTS availability text[], -- Available days (array of strings, optional)
  ADD COLUMN IF NOT EXISTS contact_number text, -- Contact phone (required)
  ADD COLUMN IF NOT EXISTS email text, -- Contact email (required)
  ADD COLUMN IF NOT EXISTS company text; -- Company/organization (optional)
```

**Explanation:**
- `location_link`: Stores the Google Maps link for the venue location.
- `map_embed_code`: Stores the Google Maps iframe HTML for embedding a map.
- `videos`: Stores an array of video URLs (YouTube/Vimeo) for the venue.
- `availability`: Stores an array of available days (e.g., ["Monday", "Tuesday"]).
- `contact_number`: Stores the venue's contact phone number.
- `email`: Stores the venue's contact email address.
- `company`: Stores the company or organization name (if provided).

**This migration ensures all fields from the new venue listing form can be saved in the venues table.**

# Venues Table (2024-08-01)

## Table Definition
```sql
CREATE TYPE venue_type AS ENUM (
  'Event Hall', 'Conference Room', 'Wedding Venue', 'Restaurant', 'Hotel',
  'Outdoor Space', 'Theater', 'Gallery', 'Sports Venue', 'Community Center'
);

CREATE TABLE public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_name text NOT NULL,
  venue_type venue_type NOT NULL,
  address text NOT NULL,
  location_link text,
  website text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Indexes
```sql
CREATE INDEX idx_venues_venue_type ON public.venues(venue_type);
CREATE INDEX idx_venues_owner_id ON public.venues(owner_id);
CREATE INDEX idx_venues_created_at ON public.venues(created_at);
```

## Row Level Security (RLS) Policies
```sql
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert their own venues" ON public.venues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND auth.uid() = owner_id AND auth.uid() = submitted_by);

CREATE POLICY "Anyone can view venues" ON public.venues
  FOR SELECT
  USING (true);

CREATE POLICY "Venue owners can update their own venues" ON public.venues
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Venue owners can delete their own venues" ON public.venues
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);
```

## Triggers
```sql
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

**2024-08-01:** Created new venues table for modern venue listing form. Includes all required fields, RLS, indexes, and triggers. Old table, types, and policies removed. All changes tested and synced with Supabase.

---

## 2024-08-01: Add capacity, area, and amenities columns to venues table
**Purpose:** Support advanced specifications and amenities selection in venue listing form.

```sql
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS capacity integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS area integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}';
```

- These fields are required for the new Specifications step in the frontend form.
- amenities is a text[] array to store selected amenity IDs.

---

## 2024-08-01: Add media, pricing, availability, and contact columns to venues table
**Purpose:** Support media uploads, pricing, booking, and contact information in venue listing form.

```sql
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS videos text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS price_per_hour numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_per_day numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS availability text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contact_number text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS company text;
```

- These fields are required for the new Media, Pricing, and Contact steps in the frontend form.
- All columns are simple types to avoid foreign key issues.

---

## [2024-07-01 - Remove Single-Tab Session Enforcement

**Changes Made:**
- Dropped `active_tab_id` column from `profiles` table.
- Dropped RLS policy "Only active tab can update profile" on `profiles`.
- Dropped `tab_sessions` table (if it existed).

**Reason:**
- The app no longer enforces single active tab or tab-level session management. Only cross-tab logout is maintained for security. Logging in does not auto-login other tabs.

**SQL:**
```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS active_tab_id;
DROP POLICY IF EXISTS "Only active tab can update profile" ON profiles;
DROP TABLE IF EXISTS tab_sessions;
```

## [2024-07-01 - Added admin_users Table for Super Admin/Admin Isolation](2024-07-01 - Added admin_users Table for Super Admin/Admin Isolation)

**Changes Made:**
- Created new table `admin_users` for Super Admins/Admins with custom email-password login.
- Added RLS policy to allow access to self only.

**SQL:**
```sql
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin')),
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow access to self only"
  ON public.admin_users
  FOR SELECT USING (auth.uid() = id);
```

---

## [2024-08-02] Deprecation and Removal of super_admin_credentials Table and Functions

**Reason:**
- The new `admin_users` table is now the source of truth for Super Admin/Admin authentication and session isolation.
- The legacy `super_admin_credentials` table and its functions are no longer needed and have been removed for security and clarity.

**SQL Executed:**
```sql
-- Drop legacy super admin credentials table and related functions
DROP TABLE IF EXISTS public.super_admin_credentials CASCADE;
DROP FUNCTION IF EXISTS public.authenticate_super_admin CASCADE;
DROP FUNCTION IF EXISTS public.create_super_admin CASCADE;
```

**Timestamp:** 2024-08-02
**Applied via Supabase MCP.**

---

## [2024-08-02] Add Super Admin (sai@gmail.com) and RLS for Admin Management

**Reason:**
- Inserted initial super admin credentials for `sai@gmail.com`.
- Updated RLS policies to allow super_admins to add/update admins and access all admin records, while all admins can access their own records.

**SQL Executed:**
```sql
-- Insert super admin
INSERT INTO public.admin_users (email, password, role) VALUES ('sai@gmail.com', 'changeme123', 'super_admin');

-- RLS policies for admin management
DROP POLICY IF EXISTS "Super admins can insert admins" ON public.admin_users;
CREATE POLICY "Super admins can insert admins" ON public.admin_users
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = 'sai@gmail.com' AND au.role = 'super_admin') AND role IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Super admins can update admins" ON public.admin_users;
CREATE POLICY "Super admins can update admins" ON public.admin_users
  FOR UPDATE
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = 'sai@gmail.com' AND au.role = 'super_admin') AND role IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Admins can access self" ON public.admin_users;
CREATE POLICY "Admins can access self" ON public.admin_users
  FOR SELECT
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = 'sai@gmail.com' AND au.role = 'super_admin'));
```

**Timestamp:** 2024-08-02
**Applied via Supabase MCP.**

### 10. Merge 'owner' and 'super_admin' Roles (2024-08-02)
**Purpose:** Unify the highest privilege roles and simplify role management.

```sql
-- 1. Update all 'owner' roles in profiles to 'super_admin'
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'owner';

-- 2. Remove 'owner' from user_role enum by recreating the type
-- (Dropped all dependent policies and functions before this step)
CREATE TYPE user_role_new AS ENUM ('user', 'venue_owner', 'administrator', 'super_admin');
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new;
DROP TYPE user_role;
ALTER TYPE user_role_new RENAME TO user_role;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- 3. Recreate any necessary policies/functions after type change.
```

- All RLS policies and functions referencing 'owner' or the old enum were dropped and should be recreated as needed.
- 'super_admin' now represents both the website owner and super admin roles.

# [2024-08-02] Mark All Approved/Rejected Venues as Cricket Venues (Sports Venue)

**Purpose:**
To ensure all previously approved and rejected venues are now categorized as cricket venues (using the closest available enum: 'Sports Venue').

**SQL Command Executed:**
```sql
UPDATE public.venues
SET venue_type = 'Sports Venue'
WHERE approval_status IN ('approved', 'rejected');
```

**Result:**
All venues with approval_status 'approved' or 'rejected' now have venue_type = 'Sports Venue'.

**Timestamp:** 2024-08-02

## [2024-08-02] Subvenues/Spaces Schema Standardization

**Purpose:** Remove confusion between sub_venues and subvenues. Use a single, clear table for all sub-venue/space data, with unique column names and proper RLS.

```sql
-- Drop old sub_venues table and dependencies
DROP TABLE IF EXISTS public.sub_venues CASCADE;

-- Create subvenues table with unique subvenue_* columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subvenue_status') THEN
    CREATE TYPE subvenue_status AS ENUM ('active', 'inactive', 'maintenance');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.subvenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  subvenue_name text NOT NULL,
  subvenue_description text,
  subvenue_features text[],
  subvenue_images text[],
  subvenue_videos text[],
  subvenue_amenities text[],
  subvenue_capacity integer,
  subvenue_type text,
  subvenue_status subvenue_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subvenues_venue_id ON public.subvenues(venue_id);

ALTER TABLE public.subvenues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Venue owners can manage their subvenues" ON public.subvenues;
CREATE POLICY "Venue owners can manage their subvenues" ON public.subvenues
  FOR ALL USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = subvenues.venue_id AND v.owner_id = auth.uid()));
```

**Note:** All sub-venue/space management will use the `subvenues` table. All columns for sub-venue/space are prefixed with `subvenue_` for clarity. Old table and dependencies dropped with CASCADE. [2024-08-02]

## [2024-08-02] Subvenues/Spaces Table Creation

**Purpose:** Create a dedicated table for sub-venues/spaces, linked to the main venue by `venue_id`. All subvenue fields are included, with RLS and status enum.

```sql
-- Create subvenue_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subvenue_status') THEN
    CREATE TYPE subvenue_status AS ENUM ('active', 'inactive', 'maintenance');
  END IF;
END$$;

-- Create subvenues table
CREATE TABLE IF NOT EXISTS public.subvenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  subvenue_name text NOT NULL,
  subvenue_description text,
  subvenue_features text[],
  subvenue_images text[],
  subvenue_videos text[],
  subvenue_amenities text[],
  subvenue_capacity integer,
  subvenue_type text,
  subvenue_status subvenue_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subvenues_venue_id ON public.subvenues(venue_id);

ALTER TABLE public.subvenues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Venue owners can manage their subvenues" ON public.subvenues;
CREATE POLICY "Venue owners can manage their subvenues" ON public.subvenues
  FOR ALL USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = subvenues.venue_id AND v.owner_id = auth.uid()));
```
