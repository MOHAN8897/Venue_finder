# List Your Venue Submission Form: Structure & Context

This document provides a detailed breakdown of the multi-step "List Your Venue" submission form, including all fields, step-by-step structure, validation, and user experience context.

---

## 1. **Form Overview**

- The form is a multi-step wizard guiding users through all required information to submit a new venue for approval.
- Steps are:
  1. **Basic Details**
  2. **Description**
  3. **Specifications & Amenities**
  4. **Media (Photos & Videos)**
  5. **Pricing & Availability**
  6. **Contact Information**
- The form is only accessible to authenticated users. Submission is blocked if the user already has a pending or approved venue.

---

## 2. **Step-by-Step Breakdown**

### **Step 1: Basic Details**
- **Venue Name** (required)
- **Venue Type** (required, select from list: Event Hall, Conference Room, Wedding Venue, Restaurant, Hotel, Outdoor Space, Theater, Gallery, Sports Venue, Community Center)
- **Full Address** (required)
- **Website** (optional)

### **Step 2: Description**
- **Venue Description** (required, up to 1000 characters)
  - Prompt: "Describe your venue, amenities, ambiance, unique features, etc."

### **Step 3: Specifications & Amenities**
- **Capacity** (required, number)
- **Area** (required, number, sq.ft)
- **Amenities** (multi-select, grouped by category)
  - Categories: Basic Facilities, Technology & AV, Kitchen & Catering, Entertainment & Recreation, Furniture & Seating, Safety & Security, Accessibility & Special Needs, Outdoor & Garden, Transportation & Access, Premium Features
  - Each amenity has an icon and label (e.g., Wi-Fi, Parking, Air Conditioning, Sound System, Stage, Security, Wheelchair Access, etc.)

### **Step 4: Media (Photos & Videos)**
- **Venue Photos** (required, 3-10 images, JPG/PNG/WebP, max 5MB each)
- **Video URLs** (optional, YouTube/Vimeo links)
- **Guidelines**: Best practices and requirements for media are shown to the user.

### **Step 5: Pricing & Availability**
- **Price per Hour** (optional, number)
- **Price per Day** (optional, number)
- **Available Days** (multi-select: Monday-Sunday)
- **Pricing Tips**: Shown to help users set competitive rates.

### **Step 6: Contact Information**
- **Contact Number** (required, validated phone)
- **Email Address** (required, validated email)
- **Company/Organization** (optional)
- **Guidelines**: Shown to help users provide professional, responsive contact info.

---

## 3. **Validation & User Experience**

- **Required fields** are enforced at each step; users cannot proceed without completing them.
- **Validation** includes:
  - Email format check
  - Phone number format check
  - Minimum/maximum photo count and file size
  - Character limits on description
- **Progress**: Users see which step they are on and can review before submitting.
- **Submission**: Images are uploaded to Supabase Storage, and all data is sent to the `venues` table.
- **Status Dialogs**: If the user has a pending, approved, or rejected submission, a dialog explains their status and blocks or allows resubmission accordingly.

---

## 4. **Field Reference Table**

| Field Name         | Step         | Type         | Required | Notes/Validation                       |
|--------------------|--------------|-------------|----------|----------------------------------------|
| venueName          | Basic        | string      | Yes      |                                        |
| venueType          | Basic        | string      | Yes      | Select from predefined list            |
| address            | Basic        | string      | Yes      |                                        |
| website            | Basic        | string      | No       |                                        |
| description        | Description  | string      | Yes      | Max 1000 chars                         |
| capacity           | Specs        | number      | Yes      |                                        |
| area               | Specs        | number      | Yes      | sq.ft                                  |
| amenities          | Specs        | string[]    | No       | Multi-select, grouped by category      |
| photos             | Media        | File[]      | Yes      | 3-10 images, JPG/PNG/WebP, max 5MB     |
| videos             | Media        | string[]    | No       | YouTube/Vimeo links                    |
| pricePerHour       | Pricing      | number      | No       |                                        |
| pricePerDay        | Pricing      | number      | No       |                                        |
| availability       | Pricing      | string[]    | No       | Days of week                           |
| contactNumber      | Contact      | string      | Yes      | Validated phone                        |
| email              | Contact      | string      | Yes      | Validated email                        |
| ownerName/company  | Contact      | string      | No       |                                        |

---

## 5. **Context & UX Notes**

- The form is designed for clarity and ease of use, with tooltips, help text, and validation at every step.
- Users are guided to provide high-quality, complete information to maximize approval chances.
- The form is mobile-friendly and accessible.
- All data is stored securely and only visible to admins until approval.

---

## 6. **References**
- See `src/components/VenueListingForm.tsx` and `src/components/venue-form/` for implementation.
- See `docs/LIST_VENUE_DATA_AND_SCHEMA.md` for database mapping. 