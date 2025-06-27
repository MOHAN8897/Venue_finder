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
$$ LANGUAGE plpgsql;

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
```

### 6. Update RLS Policies for Venue Management
**Purpose:** Enhanced security policies for the approval workflow.

```sql
-- Update venues table RLS policies
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
```

### 7. Create Owner Management Functions
**Purpose:** Functions for managing venue owners and their venues.

```sql
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
```

---

## Demo Venues Setup (2025-06-25)

### Demo Owner and Venues Creation
**Purpose:** Created 10 demo venues under a single owner ID for testing and demonstration.

**Owner Details:**
- Owner ID: `01202500-0000-0000-0000-000000000000`
- Email: `demo.owner@venuefinder.com`
- Password: `DemoOwner123!`
- Business: Demo Venue Management

**Demo User Details:**
- User ID: `01202501-0000-0000-0000-000000000000`
- Email: `demo.user@venuefinder.com`
- Password: `DemoUser123!`

**Venues Created:**
1. Elite Cricket Academy (Cricket Box)
2. Green Meadows Farmhouse (Farmhouse)
3. Royal Palace Banquet Hall (Banquet Hall)
4. MultiSport Arena (Sports Complex)
5. Celebration Zone (Party Hall)
6. Business Hub Conference Center (Conference Room)
7. Premium Cricket Ground (Cricket Box - Premium)
8. Luxury Villa Retreat (Farmhouse - Luxury)
9. Grand Palace Events (Banquet Hall - Grand)
10. Olympic Sports Center (Sports Complex - Multi-purpose)

**Key Features:**
- All venues under single owner ID for easy management
- Realistic pricing, capacity, and amenities
- High-quality images from Unsplash
- Sample reviews and favorites
- All venues approved and active
- Featured venues for homepage display

**Cleanup Command:**
```sql
DELETE FROM public.venues WHERE owner_id = '01202500-0000-0000-0000-000000000000';
```

**Files Created:**
- `final_demo_setup.sql` - Complete demo setup script
- `DEMO_SETUP_COMPLETE.md` - Comprehensive documentation

---

## User Profile Sync Fix (2025-06-23)

### 1. get_user_profile Function
```sql
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS JSONB AS $$
DECLARE
    profile JSONB;
BEGIN
    SELECT row_to_json(p)
    INTO profile
    FROM public.profiles p
    WHERE p.user_id = auth.uid();
    RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. RLS Policy for Profiles
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);
```

### 3. Troubleshooting: Check for User Profile Row
```sql
-- Replace <your-user-id> with the actual user UUID
SELECT * FROM public.profiles WHERE user_id = '<your-user-id>';
```

**Note:**
- This migration ensures the frontend can fetch the user profile via the get_user_profile RPC.
- If users still see "Failed to load user profile", check that their row exists in the profiles table and that RLS policies are correct.
- All changes are now live and in sync with Supabase. 

## Profile Editing Validation & RLS (2024-06-24)

### 1. Enforce valid date_of_birth or null
```sql
ALTER TABLE public.profiles
  ALTER COLUMN date_of_birth DROP DEFAULT,
  ALTER COLUMN date_of_birth DROP NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_date_of_birth_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_date_of_birth_check CHECK (
    date_of_birth IS NULL OR date_of_birth::text ~ '^\\d{4}-\\d{2}-\\d{2}$'
  );
```

### 2. RLS Policy for Profile Updates
```sql
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3. Notification Settings & Preferences
- Always send valid JSON for notification_settings and preferences.
- These fields are editable and synced with the user's profile.
- Frontend and backend now robustly handle these fields. 

## Unified Profile Fields & RLS (2024-06-25)

### 1. Ensure all profile fields exist
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{
    "email_notifications": true,
    "sms_notifications": false,
    "marketing_emails": true,
    "booking_reminders": true,
    "new_venue_alerts": true
  }',
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}';
```

### 2. RLS Policies for Profile Editing
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
```

- All profile editing and viewing is now unified and secure.
- The Settings page is the single source of truth for user profile data. 

## Add Phone Column to Profiles (2024-06-26)

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;
```
- This column stores the user's phone number as text (digits only, normalized by the app). 

## Phone Number Field in Profiles

- The `phone` column in `public.profiles` is of type `text` and is **not unique**.
- Each user has their own phone number field in their profile. Duplicate phone numbers are allowed across users.
- The frontend (Settings page) always fetches and displays the phone number for the currently logged-in user only, using their `user_id`.
- All updates to the phone number are user-specific and do not affect other users.

-- SQL for reference:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
-- Remove unique constraint if it exists:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_type = 'UNIQUE' AND constraint_name = 'profiles_phone_key'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_phone_key;
  END IF;
END $$;

## RLS Policy for Profile Inserts (2024-06-27)

> **Note:** This policy allows authenticated users to insert their own profile row in the `profiles` table after sign-up. Without this, new users will see a database error when trying to create their profile due to RLS blocking the insert.

```sql
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## Current RLS Policies for `profiles` Table (as of 2024-06-27)

The following policies are active on the `profiles` table. This section is for reference and should be updated if policies change in the future.

| Policy Name                        | Command | Roles         | Qualifier (USING)                        | With Check (WITH CHECK)         |
|------------------------------------|---------|--------------|------------------------------------------|---------------------------------|
| Users can view all profiles        | SELECT  | public       | true                                     |                                 |
| Users can view profiles            | SELECT  | public       | true                                     |                                 |
| Users can update own profile       | UPDATE  | public       | (auth.uid() = user_id)                   |                                 |
| Users can select initial role      | UPDATE  | authenticated| ((auth.uid() = user_id) AND (role IS NULL)) | (auth.uid() = user_id)          |
| Users can update their own profile | UPDATE  | public       | (auth.uid() = user_id)                   | (auth.uid() = user_id)          |
| Users can view their own profile   | SELECT  | public       | (auth.uid() = user_id)                   |                                 |
| Users can insert own profile       | INSERT  | authenticated|                                          | (auth.uid() = user_id)          |

**Notes:**
- `auth.uid()` refers to the currently authenticated user's UUID.
- The `Users can insert own profile` policy is required for email/password sign-up to work.
- Multiple SELECT/UPDATE policies exist; ensure they do not conflict.
- Update this section if you add, remove, or change any RLS policies on the `profiles` table.

# SQL Commands for Venue Finder Database

## Recent Fixes and Updates

### 2024-06-30: Fix Profile Creation Issues
**Migration:** `20250630_fix_profile_creation.sql`

**Problem:** Database error when saving new users due to conflicting RLS policies and incomplete trigger function.

**Solution:**
1. Dropped all conflicting RLS policies
2. Created clean, comprehensive RLS policies
3. Fixed `handle_new_user` trigger function with proper error handling
4. Ensured all required fields are populated

**Key Changes:**
```sql
-- Clean RLS policies for profiles
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Testing:** Use `test_user_creation.sql` script to verify the fix.

---
## Venues Table Schema and Constraints

### Table Definition
The `venues` table stores all information related to a venue.

**Key Columns:**
- `id`: Primary Key (UUID)
- `owner_id`: Foreign Key to `auth.users(id)`
- `name`: Name of the venue
- `description`: Detailed description
- `address`, `city`, `state`, `zip_code`, `country`: Location details
- `capacity`: Maximum number of people
- `price_per_hour`: Rental cost
- `is_approved`: Whether the venue is approved by admins
- `is_featured`: Whether the venue is featured on the homepage

### Constraints

A `UNIQUE` constraint is enforced on the combination of `owner_id` and `name` to prevent a single owner from creating multiple venues with the same name.

```sql
-- Add UNIQUE constraint to venues table
ALTER TABLE public.venues
ADD CONSTRAINT venues_owner_id_name_key UNIQUE (owner_id, name);
```

## Current RLS Policies (Cloud Database)

| Schema  | Table             | Policy Name                          | Command | Roles         | Qualifier (USING) / With Check (WITH CHECK) |
|---------|-------------------|--------------------------------------|---------|---------------|---------------------------------------------|
| public  | profiles          | Users can view profiles              | SELECT  | public        | true                                        |
| public  | profiles          | Users can update their own profile   | UPDATE  | public        | (auth.uid() = user_id)                      |
| public  | profiles          | Users can insert own profile         | INSERT  | authenticated | (auth.uid() = user_id) (WITH CHECK)         |
| public  | profiles          | Users can view all profiles          | SELECT  | public        | true                                        |
| public  | profiles          | Users can view their own profile     | SELECT  | public        | (auth.uid() = user_id)                      |
| public  | profiles          | Users can select initial role        | UPDATE  | authenticated | ((auth.uid() = user_id) AND (role IS NULL)) |
| public  | profiles          | Users can update own profile         | UPDATE  | public        | (auth.uid() = user_id)                      |
| public  | venues            | Anyone can view approved venues      | SELECT  | public        | (status = 'approved')                       |
| public  | venues            | Admins can manage all venues         | ALL     | public        | (admin/super_admin)                         |
| public  | venues            | Owners can update own venues         | UPDATE  | public        | (owner_id IN (SELECT profiles.id WHERE profiles.user_id = auth.uid())) |
| public  | venues            | Owners can insert venues             | INSERT  | public        | (owner_id IN (SELECT profiles.id WHERE profiles.user_id = auth.uid() AND role = 'owner')) |
| public  | venues            | Owners can view own venues           | SELECT  | public        | (owner_id IN (SELECT profiles.id WHERE profiles.user_id = auth.uid())) |
| ...     | ...               | ...                                  | ...     | ...           | ...                                         |

> This table is a summary. For full details, see the attached RLS policy output or the Supabase dashboard.

## Cloud Database Schema Dump (2025-06-25)

**Purpose:** To create a reference snapshot of the entire cloud database schema for analysis and local synchronization.

**Command Used:**
```bash
supabase db dump --schema-only --file cloud_schema_dump.sql
```

**Output File:**
- `cloud_schema_dump.sql`

This file represents the state of the production database schema at the time of the dump. It can be used for analysis, setting up local development environments, or as a baseline for creating new migrations.

---

## SQL File Consolidation & Migration Reference (2025-06-25)

**Purpose:** To reduce confusion and maintain a clean, organized set of SQL and documentation files for schema management, migrations, and demo data.

### Files to KEEP (Active)
- `venue_approval_system.sql` — All venue approval, super admin, and owner management schema changes and functions.
- `create_demo_users_and_venues.sql` — Demo/test data: users, profiles, and venues for testing.
- `cloud_schema_dump.sql` — Latest cloud schema snapshot (structure only, for reference or local setup).
- `local_schema.sql` — Local schema snapshot (optional, for local development reference).

### Files to ARCHIVE or DELETE (Redundant/Obsolete)
- `demo_venues_insert.sql`
- `final_demo_setup.sql`
- `simple_demo_setup.sql`
- `full_schema_dump.sql`
- `cloud_dump.sql`
- `test_user_creation.sql`
- `policies_dump.sql` (empty)
- Any other old/partial demo or schema files not listed above

### How to Apply Changes
- **Schema/Migrations:**
  ```sh
  supabase db execute venue_approval_system.sql
  ```
- **Demo/Test Data:**
  ```sh
  supabase db execute create_demo_users_and_venues.sql
  ```

### Documentation
- This section and the above file list serve as the single source of truth for future schema and data changes.
- All new migrations and data scripts should be added to the appropriate `.sql` file and referenced here.

---

## 6. User Session Tracking (2024-06-XX)
**Purpose:** Enable frontend session tracking and analytics by adding a user_sessions table and the create_user_session function, as required by sessionService.ts.

```sql
-- Create user_sessions table for session tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
    session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token text NOT NULL UNIQUE,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    last_activity timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true
);

-- Enable RLS (optional, recommended for security)
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create the function required by the frontend
CREATE OR REPLACE FUNCTION public.create_user_session(
    p_user_id uuid,
    p_session_token text,
    p_ip_address text DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    new_session_id uuid;
BEGIN
    INSERT INTO public.user_sessions (
        user_id, session_token, ip_address, user_agent, created_at, last_activity, is_active
    ) VALUES (
        p_user_id, p_session_token, p_ip_address, p_user_agent, now(), now(), true
    ) RETURNING session_id INTO new_session_id;
    RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note:** This enables the sessionService.ts logic in the frontend to work without errors. Adjust columns as needed for your analytics or security requirements.

## [NEW] 2024-07-01: Add Google Maps Embed Code to Venues Table
**Purpose:** Allow Super Admins to add a Google Maps iframe embed code for each approved venue, to be displayed on the venue detail page.

```sql
-- Add google_maps_embed_code column to venues table
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS google_maps_embed_code text;
```

- This field is editable by Super Admins after venue approval.
- It is rendered as an embedded map on the venue detail page for users.

## [NEW] 2024-07-01: Add Google Maps Link to Venues Table
**Purpose:** Require all venue submissions to include a Google Maps link for consistent location data.

```sql
-- Add google_maps_link column to venues table
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS google_maps_link text;
```

- This field is mandatory in the frontend submission form.
- It will be used by admins and users to verify and display venue locations.