import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react'; // Import Eye icons

const SUPER_ADMIN_EMAIL = 'superadmin@venuefinder.com'; 
const ALLOWED_SUPER_ADMIN_EMAILS = [SUPER_ADMIN_EMAIL, 'new.superadmin@venuefinder.com', 'sai@gmail.com']; // Add sai@gmail.com

const SuperAdminLogin: React.FC = () => {
  const [email, setEmail] = useState(''); // Make email editable
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for show/hide password
  const emailInputRef = useRef<HTMLInputElement>(null); // Ref for email input
  const navigate = useNavigate();

  useEffect(() => {
    // If already signed in as super admin, redirect
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email === SUPER_ADMIN_EMAIL) {
        navigate('/super-admin/dashboard');
      }
    });
    // Auto-focus on email input
    if (emailInputRef.current) emailInputRef.current.focus();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email, // Use the editable email state
        password
      });
      
      console.log('Supabase Auth signInWithPassword error:', authError); // DEBUG: Log Supabase Auth error

      if (authError) {
        setError(authError.message || 'Supabase authentication failed');
        setLoading(false);
        return;
      }
      // Double check user is super admin
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email && ALLOWED_SUPER_ADMIN_EMAILS.includes(data.user.email)) { // Check for both old and new super admin emails
        // Store a custom session (if you still need it, otherwise this can be removed)
        const sessionObj = {
          adminId: data.user.id, // Use Supabase user ID for custom session
          adminUuid: data.user.id, // Using user ID as UUID for simplicity
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || data.user.email,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('superAdminSession', JSON.stringify(sessionObj));
        sessionStorage.setItem('superAdminSession', JSON.stringify(sessionObj));

        navigate('/super-admin/dashboard');
      } else {
        // If authenticated but not the super admin email, sign out and show error
        await supabase.auth.signOut();
        setError(`Unauthorized. Only ${ALLOWED_SUPER_ADMIN_EMAILS.join(' or ')} is allowed.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-md w-full p-8 bg-white/10 rounded-2xl shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Super Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              ref={emailInputRef}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-blue-200 hover:text-white" />
                ) : (
                  <Eye className="h-5 w-5 text-blue-200 hover:text-white" />
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center text-red-200 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Access Admin Panel'}
          </button>
        </form>
        <p className="mt-6 text-center text-blue-200 text-sm">
          Only <span className="font-bold">{ALLOWED_SUPER_ADMIN_EMAILS.join(' or ')}</span> is allowed to log in here.
        </p>
      </div>
    </div>
  );
};

export default SuperAdminLogin; 