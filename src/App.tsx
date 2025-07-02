import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminProtectedRoute from './components/SuperAdminProtectedRoute';
import VenueOwnerProtectedRoute from './components/VenueOwnerProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Pages (lazy loaded)
const Home = lazy(() => import('./pages/Home'));
const VenueList = lazy(() => import('./pages/VenueList'));
const VenueDetail = lazy(() => import('./pages/VenueDetail'));
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
const ManageVenues = lazy(() => import('./pages/ManageVenues'));
const SuperAdminLogin = lazy(() => import('./pages/SuperAdminLogin'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));
const BookingManager = lazy(() => import('./pages/BookingManager'));
const OfferManagerPage = lazy(() => import('./pages/OfferManagerPage'));
const CompliancePage = lazy(() => import('./pages/CompliancePage'));
const BookingSettingsPage = lazy(() => import('./pages/BookingSettingsPage'));
const RevenuePage = lazy(() => import('./pages/RevenuePage'));
const MessagingPage = lazy(() => import('./pages/MessagingPage'));

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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Super Admin Standalone Routes (no main layout) */}
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route 
              path="/super-admin/dashboard" 
              element={
                <SuperAdminProtectedRoute>
                  <SuperAdminDashboard />
                </SuperAdminProtectedRoute>
              } 
            />

            {/* Public Routes with Main Layout */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/venues" element={<MainLayout><VenueList /></MainLayout>} />
            <Route path="/venue/:id" element={<MainLayout><VenueDetail /></MainLayout>} />
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

            {/* Owner Routes with Main Layout */}
            <Route 
              path="/owner/dashboard" 
              element={
                <ProtectedRoute>
                  <MainLayout><OwnerDashboard /></MainLayout>
                </ProtectedRoute>
              } 
            />

            {/* Manage Venues Route with Main Layout */}
            <Route 
              path="/manage-venues" 
              element={
                <ProtectedRoute>
                  <VenueOwnerProtectedRoute>
                    <MainLayout><ManageVenues /></MainLayout>
                  </VenueOwnerProtectedRoute>
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

            {/* 404 Route with Main Layout */}
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;