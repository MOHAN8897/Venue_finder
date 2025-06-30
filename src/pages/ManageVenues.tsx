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


const ManageVenues: React.FC = () => {
    const { user } = useAuth();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadVenues = async () => {
            if (!user) {
                setError("You must be logged in to manage venues.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const ownerVenues = await venueService.getVenuesForOwner(user.id);
                setVenues(ownerVenues);
            } catch (err: unknown) {
                setError("Failed to fetch venues. Please try again later.");
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

            {venues.length === 0 ? (
                <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-medium text-gray-900">No venues found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by listing your first venue.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {venues.map(venue => (
                        <Card key={venue.id}>
                            <CardHeader>
                                <CardTitle>{venue.name}</CardTitle>
                                <CardDescription>{venue.type}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <VenueVisibilityControl
                                    venue={venue}
                                    onVisibilityChange={handleVisibilityChange}
                                    onUnavailabilityChange={handleUnavailabilityChange}
                                />
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="outline" className="w-full">
                                    <Link to={`/edit-venue/${venue.id}`}><Edit className="mr-2 h-4 w-4" /> Edit Venue</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageVenues; 