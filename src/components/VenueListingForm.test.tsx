import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VenueListingForm from './VenueListingForm';

jest.mock('../lib/venueSubmissionService', () => ({
  VenueSubmissionService: {
    getUserVenueSubmissionStatus: jest.fn(),
  },
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { user_id: 'test-user', email: 'test@example.com' } }),
}));

describe('VenueListingForm submission flow', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while checking status', async () => {
    const { VenueSubmissionService } = require('../lib/venueSubmissionService');
    VenueSubmissionService.getUserVenueSubmissionStatus.mockImplementation(() => new Promise(() => {}));
    render(<VenueListingForm />);
    expect(screen.getByText(/checking your venue submission status/i)).toBeInTheDocument();
  });

  it('shows pending dialog and blocks form if status is pending', async () => {
    const { VenueSubmissionService } = require('../lib/venueSubmissionService');
    VenueSubmissionService.getUserVenueSubmissionStatus.mockResolvedValue('pending');
    render(<VenueListingForm />);
    await waitFor(() => expect(screen.getByText(/venue submission under review/i)).toBeInTheDocument());
    expect(screen.getByText(/you cannot submit another venue/i)).toBeInTheDocument();
  });

  it('shows approved dialog and blocks form if status is approved', async () => {
    const { VenueSubmissionService } = require('../lib/venueSubmissionService');
    VenueSubmissionService.getUserVenueSubmissionStatus.mockResolvedValue('approved');
    render(<VenueListingForm />);
    await waitFor(() => expect(screen.getByText(/venue approved/i)).toBeInTheDocument());
    expect(screen.getByText(/further submissions are not allowed/i)).toBeInTheDocument();
  });

  it('shows rejected dialog and allows form if status is rejected', async () => {
    const { VenueSubmissionService } = require('../lib/venueSubmissionService');
    VenueSubmissionService.getUserVenueSubmissionStatus.mockResolvedValue('rejected');
    render(<VenueListingForm />);
    await waitFor(() => expect(screen.getByText(/venue submission rejected/i)).toBeInTheDocument());
    expect(screen.getByText(/you may update and resubmit/i)).toBeInTheDocument();
    // Form fields should be present
    expect(screen.getByLabelText(/venue name/i)).toBeInTheDocument();
  });

  it('allows form if status is none', async () => {
    const { VenueSubmissionService } = require('../lib/venueSubmissionService');
    VenueSubmissionService.getUserVenueSubmissionStatus.mockResolvedValue('none');
    render(<VenueListingForm />);
    await waitFor(() => expect(screen.getByLabelText(/venue name/i)).toBeInTheDocument());
  });
}); 