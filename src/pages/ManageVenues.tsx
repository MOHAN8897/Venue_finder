import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { venueService, Venue } from '../lib/venueService';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, AlertCircle, Edit, PlusCircle } from 'lucide-react';
import VenueVisibilityControl from '../components/VenueVisibilityControl';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { supabase } from '../lib/supabase';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';


const ManageVenues: React.FC = () => {
    const { user } = useAuth();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('approved');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showResubmitDialog, setShowResubmitDialog] = useState(false);
    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

    useEffect(() => {
        const loadVenues = async () => {
            console.log('[ManageVenues] useAuth user:', user);
            if (!user) {
                setError("You must be logged in to manage venues.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const ownerVenues = await venueService.getVenuesForOwner(user.id);
                console.log('[ManageVenues] getVenuesForOwner result:', ownerVenues);
                setVenues(ownerVenues);
            } catch (err: unknown) {
                setError("Failed to fetch venues. Please try again later.");
                if (err instanceof Error) {
                    console.error('[ManageVenues] Error:', err.message);
                } else {
                    console.error('[ManageVenues] Unexpected error:', err);
                }
            } finally {
                setLoading(false);
            }
        };
        loadVenues();

        // Real-time subscription for venue status changes
        let subscription: ReturnType<typeof supabase.channel> | undefined;
        if (user && user.id) {
            subscription = supabase
                .channel('venue-status-dashboard-' + user.id)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'venues',
                        filter: `owner_id=eq.${user.id}`
                    },
                    () => {
                        loadVenues();
                    }
                )
                .subscribe();
        }
        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [user]);

    // Tab filtering
    const filteredVenues = venues.filter(v => v.approval_status === activeTab);
    const stats = {
        pending: venues.filter(v => v.approval_status === 'pending').length,
        approved: venues.filter(v => v.approval_status === 'approved').length,
        rejected: venues.filter(v => v.approval_status === 'rejected').length,
    };

    // Venue controls
    const handleVisibilityChange = async (venueId: string, isPublished: boolean) => {
        toast.info(`Updating visibility for venue ${venueId} to ${isPublished ? 'Published' : 'Unpublished'}.`);
        setVenues(prev => prev.map(v => v.id === venueId ? {...v, is_published: isPublished} : v));
    };
    
    const handleUnavailabilityChange = async (venueId: string, dates: DateRange) => {
        if (!dates.from) {
            toast.error("A valid start date is required.");
            return;
        }
        const toDate = dates.to ? dates.to.toDateString() : 'open-ended';
        toast.info(`Setting unavailability for venue ${venueId} from ${dates.from.toDateString()} to ${toDate}.`);
    };

    const handleDelete = async (venueId: string) => {
        setSelectedVenueId(venueId);
        setShowDeleteDialog(true);
    };
    const confirmDelete = async () => {
        if (!selectedVenueId) return;
        // TODO: Implement delete logic
        toast.success(`Venue deleted.`);
        setVenues(prev => prev.filter(v => v.id !== selectedVenueId));
        setShowDeleteDialog(false);
        setSelectedVenueId(null);
    };
    const handleResubmit = async (venueId: string) => {
        setSelectedVenueId(venueId);
        setShowResubmitDialog(true);
    };
    const confirmResubmit = async () => {
        if (!selectedVenueId) return;
        // TODO: Implement resubmit logic
        toast.success(`Venue resubmitted for approval.`);
        setVenues(prev => prev.map(v => v.id === selectedVenueId ? { ...v, approval_status: 'pending', rejection_reason: undefined } : v));
        setShowResubmitDialog(false);
        setSelectedVenueId(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-600">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manage Your Venues</h1>
                <Button asChild>
                    <Link to="/list-venue"><PlusCircle className="mr-2 h-4 w-4" /> List a New Venue</Link>
                </Button>
            </div>
            {/* Summary stats bar */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="bg-blue-50 px-4 py-2 rounded-lg text-blue-700 font-semibold">Total: {venues.length}</div>
                <div className="bg-yellow-50 px-4 py-2 rounded-lg text-yellow-700 font-semibold">Pending: {stats.pending}</div>
                <div className="bg-green-50 px-4 py-2 rounded-lg text-green-700 font-semibold">Approved: {stats.approved}</div>
                <div className="bg-red-50 px-4 py-2 rounded-lg text-red-700 font-semibold">Rejected: {stats.rejected}</div>
            </div>
            {/* Tabs for status */}
            <div className="flex space-x-4 mb-6">
                <button className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setActiveTab('approved')}>Approved ({stats.approved})</button>
                <button className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setActiveTab('pending')}>Pending ({stats.pending})</button>
                <button className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setActiveTab('rejected')}>Rejected ({stats.rejected})</button>
            </div>
            {filteredVenues.length === 0 ? (
                <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-medium text-gray-900">{activeTab === 'approved' ? 'No approved venues yet.' : activeTab === 'pending' ? 'No venues pending approval.' : 'No rejected venues.'}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {activeTab === 'approved' && 'Get started by listing your first venue.'}
                        {activeTab === 'pending' && 'Venues you submit for approval will appear here.'}
                        {activeTab === 'rejected' && 'Rejected venues will appear here. You can resubmit after making corrections.'}
                    </p>
                    {activeTab === 'approved' && (
                        <Button asChild className="mt-4">
                            <Link to="/list-venue"><PlusCircle className="mr-2 h-4 w-4" /> List a New Venue</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVenues.map(venue => (
                        <Card key={venue.id}>
                            <CardHeader className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <CardTitle>{venue.name}</CardTitle>
                                    {/* Status badge */}
                                    {venue.approval_status === 'approved' && <Badge className="bg-green-100 text-green-700">Approved</Badge>}
                                    {venue.approval_status === 'pending' && <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>}
                                    {venue.approval_status === 'rejected' && <Badge className="bg-red-100 text-red-700">Rejected</Badge>}
                                </div>
                                <CardDescription>{venue.type}</CardDescription>
                                {venue.rejection_reason && <div className="text-xs text-red-500 mt-2">Reason: {venue.rejection_reason}</div>}
                                {/* Placeholder for admin notes */}
                                {/* <div className="text-xs text-gray-500 mt-1">Admin notes: ...</div> */}
                            </CardHeader>
                            <CardContent>
                                <VenueVisibilityControl
                                    venue={venue}
                                    onVisibilityChange={handleVisibilityChange}
                                    onUnavailabilityChange={handleUnavailabilityChange}
                                />
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button asChild variant="outline" className="w-full">
                                    <Link to={`/edit-venue/${venue.id}`}><Edit className="mr-2 h-4 w-4" /> Edit Venue</Link>
                                </Button>
                                <Button variant="destructive" className="w-full" onClick={() => handleDelete(venue.id)}>
                                    Delete
                                </Button>
                                {venue.approval_status === 'rejected' && (
                                    <Button variant="default" className="w-full" onClick={() => handleResubmit(venue.id)}>
                                        Resubmit
                                    </Button>
                                )}
                                {/* Activity log button placeholder */}
                                <Button variant="secondary" className="w-full" disabled>
                                    View Activity Log (Coming Soon)
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            {/* Delete confirmation dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Venue</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this venue? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Resubmit confirmation dialog */}
            <Dialog open={showResubmitDialog} onOpenChange={setShowResubmitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resubmit Venue</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to resubmit this venue for approval?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResubmitDialog(false)}>Cancel</Button>
                        <Button variant="default" onClick={confirmResubmit}>Resubmit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageVenues; 