import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { venueService, Venue } from '../lib/venueService';
import MultiVenueSelector from '../components/MultiVenueSelector';
import VenueVisibilityControl from '../components/VenueVisibilityControl';
import ActivityLogViewer from '../components/ActivityLogViewer';
import VenuePerformanceDashboard from '../components/VenuePerformanceDashboard';
import ProfileCompletionTracker from '../components/ProfileCompletionTracker';
import VenueMediaManager from '../components/VenueMediaManager';
import { Loader2, AlertCircle, Calendar, Tag, ShieldCheck, Settings, DollarSign, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';

const OwnerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

    useEffect(() => {
        const loadVenues = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const ownerVenues = await venueService.getVenuesForOwner(user.id);
                setVenues(ownerVenues);
                if (ownerVenues.length > 0) {
                    setSelectedVenue(ownerVenues[0]);
                }
            } catch (err) {
                setError("Failed to load dashboard data.");
                if (err instanceof Error) {
                    console.error(err.message);
                } else {
                    console.error("An unexpected error occurred:", err);
                }
    } finally {
      setLoading(false);
    }
  };
        loadVenues();
    }, [user]);

    const handleVenueSelect = (venueId: string) => {
        const venue = venues.find(v => v.id === venueId);
        setSelectedVenue(venue || null);
    };

    const handleVisibilityChange = async (venueId: string, isPublished: boolean) => {
        toast.info(`Updating visibility for venue ${venueId} to ${isPublished ? 'Published' : 'Unpublished'}.`);
        // Optimistically update the UI
        setVenues(prev => prev.map(v => v.id === venueId ? { ...v, is_published: isPublished } : v));
        if (selectedVenue && selectedVenue.id === venueId) {
            setSelectedVenue(prev => prev ? { ...prev, is_published: isPublished } : null);
        }
        // In a real app, you would also call the service here and handle potential errors
    };

    const handleUnavailabilityChange = async (venueId: string, dates: DateRange) => {
        toast.info(`Setting unavailability for venue ${venueId} from ${dates.from?.toDateString()} to ${dates.to?.toDateString()}`);
        // In a real app, you would call a service to set the dates
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    if (error) {
        return <div className="flex items-center justify-center h-screen"><AlertCircle className="h-12 w-12 text-red-500" /><p className="ml-4">{error}</p></div>;
    }
    
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
                    <p className="text-sm text-gray-600">Select a venue to view its performance and manage its settings.</p>
                </header>

                <MultiVenueSelector 
                    venues={venues} 
                    selectedVenueId={selectedVenue?.id || ''}
                    onVenueSelect={handleVenueSelect}
                />

                {selectedVenue ? (
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <VenuePerformanceDashboard 
                                venueName={selectedVenue.name}
                                stats={{
                                    totalBookings: 78,
                                    totalRevenue: 540000,
                                    totalViews: 12500,
                                    averageRating: 4.7,
                                    conversionRate: 0.062,
                                    monthlyBookings: 12,
                                    monthlyRevenue: 85000,
                                    monthlyViews: 2100,
                                }}
                            />
                            <VenueMediaManager venueId={selectedVenue.id} />
                            <ActivityLogViewer venueId={selectedVenue.id} />
      </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                           <VenueVisibilityControl 
                                venue={selectedVenue}
                                onVisibilityChange={handleVisibilityChange}
                                onUnavailabilityChange={handleUnavailabilityChange}
                            />
                            <ProfileCompletionTracker />
                            <div 
                                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate('/booking-settings', { state: { venueId: selectedVenue.id, venueName: selectedVenue.name }})}
                             >
            <div className="flex items-center">
                                    <Settings className="h-8 w-8 text-gray-600 mr-4" />
              <div>
                                        <h2 className="text-xl font-semibold">Booking Settings</h2>
                                        <p className="text-sm text-gray-500">Set auto-approval rules</p>
            </div>
          </div>
        </div>
                             <div 
                                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate('/booking-manager', { state: { venueId: selectedVenue.id, venueName: selectedVenue.name }})}
                             >
              <div className="flex items-center">
                                    <Calendar className="h-8 w-8 text-blue-600 mr-4" />
                                    <div>
                                        <h2 className="text-xl font-semibold">Booking Calendar</h2>
                                        <p className="text-sm text-gray-500">View and manage all bookings</p>
                </div>
              </div>
            </div>
                            <div 
                                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate('/offer-manager', { state: { venueId: selectedVenue.id, venueName: selectedVenue.name }})}
                             >
              <div className="flex items-center">
                                    <Tag className="h-8 w-8 text-purple-600 mr-4" />
                                    <div>
                                        <h2 className="text-xl font-semibold">Manage Offers</h2>
                                        <p className="text-sm text-gray-500">Create and manage discounts</p>
                </div>
              </div>
            </div>
                            <div 
                                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate('/compliance', { state: { venueId: selectedVenue.id, venueName: selectedVenue.name }})}
                             >
              <div className="flex items-center">
                                    <ShieldCheck className="h-8 w-8 text-red-600 mr-4" />
                                    <div>
                                        <h2 className="text-xl font-semibold">Compliance</h2>
                                        <p className="text-sm text-gray-500">Manage required documents</p>
                </div>
              </div>
            </div>
                            <div 
                                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate('/revenue', { state: { venueId: selectedVenue.id, venueName: selectedVenue.name }})}
                             >
              <div className="flex items-center">
                                    <DollarSign className="h-8 w-8 text-green-600 mr-4" />
                                    <div>
                                        <h2 className="text-xl font-semibold">Revenue & Payouts</h2>
                                        <p className="text-sm text-gray-500">View financial reports</p>
                </div>
              </div>
            </div>
                            <div 
                                className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate('/messaging', { state: { venueId: selectedVenue.id, venueName: selectedVenue.name }})}
                             >
                                <div className="flex items-center">
                                    <MessageSquare className="h-8 w-8 text-cyan-600 mr-4" />
                                    <div>
                                        <h2 className="text-xl font-semibold">Inbox</h2>
                                        <p className="text-sm text-gray-500">Read and reply to messages</p>
            </div>
          </div>
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className="mt-8 text-center p-12 bg-white rounded-lg shadow">
                        <h2 className="text-xl font-semibold">No Venue Selected</h2>
                        <p className="text-gray-500 mt-2">Please select a venue from the dropdown above to see its details or add one if you have none.</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default OwnerDashboard; 