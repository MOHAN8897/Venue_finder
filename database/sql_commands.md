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