import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface Venue {
  venue_id: string;
  venue_name: string;
  status: 'approved' | 'rejected' | 'pending';
  rejection_reason?: string;
}

const ManageVenues: React.FC = () => {
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVenue = async () => {
      if (!user) {
        navigate('/signin');
        return;
      }
      // Fetch the user's venue submission (mocked for now)
      const { data, error } = await supabase
        .from('venues')
        .select('venue_id, venue_name, status, rejection_reason')
        .eq('owner_id', user.id)
        .single();
      if (error || !data) {
        // No venue submission found, redirect
        navigate('/unauthorized');
        return;
      }
      setVenue(data);
      setLoading(false);
    };
    fetchVenue();
  }, [user, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!venue) {
    // Should not reach here due to redirect, but fallback
    return null;
  }

  return (
    <Box maxWidth={600} mx="auto" mt={6}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Manage Your Venue
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Venue: {venue.venue_name}
          </Typography>
          {venue.status === 'approved' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Your venue has been <b>approved</b>. You now have full access to manage your venue.
            </Alert>
          )}
          {venue.status === 'rejected' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Unfortunately, your venue submission was <b>rejected</b>.<br />
              {venue.rejection_reason && (
                <span>
                  <b>Reason:</b> {venue.rejection_reason}
                </span>
              )}
              <br />Please review the feedback and consider resubmitting.
            </Alert>
          )}
          {venue.status === 'pending' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your venue is currently <b>under review</b>. You will be notified once a decision is made.
            </Alert>
          )}
          {venue.status === 'approved' && (
            <Box mt={2}>
              {/* Placeholder for management features */}
              <Button variant="contained" color="primary">
                Edit Venue Details
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ManageVenues; 