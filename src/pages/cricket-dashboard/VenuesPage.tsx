
import { DashboardLayout } from "@/components/cricket-dashboard/DashboardLayout";
import { VenueCard } from "@/components/cricket-dashboard/BoxCard";
import { AddVenueDialog } from "@/components/cricket-dashboard/AddBoxDialog";
import { GoogleMapView } from "@/components/cricket-dashboard/GoogleMapView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Grid3X3, Map, Building2, Filter, Search, Calendar, Clock } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import { AuthContext } from "@/context/AuthContext";
import { VenueDetailsModal } from '@/components/dashboard/VenueDetailsModal';
import { Input } from "@/components/ui/input";
import { VenueAvailabilityController } from "@/components/venue-owner/VenueAvailabilityController";
import { BookingManagementDashboard } from "@/components/venue-owner/BookingManagementDashboard";

export interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  photos?: string[];
  videos?: string[];
  pricing?: {
    hourlyRate?: number;
    peakHourRate?: number;
  };
  amenities?: string[];
  status: string;
  availability: { [key: string]: { start: string; end: string; available: boolean } };
  weekly_availability?: { [key: string]: { start: string; end: string; available: boolean } };
  capacity?: number;
  map_embed_code?: string;
  stats: {
    totalBookings: number;
    revenue: number;
    occupancyRate: number;
  };
  featured_image?: string;
}

const VenuesPage = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('venues'); // Tab state for new dashboard
  const [selectedVenueForManagement, setSelectedVenueForManagement] = useState<string>(''); // Selected venue for availability/bookings
  const { user } = useContext(AuthContext)!;

  // Fetch venues for the logged-in owner
  useEffect(() => {
    const fetchVenues = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .or(`owner_id.eq.${user.user_id},user_id.eq.${user.user_id},submitted_by.eq.${user.user_id}`);
      if (error) {
        toast.error('Failed to fetch venues');
        return;
      }
      // Map Supabase fields to Venue interface
      const mappedVenues = (data || []).map((venue: any) => ({
        id: venue.id,
        name: venue.venue_name || venue.name,
        description: venue.description || '',
        address: venue.address,
        city: venue.city,
        state: venue.state,
        latitude: venue.latitude,
        longitude: venue.longitude,
        image: (venue.photos && venue.photos[0]) || '',
        photos: venue.photos || [],
        videos: venue.videos || [],
        pricing: {
          hourlyRate: Number(venue.price_per_hour || venue.hourly_rate || 0),
          peakHourRate: Number(venue.price_per_day || venue.daily_rate || 0),
        },
        amenities: venue.amenities || [],
        status: venue.status || 'inactive',
        availability: venue.availability || {},
        weekly_availability: venue.weekly_availability || {},
        capacity: venue.capacity,
        map_embed_code: venue.map_embed_code || '',
        stats: {
          totalBookings: venue.total_bookings || 0,
          revenue: Number(venue.revenue || 0),
          occupancyRate: venue.occupancy || 0,
        },
        featured_image: venue.featured_image,
      }));
      setVenues(mappedVenues);
      // Set first venue as default selection for management tabs
      if (mappedVenues.length > 0 && !selectedVenueForManagement) {
        setSelectedVenueForManagement(mappedVenues[0].id);
      }
    };
    fetchVenues();
  }, [user, selectedVenueForManagement]);

  const handleAddVenue = (newVenue: Omit<Venue, "id" | "stats">) => {
    const venue: Venue = {
      ...newVenue,
      id: Date.now().toString(),
      stats: {
        totalBookings: 0,
        revenue: 0,
        occupancyRate: 0
      }
    };
    setVenues([...venues, venue]);
    toast.success("Venue added successfully!");
  };

  const handleUpdateVenue = (updatedVenue: Venue) => {
    setVenues(venues.map(venue => venue.id === updatedVenue.id ? updatedVenue : venue));
    toast.success("Venue updated successfully!");
  };

  const handleDeleteVenue = (venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    if (venue) {
      setVenues(venues.filter(venue => venue.id !== venueId));
      toast.success(`${venue.name} deleted successfully!`);
    }
  };

  // Quick action to manage venue availability
  const handleManageVenueAvailability = (venueId: string) => {
    setSelectedVenueForManagement(venueId);
    setActiveTab('availability');
    toast.success(`Switched to managing ${venues.find(v => v.id === venueId)?.name} availability`);
  };

  // Quick action to manage venue bookings
  const handleManageVenueBookings = (venueId: string) => {
    setSelectedVenueForManagement(venueId);
    setActiveTab('bookings');
    toast.success(`Switched to managing ${venues.find(v => v.id === venueId)?.name} bookings`);
  };

  // Filter venues based on search and status
  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         venue.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || venue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get selected venue name for display
  const selectedVenueName = venues.find(v => v.id === selectedVenueForManagement)?.name || 'No venue selected';

  if (venues.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">My Venues</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your venues and settings</p>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              className="bg-gradient-accent hover:bg-accent/90 w-full sm:w-auto h-12 sm:h-10"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add New Venue</span>
              <span className="sm:hidden">Add Venue</span>
            </Button>
          </div>

          {/* Empty State - Mobile Optimized */}
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
              <Building2 className="h-8 w-8 sm:h-12 sm:w-12 text-primary-foreground" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">No venues yet</h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md text-sm sm:text-base">
              Start building your venue business by adding your first venue. You can manage pricing, availability, and bookings all in one place.
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              size="lg"
              className="bg-gradient-primary hover:bg-primary/90 h-12 px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Venue
            </Button>
          </div>

          <AddVenueDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onAddVenue={handleAddVenue}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">My Venues</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {activeTab === 'venues' 
                ? `Managing ${venues.length} venue${venues.length !== 1 ? 's' : ''} • Dashboard`
                : activeTab === 'availability' 
                  ? `Availability Control • ${selectedVenueName}`
                  : `Booking Management • ${selectedVenueName}`
              }
            </p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            className="bg-gradient-accent hover:bg-accent/90 w-full sm:w-auto h-12 sm:h-10"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add New Venue</span>
            <span className="sm:hidden">Add Venue</span>
          </Button>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="venues" id="tab-venues" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">My Venues</span>
              <span className="sm:hidden">Venues</span>
            </TabsTrigger>
            <TabsTrigger value="availability" id="tab-availability" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Availability Control</span>
              <span className="sm:hidden">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" id="tab-bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
              <span className="sm:hidden">Bookings</span>
            </TabsTrigger>
          </TabsList>

          {/* My Venues Tab (Existing Content) */}
          <TabsContent value="venues" id="content-venues" className="space-y-4 mt-6">
            {/* Search and Filters - Mobile Optimized */}
        <div className="space-y-3 sm:space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search venues by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 sm:h-10"
            />
          </div>

          {/* Filters and View Toggle - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-12 sm:h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} found
        </div>

        {/* Venues Grid/List - Mobile Optimized */}
        <div className="space-y-4">
          {filteredVenues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm sm:text-base">
                No venues match your search criteria.
              </p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "space-y-4"
            }>
              {filteredVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onUpdate={handleUpdateVenue}
                  onDelete={handleDeleteVenue}
                  onSelect={setSelectedVenue}
                  layout={viewMode}
                />
              ))}
            </div>
          )}
        </div>

          </TabsContent>

          {/* Availability Control Tab */}
          <TabsContent value="availability" id="content-availability" className="mt-6">
            {venues.length > 0 ? (
              <div className="space-y-4">
                {/* Venue Selector for Management */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Managing Availability For:</p>
                      <p className="text-sm text-muted-foreground">Select venue to view and manage its availability schedule</p>
                    </div>
                  </div>
                  <div className="min-w-[200px]">
                    <select
                      value={selectedVenueForManagement}
                      onChange={(e) => setSelectedVenueForManagement(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      id="venue-selector-availability"
                    >
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name} - {venue.address}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Availability Controller */}
                <VenueAvailabilityController 
                  venueId={selectedVenueForManagement} 
                  venues={venues}
                  compact={false}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Add a venue first to manage availability.</p>
                <Button 
                  onClick={() => {
                    setActiveTab('venues');
                    setIsAddDialogOpen(true);
                  }}
                  className="mt-4"
                >
                  Add Your First Venue
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" id="content-bookings" className="mt-6">
            {venues.length > 0 ? (
              <div className="space-y-4">
                {/* Venue Selector for Bookings */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Managing Bookings For:</p>
                      <p className="text-sm text-muted-foreground">Select venue to view and manage its bookings</p>
                    </div>
                  </div>
                  <div className="min-w-[200px]">
                    <select
                      value={selectedVenueForManagement}
                      onChange={(e) => setSelectedVenueForManagement(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      id="venue-selector-bookings"
                    >
                      {venues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name} - {venue.address}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Booking Management Dashboard */}
                <BookingManagementDashboard 
                  venueId={selectedVenueForManagement} 
                  key={selectedVenueForManagement}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Add a venue first to manage bookings.</p>
                <Button 
                  onClick={() => {
                    setActiveTab('venues');
                    setIsAddDialogOpen(true);
                  }}
                  className="mt-4"
                >
                  Add Your First Venue
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddVenueDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddVenue={handleAddVenue}
        />
        {selectedVenue && (
          <VenueDetailsModal
            venue={selectedVenue}
            isOpen={!!selectedVenue}
            onClose={() => setSelectedVenue(null)}
            onAction={() => setSelectedVenue(null)} // No approve/reject in owner view
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default VenuesPage;
