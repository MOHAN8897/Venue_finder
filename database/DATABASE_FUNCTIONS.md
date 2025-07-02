# Database Functions

_Last updated: 2024-08-01_

## All Functions (public schema)

_No venue submission functions currently exist for the minimal venues table._

```
-- Example:
CREATE FUNCTION public.approve_venue(venue_uuid uuid, admin_notes text DEFAULT NULL::text) RETURNS jsonb ...
CREATE FUNCTION public.assign_owner_id() RETURNS trigger ...
CREATE FUNCTION public.authenticate_demo_user(user_email text, user_password text) RETURNS boolean ...
-- (See cloud_schema_dump.sql for all function bodies)
```

---

For full function bodies, see `cloud_schema_dump.sql`. 