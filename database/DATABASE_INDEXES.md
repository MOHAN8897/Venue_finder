# Database Indexes

_Last updated: 2024-08-01_

## All Indexes (public schema)

```sql
CREATE INDEX IF NOT EXISTS idx_venues_approval_status ON public.venues(approval_status);
CREATE INDEX IF NOT EXISTS idx_venues_submitted_by ON public.venues(submitted_by);
CREATE INDEX IF NOT EXISTS idx_venues_approval_date ON public.venues(approval_date);
CREATE INDEX IF NOT EXISTS idx_venue_approval_logs_venue_id ON public.venue_approval_logs(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_approval_logs_admin_id ON public.venue_approval_logs(admin_id);
```

---

For full details, see `sql_commands.md`. 