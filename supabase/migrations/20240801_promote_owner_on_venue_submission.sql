-- Promote user to owner on first venue submission
CREATE OR REPLACE FUNCTION public.promote_user_to_owner()
RETURNS TRIGGER AS promote_owner_on_venue_submission.sql
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = NEW.owner_id AND role != 'owner'
  ) THEN
    UPDATE public.profiles
    SET role = 'owner',
        owner_id = COALESCE(owner_id, 'OWNER_' || substr(NEW.owner_id::text, 1, 8)),
        owner_verified = false,
        owner_verification_date = NULL
    WHERE user_id = NEW.owner_id;
  END IF;
  RETURN NEW;
END;
promote_owner_on_venue_submission.sql LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_promote_user_to_owner ON public.venues;
CREATE TRIGGER trigger_promote_user_to_owner
AFTER INSERT ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.promote_user_to_owner();

