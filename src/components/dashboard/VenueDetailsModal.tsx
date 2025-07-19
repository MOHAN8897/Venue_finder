import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, User, Calendar, Eye, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// Use the mapped Venue type from VenueTable
// type Venue = ... (copy from VenueTable)
type Venue = {
  id: string;
  name: string;
  location: string;
  ownerName: string;
  ownerEmail: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  capacity: number;
  amenities: string[];
  description: string;
  images: string[];
  rejectionReason?: string | null;
  venue_type?: string;
  address?: string;
  company?: string | null;
  contact_number?: string;
  price_per_hour?: string;
  price_per_day?: string;
  map_embed_code?: string;
  videos?: string[]; // Added videos field
  featured_image?: string; // Added featured_image field
  // Add any other fields needed
};

interface VenueDetailsModalProps {
  venue: any; // Accepts both admin and owner dashboard Venue types
  isOpen: boolean;
  onClose: () => void;
  onAction?: (venueId: string, action: 'approve' | 'reject', reason?: string) => void;
}

export function VenueDetailsModal({ venue, isOpen, onClose, onAction }: VenueDetailsModalProps) {
  // Map owner dashboard Venue to expected fields if needed
  const mappedVenue = {
    id: venue.id,
    name: venue.name,
    address: venue.address || venue.location || '',
    description: venue.description || '',
    capacity: venue.capacity || venue.stats?.capacity || '',
    amenities: venue.amenities || [],
    images: venue.images || venue.photos || [],
    videos: venue.videos || [],
    status: venue.status || 'pending',
    price_per_hour: venue.price_per_hour || venue.pricing?.hourlyRate || venue.price || '',
    price_per_day: venue.price_per_day || venue.pricing?.peakHourRate || '',
    featured_image: venue.featured_image || (venue.images && venue.images[0]) || (venue.photos && venue.photos[0]) || '',
    map_embed_code: venue.map_embed_code || '',
    ownerName: venue.ownerName || venue.owner_name || venue.company || '',
    ownerEmail: venue.ownerEmail || venue.email || '',
    rejectionReason: venue.rejectionReason || venue.rejection_reason || '',
    submittedAt: venue.submittedAt || venue.created_at || '',
    venue_type: venue.venue_type || venue.type || '',
    company: venue.company || '',
    contact_number: venue.contact_number || '',
    price: venue.price || venue.price_per_hour || venue.pricing?.hourlyRate || '',
    pricing: venue.pricing || { hourlyRate: venue.price_per_hour || venue.price || '', peakHourRate: venue.price_per_day || '' },
    weekly_availability: venue.weekly_availability || venue.weeklyAvailability || {},
  };
  const [rejectionReason, setRejectionReason] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const allImages = mappedVenue.images || [];
  const featuredImage = mappedVenue.featured_image || (allImages[0] || '');
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = () => {
    onAction?.(mappedVenue.id, 'approve');
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setIsRejecting(true);
      return;
    }
    onAction?.(mappedVenue.id, 'reject', rejectionReason);
    onClose();
  };

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    const variants = {
      pending: { variant: 'secondary' as const, className: 'bg-yellow-400 text-black' },
      approved: { variant: 'secondary' as const, className: 'bg-green-500 text-white' },
      rejected: { variant: 'secondary' as const, className: 'bg-red-500 text-white' }
    };
    return variants[status] || { variant: 'secondary' as const, className: 'bg-muted' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number | string | undefined) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(price));
  };

  const getImageUrl = (img: string) => {
    if (img.startsWith('http')) return img;
    return `https://uledqmfntmblwreoaksi.supabase.co/storage/v1/object/public/venue-images/${img}`;
  };

  // Map videos correctly
  const allVideos = mappedVenue.videos || [];

  // Add a helper for status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'maintenance':
        return 'bg-yellow-400 text-black';
      case 'inactive':
        return 'bg-red-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{mappedVenue.name}</span>
            <Badge {...getStatusBadge(mappedVenue.status)}>
              {mappedVenue.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Featured Image Banner at Top */}
          {featuredImage && (
            <div className="relative w-full mb-6">
              <div className="w-full overflow-hidden rounded-t-lg shadow-lg" style={{ aspectRatio: '16/9' }}>
                <img
                  src={getImageUrl(featuredImage)}
                  alt={mappedVenue.name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center' }}
                />
              </div>
              <span className="absolute top-4 left-4 bg-yellow-400 text-white px-3 py-1 rounded text-xs font-semibold shadow">Featured</span>
              {/* Status badge overlayed on image */}
              <span className={`absolute top-4 right-4 px-3 py-1 rounded text-xs font-semibold shadow ${getStatusColor(mappedVenue.status)}`}>
                {mappedVenue.status}
              </span>
            </div>
          )}

          {/* Venue Name and Status */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                {mappedVenue.name}
              </CardTitle>
              <CardDescription>{mappedVenue.address}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Remove the small featured image from the info card */}
              </div>
            </CardContent>
          </Card>

          {mappedVenue.address && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base">{mappedVenue.address}</div>
              </CardContent>
            </Card>
          )}

          {mappedVenue.capacity && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base">{mappedVenue.capacity}</div>
              </CardContent>
            </Card>
          )}

          {mappedVenue.description && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base whitespace-pre-line">{mappedVenue.description}</div>
              </CardContent>
            </Card>
          )}

          {/* Amenities with count */}
          {mappedVenue.amenities && mappedVenue.amenities.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Selected Amenities ({mappedVenue.amenities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mt-1">
                  {mappedVenue.amenities.map((amenity: string) => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8">
                <div>
                  <div className="font-medium">₹{mappedVenue.pricing?.hourlyRate || mappedVenue.price_per_hour || 'N/A'}/hr</div>
                  <div className="text-xs text-muted-foreground">Regular</div>
                </div>
                <div>
                  <div className="font-medium">₹{mappedVenue.pricing?.peakHourRate || mappedVenue.price_per_day || 'N/A'}/day</div>
                  <div className="text-xs text-muted-foreground">Peak</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos with featured badge */}
          {allImages.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Venue Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {allImages.map((img: string, idx: number) => (
                    <div key={img} className="relative flex-shrink-0">
                      <div className="w-64 overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
                        <img
                          src={getImageUrl(img)}
                          alt={mappedVenue.name}
                          className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-200"
                          style={{ objectPosition: 'center' }}
                          onClick={() => {
                            setGalleryIndex(idx);
                            setGalleryOpen(true);
                          }}
                        />
                      </div>
                      {img === featuredImage && (
                        <span className="absolute top-2 left-2 bg-yellow-400 text-white px-2 py-1 rounded text-xs font-semibold shadow">Featured</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Videos as buttons and URLs */}
          {allVideos.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Video URLs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allVideos.map((video: string, idx: number) => (
                    <a
                      key={video}
                      href={video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 transition">
                        View Video {idx + 1}
                      </button>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map Embed and raw code */}
          {mappedVenue.map_embed_code && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Map Embed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full mb-2">
                  <iframe
                    srcDoc={mappedVenue.map_embed_code}
                    title="Venue Map"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Availability */}
          {mappedVenue.weekly_availability && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(mappedVenue.weekly_availability).map(([day, val]: [string, any]) => (
                    <div key={day} className="text-xs">
                      <span className="font-semibold capitalize">{day}:</span> {val.available ? `${val.start} - ${val.end}` : 'Unavailable'}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Venue Type and Contact Number if present */}
          {(mappedVenue.venue_type || mappedVenue.contact_number) && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Venue Info</CardTitle>
              </CardHeader>
              <CardContent>
                {mappedVenue.venue_type && (
                  <div className="text-sm mb-1">Type: <span className="font-semibold">{mappedVenue.venue_type}</span></div>
                )}
                {mappedVenue.contact_number && (
                  <div className="text-sm">Contact: <span className="font-semibold">{mappedVenue.contact_number}</span></div>
                )}
              </CardContent>
            </Card>
          )}
          {/* Image Gallery Modal */}
          <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
            <DialogContent className="max-w-2xl flex flex-col items-center">
              {allImages.length > 0 && (
                <div className="relative w-full flex flex-col items-center">
                  <img
                    src={getImageUrl(allImages[galleryIndex])}
                    alt={`Venue photo ${galleryIndex + 1}`}
                    className="w-full max-h-[70vh] object-contain rounded-lg"
                  />
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                    <button
                      onClick={() => setGalleryIndex((galleryIndex - 1 + allImages.length) % allImages.length)}
                      className="bg-white/80 hover:bg-white text-black rounded-full p-2 shadow"
                      disabled={allImages.length <= 1}
                    >
                      &#8592;
                    </button>
                  </div>
                  <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                    <button
                      onClick={() => setGalleryIndex((galleryIndex + 1) % allImages.length)}
                      className="bg-white/80 hover:bg-white text-black rounded-full p-2 shadow"
                      disabled={allImages.length <= 1}
                    >
                      &#8594;
                    </button>
                  </div>
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => setGalleryOpen(false)}
                      className="bg-black/70 hover:bg-black text-white rounded-full p-2"
                    >
                      &#10005;
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {galleryIndex + 1} / {allImages.length}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
        {/* Remove status badge from top right, next to venue name, and at the bottom.
            Only keep the badge overlayed on the featured image: */}
        {/* <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-sm font-bold">Status:</span>
          <Badge variant="outline" className={`text-base ${getStatusColor(mappedVenue.status)}`}>{mappedVenue.status}</Badge>
        </div> */}
      </DialogContent>
    </Dialog>
  );
}