import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Phone, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const SignIn: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render the form if user is already authenticated
  if (user) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      setSuccess(true);
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      setError('Failed to sign in with Google. Please try again.');
      console.error('Google sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    if (isSignUp) {
      if (!email || !phone || !password) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      const { error: signUpError } = await signUpWithEmail(email, password, phone);
      setLoading(false);
      if (signUpError) {
        setError(signUpError);
      } else {
        setSuccess(true);
        setPassword('');
      }
      return;
    }
    // Sign-in logic
    if (!email || !password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    const { error: signInError } = await signInWithEmail(email, password);
    if (!signInError) {
      await refreshUserProfile();
      setLoading(false);
      navigate('/', { replace: true }); // Immediate redirect after successful login
      return;
    }
    setLoading(false);
    if (signInError) {
      setError(signInError);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-400 to-purple-400 animate-gradient-x overflow-hidden relative">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="1200" cy="200" r="300" fill="#a5b4fc" fillOpacity="0.25" />
          <circle cx="200" cy="700" r="250" fill="#c7d2fe" fillOpacity="0.18" />
          <circle cx="800" cy="800" r="200" fill="#818cf8" fillOpacity="0.15" />
        </svg>
      </div>
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="backdrop-blur-xl bg-white/30 border border-white/20 shadow-2xl rounded-3xl px-8 py-10 sm:px-10 sm:py-12 flex flex-col items-center transition-all duration-300">
          <div className="mb-6 flex flex-col items-center">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-400 rounded-full p-3 shadow-lg mb-2 animate-bounce">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 drop-shadow-lg text-center">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p className="mt-2 text-sm text-gray-700 text-center">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors underline"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white/80 hover:bg-white/100 border border-gray-200 shadow-md text-gray-700 font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-60 mb-6"
          >
            <span className="inline-block h-5 w-5">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_17_40)">
                  <path d="M23.766 12.276c0-.818-.074-1.604-.213-2.356H12.24v4.451h6.484c-.28 1.51-1.13 2.79-2.41 3.65v3.02h3.89c2.28-2.1 3.582-5.2 3.582-8.765z" fill="#4285F4"/>
                  <path d="M12.24 24c3.24 0 5.963-1.073 7.95-2.91l-3.89-3.02c-1.08.73-2.46 1.17-4.06 1.17-3.12 0-5.76-2.11-6.71-4.96H1.52v3.11C3.5 21.98 7.58 24 12.24 24z" fill="#34A853"/>
                  <path d="M5.53 14.28A7.23 7.23 0 0 1 4.8 12c0-.79.14-1.56.38-2.28V6.61H1.52A12.01 12.01 0 0 0 0 12c0 1.93.47 3.76 1.52 5.39l4.01-3.11z" fill="#FBBC05"/>
                  <path d="M12.24 4.77c1.77 0 3.36.61 4.61 1.8l3.44-3.44C18.2 1.07 15.48 0 12.24 0 7.58 0 3.5 2.02 1.52 6.61l4.01 3.11c.95-2.85 3.59-4.95 6.71-4.95z" fill="#EA4335"/>
                </g>
                <defs>
                  <clipPath id="clip0_17_40">
                    <rect width="24" height="24" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </span>
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Continue with Google'}
          </button>

          <div className="relative w-full flex items-center mb-6">
            <div className="flex-grow border-t border-gray-300" />
            <span className="mx-3 text-gray-400 text-xs">or</span>
            <div className="flex-grow border-t border-gray-300" />
          </div>

          <form className="w-full space-y-5" onSubmit={handleEmailAuth} autoComplete="on">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm animate-shake">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md text-sm animate-fade-in">
                <CheckCircle className="h-4 w-4" />
                Success! Redirecting...
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 h-5 w-5" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-900 bg-white/80 placeholder-gray-400 shadow-sm transition-all duration-200"
                placeholder="Email address"
              />
            </div>
            {isSignUp && (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 h-5 w-5" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-900 bg-white/80 placeholder-gray-400 shadow-sm transition-all duration-200"
                  placeholder="Phone number (required)"
                  required
                />
              </div>
            )}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 h-5 w-5" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-12 py-2 w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-900 bg-white/80 placeholder-gray-400 shadow-sm transition-all duration-200"
                placeholder={isSignUp ? "Create a password" : "Password"}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.336 3.236-.938 4.675m-2.122 2.122A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.336 3.236-.938 4.675m-2.122 2.122A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-indigo-600 hover:text-indigo-500 underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500 underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 8s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.5s; }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.7s; }
      `}</style>
    </div>
  );
};

export default SignIn; 