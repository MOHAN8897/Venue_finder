import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "../components/ui/button";
import { 
  BarChart3, 
  Users, 
  Building2, 
  Settings, 
  LogOut,
  Search,
  Shield
} from "lucide-react";
import { supabase } from '../lib/supabase';

const sidebarTabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "venues", label: "Venue Management", icon: Building2 },
  { id: "users", label: "User Management", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Admin Settings", icon: Settings },
  { id: "admins", label: "Admin Management", icon: Shield },
];

interface VenueListItem {
  id: string;
  name: string;
  type: string;
  approval_status: string; 
  submission_date?: string;
  submitted_by?: string;
  profiles?: {
    user_id?: string;
    email?: string;
    avatar_url?: string;
    full_name?: string;
  };
}

interface VenueSubmissionDetails {
  venue: {
    id: string;
    name: string;
    description: string;
    type: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    zip_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    capacity: number;
    area: string;
    dimensions?: string;
    hourly_rate: number;
    daily_rate?: number;
    price_per_hour?: number;
    price_per_day?: number;
    currency: string;
    images: string[];
    videos: string[];
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    website?: string;
    owner_id: string; 
    status: string;
    verified: boolean;
    rating: number;
    review_count: number;
    total_reviews?: number;
    created_at: string;
    updated_at: string;
    image_urls?: string[]; 
    is_published: boolean;
    submission_date?: string;
    approval_date?: string;
    rejection_reason?: string;
    approved_by?: string; 
    submitted_by?: string; 
    approval_status: string; 
  };
  submitter: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  created_at?: string;
    user_id?: string; 
  };
  amenities: {
    id: string;
    name: string;
    icon?: string;
    category?: string;
  }[];
  slots: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    available: boolean;
    price: number;
  }[];
}

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("venues");
  const [venues, setVenues] = useState<VenueListItem[]>([]); 
  const [loading, setLoading] = useState(false); // Initialize to false. Only set true when fetchVenues starts.
  const [error, setError] = useState('');
  const [venueTab, setVenueTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [viewMode, setViewMode] = useState<'list' | 'detailed'>('list');
  const [selectedVenue, setSelectedVenue] = useState<VenueSubmissionDetails | null>(null); 
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [search, setSearch] = useState('');
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [activityLogs, setActivityLogs] = useState<unknown[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Ref to store the ID of the latest fetch request
  const latestFetchId = useRef<number>(0);

  // Memoized fetchVenues function
  const fetchVenues = useCallback(async (status: 'pending' | 'approved' | 'rejected' = venueTab) => {
    const currentFetchId = Date.now();
    latestFetchId.current = currentFetchId;

    console.log(`[FetchVenues] Fetch started for tab: ${status}, currentFetchId: ${currentFetchId}`); // DEBUG
      setLoading(true);
    setError(''); // Clear any previous errors here

    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`*, profiles:submitted_by (user_id, email, avatar_url, full_name)`)
        .eq('approval_status', status)
        .order('submission_date', { ascending: false });
      
      if (error) {
        console.error(`[FetchVenues] Error for ${currentFetchId}:`, error); // DEBUG
        throw error;
      }
      if (latestFetchId.current === currentFetchId) { // Only update state if this is the latest fetch
      setVenues(data || []);
        console.log(`[FetchVenues] Data received for ${currentFetchId}, updated state. Data:`, data); // DEBUG
      } else {
        console.log(`[FetchVenues] Data received for ${currentFetchId}, but it's not the latest. Skipping state update.`); // DEBUG
      }

    } catch (err: unknown) {
      if (latestFetchId.current === currentFetchId) { // Only update error state if this is the latest fetch
        let message = 'Failed to fetch venues.';
        if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string') {
          message = (err as { message: string }).message;
        }
        setError(message);
        setVenues([]);
        console.error(`[FetchVenues] Error handler for ${currentFetchId}, updated error state.`, err); // DEBUG
      } else {
        console.error(`[FetchVenues] Error for ${currentFetchId}, but it's not the latest. Skipping error state update.`, err); // DEBUG
      }
    } finally {
      if (latestFetchId.current === currentFetchId) { // Only set loading to false if this is the latest fetch
      setLoading(false);
        console.log(`[FetchVenues] Fetch finished for ${currentFetchId}, setLoading(false).`); // DEBUG
      } else {
        console.log(`[FetchVenues] Fetch finished for ${currentFetchId}, but it's not the latest. Not setting loading to false.`); // DEBUG
      }
      console.log(`[FetchVenues] Final state check for ${currentFetchId}: loading is now ${loading}, latestFetchId is ${latestFetchId.current}`); // DEBUG
    }
  }, [supabase, venueTab]); // Remove 'loading' from dependencies to avoid unnecessary re-renders

  // Filter out only truly incomplete venues (must have both name and type)
  const isVenueComplete = (venue: VenueListItem) => {
    return Boolean(venue.name && venue.type);
  };

  // Filtered venues for display
  const filteredVenues = venues
    .filter(isVenueComplete)
    .filter((venue: VenueListItem) => {
      const email = venue.profiles?.email || '';
      const name = venue.name || '';
      const type = venue.type || '';
      return (
        email.toLowerCase().includes(search.toLowerCase()) ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        type.toLowerCase().includes(search.toLowerCase())
      );
    });

  // Clear search input, reset detailed view, and clear logs on venueTab switch for better UX
  useEffect(() => {
    console.log(`[useEffect - venueTab] venueTab changed to: ${venueTab}`); // DEBUG
    setSearch('');
    setViewMode('list'); // Always go back to list view when switching venue tabs
    setSelectedVenue(null); // Clear selected venue details
    setAdminNotes(''); // Clear admin notes
    setRejectionReason(''); // Clear rejection reason
    setActivityLogs([]); // Clear activity logs
    setShowLogs(false); // Hide logs
    // eslint-disable-next-line
  }, [venueTab]);

  // Always fetch venues on mount and on tab change
  useEffect(() => {
    console.log(`[useEffect - activeTab/venueTab] activeTab: ${activeTab}, venueTab: ${venueTab}`); // DEBUG
    if (activeTab === 'venues') {
      fetchVenues(venueTab);
    } else {
      setLoading(false);
      latestFetchId.current = 0;
      console.log(`[useEffect - activeTab/venueTab] Leaving venues tab, setLoading(false), latestFetchId reset.`); // DEBUG
    }
  }, [activeTab, venueTab, fetchVenues]);

  // New: Reset venue-specific states when navigating to the "Venue Management" tab
  useEffect(() => {
    console.log(`[useEffect - activeTab Only] activeTab changed to: ${activeTab}`); // DEBUG
    if (activeTab === 'venues') {
      setViewMode('list');
      setSelectedVenue(null);
      setSearch('');
      setAdminNotes('');
      setRejectionReason('');
      setActivityLogs([]);
      setShowLogs(false);
      // Ensure the default venueTab is 'pending' to trigger initial fetch if needed
      // No need to set setVenueTab here if it's already 'pending', to avoid redundant re-renders
      if (venueTab !== 'pending') {
        setVenueTab('pending');
        console.log(`[useEffect - activeTab Only] Setting venueTab to pending.`); // DEBUG
      }
    } else {
      // Ensure venue-specific loading states are also reset when leaving the venues tab
      setDetailsLoading(false);
      setLogsLoading(false);
      console.log(`[useEffect - activeTab Only] Leaving non-venues tab, resetting detailsLoading/logsLoading.`); // DEBUG
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // Debug useEffect for 'loading' state changes
  useEffect(() => {
    console.log(`[Loading State] 'loading' state changed to: ${loading}`); // DEBUG
  }, [loading]);

  // Helper to refresh venues after any update
  const refreshVenues = useCallback(() => fetchVenues(venueTab), [fetchVenues, venueTab]);

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
  }, []);

  // Memoized fetchVenueDetails function
  const fetchVenueDetails = useCallback(async (venueId: string) => {
    setDetailsLoading(true);
    setSelectedVenue(null); // Clear previous details immediately
    setError(''); // Clear any previous errors here
    try {
    const { data, error } = await supabase.rpc('get_venue_approval_details', { venue_uuid: venueId });
      if (error) throw error;
      setSelectedVenue(Array.isArray(data) ? data[0] : data);
    } catch (err: unknown) {
      let message = 'Failed to fetch venue details.';
      if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string') {
        message = (err as { message: string }).message;
      }
      setError(message);
      setSelectedVenue(null);
    } finally {
      setDetailsLoading(false);
    }
  }, [supabase]);

  // Memoized fetchActivityLogs function
  const fetchActivityLogs = useCallback(async (venueId: string) => {
    setLogsLoading(true);
    setError(''); // Clear any previous errors here
    try {
      const { data, error } = await supabase
        .from('venue_approval_logs')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setActivityLogs(data || []);
    } catch (err: unknown) {
      let message = 'Failed to fetch activity logs.';
      if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string') {
        message = (err as { message: string }).message;
      }
      setError(message);
      setActivityLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [supabase]);

  const getAdminId = () => {
    let session = localStorage.getItem('superAdminSession');
    if (!session) {
      session = sessionStorage.getItem('superAdminSession');
    }
    if (session) {
      try {
        const sessionObj = JSON.parse(session);
        return sessionObj.adminUuid; // use the UUID
      } catch {
        return null;
      }
    }
    return null;
  };

  const handleApprove = async (venueId: string) => {
    setLoading(true);
    setError('');
    const adminNotesToSend = adminNotes;
    const { error: approveError } = await supabase.rpc('approve_venue', {
      venue_uuid: venueId,
      admin_notes: adminNotesToSend
    });
    if (approveError) setError(approveError.message);
    setSelectedVenue(null);
    await refreshVenues();
    setLoading(false);
  };

  const handleReject = async (venueId: string) => {
    setLoading(true);
    setError('');
    const adminNotesToSend = adminNotes;
    const rejectionReasonToSend = rejectionReason;
    const { error: rejectError } = await supabase.rpc('reject_venue', {
      venue_uuid: venueId,
      rejection_reason: rejectionReasonToSend,
      admin_notes: adminNotesToSend
    });
    if (rejectError) setError(rejectError.message);
    setSelectedVenue(null);
    await refreshVenues();
    setLoading(false);
  };

  const stats = useMemo(() => ({
    pending: venues.length,
    approved: venueTab === 'approved' ? venues.length : undefined,
    rejected: venueTab === 'rejected' ? venues.length : undefined,
  }), [venues.length, venueTab]);

  const handleLogout = async () => {
    // End Supabase session
    await supabase.auth.signOut();
    // Remove all Supabase and app session keys
    localStorage.removeItem('superAdminSession');
    sessionStorage.removeItem('superAdminSession');
    // Remove all Supabase keys (tokens, etc.)
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('sb-')) sessionStorage.removeItem(key);
    });
    // Optionally reset any in-memory state here (if using context/store)
    // Redirect to login with signed out message
    window.location.href = '/super-admin/login?signedout=1';
  };

  const handleBatchApprove = async () => {
    setLoading(true);
    const adminId = getAdminId();
    for (const venueId of selectedVenues) {
      await supabase.rpc('set_venue_approval_status', {
        venue_uuid: venueId,
        new_status: 'approved',
        admin_id: adminId,
        reason: null
      });
      await supabase.rpc('log_venue_approval_action', {
        venue_id: venueId,
        action: 'approved',
        admin_id: adminId,
        reason: null,
        notes: adminNotes
      });
    }
    setSelectedVenues([]);
    await refreshVenues();
    setLoading(false);
  };

  const handleBatchReject = async () => {
    setLoading(true);
    const adminId = getAdminId();
    for (const venueId of selectedVenues) {
      await supabase.rpc('set_venue_approval_status', {
        venue_uuid: venueId,
        new_status: 'rejected',
        admin_id: adminId,
        reason: rejectionReason
      });
      await supabase.rpc('log_venue_approval_action', {
        venue_id: venueId,
        action: 'rejected',
        admin_id: adminId,
        reason: rejectionReason,
        notes: adminNotes
      });
    }
    setSelectedVenues([]);
    await refreshVenues();
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 dark:bg-gray-900 text-white p-6 space-y-6">
        <div className="text-2xl font-bold">Admin Panel</div>
          <nav className="space-y-2">
            {sidebarTabs.map((tab) => (
              <Button
                key={tab.id}
              variant="ghost"
              className={`w-full justify-start text-left ${activeTab === tab.id ? 'bg-gray-700 dark:bg-gray-700' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
              <tab.icon className="mr-3 h-5 w-5" />
                {tab.label}
              </Button>
            ))}
          <Button
            variant="ghost"
            className="w-full justify-start text-left text-red-400 hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
          </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{sidebarTabs.find(tab => tab.id === activeTab)?.label}</h1>
          {activeTab === "venues" && viewMode === "list" && (
            <div className="flex space-x-2">
              <Button onClick={handleBatchApprove} disabled={selectedVenues.length === 0} variant="default">Batch Approve ({selectedVenues.length})</Button>
              <Button onClick={handleBatchReject} disabled={selectedVenues.length === 0} variant="destructive">Batch Reject ({selectedVenues.length})</Button>
        </div>
          )}
        </header>

        {error && <div className="bg-red-500 text-white p-3 rounded mb-4">Error: {error}</div>}

        {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Total Venues</h2>
              <p className="text-4xl font-bold">{stats.pending + (stats.approved || 0) + (stats.rejected || 0)}</p>
              </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Pending Venues</h2>
              <p className="text-4xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Approved Venues</h2>
              <p className="text-4xl font-bold">{stats.approved || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Rejected Venues</h2>
              <p className="text-4xl font-bold">{stats.rejected || 0}</p>
          </div>
            </section>
          )}

        {/* Venue Management Tab */}
          {activeTab === "venues" && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <div className="space-x-2">
                <Button variant={venueTab === 'pending' ? 'default' : 'outline'} onClick={() => { setVenueTab('pending'); setViewMode('list'); setDetailsLoading(false); setLogsLoading(false); }}>Pending</Button>
                <Button variant={venueTab === 'approved' ? 'default' : 'outline'} onClick={() => { setVenueTab('approved'); setViewMode('list'); setDetailsLoading(false); setLogsLoading(false); }}>Approved</Button>
                <Button variant={venueTab === 'rejected' ? 'default' : 'outline'} onClick={() => { setVenueTab('rejected'); setViewMode('list'); setDetailsLoading(false); setLogsLoading(false); }}>Rejected</Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                  placeholder="Search venues by email, name, type..."
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
      </div>

              {loading ? (
              <div className="text-center py-12">Loading venues...</div>
              ) : (
                // Only render list or detailed view if not loading
                viewMode === 'list' ? (
                  filteredVenues.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No {venueTab} venues found.</div>
                  ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVenues.map((venue: VenueListItem) => {
                        const user = venue.profiles || {};
                        if (!venue.profiles) {
                          console.warn(`[Profile] No profile found for venue id: ${venue.id}, submitted_by: ${venue.submitted_by}`); // DEBUG
                        }
                        const avatarUrl = user.avatar_url;
                        const displayName = user.full_name || user.email || venue.name || 'Unknown User';
                        const displayEmail = user.email || 'No email';
                        const displayInitial = (user.email ? user.email[0] : (venue.name ? venue.name[0] : '?')).toUpperCase();
                    return (
                          <div key={venue.id} className={`border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 cursor-pointer relative ${selectedVenues.includes(venue.id) ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => { fetchVenueDetails(venue.id); setViewMode('detailed'); }}>
                        <div className="flex items-center gap-3 mb-2">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {displayInitial}
                            </div>
                          )}
                          <div>
                                <div className="font-semibold">{displayName}</div>
                                <div className="text-xs text-gray-500">{displayEmail}</div>
                          </div>
                        </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">{venue.name}</div>
                            <div className="text-xs text-gray-400">{venue.type}</div>
                        <div className="text-xs mt-1">Status: <span className="font-semibold capitalize">{venueTab}</span></div>
                            <div className="text-xs text-gray-400">Submitted: {venue.submission_date ? new Date(venue.submission_date).toLocaleString() : 'N/A'}</div>
                      </div>
                    );
                  })}
                </div>
                  )
              ) : (
                  // Detailed View Conditional Rendering
                  detailsLoading ? (
                    <div className="text-center py-12">Loading details...</div>
                  ) : selectedVenue ? (
                  (() => {
                    const sv = selectedVenue; 
                    const venue = sv.venue;
                    const submitter = sv.submitter;
                    const amenities = sv.amenities || [];
                    const slots = sv.slots || [];

                    return (
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-4xl mx-auto space-y-6">
                        {/* Submitter Details */}
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                          {submitter?.avatar_url ? (
                            <img src={submitter.avatar_url} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
                          ) : (
                            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                              {submitter?.email ? submitter.email[0].toUpperCase() : '?'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-lg">{submitter?.full_name || 'Unknown User'}</div>
                            <div className="text-xs text-gray-500">{submitter?.email}</div>
                            <div className="text-xs text-gray-400">Submitted by User ID: {venue?.submitted_by || 'N/A'}</div>
                          </div>
      </div>

                        {/* Venue Details */}
                        <div className="mb-4 space-y-2">
                          <h3 className="font-bold text-xl mb-2">Venue Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                            <DetailItem label="Name" value={venue.name} />
                            <DetailItem label="Type" value={venue.type} />
                            <DetailItem label="Description" value={venue.description} />
                            <DetailItem label="Address" value={`${venue.address}, ${venue.city}, ${venue.state} - ${venue.pincode}`} />
                            <DetailItem label="Capacity" value={`${venue.capacity} people`} />
                            <DetailItem label="Area" value={venue.area} />
                            {venue.dimensions && <DetailItem label="Dimensions" value={venue.dimensions} />} 
                            <DetailItem label="Hourly Rate" value={`${venue.currency} ${venue.hourly_rate}`} />
                            {venue.daily_rate && <DetailItem label="Daily Rate" value={`${venue.currency} ${venue.daily_rate}`} />}
                            {venue.website && <DetailItem label="Website" value={venue.website} isLink={true} />} 
                            <DetailItem label="Contact Name" value={venue.contact_name} />
                            <DetailItem label="Contact Phone" value={venue.contact_phone} />
                            <DetailItem label="Contact Email" value={venue.contact_email} />
                            <DetailItem label="Status" value={venue.status} isCapitalized={true} />
                            <DetailItem label="Approval Status" value={venue.approval_status} isCapitalized={true} />
                            <DetailItem label="Submission Date" value={venue.submission_date ? new Date(venue.submission_date).toLocaleString() : 'N/A'} />
                            {venue.rejection_reason && <DetailItem label="Rejection Reason" value={venue.rejection_reason} />}
                            {venue.approved_by && <DetailItem label="Approved By" value={venue.approved_by} />} 
                            {venue.approval_date && <DetailItem label="Approval Date" value={new Date(venue.approval_date).toLocaleString()} />} 
                            <DetailItem label="Is Published" value={venue.is_published} isCapitalized={true} />
                            <DetailItem label="Verified" value={venue.verified} isCapitalized={true} />
                          </div>
    </div>

                        {/* Venue Media (Images & Videos) */}
                        {(venue.images?.length > 0 || venue.videos?.length > 0) && (
                          <div className="mb-4 space-y-2">
                            <h3 className="font-bold text-xl mb-2">Media</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {venue.images?.map((imageUrl, index) => (
                                <img key={index} src={imageUrl} alt={`Venue Image ${index + 1}`} className="w-full h-48 object-cover rounded-md shadow" />
                              ))}
                              {venue.videos?.map((videoUrl, index) => (
                                <video key={index} src={videoUrl} controls className="w-full h-48 object-cover rounded-md shadow" />
                            ))}
            </div>
          </div>
                        )}

                        {/* Amenities */}
                        {amenities.length > 0 && (
                          <div className="mb-4 space-y-2">
                            <h3 className="font-bold text-xl mb-2">Amenities</h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 list-disc pl-5">
                              {amenities.map(amenity => (
                                <li key={amenity.id} className="text-gray-700 dark:text-gray-300">{amenity.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Slots */}
                        {slots.length > 0 && (
                          <div className="mb-4 space-y-2">
                            <h3 className="font-bold text-xl mb-2">Available Slots (Upcoming)</h3>
                            <div className="overflow-x-auto">
                              <table className="min-w-full bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                                <thead>
                                  <tr className="bg-gray-100 dark:bg-gray-700">
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Time</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Price</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Available</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {slots.map(slot => (
                                    <tr key={slot.id} className="border-t border-gray-200 dark:border-gray-700">
                                      <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">{new Date(slot.date).toLocaleDateString()}</td>
                                      <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">{`${slot.start_time} - ${slot.end_time}`}</td>
                                      <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">{`${venue.currency} ${slot.price}`}</td>
                                      <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">{slot.available ? 'Yes' : 'No'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
                          {venue.approval_status === 'pending' && (
                            <>
                              <Button variant="default" onClick={() => handleApprove(venue.id)}>Approve</Button>
                          <input type="text" placeholder="Admin notes (optional)" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="px-2 py-1 rounded border text-black" />
                              <Button variant="destructive" onClick={() => handleReject(venue.id)}>Reject</Button>
                          <input type="text" placeholder="Rejection reason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="px-2 py-1 rounded border text-black" />
                            </>
                          )}
                          <Button variant="ghost" onClick={() => { setSelectedVenue(null); setViewMode('list'); }}>Back to List</Button>
                          <Button variant="outline" onClick={() => fetchActivityLogs(venue.id)}>{showLogs ? 'Hide Logs' : 'Show Logs'}</Button>
                        </div>

                        {/* Activity Logs */}
                        {showLogs && (
                          <div className="mt-6 space-y-2">
                            <h4 className="font-semibold mb-2">Activity Logs</h4>
                            {logsLoading ? (
                              <div>Loading logs...</div>
                            ) : activityLogs.length === 0 ? (
                              <div>No logs found for this venue.</div>
                            ) : (
                              <ul className="space-y-2">
                                {activityLogs.map((log) => {
                                  const l = log as { id: string; action: string; created_at: string; admin_notes?: string; reason?: string };
                                  return (
                                    <li key={l.id} className="border-b border-gray-200 pb-2">
                                      <div className="flex justify-between text-xs">
                                        <span className="font-medium">{l.action.toUpperCase()}</span>
                                        <span>{new Date(l.created_at).toLocaleString()}</span>
                                      </div>
                                      <div className="text-gray-700 dark:text-gray-300">{l.admin_notes || l.reason || '-'}</div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        )}
        </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-12">Select a venue to view details.</div>
                  )
                )
              )}
            </section>
          )}

          {activeTab === "users" && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">User Management</h2>
              <p>User management features will be implemented here.</p>
            </section>
          )}

          {activeTab === "reports" && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Reports</h2>
              <p>Reporting features will be implemented here.</p>
            </section>
          )}

          {activeTab === "settings" && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Admin Settings</h2>
              <p>Admin settings will be configured here.</p>
            </section>
          )}

          {activeTab === "admins" && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Admin Management</h2>
              <p>Admin management features will be implemented here.</p>
            </section>
            )}
        </main>
      </div>
  );
}

function DetailItem({ label, value, isLink = false, isCapitalized = false }: { label: string; value: string | number | boolean | undefined | null; isLink?: boolean; isCapitalized?: boolean }) {
  if (value === undefined || value === null || value === '') return null;

  let displayValue = value.toString();
  if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else if (isCapitalized && typeof value === 'string') {
    displayValue = value.charAt(0).toUpperCase() + value.slice(1);
  }

  if (isLink) {
  return (
      <div>
        <strong className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}:</strong>
        <a href={displayValue} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {displayValue}
        </a>
      </div>
    );
  }

  return (
    <div>
      <strong className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}:</strong>
      <span className="block text-sm text-gray-900 dark:text-white">{displayValue}</span>
    </div>
  );
}

export default SuperAdminDashboard;