# 🏟️ Venue Finder

A modern web application for discovering, booking, and managing event venues. Built with React, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

- 🔐 **Authentication**: Google OAuth and Email/Password authentication
- 🏠 **Venue Management**: List, browse, and manage venues
- 📅 **Booking System**: Book venues with real-time availability
- ⭐ **Reviews & Ratings**: Rate and review venues
- ❤️ **Favorites**: Save favorite venues to wishlist
- 👤 **User Dashboard**: Complete user profile and booking management
- 📱 **Responsive Design**: Works on all devices
- 🎨 **Modern UI**: Beautiful, intuitive interface
- 🔒 **Secure**: Row Level Security (RLS) and proper authentication

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Venue_finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase Database**
   - Follow the instructions in `SQL_README.md`
   - Run all SQL commands in your Supabase SQL editor
   - Configure Google OAuth in Supabase dashboard

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🗄️ Database Setup

### 1. Supabase Configuration

1. Create a new Supabase project
2. Go to Settings → API to get your URL and anon key
3. Add them to your `.env.local` file

### 2. Database Schema

Run the SQL commands from `SQL_README.md` in your Supabase SQL editor:

- User profiles and authentication
- Venues table with all fields
- User favorites and reviews
- Booking system
- Contact messages
- Storage buckets for file uploads

### 3. Google OAuth Setup

1. **Google Cloud Console**:
   - Create OAuth 2.0 credentials
   - Add redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:5173/auth/callback`

2. **Supabase Dashboard**:
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google Client ID and Secret

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React context providers
├── lib/               # Utility functions and services
├── pages/             # Page components
├── types/             # TypeScript type definitions
└── main.tsx          # Application entry point
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Supabase Auth with Google OAuth
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 Features Overview

### For Users
- Browse venues by type, location, and price
- View venue details with images and videos
- Book venues with date and time selection
- Rate and review venues
- Save favorite venues
- Manage bookings and profile

### For Venue Owners
- List new venues with detailed information
- Upload venue images and videos
- Manage venue availability
- View booking requests
- Track venue performance

### Authentication Features
- Google OAuth integration
- Email/password registration and login
- Password reset functionality
- User profile management
- Secure session handling

## �� Security Features

- Row Level Security (RLS) policies
- Secure file uploads
- Input validation and sanitization
- Protected API routes
- User authentication and authorization

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the `SQL_README.md` for database setup
2. Verify your environment variables
3. Check Supabase dashboard for errors
4. Review the browser console for frontend errors

## 🔄 Updates

- Keep your dependencies updated
- Regularly check for Supabase updates
- Monitor for security patches

---

**Built with ❤️ using React, TypeScript, and Supabase**
