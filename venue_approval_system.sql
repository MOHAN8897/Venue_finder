-- Venue Submission & Super Admin Management System
-- Execute this file in Supabase SQL Editor to set up the complete approval workflow

-- 1. Update Venues Table for Approval System
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

-- 2. Create Super Admin Authentication Table
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

-- 3. Create Venue Approval Logs Table
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

-- 4. Update Profiles Table for Owner Management
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

-- 5. Create Venue Management Functions

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
        v.id,
        v.name,
        v.type::text,
        v.submitted_by,
        p.email,
        p.name,
        v.submission_date,
        v.description,
        v.address,
        v.city,
        v.state,
        v.capacity,
        v.hourly_rate
    FROM public.venues v
    LEFT JOIN public.profiles p ON v.submitted_by = p.user_id
    WHERE v.approval_status = 'pending'
    ORDER BY v.submission_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get venue details for approval
CREATE OR REPLACE FUNCTION public.get_venue_approval_details(venue_uuid uuid)
RETURNS jsonb AS $$
DECLARE
    venue_data jsonb;
    submitter_data jsonb;
    result jsonb;
BEGIN
    -- Get venue details
    SELECT row_to_json(v) INTO venue_data
    FROM public.venues v
    WHERE v.id = venue_uuid;
    
    -- Get submitter details
    SELECT row_to_json(p) INTO submitter_data
    FROM public.profiles p
    WHERE p.user_id = (SELECT submitted_by FROM public.venues WHERE id = venue_uuid);
    
    -- Combine data
    result := jsonb_build_object(
        'venue', venue_data,
        'submitter', submitter_data
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update RLS Policies for Venue Management
DROP POLICY IF EXISTS "Anyone can view approved and active venues" ON public.venues;
CREATE POLICY "Anyone can view approved and active venues" ON public.venues
    FOR SELECT USING (approval_status = 'approved' AND is_active = true);

CREATE POLICY "Users can view their own submitted venues" ON public.venues
    FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Super admins can view all venues" ON public.venues
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Authenticated users can submit venues" ON public.venues
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Super admins can update venue approval status" ON public.venues
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Owners can update their approved venues" ON public.venues
    FOR UPDATE USING (
        owner_id = auth.uid() AND approval_status = 'approved'
    );

-- 7. Create Owner Management Functions

-- Function to get owner's venues
CREATE OR REPLACE FUNCTION public.get_owner_venues(owner_uuid uuid)
RETURNS TABLE (
    venue_id uuid,
    venue_name text,
    venue_type text,
    approval_status text,
    is_active boolean,
    rating numeric,
    review_count integer,
    created_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.type::text,
        v.approval_status,
        v.is_active,
        v.rating,
        v.review_count,
        v.created_at
    FROM public.venues v
    WHERE v.owner_id = owner_uuid
    ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get owner dashboard stats
CREATE OR REPLACE FUNCTION public.get_owner_dashboard_stats(owner_uuid uuid)
RETURNS jsonb AS $$
DECLARE
    stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_venues', COUNT(*),
        'approved_venues', COUNT(*) FILTER (WHERE approval_status = 'approved'),
        'pending_venues', COUNT(*) FILTER (WHERE approval_status = 'pending'),
        'rejected_venues', COUNT(*) FILTER (WHERE approval_status = 'rejected'),
        'active_venues', COUNT(*) FILTER (WHERE is_active = true),
        'total_reviews', COALESCE(SUM(review_count), 0),
        'average_rating', COALESCE(AVG(rating), 0)
    ) INTO stats
    FROM public.venues
    WHERE owner_id = owner_uuid;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create Super Admin Authentication Function
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
    
    -- Verify password (using simple hash comparison for demo - in production use proper bcrypt)
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

-- 9. Create Super Admin User Profile
-- This function creates a super admin user profile when needed
CREATE OR REPLACE FUNCTION public.create_super_admin_profile(
    admin_email text,
    admin_name text
)
RETURNS jsonb AS $$
DECLARE
    new_user_id uuid;
    result jsonb;
BEGIN
    -- Create a new user in auth.users (this would typically be done through Supabase Auth)
    -- For now, we'll assume the user already exists and just update their profile
    
    -- Update or create profile with super_admin role
    INSERT INTO public.profiles (
        user_id,
        email,
        name,
        role,
        owner_verified,
        owner_verification_date
    ) VALUES (
        (SELECT id FROM auth.users WHERE email = admin_email LIMIT 1),
        admin_email,
        admin_name,
        'super_admin',
        true,
        now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'super_admin',
        owner_verified = true,
        owner_verification_date = now();
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Super admin profile created/updated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create the super admin user profile
SELECT public.create_super_admin_profile('superadmin@venuefinder.com', 'Super Administrator'); 