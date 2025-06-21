import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';

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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/venues" element={<VenueList />} />
              <Route path="/venue/:id" element={<VenueDetail />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/list-venue" element={<ListVenue />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/dashboard" element={<UserDashboard />} />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;