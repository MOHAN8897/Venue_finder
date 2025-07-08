# Venue Finder MVP Project Structure & Features

---

## [2024-08-02] MVP Documentation

### 1. Project Structure

```
Venue_finder/
├── src/
│   ├── pages/           # Main app pages (ListVenue, ManageVenues, VenueList, VenueDetail, UserDashboard, etc.)
│   ├── components/      # Reusable UI components (VenueVisibilityControl, MultiVenueSelector, etc.)
│   ├── lib/             # Service logic (venueService, draftService, venueSubmissionService, supabase, etc.)
│   ├── hooks/           # Custom React hooks (useAuth, useDatabase)
│   ├── context/         # React context providers (AuthContext)
│   ├── config/          # Static config (venueTypes)
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions (cropImage, etc.)
├── database/            # SQL schema, migrations, and documentation
├── docs/                # All project documentation and logs
├── supabase/            # Supabase config and migrations
├── package.json         # Project dependencies
└── ...
```

### 2. Main Features
- **Venue Listing (Browse):**
  - Public page to browse/search/filter venues
  - Only approved & verified venues shown
- **List Your Venue:**
  - Multi-step form for venue submission
  - Draft system for incomplete listings
  - Media upload (images/videos to Supabase Storage)
- **Manage Your Venue:**
  - Dashboard for owners to manage their venues
  - Edit, toggle visibility, set unavailability
  - Status-based UI (pending, approved, rejected)
- **User Dashboard:**
  - Overview of bookings, favorites, reviews, listed venues
  - Quick actions for venue management
- **Venue Detail Page:**
  - Full details for a single venue (all fields from Supabase)
  - Live data, no static content
- **Draft & Approval System:**
  - Save/recover drafts by email
  - Admin review/approval flow
- **Notifications:**
  - In-app and email notifications (Supabase + EmailService)
- **(Planned) Booking & Payments:**
  - Booking calendar, payment tracking, invoices

### 3. Data Flow
- **Frontend <-> Supabase:**
  - All venue, user, and booking data stored in Supabase tables
  - Media files in Supabase Storage
  - All CRUD via service layer (venueService, venueSubmissionService, etc.)
  - Drafts and submissions via Supabase RPCs

### 4. User Roles & Permissions
- **User:** Can browse, book, list, and manage own venues
- **Owner:** Can manage all their venues, see stats, set unavailability
- **Admin:** Can approve/reject venues, manage users
- **Super Admin:** Full access, manage admins
- **RLS:** Row Level Security enabled for all sensitive tables

### 5. Supabase Integration Points
- **Tables:** venues, amenities, venue_amenities, venue_slots, venue_unavailability, venue_media, venue_managers, notifications, payments, reviews, favorites, user_activity_log, etc.
- **Storage:** venue-images, venue-videos buckets
- **RLS:** Enabled for all user/venue-specific tables
- **RPCs:** For draft, submission, approval, stats, etc.

### 6. Draft & Approval System
- **DraftService:** Save/recover incomplete venue listings
- **VenueSubmissionService:** Submit, update, delete, and approve venues
- **Admin/Owner flows:** Status, rejection reason, resubmission

### 7. Extensibility
- **Payments:** Table and logic ready for payment/invoice tracking
- **Advanced Unavailability:** Recurring/holiday support in venue_unavailability
- **Multi-Manager:** venue_managers table for shared management
- **Notifications:** Table for persistent in-app notifications
- **Activity Log:** user_activity_log for audit trail

### 8. Onboarding & Dev Notes
- All code changes and features are logged in /docs
- SQL schema and migrations in /database
- Use shadcn/ui for all UI components
- All Supabase integration points are documented in sql_commands.md
- See LIST_MANAGE_VENUE_FLOW.md for page/feature flow
- Follow project rules for logging, naming, and security

---

## [2024-08-02] Venue Approval Workflow Implemented

- SuperAdminDashboard now fully supports venue approval/rejection with backend integration.
- Admins can view, approve, or reject venues and see status in real time.
- All actions are logged and UI is updated accordingly.

---

# End of MVP Documentation 