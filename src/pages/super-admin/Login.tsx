import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const SuperAdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, refreshUserProfile, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Clear any normal user session before super admin login
    localStorage.removeItem('venueFinder_user');
    sessionStorage.removeItem('venueFinder_session');
    const { error: signInError } = await signInWithEmail(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }
    // Fetch the user profile directly from Supabase to check the role
    try {
      const { data: { user: supaUser } } = await import('../../lib/supabase').then(m => m.supabase.auth.getUser());
      if (!supaUser) throw new Error('No user session');
      const { data: profile, error: profileError } = await import('../../lib/supabase').then(m => m.supabase
        .from('profiles')
        .select('role')
        .eq('user_id', supaUser.id)
        .single()
      );
      if (profileError || !profile) throw new Error('Could not fetch user profile');
      if (profile.role === 'owner') {
        localStorage.setItem('super_admin_session', 'true');
        setLoading(false);
        navigate('/super-admin/dashboard', { replace: true });
      } else {
        setError('You are not authorized as the website owner.');
        setLoading(false);
      }
    } catch (err) {
      setError('Could not verify user role.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900">
      <div className="w-full max-w-md bg-white/90 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-900">Super Admin Login</h2>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your super admin email"
              required
              autoFocus
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLogin; 