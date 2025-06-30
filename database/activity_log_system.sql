-- Advanced Activity Log & Audit System
-- This table will store a detailed history of actions performed by users, primarily for venue owners and admins.

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