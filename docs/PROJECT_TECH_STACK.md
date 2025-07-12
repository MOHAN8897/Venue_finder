# Project Tech Stack & Main Components

This document summarizes the main languages, frameworks, and component libraries used to build the VenueFinder project.

---

## 1. **Core Language & Frameworks**

| Technology      | Version (if known) | Purpose/Usage                                      |
|----------------|--------------------|----------------------------------------------------|
| **TypeScript** | ^5.x               | Main language for all frontend code (typed JS)      |
| **React**      | ^18.x              | UI library for building components and SPA          |
| **Vite**       | ^6.x               | Build tool and dev server for fast React projects   |
| **Supabase**   | ^2.x               | Backend-as-a-Service: DB, Auth, Storage, API       |
| **PostgreSQL** | (via Supabase)     | Main database for all app data                     |

---

## 2. **Styling & UI Libraries**

| Technology         | Version (if known) | Purpose/Usage                                      |
|-------------------|--------------------|----------------------------------------------------|
| **Tailwind CSS**  | ^3.x               | Utility-first CSS framework for styling             |
| **shadcn/ui**     | ^0.9.x             | Headless, accessible React UI components (Radix UI) |
| **Radix UI**      | ^1.x               | Low-level primitives for accessible UI (via shadcn) |
| **Lucide React**  | ^0.344.x           | Icon library for modern SVG icons                   |
| **tailwindcss-animate** | ^1.x         | Animations for Tailwind components                  |

---

## 3. **Form & State Management**

| Technology             | Version (if known) | Purpose/Usage                                      |
|-----------------------|--------------------|----------------------------------------------------|
| **react-hook-form**   | ^7.x               | Form state management and validation                |
| **zod**               | ^3.x               | Schema validation for forms and API                 |
| **@tanstack/react-query** | ^5.x           | Data fetching, caching, and async state             |

---

## 4. **Other Major Libraries**

| Technology             | Version (if known) | Purpose/Usage                                      |
|-----------------------|--------------------|----------------------------------------------------|
| **@supabase/supabase-js** | ^2.x           | JS client for Supabase API, Auth, Storage           |
| **framer-motion**      | ^12.x              | Animation and motion for React                      |
| **d3-shape, recharts** | ^3.x               | Data visualization and charts                       |
| **date-fns**           | ^4.x               | Date utilities                                      |
| **sonner**             | ^2.x               | Toast notifications                                 |
| **cmdk**               | ^1.x               | Command palette UI                                  |

---

## 5. **Testing & Tooling**

| Technology             | Version (if known) | Purpose/Usage                                      |
|-----------------------|--------------------|----------------------------------------------------|
| **Jest**              | ^30.x              | Unit and integration testing                        |
| **@testing-library/react** | ^16.x          | React component testing                             |
| **ESLint**            | ^9.x               | Linting and code quality                            |
| **Babel**             | ^7.x               | JS/TS transpilation                                 |

---

## 6. **Project Structure**

- **Frontend:** React + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Functions)
- **Component Library:** shadcn/ui (built on Radix UI)
- **Styling:** Tailwind CSS (with custom theme)
- **Testing:** Jest, React Testing Library

---

## 7. **Notable Patterns & Practices**

- **Component-Driven:** All UI is built from reusable React components.
- **Headless UI:** shadcn/ui and Radix UI provide accessible, customizable primitives.
- **Type Safety:** TypeScript is used throughout for safety and maintainability.
- **Modern Build:** Vite enables fast dev/build cycles.
- **BaaS Backend:** Supabase handles DB, Auth, Storage, and serverless functions.
- **Utility-First CSS:** Tailwind enables rapid, consistent styling.

---

For more details, see:
- `package.json` (all dependencies)
- `README.md` (project overview)
- `tailwind.config.js` (theme)
- `src/components/ui/` (custom UI components) 