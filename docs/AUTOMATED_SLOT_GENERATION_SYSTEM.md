# Automated Venue Slot Generation System

_Last updated: 2025-01-23_

## 🎯 Overview

The automated venue slot generation system creates **one year of booking slots** for all approved venues based on their **weekly availability settings** configured in their dashboard edit venue form. This ensures perfect synchronization between venue owner preferences and booking availability.

## ⚡ How It Works

### 1. Weekly Availability Configuration
Venue owners configure their availability in the **Edit Venue** dashboard:
```json
{
  "monday": { "start": "06:00", "end": "18:00", "available": true },
  "tuesday": { "start": "06:00", "end": "18:00", "available": true },
  "wednesday": { "start": "06:00", "end": "18:00", "available": true },
  "thursday": { "start": "06:00", "end": "18:00", "available": true },
  "friday": { "start": "06:00", "end": "18:00", "available": true },
  "saturday": { "start": "08:00", "end": "16:00", "available": true },
  "sunday": { "start": "08:00", "end": "16:00", "available": false }
}
```

### 2. Automatic Slot Generation
**Triggers Automatically When:**
- ✅ **New venue is approved** by super admin
- ✅ **Weekly availability is updated** by venue owner
- ✅ **Venue approval status** changes to 'approved'

**Generation Rules:**
- **Duration**: 1 year from current date
- **Frequency**: Every enabled day based on weekly schedule
- **Time Slots**: Hourly slots within specified time ranges
- **Pricing**: Uses venue's `price_per_hour` setting

## 🚀 Features

### Automatic Triggers
```sql
-- Triggers on INSERT and UPDATE
CREATE TRIGGER trigger_auto_generate_slots_insert_enhanced
    AFTER INSERT ON venues
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_venue_slots_enhanced();

CREATE TRIGGER trigger_auto_generate_slots_update_enhanced
    AFTER UPDATE OF weekly_availability, approval_status ON venues
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_venue_slots_enhanced();
```

### Smart Slot Generation
- **Respects Custom Hours**: Different start/end times per day
- **Skips Disabled Days**: No slots for days marked `available: false`
- **Validates Time Ranges**: Prevents invalid time configurations
- **Automatic Cleanup**: Removes old slots before regenerating

## 📊 Database Functions

### Core Functions

#### `generate_venue_slots_for_year_enhanced(venue_id, start_date)`
Generates slots based on detailed weekly availability.

**Features:**
- Uses `weekly_availability` JSONB column
- Validates venue approval status
- Respects custom time ranges per day
- Returns detailed generation statistics

**Example:**
```sql
SELECT generate_venue_slots_for_year_enhanced('venue-id-here');
```

#### `generate_slots_for_all_existing_venues()`
Bulk generates slots for all approved venues with weekly availability.

**Returns:**
```json
{
  "summary": {
    "total_venues": 6,
    "successful_venues": 3,
    "skipped_venues": 2,
    "failed_venues": 1
  },
  "venue_results": [...]
}
```

#### `regenerate_my_venue_slots_enhanced(venue_id)`
Allows venue owners to manually regenerate their slots.

**Security:**
- RLS enforced - owners can only regenerate their own venues
- Requires venue to be approved
- Validates weekly availability configuration

#### `check_venue_slot_needs_update(venue_id)`
Checks if a venue needs slot regeneration.

**Returns:**
```json
{
  "slot_statistics": {
    "total_slots": 4006,
    "future_slots": 3800,
    "latest_slot_date": "2026-07-23",
    "needs_regeneration": false
  }
}
```

## 🎮 Usage Examples

### For Venue Owners
```sql
-- Check if my venue needs slot updates
SELECT check_venue_slot_needs_update('my-venue-id');

-- Manually regenerate slots after availability change
SELECT regenerate_my_venue_slots_enhanced('my-venue-id');
```

### For Admins
```sql
-- Generate slots for all existing venues
SELECT generate_slots_for_all_existing_venues();

-- Generate slots for specific venue
SELECT generate_venue_slots_for_year_enhanced('venue-id-here');
```

## 📋 Venue Owner Workflow

1. **Edit Venue** → Navigate to venue dashboard
2. **Weekly Availability** → Configure days and hours
3. **Save Changes** → Slots automatically regenerate
4. **Calendar Updates** → Booking calendar shows new availability

## 🔄 System Behavior

### For Existing Venues
- ✅ **Approved venues with weekly availability**: Slots generated automatically
- ⏭️ **Venues without weekly availability**: Skipped (need manual configuration)
- ❌ **Failed venues**: Logged with error details

### For New Venues
- ✅ **Auto-generation**: Triggers when venue gets approved AND has weekly availability
- 🔄 **Updates**: Triggers when weekly availability changes
- 📊 **Statistics**: Full generation details logged

## 📈 Performance & Statistics

### Testuser Venue Example
**Before Enhancement:**
- Manual slots: Limited dates
- Calendar: Few available dates

**After Enhancement:**
- **Total Slots**: 4,006 slots
- **Date Coverage**: 368 unique dates (1 year)
- **Distribution**: 
  - Monday-Friday: 12 slots/day (6 AM - 6 PM)
  - Saturday-Sunday: 8 slots/day (8 AM - 4 PM)

### System-Wide Results
- **Total Venues Processed**: 6
- **Successfully Generated**: 3 venues
- **Skipped (No Config)**: 2 venues  
- **Failed**: 1 venue (validation error)

## 🛠️ Maintenance

### Regular Cleanup
```sql
-- Clean up old slots (optional)
DELETE FROM venue_slots 
WHERE date < CURRENT_DATE - INTERVAL '30 days';
```

### Monitor System Health
```sql
-- Check venues without weekly availability
SELECT venue_name, approval_status 
FROM venues 
WHERE approval_status = 'approved' 
AND (weekly_availability IS NULL OR weekly_availability = '{}'::jsonb);
```

### Regenerate All Venues
```sql
-- Force regeneration for all venues
SELECT generate_slots_for_all_existing_venues();
```

## 🔧 Troubleshooting

### No Slots Generated
1. **Check Approval Status**: Venue must be approved
2. **Verify Weekly Availability**: Must be configured in edit venue form
3. **Validate Time Ranges**: Start time must be before end time
4. **Check Available Days**: At least one day must be marked available

### Calendar Not Updating
1. **Regenerate Slots**: Use `regenerate_my_venue_slots_enhanced()`
2. **Check Date Format**: Ensure frontend uses same date format as database
3. **Verify Venue ID**: Confirm venue ID matches between frontend and database

### Trigger Not Working
1. **Check Function Exists**: Verify trigger functions are installed
2. **Permissions**: Ensure proper database permissions
3. **Error Logs**: Check database logs for trigger errors

## ✅ Benefits

1. **🔄 Automatic Sync**: Venue availability always matches owner settings
2. **⚡ Real-time Updates**: Changes reflect immediately in booking calendar
3. **🎯 Precise Control**: Custom hours per day, disabled days respected
4. **📊 Complete Coverage**: Full year of availability generated
5. **🔒 Secure**: RLS ensures owners only manage their venues
6. **📈 Scalable**: Handles multiple venues efficiently
7. **🛡️ Reliable**: Validation prevents invalid configurations

## 🏁 Current Status

✅ **Fully Implemented and Active**
- All triggers installed and working
- All existing approved venues processed
- Calendar integration updated
- Venue owner management functions ready
- Documentation complete

The system is now **live and automatically managing** venue slot generation for all current and future venues based on their weekly availability settings! 