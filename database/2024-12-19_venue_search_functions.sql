-- Migration: 2024-12-19_venue_search_functions.sql
-- Purpose: Implement venue search functions and performance indexes for browse venues page
-- Author: AI Assistant
-- Date: 2024-12-19

-- =====================================================
-- PHASE 1: CORE SEARCH & FILTERING
-- =====================================================

-- =====================================================
-- 1. PERFORMANCE INDEXES FOR VENUE SEARCH
-- =====================================================

-- Index for location-based searches
CREATE INDEX IF NOT EXISTS idx_venues_location ON public.venues(city, state, pincode);

-- Index for price-based filtering
CREATE INDEX IF NOT EXISTS idx_venues_price ON public.venues(price_per_hour, price_per_day);

-- Index for rating-based filtering
CREATE INDEX IF NOT EXISTS idx_venues_rating ON public.venues(rating, review_count);

-- Index for venue type filtering
CREATE INDEX IF NOT EXISTS idx_venues_type ON public.venues(type);

-- Index for date-based sorting
CREATE INDEX IF NOT EXISTS idx_venues_created_at ON public.venues(created_at DESC);

-- Composite index for approval status and active venues
CREATE INDEX IF NOT EXISTS idx_venues_approval_active ON public.venues(approval_status, is_active, is_approved);

-- Index for owner-based queries
CREATE INDEX IF NOT EXISTS idx_venues_owner ON public.venues(owner_id);

-- =====================================================
-- 2. VENUE SUMMARY VIEW
-- =====================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.venue_summary;

-- Create venue summary view for consistent data access
CREATE OR REPLACE VIEW public.venue_summary AS
SELECT 
    v.id,
    v.name as venue_name,
    v.type as venue_type,
    v.description,
    v.address,
    v.city,
    v.state,
    v.pincode,
    v.capacity,
    v.price_per_hour,
    v.price_per_day,
    v.rating,
    v.review_count,
    COALESCE(v.images, v.image_urls, '{}'::text[]) as images,
    v.videos,
    v.amenities,
    v.created_at,
    v.owner_id,
    p.name as owner_name,
    p.email as owner_email,
    p.phone as owner_phone,
    v.verified,
    v.status,
    v.approval_status,
    v.is_approved,
    v.is_active
FROM public.venues v
LEFT JOIN public.profiles p ON v.owner_id = p.id
WHERE (v.approval_status = 'approved' OR v.is_approved = TRUE)
AND v.is_active = TRUE;

-- =====================================================
-- 3. VENUE SEARCH FUNCTION
-- =====================================================

-- Function to search venues with comprehensive filtering
CREATE OR REPLACE FUNCTION public.search_venues(
    p_location TEXT DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_venue_types TEXT[] DEFAULT NULL,
    p_min_rating NUMERIC DEFAULT NULL,
    p_amenities TEXT[] DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'newest',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    venue_name TEXT,
    venue_type TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    capacity INTEGER,
    price_per_hour NUMERIC,
    price_per_day NUMERIC,
    images TEXT[],
    videos TEXT[],
    amenities TEXT[],
    rating NUMERIC,
    review_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    owner_id UUID,
    owner_name TEXT,
    owner_email TEXT,
    verified BOOLEAN,
    distance_km NUMERIC DEFAULT NULL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name as venue_name,
        v.type::text as venue_type,
        v.description,
        v.address,
        v.city,
        v.state,
        v.pincode,
        v.capacity,
        v.price_per_hour,
        v.price_per_day,
        COALESCE(v.images, v.image_urls, '{}'::text[]) as images,
        v.videos,
        v.amenities,
        v.rating,
        v.review_count,
        v.created_at,
        v.owner_id,
        p.name as owner_name,
        p.email as owner_email,
        v.verified,
        -- Calculate distance if coordinates are provided (placeholder for future implementation)
        NULL::numeric as distance_km
    FROM public.venues v
    LEFT JOIN public.profiles p ON v.owner_id = p.id
    WHERE (v.approval_status = 'approved' OR v.is_approved = TRUE)
    AND v.is_active = TRUE
    AND v.owner_id IS NOT NULL
    -- Location filter
    AND (p_location IS NULL OR 
         v.address ILIKE '%' || p_location || '%' OR
         v.city ILIKE '%' || p_location || '%' OR
         v.state ILIKE '%' || p_location || '%' OR
         v.pincode ILIKE '%' || p_location || '%')
    -- Price filter
    AND (p_min_price IS NULL OR v.price_per_hour >= p_min_price)
    AND (p_max_price IS NULL OR v.price_per_hour <= p_max_price)
    -- Venue type filter
    AND (p_venue_types IS NULL OR v.type::text = ANY(p_venue_types))
    -- Rating filter
    AND (p_min_rating IS NULL OR v.rating >= p_min_rating)
    -- Amenities filter (check if all required amenities are present)
    AND (p_amenities IS NULL OR 
         p_amenities <@ v.amenities) -- All required amenities present
    ORDER BY 
        CASE p_sort_by
            WHEN 'price_low' THEN v.price_per_hour
            WHEN 'price_high' THEN v.price_per_hour
            WHEN 'rating' THEN v.rating
            WHEN 'name' THEN v.name
            WHEN 'oldest' THEN EXTRACT(EPOCH FROM v.created_at)
            WHEN 'newest' THEN EXTRACT(EPOCH FROM v.created_at)
            ELSE EXTRACT(EPOCH FROM v.created_at)
        END
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. VENUE COUNT FUNCTION
-- =====================================================

-- Function to get total count of venues matching search criteria
CREATE OR REPLACE FUNCTION public.count_venues(
    p_location TEXT DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_venue_types TEXT[] DEFAULT NULL,
    p_min_rating NUMERIC DEFAULT NULL,
    p_amenities TEXT[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM public.venues v
    WHERE (v.approval_status = 'approved' OR v.is_approved = TRUE)
    AND v.is_active = TRUE
    AND v.owner_id IS NOT NULL
    -- Location filter
    AND (p_location IS NULL OR 
         v.address ILIKE '%' || p_location || '%' OR
         v.city ILIKE '%' || p_location || '%' OR
         v.state ILIKE '%' || p_location || '%' OR
         v.pincode ILIKE '%' || p_location || '%')
    -- Price filter
    AND (p_min_price IS NULL OR v.price_per_hour >= p_min_price)
    AND (p_max_price IS NULL OR v.price_per_hour <= p_max_price)
    -- Venue type filter
    AND (p_venue_types IS NULL OR v.type::text = ANY(p_venue_types))
    -- Rating filter
    AND (p_min_rating IS NULL OR v.rating >= p_min_rating)
    -- Amenities filter
    AND (p_amenities IS NULL OR 
         p_amenities <@ v.amenities);
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. VENUE DETAILS FUNCTION
-- =====================================================

-- Function to get detailed venue information
CREATE OR REPLACE FUNCTION public.get_venue_details(p_venue_id UUID)
RETURNS JSONB AS $$
DECLARE
    venue_details JSONB;
    owner_details JSONB;
    result JSONB;
BEGIN
    -- Get venue details
    SELECT to_jsonb(v) INTO venue_details 
    FROM public.venues v 
    WHERE v.id = p_venue_id 
    AND (v.approval_status = 'approved' OR v.is_approved = TRUE)
    AND v.is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venue not found or not approved');
    END IF;
    
    -- Get owner details
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'email', p.email,
        'phone', p.phone,
        'avatar_url', p.avatar_url,
        'verified', p.verified,
        'created_at', p.created_at
    ) INTO owner_details 
    FROM public.profiles p
    WHERE p.id = (venue_details->>'owner_id')::uuid;
    
    -- Build result
    result := jsonb_build_object(
        'success', true,
        'venue', venue_details,
        'owner', owner_details
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. VENUE SUGGESTIONS FUNCTION
-- =====================================================

-- Function to get venue suggestions for search autocomplete
CREATE OR REPLACE FUNCTION public.get_venue_suggestions(
    p_query TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    venue_name TEXT,
    venue_type TEXT,
    city TEXT,
    state TEXT,
    address TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name as venue_name,
        v.type::text as venue_type,
        v.city,
        v.state,
        v.address
    FROM public.venues v
    WHERE (v.approval_status = 'approved' OR v.is_approved = TRUE)
    AND v.is_active = TRUE
    AND v.owner_id IS NOT NULL
    AND (
        v.name ILIKE '%' || p_query || '%' OR
        v.city ILIKE '%' || p_query || '%' OR
        v.state ILIKE '%' || p_query || '%' OR
        v.address ILIKE '%' || p_query || '%'
    )
    ORDER BY 
        CASE 
            WHEN v.name ILIKE p_query || '%' THEN 1
            WHEN v.city ILIKE p_query || '%' THEN 2
            WHEN v.state ILIKE p_query || '%' THEN 3
            ELSE 4
        END,
        v.rating DESC,
        v.review_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. VENUE FILTERS FUNCTION
-- =====================================================

-- Function to get available filter options
CREATE OR REPLACE FUNCTION public.get_venue_filters()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'venue_types', (
            SELECT jsonb_agg(DISTINCT type::text)
            FROM public.venues
            WHERE (approval_status = 'approved' OR is_approved = TRUE)
            AND is_active = TRUE
        ),
        'cities', (
            SELECT jsonb_agg(DISTINCT city)
            FROM public.venues
            WHERE (approval_status = 'approved' OR is_approved = TRUE)
            AND is_active = TRUE
            AND city IS NOT NULL
        ),
        'states', (
            SELECT jsonb_agg(DISTINCT state)
            FROM public.venues
            WHERE (approval_status = 'approved' OR is_approved = TRUE)
            AND is_active = TRUE
            AND state IS NOT NULL
        ),
        'price_range', (
            SELECT jsonb_build_object(
                'min', MIN(price_per_hour),
                'max', MAX(price_per_hour)
            )
            FROM public.venues
            WHERE (approval_status = 'approved' OR is_approved = TRUE)
            AND is_active = TRUE
            AND price_per_hour IS NOT NULL
        ),
        'amenities', (
            SELECT jsonb_agg(DISTINCT amenity)
            FROM public.venues,
            jsonb_array_elements_text(amenities) as amenity
            WHERE (approval_status = 'approved' OR is_approved = TRUE)
            AND is_active = TRUE
            AND amenities IS NOT NULL
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on venues table if not already enabled
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Policy for public to view approved venues
DROP POLICY IF EXISTS "Public can view approved venues" ON public.venues;
CREATE POLICY "Public can view approved venues" ON public.venues
    FOR SELECT USING (
        (approval_status = 'approved' OR is_approved = TRUE)
        AND is_active = TRUE
    );

-- Policy for venue owners to manage their venues
DROP POLICY IF EXISTS "Venue owners can manage their venues" ON public.venues;
CREATE POLICY "Venue owners can manage their venues" ON public.venues
    FOR ALL USING (owner_id = auth.uid());

-- Policy for admins to manage all venues
DROP POLICY IF EXISTS "Admins can manage all venues" ON public.venues;
CREATE POLICY "Admins can manage all venues" ON public.venues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.search_venues TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_venues TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_venue_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_venue_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_venue_filters TO authenticated;

-- Grant select permissions on views
GRANT SELECT ON public.venue_summary TO authenticated;

-- =====================================================
-- 10. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.search_venues IS 'Search venues with comprehensive filtering options for browse venues page';
COMMENT ON FUNCTION public.count_venues IS 'Get total count of venues matching search criteria for pagination';
COMMENT ON FUNCTION public.get_venue_details IS 'Get detailed venue information including owner details';
COMMENT ON FUNCTION public.get_venue_suggestions IS 'Get venue suggestions for search autocomplete';
COMMENT ON FUNCTION public.get_venue_filters IS 'Get available filter options for venue search';
COMMENT ON VIEW public.venue_summary IS 'Summary view of approved and active venues with owner information';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log the migration
INSERT INTO public.admin_logs (
    admin_id,
    action,
    details,
    created_at
) VALUES (
    'system',
    'migration_applied',
    jsonb_build_object(
        'migration', '2024-12-19_venue_search_functions.sql',
        'description', 'Implemented venue search functions and performance indexes',
        'functions_added', 5,
        'indexes_added', 7,
        'views_added', 1
    ),
    NOW()
); 