# List Your Venue Page - User Flow & Data Collection

## 📋 **Complete Form Flow Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIST YOUR VENUE FORM                        │
│                    7-Step Collection Process                    │
│                    + Optional Save & Continue                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Step-by-Step Data Collection Flow**

### **Step 1: Basic Information** 📝
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. VENUE NAME *                    │ 2. DESCRIPTION *           │
│    • Text input                    │    • Textarea (min 50 chars)│
│    • Required field                │    • Validation: Min length │
│    • Validation: Not empty         │    • Validation: Min length │
└─────────────────────────────────────────────────────────────────┘
```

**Data Collected:**
- `name` (string) - Venue name
- `description` (string) - Detailed description (50-500 chars)

---

### **Step 2: Location Details** 📍
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. COMPLETE ADDRESS *              │ 2. GOOGLE MAPS LINK *      │
│    • Street address, building      │    • URL input             │
│    • Required field                │    • Required field        │
│                                    │                            │
│ 3. CITY *          4. STATE *      │ 5. PINCODE *              │
│    • Text input     • Text input   │    • 6-digit number        │
│    • Required       • Required     │    • Validation: 6 digits  │
│                                    │                            │
│ 6. LATITUDE (Optional)             │ 7. LONGITUDE (Optional)    │
│    • Decimal number                │    • Decimal number        │
└─────────────────────────────────────────────────────────────────┘
```

**Data Collected:**
- `address` (string) - Complete address
- `googleMapsLink` (string) - Google Maps URL
- `city` (string) - City name
- `state` (string) - State name
- `pincode` (string) - 6-digit postal code
- `latitude` (string) - Optional coordinates
- `longitude` (string) - Optional coordinates

---

### **Step 3: Specifications** ⚙️
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CAPACITY (People) *             │ 2. AREA *                 │
│    • Number input                  │    • Text input            │
│    • Min: 1 person                 │    • e.g., "2000 sq ft"    │
│    • Required field                │    • Required field        │
│                                    │                            │
│ 3. HOURLY RATE (₹) *               │ 4. DAILY RATE (₹) Optional │
│    • Number input                  │    • Number input          │
│    • Min: ₹100                     │    • Min: ₹1000            │
│    • Required field                │    • Optional field        │
└─────────────────────────────────────────────────────────────────┘
```

**Data Collected:**
- `capacity` (string) - Maximum people capacity
- `area` (string) - Venue area description
- `hourlyRate` (string) - Price per hour (min ₹100)
- `dailyRate` (string) - Price per day (optional, min ₹1000)

**💾 Optional Save & Continue Feature:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    SAVE DRAFT & CONTINUE LATER                 │
│                                                                 │
│ [SAVE DRAFT] - Save progress and get recovery link             │
│                                                                 │
│ We'll send you an email with a link to continue where you      │
│ left off. Your information is safe and private.                │
└─────────────────────────────────────────────────────────────────┘
```

---

### **Step 4: Venue Type Selection** 🏢
```
┌─────────────────────────────────────────────────────────────────┐
│                    VENUE TYPE SELECTION                        │
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Cricket Box │ │ Farmhouse   │ │ Banquet     │ │ Sports      │ │
│ │             │ │             │ │ Hall        │ │ Complex     │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│ ┌─────────────┐ ┌─────────────┐                                 │
│ │ Party Hall  │ │ Conference  │                                 │
│ │             │ │ Room        │                                 │
│ └─────────────┘ └─────────────┘                                 │
│                                                                 │
│                    SPECIFIC OPTIONS                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ • Pitch Type: [☐ Turf] [☐ Concrete] [☐ Matting] [☐ Clay]   │ │
│ │ • Facilities: [☐ Floodlights] [☐ Practice Nets] [☐ ...]    │ │
│ │ • Additional Services: [☐ Coach] [☐ Equipment] [☐ ...]     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data Collected:**
- `venueType` (string) - Selected venue type
- `specificOptions` (object) - Dynamic options based on venue type:
  - Cricket Box: `pitchType`, `facilities`, `additionalServices`
  - Farmhouse: `eventTypes`, `facilities`, `additionalServices`
  - Banquet Hall: `hallType`, `facilities`, `additionalServices`
  - Sports Complex: `sportsAvailable`, `facilities`, `additionalServices`
  - Party Hall: `partyTypes`, `facilities`, `additionalServices`
  - Conference Room: `roomType`, `facilities`, `additionalServices`

**💾 Optional Save & Continue Feature:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    SAVE DRAFT & CONTINUE LATER                 │
│                                                                 │
│ [SAVE DRAFT] - Save progress and get recovery link             │
│                                                                 │
│ We'll send you an email with a link to continue where you      │
│ left off. Your information is safe and private.                │
└─────────────────────────────────────────────────────────────────┘
```

---

### **Step 5: Media Upload** 📸
```
┌─────────────────────────────────────────────────────────────────┐
│                    VENUE IMAGES *                              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │ [IMG 1] │ │ [IMG 2] │ │ [IMG 3] │ │ [IMG 4] │ │ [+ ADD] │   │
│ │   [×]   │ │   [×]   │ │   [×]   │ │   [×]   │ │ IMAGE   │   │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│ • Min: 1 image, Max: 10 images                                 │
│ • File types: image/*                                           │
│                                                                 │
│                    VENUE VIDEOS (Optional)                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                            │
│ │ [VID 1] │ │ [VID 2] │ │ [+ ADD] │                            │
│ │   [×]   │ │   [×]   │ │ VIDEO   │                            │
│ └─────────┘ └─────────┘ └─────────┘                            │
│ • Max: 3 videos                                                 │
│ • File types: video/*                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Data Collected:**
- `images` (File[]) - Array of image files (1-10 images)
- `videos` (File[]) - Array of video files (0-3 videos)

---

### **Step 6: Contact Information** 👤
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CONTACT PERSON NAME *                                        │
│    • Text input                                                  │
│    • Required field                                              │
│                                                                 │
│ 2. CONTACT PHONE *              │ 3. CONTACT EMAIL *            │
│    • Tel input                   │    • Email input             │
│    • 10-digit number             │    • Valid email format      │
│    • Required field              │    • Required field          │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔒 Privacy & Trust Assurance                                │ │
│ │                                                             │ │
│ │ We'll only use your phone/email to verify your listing     │ │
│ │ and send updates—never for unsolicited marketing.          │ │
│ │                                                             │ │
│ │ Your contact information helps us:                          │ │
│ │ • Verify venue ownership                                     │ │
│ │ • Send booking notifications                                │ │
│ │ • Provide customer support                                  │ │
│ │ • Keep you updated on listing status                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data Collected:**
- `contactName` (string) - Contact person's full name
- `contactPhone` (string) - 10-digit phone number
- `contactEmail` (string) - Valid email address

---

### **Step 7: Review & Submit** ✅
```
┌─────────────────────────────────────────────────────────────────┐
│                    REVIEW YOUR VENUE DETAILS                   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📍 Basic Information                                        │ │
│ │    Name: [Venue Name]                                       │ │
│ │    Type: [Selected Type]                                    │ │
│ │    Description: [Full description]                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🗺️ Location                                                 │ │
│ │    Address: [Complete address]                              │ │
│ │    City & State: [City, State]                              │ │
│ │    Pincode: [6-digit code]                                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ⚙️ Specifications                                           │ │
│ │    Capacity: [X] people                                      │ │
│ │    Area: [Area description]                                  │ │
│ │    Hourly Rate: ₹[Amount]                                    │ │
│ │    Daily Rate: ₹[Amount] (if provided)                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 Contact Information                                       │ │
│ │    Name: [Contact name]                                      │ │
│ │    Phone: [Phone number]                                     │ │
│ │    Email: [Email address]                                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📸 Media Files                                               │ │
│ │    Images: [X] uploaded                                      │ │
│ │    Videos: [X] uploaded                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                    [SUBMIT VENUE FOR REVIEW]                   │
└─────────────────────────────────────────────────────────────────┘
```

**Final Data Structure:**
```typescript
interface FormData {
  // Step 1
  name: string;
  description: string;
  
  // Step 2
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  googleMapsLink: string;
  
  // Step 3
  capacity: string;
  area: string;
  hourlyRate: string;
  dailyRate: string;
  
  // Step 4
  venueType: string;
  specificOptions: Record<string, string[]>;
  
  // Step 5
  images: File[];
  videos: File[];
  
  // Step 6
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

// Draft Recovery Interface
interface DraftData extends FormData {
  draftId: string;
  createdAt: Date;
  lastUpdated: Date;
  stepCompleted: number;
  recoveryEmail: string;
}
```

---

## 💾 **Save & Continue Feature**

### **Draft Recovery Flow**
```
┌─────────────────────────────────────────────────────────────────┐
│                    DRAFT RECOVERY SYSTEM                       │
│                                                                 │
│ 1. User clicks "Save Draft" after Step 3 or 4                  │
│ 2. System prompts for email address                            │
│ 3. Draft saved to database with unique ID                      │
│ 4. Recovery email sent with secure link                        │
│ 5. User can return anytime via email link                      │
│ 6. Form auto-populates with saved data                         │
│ 7. User continues from where they left off                     │
└─────────────────────────────────────────────────────────────────┘
```

### **Draft Recovery Email Template**
```
Subject: Continue Your Venue Listing - [Venue Name]

Hi [Contact Name],

You saved a draft of your venue listing "[Venue Name]" on [Date].

📝 Continue where you left off:
[SECURE RECOVERY LINK]

Your draft includes:
✅ Basic Information
✅ Location Details  
✅ Specifications
✅ Venue Type Selection
⏳ Media Upload (pending)
⏳ Contact Information (pending)
⏳ Review & Submit (pending)

This link is valid for 30 days. Your information is secure and private.

Need help? Contact our support team.

Best regards,
Venue Finder Team
```

### **Database Schema for Drafts**
```sql
-- Draft storage table
CREATE TABLE venue_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  form_data JSONB NOT NULL,
  step_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for email lookups
CREATE INDEX idx_venue_drafts_email ON venue_drafts(email);

-- Index for expiration cleanup
CREATE INDEX idx_venue_drafts_expires ON venue_drafts(expires_at);

-- RLS Policy for draft access
ALTER TABLE venue_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own drafts" ON venue_drafts
  FOR ALL USING (email = current_setting('request.jwt.claims', true)::json->>'email');
```

---

## 🔄 **Navigation Flow**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   STEP 1    │───▶│   STEP 2    │───▶│   STEP 3    │───▶│   STEP 4    │
│   Basic     │    │  Location   │    │   Specs     │    │   Type      │
│   Info      │◀───│   Details   │◀───│             │◀───│ Selection   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                    │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   STEP 7    │◀───│   STEP 6    │◀───│   STEP 5    │◀───│             │
│   Review    │    │   Contact   │    │   Media     │    │             │
│   & Submit  │───▶│   Info      │───▶│   Upload    │───▶│             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘

💾 Save Draft Options:
   • After Step 3 (Specifications)
   • After Step 4 (Venue Type Selection)
```

---

## ✅ **Validation Rules**

| Step | Field | Validation |
|------|-------|------------|
| 1 | Name | Required, not empty |
| 1 | Description | Required, min 50 characters |
| 2 | Address | Required, not empty |
| 2 | Google Maps Link | Required, valid URL |
| 2 | City | Required, not empty |
| 2 | State | Required, not empty |
| 2 | Pincode | Required, exactly 6 digits |
| 3 | Capacity | Required, min 1 |
| 3 | Area | Required, not empty |
| 3 | Hourly Rate | Required, min ₹100 |
| 4 | Venue Type | Required, must select one |
| 5 | Images | Required, at least 1 image |
| 6 | Contact Name | Required, not empty |
| 6 | Contact Phone | Required, 10 digits |
| 6 | Contact Email | Required, valid email format |

---

## 🏢 **Venue Types & Specific Options**

### **Cricket Box**
- **Pitch Type:** Turf, Concrete, Matting, Clay
- **Facilities:** Floodlights, Practice Nets, Equipment Storage, Changing Rooms, Washrooms, Parking
- **Additional Services:** Coach Available, Equipment Rental, Video Analysis, Refreshments

### **Farmhouse**
- **Event Types:** Wedding, Corporate Event, Birthday Party, Family Gathering, Photoshoot
- **Facilities:** Garden, Swimming Pool, BBQ Area, Kitchen, Parking, Security, Bonfire Area
- **Additional Services:** Catering, Decoration, Photography, Music System, Accommodation

### **Banquet Hall**
- **Hall Type:** AC Hall, Non-AC Hall, Outdoor Area, Rooftop
- **Facilities:** Stage Area, Sound System, LED Lighting, Catering Kitchen, Decoration Service, Parking
- **Additional Services:** Catering, Decoration, Photography, DJ, Valet Parking

### **Sports Complex**
- **Sports Available:** Cricket, Football, Basketball, Tennis, Badminton, Swimming, Gym
- **Facilities:** Multiple Courts, Fitness Center, Locker Rooms, Cafeteria, First Aid, Equipment Rental
- **Additional Services:** Coach Available, Tournament Organization, Equipment Rental, Refreshments

### **Party Hall**
- **Party Types:** Birthday, Anniversary, Corporate Party, DJ Night, Theme Party
- **Facilities:** DJ Setup, Dance Floor, LED Lighting, Bar Facility, Valet Parking, Sound System
- **Additional Services:** Catering, Decoration, Photography, DJ, Security

### **Conference Room**
- **Room Type:** Small Meeting Room, Conference Hall, Auditorium, Training Room
- **Facilities:** Projector, WiFi, AC, Whiteboard, Video Conferencing, Catering
- **Additional Services:** Catering, Technical Support, Recording Equipment, Stationery

---

## 🎨 **UI Components Used**

### **shadcn/ui Components**
- `Card` - For layout containers and review sections
- `CardHeader` - For section headers with icons
- `CardContent` - For content areas
- `CardTitle` - For section titles
- `Input` - For text, number, email, tel inputs
- `Label` - For form field labels
- `Textarea` - For description field
- `Button` - For navigation and submit actions
- `Checkbox` - For venue-specific options
- `Progress` - For step progress indicator
- `Alert` - For trust assurance messages
- `Badge` - For draft status indicators

### **Lucide Icons**
- `Building2` - Venue/Basic Information
- `MapPin` - Location
- `Settings` - Specifications
- `User` - Contact Information
- `List` - Venue-specific options
- `Camera` - Media files
- `CheckCircle` - Completed steps
- `AlertCircle` - Error messages
- `ArrowRight/ArrowLeft` - Navigation
- `Loader2` - Loading states
- `X` - Remove media files
- `Save` - Save draft functionality
- `Shield` - Privacy/trust assurance
- `Mail` - Email recovery

---

## 🔧 **Technical Implementation**

### **State Management**
- React `useState` for form data
- Step-by-step validation
- File upload handling
- Error state management
- Draft recovery state

### **File Upload**
- Image files: 1-10 images, `image/*` types
- Video files: 0-3 videos, `video/*` types
- Preview functionality with remove option
- Supabase storage integration

### **Validation**
- Real-time validation on each step
- Error messages with icons
- Step completion tracking
- Form submission validation

### **Navigation**
- Previous/Next button navigation
- Step progress indicator
- Validation before proceeding
- Disabled states for invalid steps

### **Draft Recovery**
- Secure draft storage in Supabase
- Email-based recovery system
- Auto-population of saved data
- 30-day expiration with cleanup
- Privacy-focused implementation

---

## 📱 **Responsive Design**

- **Mobile:** Single column layout, stacked inputs
- **Tablet:** Two-column grid for related fields
- **Desktop:** Multi-column layouts, side-by-side sections
- **Touch-friendly:** Large touch targets, proper spacing

---

## 🚀 **Performance Optimizations**

- Lazy loading of media previews
- Optimized image/video handling
- Efficient state updates
- Minimal re-renders with proper React patterns
- Draft data compression for storage efficiency

---

## 🔒 **Privacy & Security**

### **Data Protection**
- Draft data encrypted at rest
- Secure email recovery links
- Automatic data expiration
- No marketing use of contact info
- Clear privacy messaging

### **Trust Building**
- Transparent data usage policies
- Clear purpose communication
- Secure handling assurances
- User control over their data

This comprehensive flow ensures all necessary venue information is collected systematically while providing a smooth user experience with proper validation at each step, enhanced trust through privacy assurances, and convenient draft recovery functionality.

# List Your Venue – Modern Form Implementation Plan

## 🏢 Project Context
A modern, interactive, and visually rewarding multi-step form for venue owners to list their venue on Venue Finder. Uses shadcn/ui, Framer Motion, Lucide-react, Tailwind CSS, Zod, and supports dark/light themes.

---

## 🗂️ Technical Structure & Componentization
- [ ] Use componentized architecture: **Each step is a separate React component**
- [ ] Use shadcn/ui Card, CardHeader, CardContent, CardTitle for layout
- [ ] Use Input, Label, Textarea, Checkbox, Button, Progress, Separator consistently
- [ ] Animate step transitions with Framer Motion AnimatePresence
- [ ] Show step numbers, titles, and a clear progress bar
- [ ] Inputs: floating labels, focus rings, error highlighting
- [ ] Real-time validation with Zod, block next step until valid
- [ ] Image & video uploads with previews using Supabase storage
- [ ] Fully functional in light and dark modes
- [ ] Fully responsive, mobile/touch optimized
- [ ] Use hover effects, shadows, and smooth transitions

---

## 📝 Form Steps & Visual Behaviors

### Step 1: Venue Details
- [ ] Venue Name: Input with focus ring, glow on active
- [ ] Venue Type: Select dropdown with floating label, icon
- [ ] Type-Specific Options: Checkbox groups inside Card, fade in after type selection
- [ ] Next step button highlights after type selection

### Step 2: Description
- [ ] Description: Textarea with character counter, border glow after 50 chars, expands on typing
- [ ] Positive message when min character limit met

### Step 3: Location
- [ ] Address: Input with validation
- [ ] Google Maps Link: Input with icon, URL validation
- [ ] City, State, Pincode: Input group in grid, pincode restricts to 6 digits
- [ ] Checkmark icon beside valid fields

### Step 4: Specifications
- [ ] Capacity: Number input with stepper, min 1
- [ ] Area: Input with format placeholder
- [ ] Hourly Rate: Input with currency prefix, red border below min
- [ ] Daily Rate: Optional, tooltip explains

### Step 5: Media Upload
- [ ] Images: Upload grid, drag-and-drop, thumbnail preview, remove button
- [ ] Videos: Upload grid, max 3, video previews
- [ ] Hover zoom on images, success indicator after upload

### Step 6: Contact
- [ ] Contact Name: Input with floating label, checkmark on valid
- [ ] Contact Phone: 10-digit restriction, auto-format
- [ ] Contact Email: Email validation, verified badge

### Step 7: Review & Submit
- [ ] Summarized Card sections with Separator
- [ ] Edit buttons beside each group
- [ ] Submit button with loader animation
- [ ] On success: confetti or checkmark animation (Framer Motion)

---

## 🎨 Color Palette (Light & Dark Mode)
| Element         | Light Mode      | Dark Mode      |
|-----------------|-----------------|---------------|
| Primary Action  | bg-blue-600     | bg-blue-400   |
| Progress Bar    | bg-blue-600     | bg-blue-400   |
| Inputs Border   | border-gray-300 | border-gray-600|
| Card Background | bg-white        | bg-gray-800   |
| Text Color      | text-gray-800   | text-gray-200 |
| Hover States    | blue/gray       | blue/gray     |

---

## 💡 Extra Engagement Features
- [ ] Smooth step progress with completion indicators
- [ ] Real-time validation prevents incorrect submissions
- [ ] Inputs/buttons animate softly on hover/focus
- [ ] Visual badges for valid data
- [ ] Mobile, tablet, desktop optimized
- [ ] Lucide icons contextually (e.g., Building2, MapPin, Camera)
- [ ] Progressive disclosure: only show necessary fields per step

---

## 🚀 Implementation Tasks
1. [ ] **Componentize each step** as a separate React component
2. [ ] **Refactor main ListVenue page** to use step components and AnimatePresence
3. [ ] **Integrate Zod validation** for real-time feedback
4. [ ] **Modernize all UI** with shadcn/ui, Tailwind, and Lucide icons
5. [ ] **Add Framer Motion transitions** for step changes and success
6. [ ] **Implement Supabase Storage** for image/video uploads with previews
7. [ ] **Ensure full dark/light mode support**
8. [ ] **Test responsiveness and accessibility**
9. [ ] **Polish: Add micro-interactions, badges, and completion cues**
10. [ ] **Document and log all changes** in project logs

---

_This checklist ensures the List Your Venue form is modern, robust, and delightful to use._
