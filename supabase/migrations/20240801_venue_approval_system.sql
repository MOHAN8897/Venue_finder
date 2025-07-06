-- Migration: Venue Approval System
-- Created: 2024-08-01 19:00

-- 1. Add approval_status column to venues table
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected'));

-- 2. Function to get venue approval details
CREATE OR REPLACE FUNCTION public.get_venue_approval_details(venue_uuid UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    owner_id UUID,
    approval_status TEXT,
    submitted_at TIMESTAMPTZ,
    owner_email TEXT
) AS $$
    SELECT
        v.id,
        v.name,
        v.description,
        v.owner_id,
        v.approval_status,
        v.submitted_at,
        u.email AS owner_email
    FROM public.venues v
    LEFT JOIN public.users u ON v.owner_id = u.id
    WHERE v.id = venue_uuid;
$$ LANGUAGE SQL STABLE;

-- 3. Function to set venue approval status
CREATE OR REPLACE FUNCTION public.set_venue_approval_status(
    venue_uuid UUID,
    new_status TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.venues
    SET approval_status = new_status
    WHERE id = venue_uuid;
END;
$$ LANGUAGE plpgsql;

-- 4. Venue approval log table
CREATE TABLE IF NOT EXISTS public.venue_approval_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES public.venues(id),
    action TEXT CHECK (action IN ('Approved', 'Rejected', 'Pending')),
    acted_by UUID REFERENCES public.users(id),
    acted_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 5. Function to log venue approval actions
CREATE OR REPLACE FUNCTION public.log_venue_approval_action(
    venue_id UUID,
    action TEXT,
    acted_by UUID,
    notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.venue_approval_log (venue_id, action, acted_by, notes)
    VALUES (venue_id, action, acted_by, notes);
END;
$$ LANGUAGE plpgsql; 