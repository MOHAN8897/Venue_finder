# Database Triggers

_Last updated: 2024-08-01_

## All Triggers (public schema)

```
CREATE TRIGGER on_preferences_completed AFTER INSERT OR UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_profile_status_on_preferences();
CREATE TRIGGER on_review_change AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();
CREATE TRIGGER trigger_assign_owner_id BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.assign_owner_id();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_reviews_updated_at BEFORE UPDATE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_venue_rating_on_review_delete AFTER DELETE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();
CREATE TRIGGER update_venue_rating_on_review_insert AFTER INSERT ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();
CREATE TRIGGER update_venue_rating_on_review_update AFTER UPDATE ON public.user_reviews FOR EACH ROW EXECUTE FUNCTION public.update_venue_rating();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

For full details, see `cloud_schema_dump.sql`. 