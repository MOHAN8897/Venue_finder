
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VenueTable } from './VenueTable';
import { VenueDetailsModal } from './VenueDetailsModal';
import { RejectionModal } from './RejectionModal';
import { Search, Calendar as CalendarIcon, Check, Eye, Filter as FilterIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

type VenueDB = {
  id: string;
  venue_name: string;
  venue_type: string;
  address: string;
  location_link: string;
  website: string;
  user_id: string;
  owner_id: string;
  submitted_by: string;
  created_at: string;
  updated_at: string;
  description: string;
  map_embed_code: string;
  capacity: number;
  area: number;
  amenities: string[];
  photos: string[];
  videos: string[];
  price_per_hour: string;
  price_per_day: string;
  availability: string[];
  contact_number: string;
  email: string;
  company: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  admin_feedback: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  owner_name: string | null;
};

const getImageUrl = (img: string) => {
  if (img.startsWith('http')) return img;
  // Use Supabase Storage public URL
  const { data } = supabase.storage.from('venue-photos').getPublicUrl(img);
  return data?.publicUrl || img;
};

const mapVenue = (venue: VenueDB) => ({
  ...venue,
  name: venue.venue_name,
  location: venue.address,
  ownerName: venue.owner_name || venue.company || 'N/A',
  ownerEmail: venue.email,
  price: Number(venue.price_per_hour ?? 0),
  status: venue.approval_status,
  submittedAt: venue.created_at,
  rejectionReason: venue.rejection_reason,
  images: Array.isArray(venue.photos) ? venue.photos.map(getImageUrl) : [],
  venue_type: venue.venue_type,
  address: venue.address,
  company: venue.company,
  contact_number: venue.contact_number,
  price_per_hour: venue.price_per_hour,
  price_per_day: venue.price_per_day,
  map_embed_code: venue.map_embed_code,
  capacity: venue.capacity,
  amenities: Array.isArray(venue.amenities) ? venue.amenities : [],
  description: venue.description,
});

export function VenuesPage() {
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [venues, setVenues] = useState<VenueDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [filterActive, setFilterActive] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [venueToReject, setVenueToReject] = useState<VenueDB | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setVenues(data as VenueDB[]);
      }
      setLoading(false);
    };
    fetchVenues();
  }, []);

  // Date filter logic
  const filterByDate = (venueList: any[]) => {
    if (!filterActive || !fromDate || !toDate) return venueList;
    return venueList.filter(v => {
      const date = new Date(v.submittedAt || v.created_at);
      return date >= fromDate && date <= toDate;
    });
  };

  const handleApplyFilter = () => {
    setDateError(null);
    if (fromDate && toDate && toDate < fromDate) {
      setDateError('To date must be after From date.');
      setFilterActive(false);
      return;
    }
    if (fromDate && toDate) {
      setFilterActive(true);
    } else {
      setFilterActive(false);
    }
  };

  const handleClearFilter = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setFilterActive(false);
    setDateError(null);
  };

  const pendingVenues = filterByDate(venues.filter(v => v.approval_status === 'pending').map(mapVenue));
  const approvedVenues = filterByDate(venues.filter(v => v.approval_status === 'approved').map(mapVenue));
  const rejectedVenues = filterByDate(venues.filter(v => v.approval_status === 'rejected').map(mapVenue));

  // Refresh handler
  const handleRefresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setVenues(data as VenueDB[]);
    }
    setLoading(false);
  };

  const handleViewVenue = (venue: VenueDB) => {
    setSelectedVenue(venue);
  };

  const handleEditVenue = (venue: VenueDB) => {
    // This will be implemented with edit modal
    console.log('Edit venue:', venue.id);
  };

  // Approve/Reject logic
  const handleVenueAction = async (venueId: string, action: 'approve' | 'reject', reason?: string) => {
    if (action === 'reject' && !reason) {
      // Find the venue to reject and show modal
      const venue = venues.find(v => v.id === venueId);
      if (venue) {
        setVenueToReject(venue);
        setShowRejectionModal(true);
      }
      return;
    }

    setLoading(true);
    try {
      if (action === 'approve') {
        const { data, error } = await supabase.rpc('approve_venue', {
          venue_uuid: venueId,
          admin_notes: 'Approved by super admin'
        });
        
        if (error) {
          console.error('Error approving venue:', error);
          // Handle error - could show a toast notification
        } else if (data && data.success) {
          console.log('Venue approved successfully:', data.message);
        }
      } else if (action === 'reject' && reason) {
        const { data, error } = await supabase.rpc('reject_venue', {
          venue_uuid: venueId,
          rejection_reason: reason,
          admin_notes: 'Rejected by super admin'
        });
        
        if (error) {
          console.error('Error rejecting venue:', error);
          // Handle error - could show a toast notification
        } else if (data && data.success) {
          console.log('Venue rejected successfully:', data.message);
        }
      }
      
      // Refresh list
      const { data: refreshData, error: refreshError } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false });
      if (!refreshError && refreshData) {
        setVenues(refreshData as VenueDB[]);
      }
    } catch (error) {
      console.error('Error in venue action:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle rejection confirmation
  const handleRejectionConfirm = async (reason: string) => {
    if (!venueToReject) return;
    
    await handleVenueAction(venueToReject.id, 'reject', reason);
    setVenueToReject(null);
    setShowRejectionModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Venue Management</h1>
          <p className="text-muted-foreground">Review and manage venue submissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
      {/* Improved Date Filter UI */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-muted p-4 rounded-2xl shadow-md w-full max-w-xl mb-4">
        {/* From Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate ? format(fromDate, 'PPP') : 'From Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
          </PopoverContent>
        </Popover>
        {/* To Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, 'PPP') : 'To Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus />
          </PopoverContent>
        </Popover>
        {/* Filter Button */}
        <Button variant="default" className="gap-2" onClick={handleApplyFilter}>
          <FilterIcon className="h-4 w-4" />
          Filter
        </Button>
        {/* Clear Button */}
        <Button variant="ghost" className="gap-2" onClick={handleClearFilter}>
          Clear
        </Button>
      </div>
      {dateError && <div className="text-red-500 text-sm mb-2">{dateError}</div>}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-status-pending" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingVenues.length}</div>
            <Badge variant="secondary" className="bg-status-pending text-white mt-2">
              {pendingVenues.length > 0 ? 'Needs Attention' : 'No Pending'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <Check className="h-4 w-4 text-status-approved" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{approvedVenues.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
            <Eye className="h-4 w-4 text-status-rejected" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{rejectedVenues.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Require updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search venues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Venue Tables */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingVenues.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 bg-status-pending text-white">
                {pendingVenues.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <VenueTable
            venues={pendingVenues}
            onViewDetails={v => setSelectedVenue(v)}
            onAction={handleVenueAction}
            searchQuery={searchQuery}
            venueStatus="pending"
          />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <VenueTable
            venues={approvedVenues}
            onViewDetails={v => setSelectedVenue(v)}
            onAction={handleVenueAction}
            searchQuery={searchQuery}
            venueStatus="approved"
          />
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <VenueTable
            venues={rejectedVenues}
            onViewDetails={v => setSelectedVenue(v)}
            onAction={handleVenueAction}
            searchQuery={searchQuery}
            venueStatus="rejected"
          />
        </TabsContent>
      </Tabs>

      {/* Venue Details Modal */}
      {selectedVenue && (
        <VenueDetailsModal
          venue={selectedVenue}
          isOpen={!!selectedVenue}
          onClose={() => setSelectedVenue(null)}
          onAction={handleVenueAction}
        />
      )}

      {/* Rejection Modal */}
      {showRejectionModal && venueToReject && (
        <RejectionModal
          isOpen={showRejectionModal}
          onClose={() => {
            setShowRejectionModal(false);
            setVenueToReject(null);
          }}
          onConfirm={handleRejectionConfirm}
          venueName={venueToReject.venue_name}
        />
      )}
    </div>
  );
}
