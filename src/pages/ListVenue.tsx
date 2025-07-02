import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const venueTypes = [
  'cricket-box',
  'farmhouse',
  'banquet-hall',
  'sports-complex',
  'party-hall',
  'conference-room',
];

const ListVenue: React.FC = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [eligibility, setEligibility] = useState<'allowed' | 'pending' | 'rejected' | 'approved' | 'loading'>('loading');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchVenues = async () => {
      if (!user || !user.id) {
        setEligibility('allowed');
        return;
      }
      setEligibility('loading');
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('user_id', user.id);
      if (error) {
        setEligibility('allowed');
        return;
      }
      if (!data || data.length === 0) {
        setEligibility('allowed');
      } else if ((data as unknown[]).some((v) => (v as unknown as { status?: string }).status === 'pending')) {
        setEligibility('pending');
      } else if ((data as unknown[]).some((v) => (v as unknown as { status?: string }).status === 'approved')) {
        setEligibility('approved');
      } else if ((data as unknown[]).some((v) => (v as unknown as { status?: string }).status === 'rejected')) {
        setEligibility('rejected');
      } else {
        setEligibility('allowed');
      }
    };
    fetchVenues();
  }, [user, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !type) {
      setError('Please enter a venue name and select a type.');
      return;
    }
    setLoading(true);
    try {
      if (!user || !user.id) {
        setError('You must be signed in to submit a venue.');
        setLoading(false);
        return;
      }
      const { error: dbError } = await supabase
        .from('venues')
        .insert({ name, type, submitted_by: user.user_id, status: 'pending' });
      if (dbError) {
        setError(dbError.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  if (eligibility === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (eligibility === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Card className="w-full max-w-md text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Venue Submission Pending</CardTitle>
            <CardDescription className="text-gray-600">
              Your venue is being verified. You cannot submit another venue until it is approved or rejected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/venues')} variant="outline" className="w-full">
              Browse Venues
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Card className="w-full max-w-md text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Venue Submitted Successfully!</CardTitle>
            <CardDescription className="text-gray-600">
              Your venue has been submitted and is <b>pending verification</b> by our team. You will be notified once your venue is reviewed and approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => { setSuccess(false); setName(''); setType(''); }} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium">
              Register Another Venue
                </Button>
            <Button onClick={() => navigate('/venues')} variant="outline" className="w-full">
              Browse Venues
                        </Button>
                </CardContent>
              </Card>
            </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Card className="w-full max-w-md text-center shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">List Your Venue</CardTitle>
          <CardDescription className="text-gray-600">
            Enter your venue name and select a type to submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                        <input
                  type="text"
                placeholder="Venue Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
                  </div>
                <div>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select Venue Type</option>
                {venueTypes.map(vt => (
                  <option key={vt} value={vt}>{vt.replace(/-/g, ' ')}</option>
                ))}
              </select>
                      </div>
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <Button type="submit" className="w-full bg-blue-600 text-white font-medium" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Venue'}
            </Button>
          </form>
                    </CardContent>
                  </Card>
    </div>
  );
};

export default ListVenue;