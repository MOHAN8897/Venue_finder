# Venue Finder Project Overview

## Objective
A comprehensive Venue Submission and Management System for venue owners, admins, and users. The platform enables venue listing, booking, compliance, media management, messaging, notifications, and analytics.

## Tech Stack
- **Frontend:** React (TypeScript), Vite, shadcn/ui, Tailwind CSS, lucide-react, recharts, react-big-calendar, @dnd-kit/core, @dnd-kit/sortable
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Other:** ESLint, Sonner (toasts)

## Key Features
- Dynamic venue forms (config-driven)
- Owner dashboard with analytics, profile tracker, and media management
- Booking calendar and management
- Offers, compliance, and document uploads
- Messaging and notification system
- Admin and super-admin controls

## Mobile-First Design Philosophy
- **Primary Target**: Mobile devices are the main priority for this venue booking platform
- **Design Approach**: Mobile-first responsive design with touch-optimized interfaces
- **Performance**: Optimized for mobile loading speeds and data usage
- **User Experience**: Prioritizes mobile navigation, touch interactions, and mobile-specific features
- **Responsive Strategy**: Mobile → Tablet → Desktop progression in design and development

## Workflow
- Frontend-first: All UI built with placeholder data, then connected to backend
- All schema and code changes logged in markdown files
- Linting and code quality enforced
- GitHub used for version control and restore points
- Mobile-first optimization for all features and updates

## Directory Structure
- `src/` — Application source code
- `database/` — SQL and schema docs
- `docs/` — Project documentation and logs
- `misc/` — Temporary files

## Documentation
- All major changes, tasks, and errors are logged in dedicated markdown files in `docs/`.

## [2024-08-02] Venue Feature Tables & RLS Now Present

- All required tables for venue management, media, managers, notifications, and payments are now present in Supabase.
- RLS enabled for all new tables.
- See database/sql_commands.md for details.

## [2024-08-02] Supabase Integration State for Venue Features

- All major venue management, listing, and related features are connected to Supabase (CRUD, amenities, slots, approval, reviews, favorites, drafts, submission, activity logs, notifications, media, visibility, booking, revenue, compliance, messaging, performance dashboards).
- Data is pulled and pushed via direct queries and RPCs.
- Missing: advanced unavailability, media metadata, multi-manager support, in-app notification persistence, payment/invoice tracking, and RLS review for new tables.
- See TASK_COMPLETION_LOG.md for next steps and CODE_CHANGE_LOG.md for detailed audit. 