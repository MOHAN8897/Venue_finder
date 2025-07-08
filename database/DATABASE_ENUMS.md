# Database Enums (Types)

_Last updated: 2024-08-01_

```
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE public.user_role AS ENUM ('user', 'owner', 'admin', 'super_admin');
CREATE TYPE public.venue_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');
CREATE TYPE public.venue_type AS ENUM ('cricket-box', 'farmhouse', 'banquet-hall', 'sports-complex', 'party-hall', 'conference-room');
```

---

- **booking_status**: Status of a booking.
- **payment_status**: Status of a payment.
- **user_role**: Role of a user in the system.
- **venue_status**: Status of a venue in the approval process.
- **venue_type**: Type/category of venue. 