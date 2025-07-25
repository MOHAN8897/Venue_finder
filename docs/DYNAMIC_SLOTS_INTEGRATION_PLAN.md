# 🚀 Dynamic Slots Integration Plan - Venue Owner Dashboard

## 🎯 **Integration Overview**

**Starting Point**: Existing "Manage Your Venues" Dashboard (`src/pages/cricket-dashboard/VenuesPage.tsx`)
**Goal**: Add real-time availability control without disrupting current workflow

---

## 📊 **Current System Structure**

### **Main Dashboard Components:**
```
📁 Current Venue Management Flow:
├── 🏠 src/pages/cricket-dashboard/VenuesPage.tsx (Main Dashboard)
├── 🎛️ src/components/cricket-dashboard/EditVenueDialog.tsx (Edit Modal)
├── 📅 src/components/cricket-dashboard/forms/AvailabilitySection.tsx (Weekly Schedule)
├── 👁️ src/components/dashboard/VenueDetailsModal.tsx (View Details)
└── 🏢 venues.weekly_availability (Database Field - JSONB)
```

### **Current Availability Format:**
```typescript
weekly_availability: {
  monday: { start: "09:00", end: "17:00", available: true },
  tuesday: { start: "09:00", end: "17:00", available: true },
  wednesday: { start: "09:00", end: "17:00", available: false },
  // ... other days
}
```

---

## 🛠️ **Step-by-Step Integration Plan**

### **Phase 1: Database Foundation** 🗄️

#### **Step 1.1: Create Venue Blockouts Table**
```sql
-- Add to database/venue_blockouts_schema.sql
CREATE TABLE venue_blockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- Optional for partial day blocks
  end_time TIME,   -- Optional for partial day blocks
  reason TEXT NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('maintenance', 'personal', 'custom', 'emergency')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);
```

#### **Step 1.2: Create Dynamic Slot Functions**
```sql
-- Add to database/dynamic_slots_functions.sql
CREATE OR REPLACE FUNCTION get_venue_availability_for_period(
  p_venue_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSONB AS $$
-- Function to calculate real-time availability
$$;
```

### **Phase 2: Backend Services** ⚙️

#### **Step 2.1: Create Dynamic Slot Service**
**File**: `src/lib/dynamicSlotService.ts`
```typescript
export class DynamicSlotService {
  // Calculate available slots in real-time
  async getAvailableSlots(venueId: string, startDate: Date, endDate: Date): Promise<TimeSlot[]>
  
  // Get venue's base schedule
  private async getVenueSchedule(venueId: string): Promise<VenueAvailability>
  
  // Apply blockouts and bookings
  private applyRestrictions(slots: TimeSlot[], blockouts: VenueBlockout[], bookings: Booking[]): TimeSlot[]
}
```

#### **Step 2.2: Create Venue Owner Control Service**
**File**: `src/lib/venueOwnerControlService.ts`
```typescript
export class VenueOwnerControlService {
  // Block specific dates/times
  async blockSlots(blockoutData: VenueBlockoutData): Promise<VenueBlockout>
  
  // Remove blockouts
  async unblockSlots(blockoutId: string): Promise<void>
  
  // Update weekly schedule
  async updateWeeklyAvailability(venueId: string, newSchedule: VenueAvailability): Promise<void>
}
```

### **Phase 3: Frontend Integration** 🎨

#### **Step 3.1: Add Availability Control Tab to Main Dashboard**
**File**: `src/pages/cricket-dashboard/VenuesPage.tsx`

**Current Structure:**
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="grid">Grid View</TabsTrigger>
    <TabsTrigger value="list">List View</TabsTrigger>
    <TabsTrigger value="map">Map View</TabsTrigger>
  </TabsList>
</Tabs>
```

**Updated Structure:**
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="grid">My Venues</TabsTrigger>
    <TabsTrigger value="availability">🕒 Availability Control</TabsTrigger>
    <TabsTrigger value="bookings">📅 Bookings</TabsTrigger>
    <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
  </TabsList>
  
  <TabsContent value="availability">
    <VenueAvailabilityController venues={venues} />
  </TabsContent>
</Tabs>
```

#### **Step 3.2: Create Availability Controller Component**
**File**: `src/components/venue-owner/VenueAvailabilityController.tsx`

```tsx
export const VenueAvailabilityController: React.FC<{venues: Venue[]}> = ({ venues }) => {
  return (
    <div className="space-y-6">
      {/* Venue Selector */}
      <VenueSelector venues={venues} selectedVenue={selectedVenue} onChange={setSelectedVenue} />
      
      {/* Availability Calendar */}
      <AvailabilityCalendar venueId={selectedVenue.id} />
      
      {/* Active Blockouts */}
      <ActiveBlockoutsList venueId={selectedVenue.id} />
      
      {/* Quick Actions */}
      <QuickAvailabilityActions venueId={selectedVenue.id} />
    </div>
  );
};
```

#### **Step 3.3: Enhance Existing Edit Dialog**
**File**: `src/components/cricket-dashboard/EditVenueDialog.tsx`

**Add New Section:**
```tsx
{/* Existing availability section */}
<AvailabilitySection 
  availability={formData.weeklyAvailability} 
  onChange={updateWeeklyAvailability} 
/>

{/* NEW: Advanced Availability Controls */}
<Collapsible>
  <CollapsibleTrigger>
    <Button variant="outline">🕒 Advanced Availability Controls</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <AvailabilityPreview venueId={venue.id} />
    <Button onClick={() => openAvailabilityModal(venue.id)}>
      Open Full Availability Manager
    </Button>
  </CollapsibleContent>
</Collapsible>
```

### **Phase 4: New UI Components** 🧩

#### **Step 4.1: Availability Calendar Component**
**File**: `src/components/venue-owner/AvailabilityCalendar.tsx`
```tsx
export const AvailabilityCalendar: React.FC<{venueId: string}> = ({ venueId }) => {
  // 30-day calendar showing:
  // 🟢 Available days
  // 🔴 Blocked days  
  // 🟡 Partially blocked days
  // ⚫ Venue closed days
  
  const handleDateClick = (date: Date) => {
    // Quick block/unblock functionality
  };
};
```

#### **Step 4.2: Block Slots Modal**
**File**: `src/components/venue-owner/BlockSlotsModal.tsx`
```tsx
export const BlockSlotsModal: React.FC = () => {
  return (
    <Dialog>
      <form onSubmit={handleBlockSlots}>
        <DateRangePicker /> {/* Select dates to block */}
        <TimeRangePicker /> {/* Optional: specific hours */}
        <ReasonInput />    {/* Why blocking */}
        <BlockTypeSelector /> {/* maintenance/personal/custom */}
        <RecurrenceOptions /> {/* Weekly/monthly patterns */}
      </form>
    </Dialog>
  );
};
```

#### **Step 4.3: Active Blockouts Manager**
**File**: `src/components/venue-owner/ActiveBlockoutsList.tsx`
```tsx
export const ActiveBlockoutsList: React.FC<{venueId: string}> = ({ venueId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🚫 Active Blockouts</CardTitle>
      </CardHeader>
      <CardContent>
        {blockouts.map(blockout => (
          <BlockoutItem 
            key={blockout.id}
            blockout={blockout}
            onRemove={handleRemoveBlockout}
          />
        ))}
      </CardContent>
    </Card>
  );
};
```

### **Phase 5: API Integration** 🔌

#### **Step 5.1: Create API Routes**
```typescript
// Add to existing API structure
/api/venues/{venueId}/availability
  GET    - Get real-time availability for date range
  
/api/venues/{venueId}/blockouts
  GET    - Get active blockouts
  POST   - Create new blockout
  DELETE - Remove blockout

/api/venues/{venueId}/weekly-availability
  PUT    - Update base weekly schedule
```

#### **Step 5.2: Update Booking System**
**File**: `src/pages/VenueBooking.tsx`
```tsx
// Replace static slot queries with dynamic calculation
const { availableSlots, loading } = useDynamicSlots(venueId, selectedDate);
```

---

## 🎛️ **User Flow Integration**

### **Current Flow:**
```
1. Venue Owner Dashboard → My Venues → Edit Venue → Update Weekly Schedule
```

### **New Enhanced Flow:**
```
1. Venue Owner Dashboard → 
2. 🆕 Availability Control Tab → 
3. See 30-day calendar with real-time status →
4. Click "Block Dates" → Select dates → Enter reason → Confirm →
5. ✅ Slots immediately become unavailable for customers
```

### **Quick Actions Available:**
- 🚫 **Block Today** (Emergency closure)
- 🔧 **Schedule Maintenance** (Pick dates)
- 🏠 **Personal Time** (Block weekends)
- 📅 **Recurring Blockouts** (Every Sunday)
- ⚙️ **Update Weekly Hours** (Change Mon-Fri times)

---

## 📱 **UI Integration Points**

### **1. Main Dashboard Enhancement**
**Before:**
```tsx
// src/pages/cricket-dashboard/VenuesPage.tsx
<header>My Venues ({venues.length})</header>
<VenueGrid venues={venues} />
```

**After:**
```tsx
<header>
  <h1>My Venues ({venues.length})</h1>
  <AvailabilityStatusSummary venues={venues} /> {/* NEW */}
</header>

<Tabs>
  <TabsList>
    <TabsTrigger value="venues">🏢 My Venues</TabsTrigger>
    <TabsTrigger value="availability">🕒 Availability</TabsTrigger> {/* NEW */}
    <TabsTrigger value="bookings">📅 Bookings</TabsTrigger> {/* NEW */}
  </TabsList>
</Tabs>
```

### **2. Venue Card Enhancement**
**Before:**
```tsx
// src/components/cricket-dashboard/BoxCard.tsx
<VenueCard>
  <VenueTitle />
  <VenueStats />
  <ActionButtons />
</VenueCard>
```

**After:**
```tsx
<VenueCard>
  <VenueTitle />
  <AvailabilityStatusBadge venue={venue} /> {/* NEW */}
  <VenueStats />
  <ActionButtons>
    <ManageAvailabilityButton venue={venue} /> {/* NEW */}
  </ActionButtons>
</VenueCard>
```

### **3. Edit Dialog Enhancement**
**Current Edit Sections:**
- Basic Info
- Media
- Amenities  
- Weekly Schedule ✅ (Existing)

**New Sections Added:**
- Advanced Availability Controls 🆕
- Blockout Management 🆕
- Availability Preview 🆕

---

## 🔄 **Migration Strategy**

### **Phase 1: Parallel Implementation**
- ✅ Keep existing weekly_availability system
- ✅ Add new dynamic slot calculation alongside
- ✅ Both systems work independently

### **Phase 2: Gradual Integration**
- ✅ New "Availability Control" tab uses dynamic system
- ✅ Existing edit dialogs still use current system
- ✅ Booking system gradually switches to dynamic

### **Phase 3: Full Migration**
- ✅ All availability queries use dynamic system
- ✅ Remove pre-generated venue_slots table
- ✅ Keep weekly_availability as base schedule

### **Phase 4: Cleanup**
- ✅ Archive old slot generation code
- ✅ Optimize database performance
- ✅ Monitor system performance

---

## 📋 **Implementation Checklist**

### **Backend (Database & APIs)**
- [ ] Create `venue_blockouts` table
- [ ] Create dynamic slot calculation functions
- [ ] Create venue owner control APIs
- [ ] Add database indexes for performance
- [ ] Create RLS policies for security

### **Frontend (UI Components)**
- [ ] Create `VenueAvailabilityController` component
- [ ] Create `AvailabilityCalendar` component
- [ ] Create `BlockSlotsModal` component
- [ ] Create `ActiveBlockoutsList` component
- [ ] Add new tab to main dashboard

### **Integration**
- [ ] Update `VenuesPage.tsx` with new tab
- [ ] Enhance `EditVenueDialog.tsx` with availability controls
- [ ] Update `VenueCard` with availability status
- [ ] Connect booking system to dynamic slots

### **Testing**
- [ ] Test venue owner can block/unblock dates
- [ ] Test changes reflect immediately in booking system
- [ ] Test weekly schedule updates work correctly
- [ ] Test performance with multiple venues

---

## 🎯 **Success Metrics**

### **Functionality**
- ✅ Venue owners can block any date/time in ≤3 clicks
- ✅ Changes take effect immediately (≤5 seconds)
- ✅ Weekly schedule updates work seamlessly
- ✅ No conflicts between different availability settings

### **Performance**
- ✅ Dashboard loads in ≤2 seconds
- ✅ Availability calendar renders in ≤1 second
- ✅ Database queries return in ≤500ms
- ✅ System handles 100+ venues without issues

### **User Experience**
- ✅ Intuitive availability calendar interface
- ✅ Clear visual indicators for different slot states
- ✅ Helpful error messages and confirmations
- ✅ Mobile-friendly design

---

## 🚀 **Next Steps**

1. **Start with Backend Foundation** - Create database tables and functions
2. **Build Core Services** - Implement dynamic slot calculation
3. **Create UI Components** - Build availability calendar and controls
4. **Integrate with Dashboard** - Add new tab and enhance existing components
5. **Test & Optimize** - Ensure performance and reliability

This plan provides a clear roadmap for integrating dynamic slots into your existing venue management system without disrupting current workflows. Would you like me to proceed with implementing any specific phase? 