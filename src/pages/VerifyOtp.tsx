import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

const VerifyOtp = () => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const inputsRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (!email) {
      // If there's no email in state, user probably landed here directly.
      // Redirect them to the start of the flow.
      navigate('/forgot-password');
    }
    inputsRef.current[0]?.focus();
  }, [email, navigate]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = otp.join('');
    if (token.length !== 6) {
      setError('Please enter a 6-digit OTP.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        throw error;
      }

      // On successful verification, the user is logged in.
      // Navigate them to the page where they can set a new password.
      navigate('/reset-password');

    } catch (err) {
      console.error('Error verifying OTP:', err);
      const errorMessage = (err as Error)?.message || 'Invalid or expired OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify Your Identity
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code sent to <strong>{email || 'your email'}</strong>.
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          <div className="flex justify-center space-x-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                name="otp"
                maxLength={1}
                className="w-12 h-12 text-center text-2xl font-semibold border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => (inputsRef.current[index] = el as HTMLInputElement)}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center text-sm text-red-600 pt-4">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? 'Verifying...' : 'Verify & Proceed'}
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
          <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            Didn't get a code? Resend
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp; 