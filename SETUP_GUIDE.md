# 🚀 Complete Setup Guide for Venue Finder

This guide will walk you through setting up Google OAuth, email authentication, and the complete database for your Venue Finder application.

## 📋 Prerequisites

- ✅ Node.js installed (v16 or higher)
- ✅ npm or yarn installed
- ✅ Supabase account (free tier works)
- ✅ Google Cloud Console account (free)

## 🔧 Step 1: Supabase Project Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Choose a project name (e.g., "venue-finder")
4. Set a database password (save this!)
5. Choose a region close to you
6. Wait for project to be created (2-3 minutes)

### 1.2 Get Project Credentials
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

### 1.3 Create Environment File
Create a `.env.local` file in your project root:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🗄️ Step 2: Database Setup

### 2.1 Run SQL Commands
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire content from `SQL_README.md`
4. Click **Run** to execute all commands
5. Verify all tables are created in **Table Editor**

### 2.2 Verify Tables Created
Check that these tables exist:
- ✅ `user_profiles`
- ✅ `venues`
- ✅ `user_favorites`
- ✅ `user_reviews`
- ✅ `bookings`
- ✅ `contact_messages`

## 🔐 Step 3: Google OAuth Setup

### 3.1 Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable APIs:
   - Go to **APIs & Services** → **Library**
   - Search and enable:
     - **Google+ API**
     - **Google Identity API**

### 3.2 Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set application name: "Venue Finder"
5. Add authorized redirect URIs:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback
   ```
6. Click **Create**
7. **Save the Client ID and Client Secret**

### 3.3 Configure Supabase Google Auth
1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click **Enable**
4. Enter your Google credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
5. Click **Save**

## 📧 Step 4: Email Authentication Setup

### 4.1 Configure Email Templates
1. Go to **Authentication** → **Settings**
2. Configure email templates:
   - **Email confirmation**
   - **Password reset**
   - **Magic link**
3. Customize the templates if needed

### 4.2 Test Email Auth
1. Start your development server: `npm run dev`
2. Go to `http://localhost:5173/signin`
3. Try signing up with email/password
4. Check for confirmation email

## 🧪 Step 5: Testing Authentication

### 5.1 Test Google OAuth
1. Go to `http://localhost:5173/signin`
2. Click **Sign in with Google**
3. Complete Google OAuth flow
4. Verify you're redirected to home page
5. Check user profile is created in database

### 5.2 Test Email Authentication
1. Try signing up with email/password
2. Check for confirmation email
3. Confirm email and sign in
4. Verify user profile creation

### 5.3 Test User Dashboard
1. Sign in with any method
2. Go to user dashboard
3. Verify all sections load:
   - Profile
   - Bookings
   - Favorites
   - Reviews
   - Settings

## 🚀 Step 6: GitHub Setup

### 6.1 Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Create a new repository
3. Name it: `venue-finder` or similar
4. Don't initialize with README (we already have one)

### 6.2 Push to GitHub
```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/venue-finder.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🔍 Step 7: Verification Checklist

### Database Verification
- [ ] All tables created successfully
- [ ] RLS policies working
- [ ] Storage buckets created
- [ ] Functions and triggers working

### Authentication Verification
- [ ] Google OAuth working
- [ ] Email/password registration working
- [ ] Email confirmation working
- [ ] Password reset working
- [ ] User profiles auto-created

### Application Verification
- [ ] App starts without errors
- [ ] All pages load correctly
- [ ] Authentication flows work
- [ ] User dashboard functional
- [ ] Venue listing works
- [ ] File uploads work

## 🚨 Troubleshooting

### Common Issues

#### 1. Google OAuth Not Working
- **Problem**: "Invalid redirect URI" error
- **Solution**: Check redirect URIs in Google Cloud Console match exactly

#### 2. Database Connection Errors
- **Problem**: "Invalid API key" errors
- **Solution**: Verify environment variables are correct

#### 3. RLS Policy Errors
- **Problem**: "Row Level Security" errors
- **Solution**: Ensure all policies are created correctly

#### 4. File Upload Errors
- **Problem**: Storage bucket errors
- **Solution**: Verify storage buckets are created and policies set

### Debug Steps
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify environment variables
4. Test database queries directly
5. Check network requests in browser dev tools

## 📞 Support

If you encounter issues:

1. **Check the logs**: Browser console and Supabase logs
2. **Verify setup**: Follow this guide step by step
3. **Common solutions**: See troubleshooting section above
4. **Database issues**: Check `SQL_README.md` for correct commands

## 🎉 Success!

Once all steps are completed, you'll have:
- ✅ Complete authentication system
- ✅ Full database with all tables
- ✅ Google OAuth integration
- ✅ Email authentication
- ✅ User profiles and preferences
- ✅ Venue management system
- ✅ Booking system
- ✅ Reviews and ratings
- ✅ File upload capabilities
- ✅ Secure RLS policies

Your Venue Finder application is now ready for development and deployment! 🚀 