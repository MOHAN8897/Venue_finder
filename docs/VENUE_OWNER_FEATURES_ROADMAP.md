# Venue Owner Features: Implementation Roadmap

## 🚀 **Project Overview**
**Purpose**: To implement a comprehensive suite of advanced features for venue owners, enhancing their ability to manage, monitor, and monetize their listings on the platform.
**Last Updated**: 2024-07-31
**Overall Status**: 📋 **Planning**

---

## 🗺️ **Implementation Phases & Tasks**

This project is divided into five phases, starting with foundational enhancements and progressing to monetization and compliance features.

### **Phase 1: Foundational Enhancements (Editing & Core Management)**
**Status**: 📋 **Pending**
**Goal**: To upgrade the core venue management experience with intelligent editing, robust visibility controls, and a comprehensive audit trail system.

- **Task 1.1: Advanced Venue Editing System** `[Pending]`
  - [ ] Implement dynamic form in `EditVenue.tsx` based on `venue_type`.
  - [ ] Add venue-type-specific validation logic.
  - [ ] Differentiate between minor and major edits.
  - [ ] On major edits, update backend to set status to 'Pending Review' and notify admin.
  - [ ] Integrate with the new Activity Log system to track all changes.

- **Task 1.2: Advanced Venue Visibility Management** `[Pending]`
  - [ ] Integrate `VenueVisibilityToggle.tsx` into the `ManageVenues.tsx` page.
  - [ ] Implement backend logic to filter public queries based on visibility status.
  - [ ] Add new feature for setting temporary unavailability (dates) and auto-reactivation.
  - [ ] Integrate with Activity Log system to record all visibility changes.

- **Task 1.3: Advanced Activity Log & Audit System** `[Pending]`
  - [ ] Create a new `activity_logs` table for detailed, field-level change tracking.
  - [ ] Develop a backend logging service (`logActivity()`) to be called from various services.
  - [ ] Design the UI for viewing and filtering activity logs within the owner dashboard.

- **Task 1.4: Venue Media Management** `[Pending]`
  - [ ] Build UI in `EditVenue.tsx` for adding, replacing, and removing media.
  - [ ] Implement drag-and-drop reordering for photos and setting a cover image.
  - [ ] Enforce media limits and format validation on the frontend.
  - [ ] Log all media changes in the Activity Log system.

---

### **Phase 2: Owner Engagement & Insights**
**Status**: 📋 **Pending**
**Goal**: To empower owners with data-driven insights and tools to improve their listing's performance and build trust with users.

- **Task 2.1: Performance Dashboard (Real Data & Charts)** `[Pending]`
  - [ ] Develop owner-specific backend functions to fetch booking, view, and revenue stats.
  - [ ] Implement a `views` counter on the `venues` table and an API to increment it.
  - [ ] Integrate a charting library (e.g., Recharts) to visualize data.
  - [ ] Connect the `VenuePerformanceDashboard.tsx` component to live data.
  - [ ] Implement CSV/PDF export functionality.

- **Task 2.2: Rating & Reviews Management** `[Pending]`
  - [ ] Add `owner_reply` functionality to the reviews system.
  - [ ] Create UI for owners to submit replies.
  - [ ] Develop an admin interface for review moderation.

- **Task 2.3: Profile Completion Tracker** `[Pending]`
  - [ ] Design and implement a UI component to show a completion percentage.
  - [ ] Create backend logic to calculate profile completeness based on key fields.
  - [ ] Provide actionable suggestions for owners to improve their listing.

---

### **Phase 3: Booking & Availability Management**
**Status**: 📋 **Pending**
**Goal**: To provide sophisticated tools for managing when and how a venue can be booked, reducing conflicts and manual effort.

- **Task 3.1: Booking Slot/Availability Calendar** `[Pending]`
  - [ ] Create a `venue_availability` table to store available/unavailable dates and time slots.
  - [ ] Integrate a calendar component (e.g., `react-day-picker`) into the owner dashboard.
  - [ ] Implement logic to prevent overlapping bookings at both frontend and backend levels.
  - [ ] Add support for creating recurring unavailability blocks.

- **Task 3.2: Automated Booking Approval System** `[Pending]`
  - [ ] Extend `venues` table with `auto_approve_bookings` settings.
  - [ ] Build a UI for owners to configure auto-approval rules (e.g., based on payment, group size).
  - [ ] Update the booking creation process to check and apply these rules.
  - [ ] Ensure booking logs clearly indicate automated vs. manual approvals.

---

### **Phase 4: Monetization & Communication**
**Status**: 📋 **Pending**
**Goal**: To introduce features that help owners increase their revenue and communicate effectively with platform administrators.

- **Task 4.1: Venue Discounts & Promotions** `[Pending]`
  - [ ] Create a `discounts` table linked to venues.
  - [ ] Develop a UI for owners to create and manage discount codes.
  - [ ] Integrate discount application logic into the booking flow.
  - [ ] Track discount usage and reflect it in the performance dashboard.

- **Task 4.2: Revenue & Earnings Overview** `[Pending]`
  - [ ] Build a dedicated section in the owner dashboard for financial reporting.
  - [ ] Create backend functions to calculate and break down revenue from bookings.
  - [ ] Add payout status tracking (assuming platform handles payments).
  - [ ] Implement export functionality for revenue reports.

- **Task 4.3: Owner-Admin Messaging System** `[Pending]`
  - [ ] Design and create database tables for `conversations` and `messages`.
  - [ ] Build a secure, real-time messaging UI for both owners and admins.
  - [ ] Implement file attachment support.

---

### **Phase 5: Compliance & Notifications**
**Status**: 📋 **Pending**
**Goal**: To ensure venue compliance and keep owners informed with a powerful notification system.

- **Task 5.1: Venue Compliance & Document Upload** `[Pending]`
  - [ ] Create a `venue_documents` table to track uploaded documents and their status.
  - [ ] Build a secure UI for owners to upload documents.
  - [ ] Develop an admin interface for document verification.
  - [ ] Implement reminders for expiring documents.

- **Task 5.2: Advanced Notification System** `[Pending]`
  - [ ] Create a `notifications` table in the database.
  - [ ] Use Supabase Realtime to push in-app notifications.
  - [ ] Build a notification center/panel in the UI with filtering options.
  - [ ] Add a section in user settings for customizable email notification preferences.

---

### **Cross-Cutting Concerns**
- **Multi-Venue Dashboard Switching** `[Ongoing]`
  - [ ] The existing `MultiVenueSelector.tsx` will be enhanced with search functionality.
  - [ ] It will be integrated into all new dashboard pages to ensure seamless switching and data isolation between venues. 