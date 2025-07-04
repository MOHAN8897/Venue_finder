# Errors and Fixes Log

## 2024-07-31
- **File corruption in EditVenue.tsx**: Fixed by deleting and recreating the file with valid UTF-8 code.
- **Infinite update loop in AuthContext.tsx**: Fixed by refactoring useEffect dependencies and logic.
- **Supabase 400 Bad Request**: Fixed by correcting the column name in the select query in Header.tsx.
- **ReferenceError: handleUserLogout is not defined**: Fixed by moving function definitions back to top-level in AuthContext.tsx.

## 2025-01-27 - SQL Syntax Error: get_venue_approval_details Function Fix

**Error:** `ERROR: 42601: syntax error at or near ".." LINE 1: create function public.get_venue_approval_details(venue_uuid uuid) ...`

**Root Cause:** The function definition had incomplete error handling and the original syntax was causing parsing issues when executed.

**Fix Applied:**
1. Created a corrected version of the `get_venue_approval_details` function with proper error handling
2. Added null checking for venue existence 
3. Improved the submitter details query with proper null handling using COALESCE
4. Added SECURITY DEFINER to ensure proper permissions
5. Updated both the standalone SQL file and sql_commands.md with the corrected function

**Files Modified:**
- `database/fixed_venue_approval_function.sql` (created)
- `database/sql_commands.md` (updated function definition)

**Testing:** Function should now execute without syntax errors and provide proper error handling for missing venues.

---

## Previous Entries
(Add any previous errors and fixes here) 