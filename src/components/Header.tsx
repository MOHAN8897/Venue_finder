import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MapPin, User, LogOut, LayoutDashboard, Heart, Calendar, Settings, ChevronDown, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationPanel from './NotificationPanel';
import { VenueSubmissionService } from '../lib/venueSubmissionService';
import { supabase } from '../lib/supabase';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [hasApprovedVenue, setHasApprovedVenue] = useState(false);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const checkApprovedVenue = async () => {
      if (user) {
        const status = await VenueSubmissionService.getUserVenueSubmissionStatus();
        setHasApprovedVenue(status === 'approved');
      } else {
        setHasApprovedVenue(false);
      }
    };
    checkApprovedVenue();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsProfileMenuOpen(false);
      navigate('/');
    } catch {
      setIsProfileMenuOpen(false);
      navigate('/');
    }
  };

  const handleVenueSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .insert([{
          name: 'Venue Name',
          type: 'sports-complex',
          submitted_by: user.id,
          user_id: user.id
        }]);

      if (error) {
        console.error('Error submitting venue:', error);
      } else {
        console.log('Venue submission successful:', data);
      }
    } catch (error) {
      console.error('Error submitting venue:', error);
    }
  };

  return (
    <header id="main-header" className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link id="logo-link" to="/" className="flex items-center space-x-2">
            <div id="logo-icon" className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <span id="logo-text" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              VenueFinder
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav id="desktop-nav" className="hidden md:flex items-center space-x-8">
            <Link 
              id="nav-home"
              to="/" 
              className={`text-gray-700 hover:text-blue-600 font-medium transition-colors ${
                location.pathname === '/' ? 'text-blue-600' : ''
              }`}
            >
              Home
            </Link>
            <Link 
              id="nav-venues"
              to="/venues" 
              className={`text-gray-700 hover:text-blue-600 font-medium transition-colors ${
                location.pathname === '/venues' ? 'text-blue-600' : ''
              }`}
            >
              Browse Venues
            </Link>
          </nav>

          {/* Auth Section */}
          <div id="auth-container" className="hidden md:flex items-center space-x-4">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <>
                <NotificationPanel />
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || user.email || 'User'}
                        loading="lazy"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : user.email ? (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user.email[0].toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="font-medium">{user.full_name || user.email || 'User'}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Enhanced Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200">
                      <div className="px-4 py-3 text-sm border-b border-gray-100">
                        <div className="font-semibold text-gray-900 text-base">{user.full_name || user.email || 'User'}</div>
                        <div className="text-gray-600 text-sm mt-1 break-all">{user.email || ''}</div>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          to="/dashboard"
                          className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Dashboard</span>
                        </Link>
                        
                        {/* Show Manage Venues for owners with approved venue */}
                        {hasApprovedVenue && (
                          <Link
                            to="/manage-venues"
                            className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <Building2 className="h-5 w-5 text-green-500" />
                            <span className="font-medium">Manage Venues</span>
                          </Link>
                        )}
                        
                        <Link
                          to="/favorites"
                          className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Heart className="h-5 w-5 text-red-500" />
                          <span className="font-medium">My Favorites</span>
                        </Link>
                        
                        <Link
                          to="/bookings"
                          className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Calendar className="h-5 w-5 text-green-500" />
                          <span className="font-medium">My Bookings</span>
                        </Link>
                        
                        {/* List Your Venue - always show for signed-in users, above Settings */}
                        <Link
                          to="/list-venue"
                          className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <MapPin className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">List Your Venue</span>
                        </Link>
                        
                        <Link
                          to="/settings"
                          className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings className="h-5 w-5 text-gray-500" />
                          <span className="font-medium">Settings</span>
                        </Link>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                        >
                          <LogOut className="h-5 w-5 text-red-500" />
                          <span className="font-medium">Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/signin"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div id="mobile-menu" className="md:hidden bg-white border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                id="mobile-nav-home"
                to="/" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                id="mobile-nav-venues"
                to="/venues" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Venues
              </Link>
              <Link 
                id="mobile-nav-list-venue"
                to="/list-venue" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                List Your Venue
              </Link>
              
              {/* Mobile Auth */}
              <div id="mobile-auth-container" className="pt-4 border-t border-gray-200">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-4">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || user.email || 'User'}
                          loading="lazy"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : user.email ? (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.email[0].toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name || 'User'}</div>
                        <div className="text-sm text-gray-500">{user.email || ''}</div>
                      </div>
                    </div>
                    
                    <Link
                      to="/dashboard"
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                    
                    {/* Show Manage Venues for owners in mobile menu */}
                    {hasApprovedVenue && (
                      <Link
                        to="/manage-venues"
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Building2 className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Manage Venues</span>
                      </Link>
                    )}
                    
                    <Link
                      to="/favorites"
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Heart className="h-5 w-5 text-red-500" />
                      <span className="font-medium">My Favorites</span>
                    </Link>
                    
                    <Link
                      to="/bookings"
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Calendar className="h-5 w-5 text-green-500" />
                      <span className="font-medium">My Bookings</span>
                    </Link>
                    
                    <Link
                      to="/list-venue"
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">List Your Venue</span>
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-3 transition-colors rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Settings</span>
                    </Link>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 flex items-center space-x-3 transition-colors rounded-lg"
                    >
                      <LogOut className="h-5 w-5 text-red-500" />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/signin"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium block text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;