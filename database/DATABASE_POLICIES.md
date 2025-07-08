# Database Row-Level Security (RLS) Policies

_Last updated: 2024-08-01_

## All Policies (public schema)

### Venues
- **Public can view approved venues:**
  ```sql
  CREATE POLICY "Public can view approved venues" ON public.venues
      FOR SELECT USING (approval_status = 'approved' AND is_active = true);
  ```
- **Owner can manage own venues:**
  ```sql
  CREATE POLICY "Owner can manage own venues" ON public.venues
      FOR UPDATE USING (submitted_by = auth.uid());
  ```
- **Owner can delete own venues:**
  ```sql
  CREATE POLICY "Owner can delete own venues" ON public.venues
      FOR DELETE USING (submitted_by = auth.uid());
  ```
- **Admins can approve/reject venues:**
  ```sql
  CREATE POLICY "Admins can approve/reject venues" ON public.venues
      FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')));
  ```

### Venue Approval Logs
- **Super admins can view all approval logs:**
  ```sql
  CREATE POLICY "Super admins can view all approval logs" ON public.venue_approval_logs
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin'));
  ```
- **Super admins can insert approval logs:**
  ```sql
  CREATE POLICY "Super admins can insert approval logs" ON public.venue_approval_logs
      FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin'));
  ```

### Super Admin Credentials
- **Super admin credentials are private:**
  ```sql
  CREATE POLICY "Super admin credentials are private" ON public.super_admin_credentials
      FOR ALL USING (false);
  ```

---

For full details, see `sql_commands.md` and this file. 