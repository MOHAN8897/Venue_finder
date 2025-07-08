# Performance Refactor Tasks

## Performance Budgets (2025-06-30)
- Main JS bundle: **< 250KB gzipped** (current: ~447KB gzipped)
- Main CSS bundle: **< 30KB gzipped** (current: ~13.7KB gzipped)
- Largest single JS chunk: **< 150KB gzipped**
- Home page load time: **< 1.5s** on 3G/slow 4G
- API response time: **< 300ms** for all main endpoints
- Time to Interactive: **< 2s**
- Cumulative Layout Shift: **< 0.1**
- Largest Contentful Paint: **< 2.5s**

## Largest Bundle Contributors (2025-06-30)
- `react-dom` (~131KB minified)
- `react` core
- `@remix-run/router`, `react-router`, `react-router-dom`
- Many small icon modules from `lucide-react`
- Charting libraries (if used)
- No single huge dependency, but icons and routing libraries add up

## Objective
Refactor and optimize the entire codebase to meet the project's performance and code quality standards. This includes bundle size, load time, efficient React patterns, database optimization, and more.

---

## Task Checklist

- [ ] **Audit bundle size and set performance budgets**
  - [x] Use Vite's build output and source-map-explorer to analyze JS/CSS bundle
  - [ ] Set clear targets (e.g., main bundle < 250KB gzipped)
  - [ ] Identify/document largest contributors to bundle size

- [ ] **Run Lighthouse/Web Vitals on all main pages**
  - [ ] Run Lighthouse on Home, Dashboard, Venue List, Booking, Owner Dashboard, etc.
  - [ ] Record scores for Performance, Accessibility, Best Practices, SEO
  - [ ] Note any "red" or "yellow" flags for follow-up

- [ ] **Identify and optimize large/unused dependencies**
  - [ ] List all dependencies in package.json
  - [ ] Remove unused packages
  - [ ] Replace heavy libraries with lighter alternatives if possible
  - [ ] Use dynamic imports for rarely-used features

- [ ] **Implement code splitting and lazy loading**
  - [ ] Use React.lazy and Suspense for large pages/components
  - [ ] Split vendor and app code in Vite config
  - [ ] Test initial load and navigation

- [ ] **Optimize images and assets**
  - [ ] Convert all static images to WebP or AVIF
  - [ ] Compress images before upload
  - [ ] Use responsive <img srcSet> for different device sizes
  - [ ] Serve images/assets via CDN (Supabase Storage, Vercel, or Netlify)
  - [ ] Audit for unoptimized SVGs/icons

- [ ] **Audit and optimize Supabase queries**
  - [ ] Review all .from(...).select(...) queries for unnecessary data fetching
  - [ ] Replace N+1 query patterns with joins or batch requests
  - [ ] Add missing indexes on frequently filtered columns
  - [ ] Add pagination to all endpoints that return lists
  - [ ] Document schema/index changes in database log

- [ ] **Refactor React components for efficiency**
  - [ ] Use React.memo, useMemo, and useCallback to prevent unnecessary re-renders
  - [ ] Virtualize large lists (e.g., bookings, venues) with react-window or similar
  - [ ] Clean up all useEffect hooks to avoid memory leaks
  - [ ] Remove inline functions/objects in render that cause re-renders

- [ ] **Add error and performance monitoring**
  - [ ] Integrate Sentry or similar for frontend error tracking
  - [ ] Enable and monitor Supabase logs for slow queries and errors
  - [ ] Set up alerts for critical errors or performance regressions

- [ ] **Add/optimize unit and integration tests**
  - [ ] Write tests for all performance-critical flows (auth, booking, payments, dashboard)
  - [ ] Use Jest and React Testing Library
  - [ ] Ensure at least 80% test coverage
  - [ ] Add tests for any bugfixes or refactors

- [ ] **Document all changes**
  - [ ] Log every optimization, refactor, and bugfix in CODE_CHANGE_LOG.md and PERFORMANCE_REFACTOR_TASKS.md
  - [ ] Include before/after metrics (bundle size, Lighthouse scores, etc.) where possible

- [ ] **Continuous improvement**
  - [ ] Schedule regular (e.g., monthly) performance audits
  - [ ] Add new tasks as new bottlenecks or best practices emerge

---

## Progress Log

| Date | Update |
|------|--------|
|      | File created. Initial task list added. |
| 2024-08-01 | Ran Vite build. Main JS bundle: 1,528 KB (447 KB gzipped). CSS: 81 KB (13.7 KB gzipped). **Warning:** Some chunks > 500 KB. Need code splitting and bundle optimization. |

_Add new tasks and log entries as the refactor progresses._ 