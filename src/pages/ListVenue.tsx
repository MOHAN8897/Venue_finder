import React from 'react';
import AuthWrapper from '../components/AuthWrapper';
import VenueListingForm from '../components/VenueListingForm';

const ListVenue: React.FC = () => {
  return (
    <AuthWrapper requireAuth={true}>
      <VenueListingForm />
    </AuthWrapper>
  );
};
export default ListVenue;