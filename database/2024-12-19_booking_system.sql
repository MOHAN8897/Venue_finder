-- Migration: 2024-12-19_booking_system.sql
-- Purpose: Implement booking system functions and slot management for venue booking
-- Author: AI Assistant
-- Date: 2024-12-19

-- =====================================================
-- PHASE 2: BOOKING SYSTEM
-- =====================================================

-- =====================================================
-- 1. ENHANCE VENUE SLOTS TABLE
-- =====================================================

-- Add missing columns to venue_slots table
ALTER TABLE public.venue_slots 
ADD COLUMN IF NOT EXISTS slot_duration INTEGER DEFAULT 60, -- minutes
ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS slot_type TEXT DEFAULT 'hourly',
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurring_pattern JSONB,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for venue_slots performance
CREATE INDEX IF NOT EXISTS idx_venue_slots_venue_date ON public.venue_slots(venue_id, date);
CREATE INDEX IF NOT EXISTS idx_venue_slots_available ON public.venue_slots(venue_id, date, available);
CREATE INDEX IF NOT EXISTS idx_venue_slots_booked_by ON public.venue_slots(booked_by);
CREATE INDEX IF NOT EXISTS idx_venue_slots_start_time ON public.venue_slots(start_time);

-- =====================================================
-- 2. ENHANCE BOOKINGS TABLE
-- =====================================================

-- Add missing columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS special_requests TEXT,
ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS total_hours INTEGER,
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount NUMERIC,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID,
ADD COLUMN IF NOT EXISTS booking_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add indexes for bookings performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON public.bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON public.bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- =====================================================
-- 3. SLOT AVAILABILITY FUNCTIONS
-- =====================================================

-- Function to get available slots for a date
CREATE OR REPLACE FUNCTION public.get_available_slots(
    p_venue_id UUID,
    p_date DATE,
    p_start_time TIME DEFAULT '06:00:00',
    p_end_time TIME DEFAULT '22:00:00'
)
RETURNS TABLE (
    slot_id UUID,
    start_time TIME,
    end_time TIME,
    price NUMERIC,
    available BOOLEAN,
    current_bookings INTEGER,
    max_capacity INTEGER,
    slot_duration INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vs.id,
        vs.start_time,
        vs.end_time,
        vs.price,
        vs.available AND (vs.current_bookings < COALESCE(vs.max_capacity, 999999)),
        vs.current_bookings,
        vs.max_capacity,
        vs.slot_duration
    FROM public.venue_slots vs
    WHERE vs.venue_id = p_venue_id
    AND vs.date = p_date
    AND vs.start_time >= p_start_time
    AND vs.end_time <= p_end_time
    ORDER BY vs.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check slot availability
CREATE OR REPLACE FUNCTION public.check_slot_availability(
    p_venue_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
    v_available_slots INTEGER;
    v_required_slots INTEGER;
BEGIN
    -- Calculate required slots (assuming 1-hour slots)
    v_required_slots := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
    
    -- Count available slots
    SELECT COUNT(*)
    INTO v_available_slots
    FROM public.venue_slots
    WHERE venue_id = p_venue_id
    AND date = p_date
    AND start_time >= p_start_time
    AND end_time <= p_end_time
    AND available = TRUE
    AND current_bookings < COALESCE(max_capacity, 999999);
    
    RETURN v_available_slots >= v_required_slots;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate slots for a venue and date range
CREATE OR REPLACE FUNCTION public.generate_venue_slots(
    p_venue_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_start_time TIME DEFAULT '06:00:00',
    p_end_time TIME DEFAULT '22:00:00',
    p_price NUMERIC DEFAULT NULL,
    p_slot_duration INTEGER DEFAULT 60
)
RETURNS INTEGER AS $$
DECLARE
    v_current_date DATE;
    v_current_time TIME;
    v_slots_created INTEGER := 0;
    v_venue_price NUMERIC;
BEGIN
    -- Get venue price if not provided
    IF p_price IS NULL THEN
        SELECT price_per_hour INTO v_venue_price FROM public.venues WHERE id = p_venue_id;
    ELSE
        v_venue_price := p_price;
    END IF;
    
    -- Generate slots for each date in range
    v_current_date := p_start_date;
    WHILE v_current_date <= p_end_date LOOP
        v_current_time := p_start_time;
        
        -- Generate slots for each hour
        WHILE v_current_time < p_end_time LOOP
            -- Insert slot if it doesn't exist
            INSERT INTO public.venue_slots (
                venue_id,
                date,
                start_time,
                end_time,
                price,
                available,
                slot_duration,
                created_at,
                updated_at
            ) VALUES (
                p_venue_id,
                v_current_date,
                v_current_time,
                v_current_time + INTERVAL '1 hour',
                v_venue_price,
                TRUE,
                p_slot_duration,
                NOW(),
                NOW()
            ) ON CONFLICT (venue_id, date, start_time) DO NOTHING;
            
            v_slots_created := v_slots_created + 1;
            v_current_time := v_current_time + INTERVAL '1 hour';
        END LOOP;
        
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN v_slots_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. BOOKING MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create booking with multiple slots
CREATE OR REPLACE FUNCTION public.create_booking_with_slots(
    p_user_id UUID,
    p_venue_id UUID,
    p_event_date DATE,
    p_slot_times TEXT[], -- Array of time strings like ['09:00', '10:00']
    p_guest_count INTEGER DEFAULT 1,
    p_special_requests TEXT DEFAULT NULL,
    p_total_amount NUMERIC,
    p_customer_name TEXT DEFAULT NULL,
    p_customer_email TEXT DEFAULT NULL,
    p_customer_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_booking_id UUID;
    v_slot_id UUID;
    v_slot_time TEXT;
    v_slot_ids UUID[] := '{}';
    v_venue_price NUMERIC;
    v_total_hours INTEGER;
    v_booking_record RECORD;
    v_result JSONB;
BEGIN
    -- Get venue price
    SELECT price_per_hour INTO v_venue_price FROM public.venues WHERE id = p_venue_id;
    
    -- Calculate total hours
    v_total_hours := array_length(p_slot_times, 1);
    
    -- Validate slots exist and are available
    FOREACH v_slot_time IN ARRAY p_slot_times
    LOOP
        SELECT id INTO v_slot_id
        FROM public.venue_slots
        WHERE venue_id = p_venue_id
        AND date = p_event_date
        AND start_time::text = v_slot_time
        AND available = TRUE
        AND current_bookings < COALESCE(max_capacity, 999999);
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'Slot not available: ' || v_slot_time
            );
        END IF;
        
        v_slot_ids := array_append(v_slot_ids, v_slot_id);
    END LOOP;
    
    -- Create booking record
    INSERT INTO public.bookings (
        user_id, 
        venue_id, 
        event_date, 
        slot_ids, 
        guest_count, 
        special_requests, 
        total_amount,
        total_hours,
        hourly_rate,
        final_amount,
        booking_status, 
        payment_status, 
        customer_name,
        customer_email,
        customer_phone,
        created_at
    ) VALUES (
        p_user_id, 
        p_venue_id, 
        p_event_date, 
        v_slot_ids,
        p_guest_count, 
        p_special_requests, 
        p_total_amount,
        v_total_hours,
        v_venue_price,
        p_total_amount,
        'pending', 
        'pending', 
        p_customer_name,
        p_customer_email,
        p_customer_phone,
        NOW()
    ) RETURNING * INTO v_booking_record;
    
    -- Update slot availability
    FOREACH v_slot_id IN ARRAY v_slot_ids
    LOOP
        UPDATE public.venue_slots 
        SET 
            booked_by = p_user_id,
            available = FALSE,
            current_bookings = current_bookings + 1,
            updated_at = NOW()
        WHERE id = v_slot_id;
    END LOOP;
    
    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'booking_id', v_booking_record.id,
        'total_amount', v_booking_record.total_amount,
        'total_hours', v_booking_record.total_hours,
        'slot_count', array_length(v_slot_ids, 1),
        'message', 'Booking created successfully'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user bookings
CREATE OR REPLACE FUNCTION public.get_user_bookings(
    p_user_id UUID,
    p_status TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    booking_id UUID,
    venue_id UUID,
    venue_name TEXT,
    event_date DATE,
    total_amount NUMERIC,
    booking_status TEXT,
    payment_status TEXT,
    guest_count INTEGER,
    total_hours INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    slot_times TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.venue_id,
        v.name as venue_name,
        b.event_date,
        b.total_amount,
        b.booking_status::text,
        b.payment_status::text,
        b.guest_count,
        b.total_hours,
        b.created_at,
        ARRAY(
            SELECT vs.start_time::text
            FROM public.venue_slots vs
            WHERE vs.id = ANY(b.slot_ids)
            ORDER BY vs.start_time
        ) as slot_times
    FROM public.bookings b
    JOIN public.venues v ON b.venue_id = v.id
    WHERE b.user_id = p_user_id
    AND (p_status IS NULL OR b.booking_status::text = p_status)
    ORDER BY b.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get venue bookings (for owners)
CREATE OR REPLACE FUNCTION public.get_venue_bookings(
    p_venue_id UUID,
    p_status TEXT DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    booking_id UUID,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    event_date DATE,
    total_amount NUMERIC,
    booking_status TEXT,
    payment_status TEXT,
    guest_count INTEGER,
    total_hours INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    slot_times TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.user_id,
        p.name as user_name,
        p.email as user_email,
        b.event_date,
        b.total_amount,
        b.booking_status::text,
        b.payment_status::text,
        b.guest_count,
        b.total_hours,
        b.created_at,
        ARRAY(
            SELECT vs.start_time::text
            FROM public.venue_slots vs
            WHERE vs.id = ANY(b.slot_ids)
            ORDER BY vs.start_time
        ) as slot_times
    FROM public.bookings b
    JOIN public.profiles p ON b.user_id = p.id
    WHERE b.venue_id = p_venue_id
    AND (p_status IS NULL OR b.booking_status::text = p_status)
    AND (p_start_date IS NULL OR b.event_date >= p_start_date)
    AND (p_end_date IS NULL OR b.event_date <= p_end_date)
    ORDER BY b.event_date DESC, b.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel booking
CREATE OR REPLACE FUNCTION public.cancel_booking(
    p_booking_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_booking_record RECORD;
    v_slot_id UUID;
    v_result JSONB;
BEGIN
    -- Get booking details
    SELECT * INTO v_booking_record
    FROM public.bookings
    WHERE id = p_booking_id
    AND (user_id = p_user_id OR 
         venue_id IN (
             SELECT id FROM public.venues WHERE owner_id = p_user_id
         ));
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Booking not found or access denied'
        );
    END IF;
    
    -- Check if booking can be cancelled
    IF v_booking_record.booking_status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Booking is already cancelled'
        );
    END IF;
    
    -- Update booking status
    UPDATE public.bookings 
    SET 
        booking_status = 'cancelled',
        cancellation_reason = p_reason,
        cancelled_at = NOW(),
        cancelled_by = p_user_id,
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Free up slots
    FOREACH v_slot_id IN ARRAY v_booking_record.slot_ids
    LOOP
        UPDATE public.venue_slots 
        SET 
            booked_by = NULL,
            available = TRUE,
            current_bookings = GREATEST(current_bookings - 1, 0),
            updated_at = NOW()
        WHERE id = v_slot_id;
    END LOOP;
    
    v_result := jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'message', 'Booking cancelled successfully'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. BOOKING ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get booking statistics for a venue
CREATE OR REPLACE FUNCTION public.get_venue_booking_stats(
    p_venue_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_bookings', COUNT(*),
        'total_revenue', COALESCE(SUM(total_amount), 0),
        'confirmed_bookings', COUNT(*) FILTER (WHERE booking_status = 'confirmed'),
        'pending_bookings', COUNT(*) FILTER (WHERE booking_status = 'pending'),
        'cancelled_bookings', COUNT(*) FILTER (WHERE booking_status = 'cancelled'),
        'total_hours_booked', COALESCE(SUM(total_hours), 0),
        'average_booking_value', COALESCE(AVG(total_amount), 0),
        'total_guests', COALESCE(SUM(guest_count), 0)
    ) INTO v_stats
    FROM public.bookings
    WHERE venue_id = p_venue_id
    AND (p_start_date IS NULL OR event_date >= p_start_date)
    AND (p_end_date IS NULL OR event_date <= p_end_date);
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user booking statistics
CREATE OR REPLACE FUNCTION public.get_user_booking_stats(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_bookings', COUNT(*),
        'total_spent', COALESCE(SUM(total_amount), 0),
        'confirmed_bookings', COUNT(*) FILTER (WHERE booking_status = 'confirmed'),
        'pending_bookings', COUNT(*) FILTER (WHERE booking_status = 'pending'),
        'cancelled_bookings', COUNT(*) FILTER (WHERE booking_status = 'cancelled'),
        'total_hours_booked', COALESCE(SUM(total_hours), 0),
        'average_booking_value', COALESCE(AVG(total_amount), 0),
        'favorite_venue_type', (
            SELECT v.type::text
            FROM public.bookings b
            JOIN public.venues v ON b.venue_id = v.id
            WHERE b.user_id = p_user_id
            GROUP BY v.type
            ORDER BY COUNT(*) DESC
            LIMIT 1
        )
    ) INTO v_stats
    FROM public.bookings
    WHERE user_id = p_user_id;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS FOR BUSINESS LOGIC
-- =====================================================

-- Trigger function to update slot availability when booking status changes
CREATE OR REPLACE FUNCTION public.trigger_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.booking_status != NEW.booking_status THEN
        IF NEW.booking_status = 'cancelled' THEN
            -- Free up slots
            UPDATE public.venue_slots 
            SET 
                booked_by = NULL,
                available = TRUE,
                current_bookings = GREATEST(current_bookings - 1, 0),
                updated_at = NOW()
            WHERE id = ANY(NEW.slot_ids);
        ELSIF OLD.booking_status = 'cancelled' AND NEW.booking_status != 'cancelled' THEN
            -- Re-book slots
            UPDATE public.venue_slots 
            SET 
                booked_by = NEW.user_id,
                available = FALSE,
                current_bookings = current_bookings + 1,
                updated_at = NOW()
            WHERE id = ANY(NEW.slot_ids);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking status changes
DROP TRIGGER IF EXISTS booking_status_change_trigger ON public.bookings;
CREATE TRIGGER booking_status_change_trigger
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_booking_status_change();

-- =====================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their bookings
DROP POLICY IF EXISTS "Users can manage their bookings" ON public.bookings;
CREATE POLICY "Users can manage their bookings" ON public.bookings
    FOR ALL USING (user_id = auth.uid());

-- Policy for venue owners to view bookings for their venues
DROP POLICY IF EXISTS "Venue owners can view venue bookings" ON public.bookings;
CREATE POLICY "Venue owners can view venue bookings" ON public.bookings
    FOR SELECT USING (
        venue_id IN (
            SELECT id FROM public.venues WHERE owner_id = auth.uid()
        )
    );

-- Enable RLS on venue_slots table
ALTER TABLE public.venue_slots ENABLE ROW LEVEL SECURITY;

-- Policy for public to view available slots
DROP POLICY IF EXISTS "Public can view available slots" ON public.venue_slots;
CREATE POLICY "Public can view available slots" ON public.venue_slots
    FOR SELECT USING (available = TRUE);

-- Policy for venue owners to manage slots for their venues
DROP POLICY IF EXISTS "Venue owners can manage venue slots" ON public.venue_slots;
CREATE POLICY "Venue owners can manage venue slots" ON public.venue_slots
    FOR ALL USING (
        venue_id IN (
            SELECT id FROM public.venues WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on booking functions
GRANT EXECUTE ON FUNCTION public.get_available_slots TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_slot_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_venue_slots TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_with_slots TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_venue_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_venue_booking_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_booking_stats TO authenticated;

-- =====================================================
-- 9. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.get_available_slots IS 'Get available time slots for a venue on a specific date';
COMMENT ON FUNCTION public.check_slot_availability IS 'Check if requested time slots are available for booking';
COMMENT ON FUNCTION public.generate_venue_slots IS 'Generate time slots for a venue over a date range';
COMMENT ON FUNCTION public.create_booking_with_slots IS 'Create a booking with multiple time slots';
COMMENT ON FUNCTION public.get_user_bookings IS 'Get all bookings for a specific user';
COMMENT ON FUNCTION public.get_venue_bookings IS 'Get all bookings for a specific venue (for owners)';
COMMENT ON FUNCTION public.cancel_booking IS 'Cancel a booking and free up associated slots';
COMMENT ON FUNCTION public.get_venue_booking_stats IS 'Get booking statistics for a venue';
COMMENT ON FUNCTION public.get_user_booking_stats IS 'Get booking statistics for a user';

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
        'migration', '2024-12-19_booking_system.sql',
        'description', 'Implemented booking system functions and slot management',
        'functions_added', 9,
        'indexes_added', 9,
        'triggers_added', 1,
        'columns_added', 15
    ),
    NOW()
); 