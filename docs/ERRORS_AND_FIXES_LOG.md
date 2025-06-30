# Errors and Fixes Log

## 2024-07-31
- **File corruption in EditVenue.tsx**: Fixed by deleting and recreating the file with valid UTF-8 code.
- **Infinite update loop in AuthContext.tsx**: Fixed by refactoring useEffect dependencies and logic.
- **Supabase 400 Bad Request**: Fixed by correcting the column name in the select query in Header.tsx.
- **ReferenceError: handleUserLogout is not defined**: Fixed by moving function definitions back to top-level in AuthContext.tsx.

## ...
_Add new entries for each error and its solution._ 