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

## Workflow
- Frontend-first: All UI built with placeholder data, then connected to backend
- All schema and code changes logged in markdown files
- Linting and code quality enforced
- GitHub used for version control and restore points

## Directory Structure
- `src/` — Application source code
- `database/` — SQL and schema docs
- `docs/` — Project documentation and logs
- `misc/` — Temporary files

## Documentation
- All major changes, tasks, and errors are logged in dedicated markdown files in `docs/`. 