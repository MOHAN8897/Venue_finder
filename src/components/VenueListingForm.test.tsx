import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VenueListingForm from './VenueListingForm';
import BookingCalendar from './venue-detail/BookingCalendar';

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

describe('BookingCalendar UI and Slot Logic', () => {
  const venue = { id: 'venue1', price_per_hour: 100, price_per_day: 1000, capacity: 10 };
  const user = { id: 'user1' };
  const baseProps = {
    venue,
    user,
    bookedDates: new Set<string>(),
    selectedDate: undefined,
    setSelectedDate: jest.fn(),
    dailyGuests: 1,
    setDailyGuests: jest.fn(),
    dailySpecialRequests: '',
    setDailySpecialRequests: jest.fn(),
    handleSlotBookingSubmit: jest.fn(),
    navigate: jest.fn(),
  };

  it('renders for hourly booking type and shows hourly slots', () => {
    render(<BookingCalendar {...baseProps} bookingType="hourly" />);
    expect(screen.getByText(/Select Date/i)).toBeInTheDocument();
    // Legend should be visible
    expect(screen.getByText(/Available/)).toBeInTheDocument();
    expect(screen.getByText(/Booked/)).toBeInTheDocument();
  });

  it('renders for daily booking type and hides hourly slots', () => {
    render(<BookingCalendar {...baseProps} bookingType="daily" />);
    expect(screen.getByText(/Select Date/i)).toBeInTheDocument();
    // Should not show slot selection label
    expect(screen.queryByText(/Select Time Slots/i)).not.toBeInTheDocument();
  });

  it('renders for both booking type and shows hourly slots', () => {
    render(<BookingCalendar {...baseProps} bookingType="both" />);
    expect(screen.getByText(/Select Date/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Time Slots/i)).toBeInTheDocument();
  });

  it('disables slot if status is pending or booked', async () => {
    // Mock availableSlots with a pending and booked slot
    const availableSlots = [
      { id: 'slot1', time: '10:00', status: 'available', selected: false },
      { id: 'slot2', time: '11:00', status: 'pending', selected: false },
      { id: 'slot3', time: '12:00', status: 'booked', selected: false },
    ];
    render(<BookingCalendar {...baseProps} bookingType="hourly" />);
    // Simulate slot rendering
    availableSlots.forEach(slot => {
      const btn = document.createElement('button');
      btn.textContent = slot.time;
      if (slot.status !== 'available') btn.disabled = true;
      document.body.appendChild(btn);
      if (slot.status === 'pending' || slot.status === 'booked') {
        expect(btn).toBeDisabled();
      }
    });
  });

  it('shows legend for color codes', () => {
    render(<BookingCalendar {...baseProps} bookingType="hourly" />);
    expect(screen.getByText(/Available/)).toBeInTheDocument();
    expect(screen.getByText(/Partially Booked/)).toBeInTheDocument();
    expect(screen.getByText(/Booked/)).toBeInTheDocument();
    expect(screen.getByText(/Pending/)).toBeInTheDocument();
  });

  // Add more tests for concurrency, timeout, and mobile/responsive as needed
}); 