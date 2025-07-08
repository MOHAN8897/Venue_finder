# Venue Submission & Management Flow Documentation

---

## A. List Your Venue Page

### 1. Step-by-Step Structure
- **Step 1: Basic Info**
  - Fields: Venue name, description
- **Step 2: Location**
  - Fields: Address, city, state, pincode, latitude, longitude, Google Maps link
- **Step 3: Specifications**
  - Fields: Capacity, area, hourly rate, daily rate
- **Step 4: Venue Type**
  - Fields: Venue type (cricket-box, farmhouse, etc.), specific options (pitch type, facilities, etc.)
- **Step 5: Media**
  - Fields: Images (max 10), videos (max 3)
- **Step 6: Contact**
  - Fields: Contact name, phone, email
- **Step 7: Review**
  - Final review and submit

### 2. Form & Supabase Interaction
- **On Submit:**
  - Upload images/videos to Supabase Storage
  - Validate all fields (see validation logic in code)
  - Call `VenueSubmissionService.submitVenue()` (uses Supabase RPC)
  - On success: show confirmation, redirect to venues
- **Draft System:**
  - Save incomplete listings via `DraftService.saveDraft()` (Supabase RPC)
  - Drafts are linked to user email, can be recovered
  - Recovery email sent with draft link

### 3. Validation
- All fields validated per step (see code for details)
- Images/videos validated for count and type

---

## B. Manage Your Venue Page

### 1. Page Appearance
- Appears in user profile dropdown if user is authenticated
- Quick action in dashboard if user has venues

### 2. UI Behavior by Venue Status
- **Pending:**
  - Show "Under Review" message, disable edits
- **Approved:**
  - Show management dashboard, allow edits, visibility toggle, unavailability
- **Rejected:**
  - Show rejection reason, allow resubmission

### 3. Venue Management Actions
- Edit venue (if approved)
- Toggle visibility (published/unpublished)
- Set temporary unavailability

---

## C. Venue Listing Display Procedure

### 1. Public Browse Venues Page
- Only venues with `status: approved` and `verified: true` are shown
- Filter by location, type, price, capacity, amenities
- Hide venues if unpublished or not approved

### 2. User Dashboard
- Show only venues submitted by the logged-in user
- If user has multiple venues, allow switching views
- Show stats: total venues, pending, approved, rejected

---

## 2. Supabase Integration Requirements

### Venue Data Structure (Required Fields)
- id, name, description, type, address, city, state, pincode, latitude, longitude, capacity, area, hourly_rate, daily_rate, specific_options, contact_name, contact_phone, contact_email, google_maps_link, images, videos, owner_id, status, verified, rating, review_count, created_at, updated_at, is_published

### Venue Status Tracking
- `status`: pending, approved, rejected, inactive
- `is_published`: true/false
- `approval_status`, `rejection_reason`, `approval_date`

### Media Storage
- Images/videos uploaded to Supabase Storage (buckets: `venue-images`, `venue-videos`)
- URLs stored in venue record

### User-Specific Venue Ownership
- `owner_id` field links to user profile
- Only owner (or manager) can edit/manage

### Activity Logs
- Venue edits/status changes should be logged (future: use `user_activity_log`)

### Booking Data (Future)
- Bookings table links to venue_id

### Visibility Toggles
- `is_published` field controls public visibility

#### Data to Store/Retrieve from Supabase
- All venue fields, images/videos, status, owner, visibility, unavailability, managers

#### UI-Only Temporary States
- Current form step, unsaved form data, preview URLs, local error states

---

## 3. Codebase Analysis for Existing Pages

### List Your Venue
- Multi-step form, state managed in React
- Draft system: saves to Supabase via RPC, recovers by email
- On submit: uploads media, validates, submits to Supabase
- No hardcoded demo data; all fields mapped to Supabase

### Manage Your Venue
- Fetches venues for owner from Supabase
- UI adapts to status (pending/approved/rejected)
- Visibility and unavailability managed via child component

### Venue Listing (Browse)
- Fetches only approved/verified venues from Supabase
- Filters applied via query params
- No demo/static data

### Gaps/To-Do
- Ensure all status changes and edits are logged
- Add support for new tables (venue_managers, unavailability, media)
- Remove any remaining mock/demo data (see VenueDetail for placeholder)

---

## 4. Cleanup Plan for Demo Data
- Remove all static/demo data from VenueDetail and any other pages
- Replace with Supabase queries for real data
- Ensure all venue-related pages use live Supabase data and status

---

## 5. API/Supabase Calls Needed
- `VenueSubmissionService.submitVenue()`
- `VenueSubmissionService.uploadFiles()`
- `VenueSubmissionService.getUserSubmittedVenues()`
- `venueService.getVenuesForOwner()`
- `venueService.getAllVenues()` / `getFilteredVenues()`
- `venueService.updateVenue()`
- `DraftService.saveDraft()`, `getDraft()`, `deleteDraft()`
- Supabase Storage for media
- (Future) Activity log, booking, payments, notifications

---

## [2024-08-02] VenueDetail Now Fully Integrated with Supabase

- All fields in VenueDetail.tsx are now fetched from Supabase.
- No static or mock data remains; all data is live and up-to-date.
- See CODE_CHANGE_LOG.md for details.

---

## [2024-08-02] End-to-End Venue Submission & Approval Flow

### 1. List Your Venue
- Every field in the List Your Venue form is saved to the database via VenueSubmissionService.
- A unique venue ID is generated for each submission.
- The venue is tagged to the user (owner_id) who submitted it.
- All fields are validated and stored, including media, location, and contact info.

### 2. Manage Your Venue
- After submission, the venue appears in the user's profile dropdown and Manage Your Venue page.
- The status (pending, approved, rejected) is displayed for each venue.
- Only the owner (user) can see and manage their venues.

### 3. Super Admin Panel
- All venue submissions appear in the Venue Management section of the Super Admin Dashboard.
- Venues are separated into tabs: Pending, Approved, Rejected.
- Super admin can approve, reject, or leave venues in pending status.
- Status changes are reflected in both the admin panel and user dashboard.

### 4. User Experience
- When a user submits a venue, its status is shown in their profile dropdown and dashboard.
- If pending: "Under Review" message is shown, edits are disabled.
- If rejected: Rejection reason is shown, resubmission is allowed.
- If approved: "Your venue is approved!" message is shown once, then user is redirected to Manage Venue dashboard.
- For users with multiple venues, each venue's status is shown in the dashboard.

### 5. Data Integrity
- All venues are uniquely identified and tagged to the submitting user.
- All status changes are logged and reflected in the UI.
- No static or mock data remains; all data is live from Supabase.

---

## [2024-08-02] Venue Approval System - Missing Logic & Workflow

### Missing Logic
- Approve/Reject actions in SuperAdminDashboard are not yet implemented.
- No frontend integration with backend approval/rejection functions.
- Audit logs for admin actions are not triggered from frontend.
- No user notification on venue status change.

### Planned Workflow
1. Super admin sees all pending venues in Venue Management tab.
2. Approve/Reject buttons are available for each venue.
3. On action, call Supabase RPC (approve_venue/reject_venue) and update status in DB.
4. Log action to venue_approval_logs table.
5. Notify user (email/notification) of status change.
6. User dashboard/profile updates in real time.
7. All changes and actions are logged and documented.

---

## [2024-08-02] Venue Approval Workflow Implemented

- SuperAdminDashboard now fetches and displays pending, approved, and rejected venues.
- Approve/Reject actions are available for each pending venue.
- Actions call Supabase backend functions and update the UI in real time.
- Error and success states are handled and displayed to the admin.

---

# End of Documentation 