# List Your Venue: Data Collection & Database Schema

This document describes what information is collected from users on the "List Your Venue" page and how it is stored in the database (`venues` table). It also explains the approval workflow and relevant database columns.

---

## 1. **Frontend: Venue Submission Form Fields**

The List Your Venue page collects the following information from users:

| Field Name         | Type         | Description/Example                |
|--------------------|--------------|------------------------------------|
| venueName          | string       | Venue name                         |
| venueType          | string       | Venue type/category (enum)         |
| address            | string       | Full address                       |
| website            | string       | Website URL (optional)             |
| description        | string       | Description of the venue           |
| capacity           | number       | Maximum capacity (optional)        |
| area               | number/text  | Area in sq ft/m2 (optional)        |
| amenities          | string[]     | List of amenities                  |
| photos             | File[]       | Venue images (uploaded to storage) |
| videos             | string[]     | Video URLs (optional)              |
| pricePerHour       | number       | Hourly price (optional)            |
| pricePerDay        | number       | Daily price (optional)             |
| availability       | string[]     | Available days/times (optional)    |
| contactNumber      | string       | Contact phone (optional)           |
| email              | string       | Contact email (optional)           |
| ownerName          | string       | Owner/manager name (optional)      |

**Note:** Some fields are required, others are optional. Images are uploaded to Supabase Storage and stored as URLs in the database.

---

## 2. **Backend: `venues` Table Columns**

The `venues` table in the database stores all submitted venue data. Key columns include:

| Column Name         | Type                | Description/Notes                                 |
|---------------------|---------------------|---------------------------------------------------|
| id                  | uuid (PK)           | Unique venue ID                                   |
| owner_id            | uuid                | User ID of the owner                              |
| name                | text                | Venue name                                        |
| description         | text                | Venue description                                 |
| type                | venue_type (enum)   | Venue type/category                               |
| address             | text                | Venue address                                     |
| city                | text                | City                                              |
| state               | text                | State                                             |
| pincode             | text                | Postal code                                       |
| latitude            | numeric             | Latitude (optional)                               |
| longitude           | numeric             | Longitude (optional)                              |
| images              | text[]              | Image URLs (array)                                |
| videos              | text[]              | Video URLs (array)                                |
| capacity            | integer             | Maximum capacity                                  |
| area                | text                | Area (sq ft/m2)                                   |
| dimensions          | text                | Dimensions (optional)                             |
| hourly_rate         | numeric             | Hourly price                                      |
| currency            | text                | Currency (default: INR)                           |
| rating              | numeric             | Average rating                                    |
| review_count        | integer             | Number of reviews                                 |
| status              | venue_status (enum) | Approval status: pending/approved/rejected        |
| verified            | boolean             | Is venue verified?                                |
| contact_name        | text                | Contact person name                               |
| contact_phone       | text                | Contact phone                                     |
| contact_email       | text                | Contact email                                     |
| created_at          | timestamp           | Submission date                                   |
| updated_at          | timestamp           | Last update date                                  |
| zip_code            | text                | Zip/postal code                                   |
| country             | text                | Country (default: India)                          |
| price_per_hour      | numeric             | Hourly price (duplicate for compatibility)        |
| price_per_day       | numeric             | Daily price (duplicate for compatibility)         |
| website             | text                | Website URL                                       |
| image_urls          | text[]              | Image URLs (duplicate for compatibility)          |
| is_approved         | boolean             | Is venue approved?                                |
| is_active           | boolean             | Is venue active?                                  |
| submitted_by        | uuid                | User ID who submitted the venue                   |
| approval_status     | text                | Approval status: pending/approved/rejected        |
| approval_date       | timestamp           | Date/time of approval                             |
| approved_by         | uuid                | Admin user ID who approved                        |
| rejection_reason    | text                | Reason for rejection (if any)                     |
| submission_date     | timestamp           | Date/time of submission                           |

**Note:** Some columns are for internal workflow (approval, status, admin actions).

---

## 3. **Approval Workflow**

- When a user submits a venue, it is stored in the `venues` table with `approval_status = 'pending'`.
- Super admins review submissions and set `approval_status` to `approved` or `rejected`.
- If approved, the user is promoted to owner and can manage their venue.
- If rejected, the user can update and resubmit.
- All actions are logged in the `venue_approval_logs` table for audit trail.

---

## 4. **Related Enums**

- `venue_status`: `'pending'`, `'approved'`, `'rejected'`, `'inactive'`
- `venue_type`: `'cricket-box'`, `'farmhouse'`, `'banquet-hall'`, `'sports-complex'`, `'party-hall'`, `'conference-room'`, etc.

---

## 5. **References**

- See `src/components/VenueListingForm.tsx` for form logic.
- See `database/cloud_schema_dump.sql` for full schema.
- See `database/sql_commands.md` for schema migrations and workflow. 