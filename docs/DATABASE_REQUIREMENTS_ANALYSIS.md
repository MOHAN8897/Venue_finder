# Database Requirements Analysis for Browse Venue & Booking System

## Overview
This document analyzes the current frontend implementation of the browse venue page and booking system to identify all required database changes, functions, and stored procedures needed to make the system fully functional.

## Current Frontend Analysis

### 1. Browse Venues Page (`src/pages/BrowseVenues.tsx`)

#### **Data Fields Required:**
- **Venue Information:**
  - `id` (UUID) - Primary key
  - `venue_name` (TEXT) - Venue display name
  - `venue_type` (ENUM) - Type of venue (Sports Venue, Farmhouse, Auditorium, etc.)
  - `address` (TEXT) - Full address
  - `city` (TEXT) - City name
  - `state` (TEXT) - State name
  - `pincode` (TEXT) - Postal code
  - `capacity` (INTEGER) - Maximum capacity
  - `price_per_hour` (NUMERIC) - Hourly rate
  - `price_per_day` (NUMERIC) - Daily rate
  - `images` (TEXT[]) - Array of image URLs
  - `photos` (TEXT[]) - Alternative image field
  - `image_urls` (TEXT[]) - Another image field variant
  - `amenities` (TEXT[]) - Array of amenities
  - `rating` (NUMERIC) - Average rating
  - `average_rating` (NUMERIC) - Alternative rating field
  - `review_count` (INTEGER) - Number of reviews
  - `total_reviews` (INTEGER) - Alternative review count
  - `created_at` (TIMESTAMP) - Creation date
  - `owner_id` (UUID) - Venue owner reference
  - `approval_status` (TEXT) - 'pending', 'approved', 'rejected'
  - `is_approved` (BOOLEAN) - Approval status boolean

#### **Filtering Requirements:**
- **Location Filter:** Search by address, city, state, pincode
- **Price Filter:** Range filtering on price_per_hour/price_per_day
- **Type Filter:** Filter by venue_type
- **Rating Filter:** Filter by average_rating
- **Amenities Filter:** Filter by amenities array
- **Sorting:** By price, rating, date, name

### 2. Booking System Components

#### **Mobile Booking Modal (`src/components/venue-detail/MobileBookingModal.tsx`)**
- **Time Slot Management:**
  - Date selection
  - Hour-based time slots (6 AM to 10 PM)
  - Slot availability status
  - Slot pricing
  - Multiple slot selection

#### **Desktop Booking Calendar (`src/components/venue-detail/SlotBasedBookingCalendar.tsx`)**
- **Slot-based Booking:**
  - Date picker
  - Time slot grid
  - Slot selection/deselection
  - Real-time price calculation
  - Guest count management

#### **Payment Page (`src/pages/PaymentPage.tsx`)**
- **Payment Integration:**
  - Multiple payment methods (Card, UPI, Net Banking)
  - Payment processing
  - Booking confirmation
  - Payment status tracking

## Database Schema Requirements

### 1. **Venues Table Enhancements**

#### **Missing Fields to Add:**
```sql
-- Add missing venue fields
ALTER TABLE venues ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS featured_image TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS featured_video TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS weekly_availability JSONB;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
```

#### **Indexes for Performance:**
```sql
-- Performance indexes for filtering
CREATE INDEX IF NOT EXISTS idx_venues_approval_status ON venues(approval_status, is_approved);
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues(city, state, pincode);
CREATE INDEX IF NOT EXISTS idx_venues_price ON venues(price_per_hour, price_per_day);
CREATE INDEX IF NOT EXISTS idx_venues_rating ON venues(average_rating, review_count);
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_owner ON venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_created_at ON venues(created_at DESC);
```

### 2. **Time Slots Management**

#### **Venue Slots Table (Already exists but needs enhancement):**
```sql
-- Enhance venue_slots table
ALTER TABLE venue_slots ADD COLUMN IF NOT EXISTS slot_duration INTEGER DEFAULT 60; -- minutes
ALTER TABLE venue_slots ADD COLUMN IF NOT EXISTS max_capacity INTEGER;
ALTER TABLE venue_slots ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0;
ALTER TABLE venue_slots ADD COLUMN IF NOT EXISTS slot_type TEXT DEFAULT 'hourly';
ALTER TABLE venue_slots ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE venue_slots ADD COLUMN IF NOT EXISTS recurring_pattern JSONB;
```

#### **Slot Availability Functions:**
```sql
-- Function to get available slots for a date
CREATE OR REPLACE FUNCTION get_available_slots(
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
    max_capacity INTEGER
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
        vs.max_capacity
    FROM venue_slots vs
    WHERE vs.venue_id = p_venue_id
    AND vs.date = p_date
    AND vs.start_time >= p_start_time
    AND vs.end_time <= p_end_time
    ORDER BY vs.start_time;
END;
$$ LANGUAGE plpgsql;
```

### 3. **Booking System Enhancements**

#### **Bookings Table (Already exists but needs enhancement):**
```sql
-- Enhance bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'web';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_hours INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS final_amount NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by UUID;
```

#### **Booking Functions:**
```sql
-- Function to create booking with multiple slots
CREATE OR REPLACE FUNCTION create_booking_with_slots(
    p_user_id UUID,
    p_venue_id UUID,
    p_event_date DATE,
    p_slot_ids UUID[],
    p_guest_count INTEGER DEFAULT 1,
    p_special_requests TEXT DEFAULT NULL,
    p_total_amount NUMERIC
)
RETURNS UUID AS $$
DECLARE
    v_booking_id UUID;
    v_slot_id UUID;
BEGIN
    -- Create booking record
    INSERT INTO bookings (
        user_id, venue_id, event_date, slot_ids, 
        guest_count, special_requests, total_amount,
        booking_status, payment_status, created_at
    ) VALUES (
        p_user_id, p_venue_id, p_event_date, p_slot_ids,
        p_guest_count, p_special_requests, p_total_amount,
        'pending', 'pending', NOW()
    ) RETURNING id INTO v_booking_id;
    
    -- Update slot availability
    FOREACH v_slot_id IN ARRAY p_slot_ids
    LOOP
        UPDATE venue_slots 
        SET 
            booked_by = p_user_id,
            available = FALSE,
            current_bookings = current_bookings + 1,
            updated_at = NOW()
        WHERE id = v_slot_id;
    END LOOP;
    
    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;
```

### 4. **Payment Integration**

#### **Payments Table (Already exists but needs enhancement):**
```sql
-- Enhance payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method_details JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_by UUID;
```

#### **Payment Functions:**
```sql
-- Function to process payment
CREATE OR REPLACE FUNCTION process_payment(
    p_booking_id UUID,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_gateway_transaction_id TEXT DEFAULT NULL,
    p_payment_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
BEGIN
    -- Create payment record
    INSERT INTO payments (
        booking_id, amount, payment_method, 
        gateway_transaction_id, payment_method_details,
        status, created_at
    ) VALUES (
        p_booking_id, p_amount, p_payment_method,
        p_gateway_transaction_id, p_payment_details,
        'paid', NOW()
    ) RETURNING id INTO v_payment_id;
    
    -- Update booking status
    UPDATE bookings 
    SET 
        payment_status = 'paid',
        booking_status = 'confirmed',
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;
```

### 5. **Reviews and Ratings System**

#### **Reviews Table (Already exists but needs enhancement):**
```sql
-- Enhance reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_title TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful_votes INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified_booking BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'published';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_response TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_response_at TIMESTAMP;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_response_by UUID;
```

#### **Rating Functions:**
```sql
-- Function to update venue rating
CREATE OR REPLACE FUNCTION update_venue_rating(p_venue_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE venues 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews 
            WHERE venue_id = p_venue_id 
            AND review_status = 'published'
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews 
            WHERE venue_id = p_venue_id 
            AND review_status = 'published'
        ),
        updated_at = NOW()
    WHERE id = p_venue_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating when review is added/updated
CREATE OR REPLACE FUNCTION trigger_update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_venue_rating(NEW.venue_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venue_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_venue_rating();
```

### 6. **Amenities Management**

#### **Amenities Table (Already exists):**
- Current structure is good
- Need to ensure proper linking with venues

#### **Venue Amenities Junction Table (Already exists):**
- Current structure is good
- Need to ensure proper data population

### 7. **User Favorites System**

#### **User Favorites Table (Already exists):**
- Current structure is good
- May need indexes for performance

```sql
-- Add indexes for favorites
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_venue_id ON user_favorites(venue_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favorites_unique ON user_favorites(user_id, venue_id);
```

### 8. **Notifications System**

#### **Notifications Table (Already exists):**
- Current structure is good
- May need additional notification types for booking system

```sql
-- Add booking-related notification types
INSERT INTO notifications (user_id, type, content, data) VALUES 
-- Booking confirmation
-- Payment success
-- Booking reminder
-- Cancellation notification
-- Review reminder
```

## Required Database Functions

### 1. **Venue Search and Filtering**
```sql
-- Function to search venues with filters
CREATE OR REPLACE FUNCTION search_venues(
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
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    capacity INTEGER,
    price_per_hour NUMERIC,
    price_per_day NUMERIC,
    images TEXT[],
    amenities TEXT[],
    average_rating NUMERIC,
    review_count INTEGER,
    created_at TIMESTAMP,
    owner_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.venue_name,
        v.venue_type,
        v.address,
        v.city,
        v.state,
        v.pincode,
        v.capacity,
        v.price_per_hour,
        v.price_per_day,
        COALESCE(v.images, v.photos, v.image_urls, '{}'),
        v.amenities,
        v.average_rating,
        v.review_count,
        v.created_at,
        v.owner_id
    FROM venues v
    WHERE (v.approval_status = 'approved' OR v.is_approved = TRUE)
    AND v.owner_id IS NOT NULL
    AND (p_location IS NULL OR 
         v.address ILIKE '%' || p_location || '%' OR
         v.city ILIKE '%' || p_location || '%' OR
         v.state ILIKE '%' || p_location || '%' OR
         v.pincode ILIKE '%' || p_location || '%')
    AND (p_min_price IS NULL OR v.price_per_hour >= p_min_price)
    AND (p_max_price IS NULL OR v.price_per_hour <= p_max_price)
    AND (p_venue_types IS NULL OR v.venue_type = ANY(p_venue_types))
    AND (p_min_rating IS NULL OR v.average_rating >= p_min_rating)
    AND (p_amenities IS NULL OR 
         p_amenities <@ v.amenities) -- All required amenities present
    ORDER BY 
        CASE p_sort_by
            WHEN 'price_low' THEN v.price_per_hour
            WHEN 'price_high' THEN v.price_per_hour
            WHEN 'rating' THEN v.average_rating
            WHEN 'name' THEN v.venue_name
            WHEN 'oldest' THEN EXTRACT(EPOCH FROM v.created_at)
            ELSE EXTRACT(EPOCH FROM v.created_at)
        END
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
```

### 2. **Slot Availability Management**
```sql
-- Function to check slot availability
CREATE OR REPLACE FUNCTION check_slot_availability(
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
    -- Calculate required slots
    v_required_slots := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
    
    -- Count available slots
    SELECT COUNT(*)
    INTO v_available_slots
    FROM venue_slots
    WHERE venue_id = p_venue_id
    AND date = p_date
    AND start_time >= p_start_time
    AND end_time <= p_end_time
    AND available = TRUE
    AND current_bookings < COALESCE(max_capacity, 999999);
    
    RETURN v_available_slots >= v_required_slots;
END;
$$ LANGUAGE plpgsql;
```

### 3. **Booking Management**
```sql
-- Function to get user bookings
CREATE OR REPLACE FUNCTION get_user_bookings(
    p_user_id UUID,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    booking_id UUID,
    venue_id UUID,
    venue_name TEXT,
    event_date DATE,
    total_amount NUMERIC,
    booking_status TEXT,
    payment_status TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.venue_id,
        v.venue_name,
        b.event_date,
        b.total_amount,
        b.booking_status,
        b.payment_status,
        b.created_at
    FROM bookings b
    JOIN venues v ON b.venue_id = v.id
    WHERE b.user_id = p_user_id
    AND (p_status IS NULL OR b.booking_status = p_status)
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

## Required Stored Procedures

### 1. **Venue Approval Process**
```sql
-- Procedure to approve/reject venue
CREATE OR REPLACE PROCEDURE process_venue_approval(
    p_venue_id UUID,
    p_action TEXT, -- 'approve' or 'reject'
    p_admin_id UUID,
    p_reason TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_action = 'approve' THEN
        UPDATE venues 
        SET 
            approval_status = 'approved',
            is_approved = TRUE,
            approval_date = NOW(),
            approved_by = p_admin_id,
            updated_at = NOW()
        WHERE id = p_venue_id;
    ELSIF p_action = 'reject' THEN
        UPDATE venues 
        SET 
            approval_status = 'rejected',
            is_approved = FALSE,
            rejection_reason = p_reason,
            updated_at = NOW()
        WHERE id = p_venue_id;
    END IF;
    
    -- Log the action
    INSERT INTO venue_approval_logs (
        venue_id, admin_id, action, reason, created_at
    ) VALUES (
        p_venue_id, p_admin_id, p_action, p_reason, NOW()
    );
END;
$$;
```

### 2. **Payment Processing**
```sql
-- Procedure to process payment with Razorpay integration
CREATE OR REPLACE PROCEDURE process_razorpay_payment(
    p_booking_id UUID,
    p_payment_id TEXT,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_gateway_response JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_payment_record_id UUID;
BEGIN
    -- Create payment record
    INSERT INTO payments (
        booking_id, amount, payment_method,
        gateway_transaction_id, gateway_response,
        status, created_at
    ) VALUES (
        p_booking_id, p_amount, p_payment_method,
        p_payment_id, p_gateway_response,
        'paid', NOW()
    ) RETURNING id INTO v_payment_record_id;
    
    -- Update booking status
    UPDATE bookings 
    SET 
        payment_status = 'paid',
        booking_status = 'confirmed',
        payment_id = p_payment_id,
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Send notification (if notification system exists)
    -- INSERT INTO notifications (...)
    
    COMMIT;
END;
$$;
```

## Required Triggers

### 1. **Automatic Rating Updates**
```sql
-- Trigger for venue rating updates (already defined above)
```

### 2. **Booking Status Updates**
```sql
-- Trigger to update slot availability when booking status changes
CREATE OR REPLACE FUNCTION trigger_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.booking_status != NEW.booking_status THEN
        IF NEW.booking_status = 'cancelled' THEN
            -- Free up slots
            UPDATE venue_slots 
            SET 
                booked_by = NULL,
                available = TRUE,
                current_bookings = GREATEST(current_bookings - 1, 0),
                updated_at = NOW()
            WHERE id = ANY(NEW.slot_ids);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_status_change_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_booking_status_change();
```

## Required Views

### 1. **Venue Summary View**
```sql
-- View for venue summary data
CREATE OR REPLACE VIEW venue_summary AS
SELECT 
    v.id,
    v.venue_name,
    v.venue_type,
    v.address,
    v.city,
    v.state,
    v.pincode,
    v.capacity,
    v.price_per_hour,
    v.price_per_day,
    v.average_rating,
    v.review_count,
    v.images,
    v.amenities,
    v.created_at,
    v.owner_id,
    p.name as owner_name,
    p.email as owner_email
FROM venues v
LEFT JOIN profiles p ON v.owner_id = p.id
WHERE v.approval_status = 'approved' OR v.is_approved = TRUE;
```

### 2. **Booking Summary View**
```sql
-- View for booking summary data
CREATE OR REPLACE VIEW booking_summary AS
SELECT 
    b.id,
    b.user_id,
    b.venue_id,
    v.venue_name,
    b.event_date,
    b.total_amount,
    b.booking_status,
    b.payment_status,
    b.guest_count,
    b.created_at,
    p.name as user_name,
    p.email as user_email
FROM bookings b
JOIN venues v ON b.venue_id = v.id
JOIN profiles p ON b.user_id = p.id;
```

## Required Policies (RLS)

### 1. **Venue Access Policies**
```sql
-- Policy for venue owners to manage their venues
CREATE POLICY "Venue owners can manage their venues" ON venues
    FOR ALL USING (owner_id = auth.uid());

-- Policy for public to view approved venues
CREATE POLICY "Public can view approved venues" ON venues
    FOR SELECT USING (approval_status = 'approved' OR is_approved = TRUE);
```

### 2. **Booking Access Policies**
```sql
-- Policy for users to manage their bookings
CREATE POLICY "Users can manage their bookings" ON bookings
    FOR ALL USING (user_id = auth.uid());

-- Policy for venue owners to view bookings for their venues
CREATE POLICY "Venue owners can view venue bookings" ON bookings
    FOR SELECT USING (
        venue_id IN (
            SELECT id FROM venues WHERE owner_id = auth.uid()
        )
    );
```

## Integration Requirements

### 1. **Razorpay Integration**
- API key management
- Webhook handling
- Payment verification
- Refund processing

### 2. **Email Notifications**
- Booking confirmations
- Payment receipts
- Reminders
- Cancellation notices

### 3. **SMS Notifications**
- Booking confirmations
- Payment confirmations
- Reminders

## Performance Optimizations

### 1. **Indexes**
- All foreign key columns
- Frequently queried columns
- Composite indexes for complex queries

### 2. **Partitioning**
- Consider partitioning bookings table by date
- Consider partitioning venue_slots table by date

### 3. **Caching**
- Venue search results
- Slot availability
- User preferences

## Security Considerations

### 1. **Data Protection**
- Encrypt sensitive payment data
- Mask personal information in logs
- Implement proper access controls

### 2. **Payment Security**
- Verify payment signatures
- Implement webhook security
- Store payment tokens securely

### 3. **API Security**
- Rate limiting
- Input validation
- SQL injection prevention

## Testing Requirements

### 1. **Unit Tests**
- Database functions
- Stored procedures
- Triggers

### 2. **Integration Tests**
- Payment processing
- Booking workflow
- Email notifications

### 3. **Performance Tests**
- Search queries
- Booking operations
- Payment processing

## Migration Strategy

### 1. **Phase 1: Core Schema**
- Add missing columns
- Create indexes
- Implement basic functions

### 2. **Phase 2: Business Logic**
- Implement booking functions
- Add payment processing
- Create notification system

### 3. **Phase 3: Integration**
- Razorpay integration
- Email/SMS integration
- Performance optimization

### 4. **Phase 4: Testing & Deployment**
- Comprehensive testing
- Data migration
- Production deployment

## Conclusion

This analysis identifies all the database requirements needed to make the browse venue page and booking system fully functional. The implementation should be done in phases to ensure stability and proper testing at each stage.

Key priorities:
1. **Immediate**: Add missing venue fields and indexes
2. **Short-term**: Implement booking and payment functions
3. **Medium-term**: Add Razorpay integration and notifications
4. **Long-term**: Performance optimization and advanced features

All changes should be thoroughly tested and documented before deployment to production. 