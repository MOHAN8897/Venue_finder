import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import VenueList from './pages/VenueList';
import VenueDetail from './pages/VenueDetail';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import ListVenue from './pages/ListVenue';
import SignIn from './pages/SignIn';
import AuthCallback from './pages/AuthCallback';
import ContactUs from './pages/ContactUs';
import TermsAndConditions from './pages/TermsAndConditions';
import UserDashboard from './pages/UserDashboard';
import UserFavorites from './pages/UserFavorites';
import UserBookings from './pages/UserBookings';
import UserSettings from './pages/UserSettings';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import ManageVenues from './pages/ManageVenues';

// Admin & Owner Pages
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

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
            <Routes>
          {/* Super Admin Standalone Routes (no main layout) */}
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />

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
                <MainLayout><ManageVenues /></MainLayout>
                  </ProtectedRoute>
                } 
              />

          {/* 404 Route with Main Layout */}
          <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
            </Routes>
      </AuthProvider>
      </Router>
  );
}

export default App;