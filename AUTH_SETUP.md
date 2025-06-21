# Venue Finder - Authentication Setup Guide

This guide explains how to set up authentication for the Venue Finder application using Supabase.

## Features Implemented

### 1. Authentication Methods
- **Google OAuth**: Primary authentication method
- **Email/Password**: Traditional email and password authentication
- **Phone Number**: Optional phone number collection during signup

### 2. User Management
- Automatic user profile creation on signup
- Profile data synchronization with Supabase
- Session persistence across browser sessions
- Secure sign out functionality

### 3. Database Integration
- User profiles stored in `user_profiles` table
- Automatic data sync between auth and profile tables
- Row Level Security (RLS) for data protection

## Setup Instructions

### 1. Supabase Configuration

The application is already configured with your Supabase credentials:

```typescript
// src/lib/supabase.ts
const supabaseUrl = 'https://uledqmfntmblwreoaksi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWRxbWZudG1ibHdyZW9ha3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTU2MjEsImV4cCI6MjA2NjA3MTYyMX0.lwusINGkcdk8DZAClao4HYCLkfDriN3iDc9VY3Lqiz4';
```

### 2. Database Setup

Run the SQL commands from `SQL_README.md` in your Supabase SQL editor:

1. Create the `user_profiles` table
2. Set up Row Level Security policies
3. Create triggers for automatic profile creation
4. Set up indexes for performance

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://uledqmfntmblwreoaksi.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (for development)
6. Copy the Client ID and Client Secret
7. In Supabase Dashboard:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google Client ID and Client Secret

### 4. Environment Variables

Create a `.env.local` file in your project root:

```bash
VITE_SUPABASE_URL=https://uledqmfntmblwreoaksi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWRxbWZudG1ibHdyZW9ha3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0OTU2MjEsImV4cCI6MjA2NjA3MTYyMX0.lwusINGkcdk8DZAClao4HYCLkfDriN3iDc9VY3Lqiz4
```

## Application Structure

### 1. Authentication Context (`src/context/AuthContext.tsx`)
- Manages authentication state
- Provides auth functions to components
- Handles user profile synchronization
- Listens for auth state changes

### 2. Supabase Client (`src/lib/supabase.ts`)
- Supabase client configuration
- Auth helper functions
- User profile management functions

### 3. Sign In Page (`src/pages/SignIn.tsx`)
- Google OAuth button
- Email/password form
- Sign up/sign in toggle
- Error handling and validation

### 4. Header Component (`src/components/Header.tsx`)
- Shows user profile when logged in
- Sign in button when not authenticated
- Profile dropdown with sign out option
- Mobile-responsive design

### 5. Auth Callback (`src/pages/AuthCallback.tsx`)
- Handles OAuth redirects
- Processes authentication results
- Redirects to appropriate pages

## Usage

### 1. Sign In Process
1. User clicks "Sign In" in header
2. User chooses Google OAuth or email/password
3. For Google: Redirects to Google, then back to app
4. For email: Form validation and submission
5. User profile is created/updated in database
6. User is redirected to home page

### 2. User Profile Management
- Profile data is automatically synced with Supabase
- Users can update their profile information
- Data persists across sessions
- Profile is displayed in header

### 3. Sign Out
- User clicks profile dropdown
- Selects "Sign out"
- Session is cleared
- User is redirected to home page

## Security Features

### 1. Row Level Security (RLS)
- Users can only access their own data
- Profile data is protected
- Secure data access patterns

### 2. Session Management
- Secure session handling
- Automatic session refresh
- Proper session cleanup on sign out

### 3. Input Validation
- Email format validation
- Password strength requirements
- Phone number validation

## Data Flow

### 1. User Registration
```
User Sign Up → Supabase Auth → Trigger → Profile Creation → Database Sync
```

### 2. User Login
```
User Sign In → Supabase Auth → Session Creation → Profile Fetch → UI Update
```

### 3. Profile Updates
```
Profile Update → Database Update → Local State Update → UI Refresh
```

## Troubleshooting

### Common Issues

1. **Google OAuth not working**
   - Check redirect URIs in Google Console
   - Verify Supabase Google provider settings
   - Check browser console for errors

2. **Profile not created**
   - Verify database trigger is set up
   - Check Supabase logs for errors
   - Ensure RLS policies are correct

3. **Session not persisting**
   - Check browser storage settings
   - Verify Supabase session configuration
   - Check for JavaScript errors

### Debug Commands

```bash
# Check TypeScript errors
npx tsc --noEmit

# Run development server
npm run dev

# Build for production
npm run build
```

## Next Steps

1. **Email Verification**: Add email verification for new accounts
2. **Password Reset**: Implement password reset functionality
3. **Social Login**: Add more OAuth providers (Facebook, GitHub, etc.)
4. **Profile Management**: Add profile editing page
5. **Admin Panel**: Create admin interface for user management

## Support

For issues or questions:
1. Check the browser console for errors
2. Review Supabase logs in the dashboard
3. Verify all SQL commands were executed correctly
4. Test with different browsers and devices 