# Manage Your Venue Dashboard & My Venues Page: Full Context Blueprint

## 1. Overview
The **Manage Your Venue Dashboard** is the main interface for venue owners to manage, view, and update their venues. The **My Venues** page lists all venues owned by the user and provides access to management features, modals, and actions.

---

## 2. Component & Page Map
- **DashboardLayout** (`src/components/layout/DashboardLayout.tsx`): Main wrapper for dashboard pages.
- **MyVenuesPage** (`src/components/dashboard/MyVenuesPage.tsx`): Lists all venues for the logged-in owner.
- **VenueTable** (`src/components/dashboard/VenueTable.tsx`): Table/grid of venues with actions.
- **VenueDetailsModal** (`src/components/dashboard/VenueDetailsModal.tsx`): Modal for viewing venue details, with approve/reject/edit/view actions.
- **VenueEditPage** (`src/components/dashboard/VenueEditPage.tsx`): Full-page form for editing a venue.
- **VenueEditModal** (if used): Drawer/modal for editing venue details inline.
- **VenueListingForm** (`src/components/VenueListingForm.tsx`): Form for adding a new venue.
- **AmenitiesSection, PricingSection, AvailabilitySection**: Form subsections for specific fields.
- **Other UI Components**: Button, Input, Dialog, etc. from `src/components/ui/`.

---

## 3. Field-by-Field Data Model
### Venue Fields (Frontend/Backend)
| Field (Frontend)      | DB Column         | Type         | Validation/Notes                | Where Used                |
|----------------------|-------------------|--------------|---------------------------------|---------------------------|
| venue_name           | venue_name        | string       | required, unique                | Table, forms, modals      |
| venue_type           | venue_type        | string       | required, enum                  | Table, forms              |
| address              | address           | string       | required                        | Table, forms              |
| location_link        | location_link     | string/url   | optional, must be valid URL     | Details, forms            |
| website              | website           | string/url   | optional, must be valid URL     | Details, forms            |
| user_id              | user_id           | uuid         | owner, required                 | Backend only              |
| owner_id             | owner_id          | uuid         | owner, required                 | Backend only              |
| submitted_by         | submitted_by      | uuid         | submitter, required             | Backend only              |
| created_at           | created_at        | timestamp    | auto, read-only                 | Details                   |
| updated_at           | updated_at        | timestamp    | auto, read-only                 | Details                   |
| description          | description       | string       | required                        | Details, forms            |
| map_embed_code       | map_embed_code    | string       | optional, HTML/iframe           | Details, forms            |
| capacity             | capacity          | number       | required, >0                    | Details, forms            |
| area                 | area              | number       | required, >0                    | Details, forms            |
| amenities            | amenities         | string[]     | required, multi-select          | Details, forms            |
| photos               | photos            | string[]     | required, image URLs            | Details, forms            |
| features             | features          | string[]     | optional, tags                  | Details, forms            |
| status               | status            | string       | enum: pending/approved/rejected | Table, modals             |
| price_per_hour       | price_per_hour    | number       | optional, >=0                   | Details, forms            |
| price_per_day        | price_per_day     | number       | optional, >=0                   | Details, forms            |
| availability         | availability      | jsonb        | required, weekly schedule       | Details, forms, modals    |
| contact_number       | contact_number    | string       | required, phone validation      | Details, forms            |
| email                | email             | string       | required, email validation      | Details, forms            |

See also: [`docs/LIST_VENUE_FORM_STRUCTURE.md`](LIST_VENUE_FORM_STRUCTURE.md), [`docs/LIST_VENUE_DATA_AND_SCHEMA.md`](LIST_VENUE_DATA_AND_SCHEMA.md)

---

## 4. API/Data Flow
- **Fetching Venues:**
  - Uses Supabase client: `supabase.from('venues').select('*').eq('owner_id', user.id)`
  - Data mapped to Venue type for UI.
- **Updating Venues:**
  - On edit/save, sends update via Supabase: `supabase.from('venues').update(payload).eq('id', venueId)`
  - Handles validation and error feedback.
- **Adding Venues:**
  - Uses `VenueListingForm` to collect data, then inserts via Supabase.
- **Modals/Dialogs:**
  - Opened via local state (e.g., `showDetailsModal`, `showEditModal`).
  - Props: venue data, onClose, onSave, etc.
- **Storage:**
  - Images uploaded to Supabase Storage, URLs saved in `photos`.
- **Real-time Sync:**
  - Optionally uses Supabase subscriptions for live updates.

---

## 5. Modal/Dialog Structure
- **VenueDetailsModal**: Shows all venue fields, actions for approve/reject/edit/view.
- **VenueEditModal/Page**: Form for editing all fields, validation, and save.
- **AvailabilitySection**: Weekly schedule (days, open/close times, toggles).
- **Open/Close Logic:**
  - Controlled by local state in parent (e.g., `useState`).
  - Props: venue, onClose, onSave, etc.

---

## 6. User Roles & Permissions
- **Venue Owner:** Can view, edit, and manage their own venues.
- **Super Admin:** Can view all venues, approve/reject, and manage status.
- **Role Checks:** UI and API enforce permissions (see `src/context/AuthContext.tsx`).

---

## 7. UI/UX Patterns
- **Navigation:** Sidebar, topbar, tabbed sections.
- **Feedback:** Toasts, error messages, loading spinners.
- **Validation:** Inline errors, required fields, type checks.
- **Loading States:** Shown while fetching or saving data.
- **Accessibility:** Labels, focus management, ARIA roles.

---

## 8. Example Code Snippets
### Fetch Venues
```ts
const { data, error } = await supabase.from('venues').select('*').eq('owner_id', user.id);
```
### Update Venue
```ts
await supabase.from('venues').update(updatePayload).eq('id', venueId);
```
### Open Modal
```ts
const [showDetails, setShowDetails] = useState(false);
<button onClick={() => setShowDetails(true)}>View</button>
{showDetails && <VenueDetailsModal venue={venue} onClose={() => setShowDetails(false)} />}
```

---

## 9. Related Docs & Cross-References
- [Form Structure](LIST_VENUE_FORM_STRUCTURE.md)
- [Data & Schema](LIST_VENUE_DATA_AND_SCHEMA.md)
- [Component Map](CODEBASE_COMPONENTS_AND_PAGES.md)
- [Tech Stack](PROJECT_TECH_STACK.md)
- [Setup Guide](SETUP_GUIDE.md)
- [Project Overview](PROJECT_OVERVIEW.md)

---

## 10. Business Rules, Edge Cases, Special Logic
- **Status Workflow:** Venues start as pending, must be approved by admin.
- **Availability:** Must set at least one available day when editing/creating.
- **Unique Names:** Venue names must be unique per owner.
- **Image Upload:** Only valid image types, size limits enforced.
- **Role Enforcement:** Only owners can edit their venues; only admins can approve/reject.
- **Validation:** All required fields must be filled before save.

---

## 11. Extensibility, Testing, Performance
- **Extensible:** Add new fields by updating schema, forms, and modals.
- **Testing:** Uses Jest/React Testing Library for unit tests; see `__tests__`.
- **Performance:** Optimized queries, lazy loading, code splitting, image optimization.
- **Monitoring:** Use Supabase logs, Sentry for error/performance tracking.

---

## 12. How to Recreate
- Follow the component/page map and data model.
- Implement Supabase queries as shown.
- Use the UI/UX patterns and validation rules.
- Reference related docs for deeper details.

---

## 13. Component API Tables
### Example: VenueDetailsModal
| Prop         | Type     | Description                       |
|--------------|----------|-----------------------------------|
| venue        | Venue    | Venue object to display           |
| isOpen       | boolean  | Whether the modal is open         |
| onClose      | () => void | Close handler                   |
| onAction     | (action: string) => void | Approve/Reject/Edit |

_Repeat for all major components: VenueTable, VenueEditPage, VenueEditModal, etc._

---

## 14. Validation Table
| Field           | Validation Rule                        | Sample Error Message                |
|-----------------|----------------------------------------|-------------------------------------|
| venue_name      | Required, unique                       | "Venue name is required"           |
| email           | Required, valid email                  | "Please enter a valid email"       |
| price_per_hour  | Optional, number >= 0                  | "Price must be a positive number"  |
| amenities       | Required, at least 1 selected          | "Select at least one amenity"      |
| ...             | ...                                    | ...                                 |

---

## 15. Wireframes/Diagrams
- _Insert wireframes or screenshots for:_
  - My Venues Page
  - Venue Table
  - VenueDetailsModal
  - VenueEditPage/Modal
  - Availability Dialog

---

## 16. SQL Schema Reference
```sql
-- venues table schema (example)
CREATE TABLE public.venues (
  id uuid PRIMARY KEY,
  venue_name text NOT NULL,
  description text NOT NULL,
  address text NOT NULL,
  price_per_hour numeric,
  price_per_day numeric,
  capacity integer,
  amenities text[],
  photos text[],
  owner_id uuid NOT NULL,
  status text NOT NULL,
  map_embed_code text,
  availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

---

## 17. Edge Cases & Handling
- Venue deleted while being edited: Show error and redirect.
- Image upload fails: Show toast, allow retry.
- Duplicate venue name: Show inline error.
- API/network error: Show error message, prevent save.
- No venues found: Show empty state message.
- ...

---

## 18. Theme/Style Guide
- **Color Palette:** _List primary, secondary, accent, background, text colors._
- **Fonts:** _List font families, sizes, weights._
- **Component Library:** Uses shadcn/ui for all UI elements. Custom components extend shadcn/ui base.
- **Button Styles:** _Describe primary, secondary, disabled, etc._
- **Spacing & Layout:** _Describe grid/gap/margin conventions._

---

## 19. Sample Data
### Example Venue JSON
```json
{
  "id": "uuid-123",
  "venue_name": "Sunset Hall",
  "description": "A beautiful event space...",
  "address": "123 Main St",
  "price_per_hour": 100,
  "capacity": 200,
  "amenities": ["WiFi", "Parking"],
  "photos": ["url1", "url2"],
  "owner_id": "user-uuid",
  "status": "pending",
  "map_embed_code": "<iframe ...>",
  "availability": {"monday": {"start": "09:00", "end": "18:00", "available": true}},
  "created_at": "2024-08-02T12:00:00Z"
}
```
### Example SQL Insert
```sql
INSERT INTO public.venues (id, venue_name, description, address, price_per_hour, capacity, amenities, photos, owner_id, status, map_embed_code, availability, created_at)
VALUES ('uuid-123', 'Sunset Hall', 'A beautiful event space...', '123 Main St', 100, 200, ARRAY['WiFi','Parking'], ARRAY['url1','url2'], 'user-uuid', 'pending', '<iframe ...>', '{"monday": {"start": "09:00", "end": "18:00", "available": true}}', now());
```

---

## 20. Test Case Examples
### Jest/RTL Example: Venue Table Renders
```js
import { render, screen } from '@testing-library/react';
import VenueTable from './VenueTable';

test('renders venue table with venues', () => {
  render(<VenueTable venues={[{ venue_name: 'Sunset Hall', ... }]} />);
  expect(screen.getByText('Sunset Hall')).toBeInTheDocument();
});
```
_Repeat for modals, forms, error states, etc._

---

## 21. Extensibility Guide
**How to add a new field (e.g., "venue_category")**
1. Update the SQL schema to add the new column.
2. Update the data model in frontend types.
3. Add the field to forms (VenueEditPage, VenueListingForm).
4. Add validation and error messages.
5. Update modals and tables to display the new field.
6. Add to Supabase queries (select, insert, update).
7. Add tests for the new field.

---

This file, together with the linked documentation, provides a complete blueprint for recreating the Manage Your Venue dashboard and My Venues page from scratch, with all fields, flows, and business logic. 