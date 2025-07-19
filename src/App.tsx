import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import VenueOwnerProtectedRoute from './components/VenueOwnerProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './hooks/useAuth';
import SuperAdminProtectedRoute from './components/SuperAdminProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/cricket-dashboard/tooltip';
import { Toaster as DashboardToaster } from '@/components/cricket-dashboard/toaster';
import { Toaster as Sonner } from '@/components/cricket-dashboard/sonner';
import EnvironmentCheck from './components/EnvironmentCheck';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="text-red-600 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


// Pages (lazy loaded)
const Home = lazy(() => import('./pages/Home'));
const VenueList = lazy(() => import('./pages/VenueList'));
const VenueDetail = lazy(() => import('./pages/VenueDetail'));
const VenueBooking = lazy(() => import('./pages/VenueBooking'));
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const VenueTest = lazy(() => import('./pages/VenueTest'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ListVenue = lazy(() => import('./pages/ListVenue'));
const EditVenue = lazy(() => import('./pages/EditVenue'));
const SignIn = lazy(() => import('./pages/SignIn'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const UserFavorites = lazy(() => import('./pages/UserFavorites'));
const UserBookings = lazy(() => import('./pages/UserBookings'));
const UserSettings = lazy(() => import('./pages/UserSettings'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const BookingManager = lazy(() => import('./pages/BookingManager'));
const OfferManagerPage = lazy(() => import('./pages/OfferManagerPage'));
const CompliancePage = lazy(() => import('./pages/CompliancePage'));
const BookingSettingsPage = lazy(() => import('./pages/BookingSettingsPage'));
const RevenuePage = lazy(() => import('./pages/RevenuePage'));
const MessagingPage = lazy(() => import('./pages/MessagingPage'));
const SuperAdminDashboardIndex = lazy(() => import('./pages/super-admin/Index'));
const SuperAdminNotFound = lazy(() => import('./pages/super-admin/NotFound'));
const SuperAdminLogin = lazy(() => import('./pages/super-admin/Login'));
const ManageYourPageDashboard = lazy(() => import('./pages/cricket-dashboard/Index'));
const ManageYourPageVenues = lazy(() => import('./pages/cricket-dashboard/VenuesPage'));
const ManageYourPageCalendar = lazy(() => import('./pages/cricket-dashboard/CalendarPage'));
const ManageYourPageAnalytics = lazy(() => import('./pages/cricket-dashboard/AnalyticsPage'));
const ManageYourPageSettings = lazy(() => import('./pages/cricket-dashboard/SettingsPage'));
const BrowseVenues = lazy(() => import('./pages/BrowseVenues'));
const VenueCardDemo = lazy(() => import('./pages/VenueCardDemo'));

// Main Layout Component
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <DashboardToaster />
          <Sonner />
          <Router>
            <AuthProvider>
              <AppWithTabOverlay />
            </AuthProvider>
          </Router>
          <EnvironmentCheck />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const AppWithTabOverlay: React.FC = () => {
  const location = useLocation();
  const userRole = localStorage.getItem('userRole');
  // Prevent session mixing: if on /super-admin/* and not admin, redirect to login
  if (location.pathname.startsWith('/super-admin')) {
    if (userRole !== 'administrator') {
      localStorage.clear();
      sessionStorage.clear();
      if (location.pathname !== '/super-admin/login') {
        return <Navigate to="/super-admin/login" replace />;
      }
    }
  } else {
    // If admin is logged in and tries to access user routes, redirect to super-admin dashboard
    if (userRole === 'administrator') {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
  }
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Super Admin Dashboard: All /super-admin/* routes */}
        <Route path="/super-admin/*" element={
          <SuperAdminProtectedRoute>
            <SuperAdminDashboardIndex />
          </SuperAdminProtectedRoute>
        } />
        {/* Optionally, handle /super-admin/404 or similar */}
        <Route path="/super-admin/404" element={<SuperAdminNotFound />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />

            {/* Public Routes with Main Layout */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/venues" element={<MainLayout><BrowseVenues /></MainLayout>} />
            <Route path="/venue-card-demo" element={<MainLayout><VenueCardDemo /></MainLayout>} />

            <Route path="/venue/:id" element={<MainLayout><VenueDetail /></MainLayout>} />
            <Route path="/book/:id" element={<MainLayout><VenueBooking /></MainLayout>} />
            <Route path="/booking-confirmation/:bookingId" element={<MainLayout><BookingConfirmation /></MainLayout>} />
            <Route path="/venue-test" element={<MainLayout><VenueTest /></MainLayout>} />
            <Route path="/unauthorized" element={<MainLayout><Unauthorized /></MainLayout>} />
            <Route path="/list-venue" element={<MainLayout><ListVenue /></MainLayout>} />
            <Route path="/signin" element={<MainLayout><SignIn /></MainLayout>} />
            <Route path="/auth/callback" element={<MainLayout><AuthCallback /></MainLayout>} />
            <Route path="/contact" element={<MainLayout><ContactUs /></MainLayout>} />
            <Route path="/terms" element={<MainLayout><TermsAndConditions /></MainLayout>} />
            <Route path="/forgot-password" element={<MainLayout><ForgotPassword /></MainLayout>} />
            <Route path="/verify-otp" element={<MainLayout><VerifyOtp /></MainLayout>} />
            <Route path="/reset-password" element={<MainLayout><ResetPassword /></MainLayout>} />
            <Route path="/booking-manager" element={<BookingManager />} />
            <Route path="/offer-manager" element={<OfferManagerPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/booking-settings" element={<BookingSettingsPage />} />
            <Route path="/revenue" element={<RevenuePage />} />
            <Route path="/messaging" element={<MessagingPage />} />

            {/* Protected Routes with Main Layout */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <MainLayout><UserDashboard /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/favorites" 
              element={
                <ProtectedRoute>
                  <MainLayout><UserFavorites /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bookings" 
              element={
                <ProtectedRoute>
                  <MainLayout><UserBookings /></MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <MainLayout><UserSettings /></MainLayout>
                </ProtectedRoute>
              } 
            />

            {/* Edit Venue Route with Main Layout */}
            <Route 
              path="/edit-venue/:venueId" 
              element={
                <ProtectedRoute>
                  <VenueOwnerProtectedRoute>
                    <MainLayout><EditVenue /></MainLayout>
                  </VenueOwnerProtectedRoute>
                </ProtectedRoute>
              } 
            />

            {/* Manage Your Venue Dashboard Routes (unique) */}
            <Route path="/manageyourpage-dashboard" element={<MainLayout><ManageYourPageDashboard /></MainLayout>} />
            <Route path="/manageyourpage-venues" element={<MainLayout><ManageYourPageVenues /></MainLayout>} />
            <Route path="/manageyourpage-calendar" element={<MainLayout><ManageYourPageCalendar /></MainLayout>} />
            <Route path="/manageyourpage-analytics" element={<MainLayout><ManageYourPageAnalytics /></MainLayout>} />
            <Route path="/manageyourpage-settings" element={<MainLayout><ManageYourPageSettings /></MainLayout>} />
            <Route path="/manageyourpage-boxes" element={<Navigate to="/manageyourpage-venues" replace />} />

            {/* Redirect old cricket-dashboard routes to new manageyourpage-dashboard */}
            <Route path="/cricket-dashboard" element={<Navigate to="/manageyourpage-dashboard" replace />} />
            <Route path="/cricket-dashboard/*" element={<Navigate to="/manageyourpage-dashboard" replace />} />

            {/* 404 Route with Main Layout */}
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
      </Routes>
    </Suspense>
  );
};

export default App;