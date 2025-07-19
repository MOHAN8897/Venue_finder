
import { DashboardLayout } from "@/components/cricket-dashboard/DashboardLayout";
import { VenueCard } from "@/components/cricket-dashboard/BoxCard";
import { AddVenueDialog } from "@/components/cricket-dashboard/AddBoxDialog";
import { GoogleMapView } from "@/components/cricket-dashboard/GoogleMapView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Grid3X3, Map, Building2 } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import { AuthContext } from "@/context/AuthContext";
import { VenueDetailsModal } from '@/components/dashboard/VenueDetailsModal';

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
    };
    fetchVenues();
  }, [user]);

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

  if (venues.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Venues</h1>
              <p className="text-muted-foreground">Manage your venues and settings</p>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              className="bg-gradient-accent hover:bg-accent/90 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Venue
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6">
              <Building2 className="h-12 w-12 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No venues yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Start building your venue business by adding your first venue. You can manage pricing, availability, and bookings all in one place.
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              size="lg"
              className="bg-gradient-primary hover:bg-primary/90"
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
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Venues</h1>
            <p className="text-muted-foreground">
              Managing {venues.length} venue{venues.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            className="bg-gradient-accent hover:bg-accent/90 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Venue
          </Button>
        </div>

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-1">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Grid View</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {venues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onUpdate={handleUpdateVenue}
                  onDelete={handleDeleteVenue}
                  onSelect={setSelectedVenue}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

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
