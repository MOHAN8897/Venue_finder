import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2,
  Building2,
  Users,
  Settings,
  BarChart3
} from 'lucide-react';

const SuperAdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call the authenticate_super_admin function
      const { data, error } = await supabase.rpc('authenticate_super_admin', {
        email_input: email,
        password_input: password
      });

      if (error) throw error;

      if (data && data.success) {
        // Store admin session
        localStorage.setItem('superAdminSession', JSON.stringify({
          adminId: data.admin_id,
          email: data.email,
          fullName: data.full_name,
          loginTime: new Date().toISOString()
        }));

        // Navigate to super admin dashboard
        navigate('/super-admin/dashboard');
      } else {
        setError(data?.error || 'Authentication failed');
      }
    } catch (err: unknown) {
      console.error('Super admin login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Super Admin Portal</h1>
          <p className="text-blue-200">Secure access to venue management system</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Shield className="h-5 w-5 text-blue-200" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent pr-12"
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Access Admin Panel
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-300 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-1">Security Notice</p>
                <p>This portal is restricted to authorized super administrators only. All access attempts are logged and monitored.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Building2 className="h-8 w-8 text-blue-300 mx-auto mb-2" />
            <p className="text-blue-200 text-sm font-medium">Venue Management</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Users className="h-8 w-8 text-purple-300 mx-auto mb-2" />
            <p className="text-purple-200 text-sm font-medium">User Management</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <BarChart3 className="h-8 w-8 text-green-300 mx-auto mb-2" />
            <p className="text-green-200 text-sm font-medium">Analytics</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Settings className="h-8 w-8 text-orange-300 mx-auto mb-2" />
            <p className="text-orange-200 text-sm font-medium">System Settings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin; 