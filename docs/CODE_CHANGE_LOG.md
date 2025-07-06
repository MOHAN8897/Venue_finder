# Code Change Log

## 2024-07-31
- Initial project setup, Vite + React + Supabase
- Added dynamic venue form config (`src/config/venueTypes.ts`)
- Built Owner Dashboard and all major UI components
- Integrated shadcn/ui, recharts, dnd-kit, react-big-calendar
- Refactored EditVenue.tsx to fix encoding and logic bugs
- Fixed infinite update loop in AuthContext.tsx
- Fixed Supabase query bug in Header.tsx
- Organized codebase into `src/`, `database/`, `docs/`, `misc/`

## [2025-06-30] Performance Refactor: Code Splitting with React.lazy/Suspense
- Refactored `src/App.tsx` to use `React.lazy` and `Suspense` for all major page imports.
- Added `LoadingSpinner` as fallback for lazy-loaded routes.
- This enables code splitting and reduces initial JS bundle size, improving load performance.
- Part of ongoing performance optimization initiative.

## [2025-06-30] Dependency Audit & React Performance Optimization Initiated
- Audited all dependencies in `package.json` for unused or heavy packages.
- Searched for large lists and array operations in components/pages to identify candidates for React.memo/useMemo/useCallback optimizations.
- Next: Remove unused dependencies, suggest lighter alternatives, and apply React performance patterns to large lists and dashboard components.
- This is part of the ongoing performance optimization initiative.

## [2025-06-30] Removed Material UI (MUI) and Related Dependencies
- Searched the codebase for all usages of MUI components and icons.
- Removed all MUI and related dependencies (`@mui/material`, `@mui/icons-material`, `@mui/lab`, `@mui/x-data-grid`, `@emotion/react`, `@emotion/styled`).
- Replaced MUI components in VenueList, UserSettings, and AdminLayout with shadcn/ui or native equivalents.
- This reduces bundle size and improves performance as part of the ongoing optimization initiative.

## [2025-06-30] React Performance Refactor: VenueList
- Refactored `VenueList` to use `React.memo` for the venue card component.
- Used `useMemo` for the filtered venues array.
- Used `useCallback` for the favorite toggle handler.
- Improved performance for large lists and reduced unnecessary re-renders.
- Part of the ongoing performance optimization initiative.

## [2025-06-30] React Performance Refactor: UserBookings
- Refactored `UserBookings` to use `React.memo` for the booking card component.
- Used `useMemo` for the bookings array.
- Used `useCallback` for status and formatting helpers.
- Fixed all linter errors and ensured correct property usage for booking dates.
- Improved performance for large booking lists and reduced unnecessary re-renders.
- Part of the ongoing performance optimization initiative.

## [2025-06-30] React Performance Refactor: UserFavorites
- Refactored `UserFavorites` to use `React.memo` for the favorite card component.
- Used `useMemo` for the favorites array.
- Used `useCallback` for the remove favorite handler.
- Improved performance for large favorite lists and reduced unnecessary re-renders.
- Part of the ongoing performance optimization initiative.

## [2025-06-30] React Performance Refactor: ReviewManagement
- Refactored `ReviewManagement` to use `React.memo` for the review item component.
- Used `useMemo` for the reviews array.
- Used `useCallback` for reply handlers and state setters.
- Fixed all linter errors and ensured correct prop typing.
- Improved performance for large review lists and reduced unnecessary re-renders.
- Part of the ongoing performance optimization initiative.

## [2025-06-30] React Performance Refactor: NotificationPanel
- Refactored `NotificationPanel` to use `React.memo` for the notification item component.
- Used `useMemo` for the notifications array and unread count.
- Used `useCallback` for the mark-all-as-read handler.
- Fixed all linter errors and ensured correct JSX structure.
- Improved performance for large notification lists and reduced unnecessary re-renders.
- Part of the ongoing performance optimization initiative.

## [2025-06-30] React Performance Refactor: MultiVenueSelector
- Refactored `MultiVenueSelector` to use `React.memo` for the venue list item component.
- Used `useMemo` for the venues array and selected venue.
- Used `useCallback` for the venue select handler.
- Improved performance for large venue lists and reduced unnecessary re-renders.
- Part of the ongoing performance optimization initiative.

## [2025-06-30] React Performance Refactor: MessagingInterface
- Refactored `MessagingInterface` to use `React.memo` for the conversation list item and message bubble components.
- Used `useMemo` for the conversations and messages arrays.
- Used `useCallback` for conversation selection and send message handlers.
- Improved performance for large conversation/message lists and reduced unnecessary re-renders.
- Part of the ongoing performance optimization initiative.

## [2025-06-30] React Performance Refactor: OfferManager
- Refactored `OfferManager` to use `React.memo` for the offer card component.
- Used `useMemo` for the offers array.
- Used `useCallback` for the create offer handler.
- Improved performance for large offer lists and reduced unnecessary re-renders.
- Part of the ongoing performance optimization initiative.

## [2024-08-01] Automatic WebP Conversion for All Image Uploads
- Implemented in-browser conversion of all uploaded images (venue images, user avatars, etc.) to WebP format before uploading to Supabase storage.
- Updated VenueMediaManager, venueSubmissionService, and userService to ensure only WebP images are uploaded for optimal website loading speed and storage efficiency.
- Used Canvas API for conversion; original format is not stored.
- This change improves frontend and backend performance, reduces bandwidth, and ensures modern browser compatibility.

## [2024-08-02] Supabase Integration Audit for Venue Features

- Analyzed all venue-related pages and components (ListVenue, ManageVenues, and dependencies).
- Mapped all Supabase interactions (fetch, push, update, delete) for venue CRUD, amenities, slots, approval, reviews, favorites, drafts, submission, activity logs, notifications, media, visibility, booking, revenue, compliance, messaging, and performance dashboards.
- Confirmed all major data flows are connected to Supabase via RPCs or direct queries.
- Identified missing features: advanced unavailability, media metadata, multi-manager support, in-app notification persistence, payment/invoice tracking, and RLS review for new tables.
- Logged next steps in TASK_COMPLETION_LOG.md.

## [2024-08-02] Created Venue Feature Tables & RLS

- Created tables: venue_unavailability, venue_media, venue_managers, notifications, payments.
- Enabled RLS for all new tables with appropriate access restrictions.
- Documented all SQL and context in database/sql_commands.md.
- These changes support advanced unavailability, media metadata, multi-manager, notification, and payment features for venues.

## [2024-08-02] Venue Approval System - Gap Analysis & Implementation Plan

- Identified missing approve/reject logic in SuperAdminDashboard.
- No frontend calls to backend approval/rejection functions or audit logging.
- No notification logic for venue status changes.
- Plan: Add approve/reject buttons, call Supabase RPCs, log actions, notify users, and update UI in real time.
- See TASK_COMPLETION_LOG.md and LIST_MANAGE_VENUE_FLOW.md for details.

## [2024-08-02] Venue Approval Workflow Implemented in SuperAdminDashboard

- Implemented fetching and display of pending, approved, and rejected venues.
- Added Approve/Reject buttons and integrated with Supabase backend functions.
- UI updates in real time and handles errors/success.
- See TASK_COMPLETION_LOG.md and LIST_MANAGE_VENUE_FLOW.md for details.

## [2024-08-02] Venue Media & Amenities DB Integration
- Updated ListVenue and VenueSubmissionService to save all uploaded images/videos to venue_media table with default metadata structure.
- Facilities/amenities are now saved to venue_amenities table (and amenities table if new).
- Linter errors fixed for new logic.

## [2024-08-02] Improved Media Upload Error Handling
- VenueSubmissionService.uploadFiles now returns per-file success/error results instead of throwing.
- ListVenue page now shows upload errors in the UI and prevents submission if any upload fails.
- Added instructions for creating/configuring public buckets (venue-images, venue-videos) in Supabase Storage.

## [2024-08-02] Image/Video Upload UI Fix & Linter Error Correction
- Fixed ListVenue page so clicking Add Image/Add Video now opens the file picker (used refs and onClick on the card).
- Root cause: file input was hidden and not triggered by UI, so user could not upload files.
- Fixed linter errors in progress bar step comparison (ensured correct type usage).
- ListVenue page now allows users to upload images and videos as expected.

## [2024-08-02] Improved Error Handling for Venue Submission
- ListVenue page now always stops loading and displays backend error messages if submission fails.
- Added type-safe error extraction in the catch block.
- This helps diagnose and fix issues where venue data is not saved to the database.

## [2024-08-01] Fixed venue submission type errors by:
- Updating the frontend to preprocess and coerce all numeric/enum fields before submission.
- Creating/updating the `submit_venue` function in Supabase to cast all fields to the correct types and handle empty strings/nulls robustly.
- All changes applied and tested via MCP.

## [2024-08-01] Frontend: Updated ListVenue page to call refreshUserProfile after successful venue submission, ensuring the dropdown and owner status update immediately.
- The success message now clearly tells the user they are a Venue Owner and can access the 'Manage Venues' page in their profile menu.

## [2024-08-01] Frontend: Updated OwnerDashboard, ManageVenues, and UserDashboard to always show all dashboard components, and display a clear 'No data available' message if no data is found. Removed early returns that hid the dashboard if data was missing. Fixed linter errors and ensured all data is loaded directly from the database.

## [2024-08-01] Backend: Verified and (re)applied all RLS policies, functions, triggers, and RPCs for dashboard and related pages to the Supabase database using the CLI (`supabase db push`). Ensured all required backend logic and security is in place for robust data access and storage.

## [2024-08-01] Fixed Venue Submission Flow and Eligibility Checks
- Removed automatic navigation timeout that was causing the success message to disappear too quickly.
- Added venue submission eligibility check on component mount.
- Implemented proper flow: first-time users can't submit another venue until their first is approved.
- Users with approved venues can submit additional venues.
- Added "Register Another Venue" button that only shows for eligible users.
- Success message now stays until user chooses to proceed.
- Added loading state while checking eligibility.
- Added error state for users who can't submit (pending venue without approved ones).
- Proper owner role management based on venue approval status.

## [2024-08-01] Fixed Infinite Loading Issue in List Your Venue Form
- Identified that the VenueSubmissionService was calling a non-existent `submit_venue` RPC function.
- Added the missing `submit_venue` RPC function to handle venue submission to the database.
- Added supporting RPC functions: `get_user_submitted_venues` and `get_user_venue_stats`.
- The form should now properly submit venues and show success message instead of infinite loading.
- All RPC functions are documented in sql_commands.md.

## [2024-08-01] Venue Submission & Super Admin Approval Workflow Overhaul
- Replaced legacy/conflicting venue approval schema with a clean, modern structure.
- Updated ENUMs for venue_type and venue_status.
- Recreated venues table with all required fields for listing, approval, and admin management.
- Added venue_approval_logs table for audit trail.
- Added/updated RLS policies for owners, super admins, and public access.
- Added triggers for updated_at.
- Added approval/rejection functions for super admin workflow.
- Ensured Supabase Storage integration for venue images.
- All changes documented in sql_commands.md.

## [2024-08-01] Venue Submissions Now Tagged with User Sign-in Email
- Added submitter_email column to venues table.
- Updated submit_venue function to fetch the user's email from profiles and save it in submitter_email for every new venue.
- Now you can search/filter all venue submissions by the user's sign-in email directly in the database.

## [2024-08-01] Added Helper RPC for Venue Submission Status
- Added get_user_venue_submission_status RPC function.
- Allows frontend to check if user has a pending, approved, rejected, or no venue submission.
- Enables correct UI/UX for venue submission restrictions and success flow.

## [2024-08-01] Profile Menu Logic: Show 'Manage Your Venues' Only for Approved Owners
- Updated Header.tsx to use the backend get_user_venue_submission_status helper.
- 'Manage Your Venues' now only appears in the profile menu if the user has at least one approved venue.
- Placed 'Manage Your Venues' above 'Settings' as required.
- Cleaned up unused state and imports to fix linter errors.

## [2024-08-01] Venue Submission Flow Refactor

- Updated `venues` table to minimal fields: id, name, type, user_id, status (enum: pending, approved, rejected).
- Added RLS policies to restrict insert/select to authenticated users and their own venues.
- Updated frontend (ListVenue.tsx) to:
  - Block resubmission if user has a pending venue.
  - Allow resubmission if rejected.
  - Allow additional submissions if approved.
  - Show appropriate messages for each case.
- All venue submissions are now tagged to the user's UUID.
- SQL commands used:
  - CREATE TYPE public.venue_status AS ENUM ('pending', 'approved', 'rejected');
  - ALTER TABLE public.venues ADD COLUMN status public.venue_status NOT NULL DEFAULT 'pending';
  - ALTER TABLE public.venues ADD COLUMN user_id uuid NOT NULL;
  - ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
  - CREATE POLICY ... (see DATABASE_POLICIES.md)
- All changes tested and verified in Supabase and frontend.

## [2024-08-01] Venue Approval/Rejection Timestamps

- Added approved_at and rejected_at columns to venues table for tracking approval/rejection times.
- Updated Super Admin dashboard to display and update these timestamps when status changes.

## [2024-08-01 19:30] Comprehensive Venue Approval, Owner Management, and Logging System Migration

- Added/ensured all required columns in `venues` and `profiles` for approval, audit, and owner management.
- Created/ensured `venue_approval_logs` and `super_admin_credentials` tables.
- Added/ensured all necessary indexes for fast lookup on approval and audit columns.
- Implemented/ensured RLS policies for venues, approval logs, and super admin credentials.
- Added/ensured triggers for owner promotion and venue audit.
- Added/ensured functions for approve, reject, delete, resubmit, and fetch activity logs for venues.
- Updated `sql_commands.md` as the single source of truth for all schema changes.
- See `database/sql_commands.md` for full SQL and explanations.

## ...
_Add new entries for each major change or bugfix._ 