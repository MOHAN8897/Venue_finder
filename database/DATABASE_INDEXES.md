# Database Indexes

_Last updated: 2024-08-01_

## All Indexes (public schema)

```
CREATE INDEX idx_admin_logs_admin_id ON public.admin_logs USING btree (admin_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs USING btree (created_at);
CREATE INDEX idx_auth_logs_attempt_type ON public.auth_logs USING btree (attempt_type);
CREATE INDEX idx_auth_logs_created_at ON public.auth_logs USING btree (created_at);
CREATE INDEX idx_auth_logs_email ON public.auth_logs USING btree (email);
CREATE INDEX idx_auth_logs_email_type ON public.auth_logs USING btree (email, attempt_type);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages USING btree (created_at);
CREATE INDEX idx_contact_messages_status ON public.contact_messages USING btree (status);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens USING btree (email);
CREATE INDEX idx_password_reset_tokens_email_used ON public.password_reset_tokens USING btree (email, used);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX idx_profiles_google_id ON public.profiles USING btree (google_id);
CREATE INDEX idx_profiles_profile_status ON public.profiles USING btree (profile_status);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);
CREATE INDEX idx_user_bookings_user_id ON public.user_bookings USING btree (user_id);
CREATE INDEX idx_user_bookings_venue_id ON public.user_bookings USING btree (venue_id);
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites USING btree (user_id);
CREATE INDEX idx_user_favorites_venue_id ON public.user_favorites USING btree (venue_id);
CREATE INDEX idx_user_preferences_completed ON public.user_preferences USING btree (completed);
CREATE INDEX idx_user_preferences_updated_at ON public.user_preferences USING btree (updated_at);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);
CREATE INDEX idx_user_reviews_rating ON public.user_reviews USING btree (rating);
CREATE INDEX idx_user_reviews_user_id ON public.user_reviews USING btree (user_id);
CREATE INDEX idx_user_reviews_venue_id ON public.user_reviews USING btree (venue_id);
CREATE INDEX idx_venues_approval_date ON public.venues USING btree (approval_date);
CREATE INDEX idx_venues_approval_status ON public.venues USING btree (approval_status);
CREATE INDEX idx_venues_submitted_by ON public.venues USING btree (submitted_by);
```

---

For full details, see `cloud_schema_dump.sql`. 