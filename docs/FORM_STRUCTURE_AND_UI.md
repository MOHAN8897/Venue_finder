# Venue Submission Form Structure & UI Reference

This document describes the structure, fields, validation, and UI/UX notes for the Venue Submission Form, suitable for implementation with supabase-js + React.

---

## **Form Fields**

| Field             | Type      | Required | Validation/Notes                                  |
|-------------------|-----------|----------|--------------------------------------------------|
| venueName         | string    | Yes      | Min 3 chars, max 100                              |
| venueType         | string    | Yes      | Select from list (Event Hall, Hotel, etc.)        |
| address           | string    | Yes      | Full address                                      |
| locationLink      | string    | No       | Google Maps link                                  |
| website           | string    | No       | Valid URL                                         |
| description       | string    | Yes      | Min 20 chars, max 1000                            |
| mapEmbedCode      | string    | No       | Google Maps embed code                            |
| capacity          | number    | Yes      | > 0                                               |
| area              | number    | Yes      | > 0 (sq.ft)                                       |
| amenities         | string[]  | No       | List of amenity IDs                               |
| photos            | File[]    | Yes      | 1-10 images, jpg/png/webp, max 5MB each           |
| videos            | string[]  | No       | YouTube/Vimeo URLs                                |
| pricePerHour      | number    | No       | >= 0                                              |
| pricePerDay       | number    | No       | >= 0                                              |
| availability      | string[]  | No       | Days of week                                      |
| contactNumber     | string    | Yes      | Valid phone number                                |
| email             | string    | Yes      | Valid email address                               |
| company           | string    | No       | Company/Org name                                  |

---

## **UI/UX Notes**
- Multi-step form (can be single page for MVP)
- Show progress indicator (optional)
- Show validation errors inline
- Show clear success/error messages after submit
- Disable submit button while submitting
- Show image previews for uploaded photos
- Responsive/mobile-friendly layout

---

## **Supabase Table Mapping**
- Table: `public.venues`
- All fields map to columns (snake_case) in the table
- Images are uploaded to Supabase Storage (`venue-images` bucket), URLs saved in `image_urls` column
- Videos are saved as array of URLs

---

## **Example Minimal Payload**
```json
{
  "venue_name": "Grand Ballroom",
  "venue_type": "Event Hall",
  "address": "123 Main St, City, State, ZIP",
  "description": "Spacious event hall for weddings and conferences.",
  "capacity": 200,
  "area": 5000,
  "image_urls": ["https://..."],
  "contact_number": "+1 555-123-4567",
  "email": "owner@example.com",
  "user_id": "<uuid>",
  "owner_id": "<uuid>",
  "submitted_by": "<uuid>"
}
```

---

## **Implementation Notes**
- Use `@supabase/supabase-js` for all DB/storage operations
- Use React state or React Hook Form for form state/validation
- Use async/await for all Supabase calls
- Handle and display all errors
- Only allow submission if all required fields are valid

---

## **Next Steps**
- Use this doc as a reference to build the form in React + supabase-js
- You can create a new table if you want to test without affecting `public.venues` (let me know if you want a new table schema!) 