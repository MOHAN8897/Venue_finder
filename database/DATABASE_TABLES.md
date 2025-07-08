# Database Tables

_Last updated: 2024-08-01_

## All Tables (public schema)

```
CREATE TYPE public.venue_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.venues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type public.venue_type NOT NULL,
  user_id uuid NOT NULL,
  status public.venue_status NOT NULL DEFAULT 'pending',
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone
);

-- (Repeat for all tables: admin_logs, amenities, auth_logs, bookings, contact_messages, email_templates, favorites, password_reset_tokens, profiles, reviews, super_admin_credentials, user_bookings, user_favorites, user_preferences, user_reviews, venue_amenities, venue_approval_logs, venue_slots)
```

---

For full details, see `cloud_schema_dump.sql`. 