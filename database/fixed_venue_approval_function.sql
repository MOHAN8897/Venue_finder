-- Fixed version of get_venue_approval_details function
-- This function retrieves venue details along with submitter information for approval process

CREATE OR REPLACE FUNCTION public.get_venue_approval_details(venue_uuid uuid)
RETURNS jsonb AS $$
DECLARE
    venue_details jsonb;
    submitter_details jsonb;
    result jsonb;
BEGIN
    -- Get venue details
    SELECT to_jsonb(v) INTO venue_details 
    FROM public.venues v 
    WHERE v.id = venue_uuid;
    
    -- Check if venue exists
    IF venue_details IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Venue not found',
            'venue_id', venue_uuid
        );
    END IF;
    
    -- Get submitter details with proper null handling
    SELECT jsonb_build_object(
        'full_name', COALESCE(p.full_name, p.name),
        'email', p.email,
        'avatar_url', p.avatar_url,
        'created_at', p.created_at,
        'role', p.role,
        'verified', p.verified
    ) INTO submitter_details 
    FROM public.profiles p
    INNER JOIN public.venues v ON p.user_id = v.submitted_by
    WHERE v.id = venue_uuid;
    
    -- Build final result
    result := jsonb_build_object(
        'success', true,
        'venue', venue_details,
        'submitter', submitter_details
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_venue_approval_details(uuid) TO authenticated;