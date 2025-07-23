# Venue Slot Generation System

_Last updated: 2025-01-23_

## Overview

The venue slot generation system automatically creates one year's worth of time slots for each venue based on their weekly availability settings. This ensures that all approved venues have consistent booking availability.

## How It Works

### 1. Weekly Availability Configuration
- Venue owners set their weekly availability (e.g., ["Monday", "Tuesday", "Wednesday"])
- This determines which days of the week the venue accepts bookings
- Stored in the `venues.availability` column as a text array

### 2. Automatic Slot Generation
- **Time Range**: 5 AM to 9 PM (16 hourly slots per day)
- **Duration**: One year from current date
- **Frequency**: Every day that matches the weekly availability
- **Pricing**: Uses `venues.price_per_hour` for each slot

### 3. Trigger System
Slots are automatically generated when:
- **New venue is created** (with availability set)
- **Venue availability is updated**
- **Venue approval status changes** to 'approved'

## Database Functions

### Core Functions

#### `generate_venue_slots_for_year(venue_id, start_date)`
Generates one year of slots for a specific venue.

**Parameters:**
- `venue_id` (UUID): Target venue ID
- `start_date` (DATE): Starting date (defaults to current date)

**Returns:** JSONB with success status and slot creation details

**Example:**
```sql
SELECT generate_venue_slots_for_year('6db3f442-cc2d-45c8-8531-702a67ab38f4');
```

#### `generate_slots_for_all_venues()`
Bulk generates slots for all approved venues with availability set.

**Returns:** JSONB with summary of successes and failures

**Example:**
```sql
SELECT generate_slots_for_all_venues();
```

#### `regenerate_my_venue_slots(venue_id)`
Allows venue owners to regenerate slots for their own venues.

**Security:** Uses RLS to ensure users can only regenerate their own venue slots

#### `get_venue_slot_status(venue_id)`
Returns comprehensive statistics about a venue's slots.

**Returns:**
- Total slots created
- Date range coverage
- Available vs booked slot counts
- Weekly availability settings

### Automatic Triggers

#### Insert Trigger
```sql
CREATE TRIGGER trigger_auto_generate_slots_insert
    AFTER INSERT ON venues
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_venue_slots();
```

#### Update Trigger
```sql
CREATE TRIGGER trigger_auto_generate_slots_update
    AFTER UPDATE OF availability, approval_status ON venues
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_venue_slots();
```

## Slot Structure

Each generated slot includes:
- **venue_id**: Reference to the venue
- **date**: The booking date
- **start_time**: Slot start time (5:00-20:00)
- **end_time**: Slot end time (start_time + 1 hour)
- **available**: true (initially all slots are available)
- **price**: Venue's hourly rate
- **booked_by**: null (until someone books it)

## Calendar Integration

The booking calendar queries these slots to:
1. **Show available dates** (green) - dates with available slots
2. **Show unavailable dates** (red) - dates with no slots or all booked
3. **Enable multi-date selection** for daily bookings
4. **Display hourly slots** for hourly bookings

### Calendar Logic
```javascript
// A date is available if:
available = (slot exists) && (slot.available = true) && (slot.booked_by = null)
```

## Admin Operations

### Generate Slots for All Venues
```sql
SELECT generate_slots_for_all_venues();
```

### Check Venue Slot Status
```sql
SELECT get_venue_slot_status('venue-id-here');
```

### Manual Slot Generation
```sql
SELECT generate_venue_slots_for_year('venue-id-here', '2025-01-01');
```

## Maintenance

### Cleanup Old Slots
Slots older than current date can be cleaned up periodically:
```sql
DELETE FROM venue_slots WHERE date < CURRENT_DATE - INTERVAL '30 days';
```

### Regenerate Future Slots
If venue availability changes significantly:
```sql
-- This happens automatically via triggers, but can be done manually:
SELECT regenerate_my_venue_slots('venue-id-here');
```

## Performance Considerations

- **Indexing**: Venue slots are indexed on `venue_id`, `date`, and `available`
- **Batch Operations**: Use `generate_slots_for_all_venues()` for bulk operations
- **Cleanup**: Regular cleanup of old slots keeps the table size manageable

## Benefits

1. **Consistent Availability**: All venues have proper time slots
2. **Automatic Updates**: Slots update when venue settings change
3. **Calendar Performance**: Fast queries for date availability
4. **Booking Reliability**: Prevents booking conflicts
5. **Owner Control**: Venue owners control their availability schedule

## Troubleshooting

### No Slots Generated
- Check if venue has `availability` array set
- Verify venue `approval_status` is 'approved'
- Ensure `price_per_hour` is set

### Calendar Shows No Available Dates
- Run `get_venue_slot_status(venue_id)` to check slot statistics
- Verify venue ID matches between calendar and database
- Check date format compatibility in frontend

### Slots Not Updating
- Triggers should handle this automatically
- Manual regeneration: `SELECT regenerate_my_venue_slots(venue_id)` 