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
  // Add any other fields needed
};

interface VenueDetailsModalProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
  onAction: (venueId: string, action: 'approve' | 'reject', reason?: string) => void;
}

export function VenueDetailsModal({ venue, isOpen, onClose, onAction }: VenueDetailsModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showImage, setShowImage] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = () => {
    onAction(venue.id, 'approve');
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setIsRejecting(true);
      return;
    }
    onAction(venue.id, 'reject', rejectionReason);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{venue.name}</span>
            <Badge {...getStatusBadge(venue.status)}>
              {venue.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Image Viewer Modal */}
        {showImage && (
          <Dialog open={!!showImage} onOpenChange={() => setShowImage(null)}>
            <DialogContent className="max-w-2xl">
              <img src={showImage} alt="Venue" className="w-full h-auto rounded-lg" />
              <Button variant="outline" className="mt-4" onClick={() => setShowImage(null)}>
                <X className="mr-2 h-4 w-4" /> Close
              </Button>
            </DialogContent>
          </Dialog>
        )}

        <div className="space-y-6">
          {/* Venue Images */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {venue.images.map((image, index) => (
              <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer" onClick={() => setShowImage(getImageUrl(image))}>
                <img
                  src={getImageUrl(image)}
                  alt={`${venue.name} ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>

          {/* Venue Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Type:</span> {venue.venue_type || '-'}
              </div>
              <div>
                <span className="font-semibold">Description:</span>
                <div className="whitespace-pre-wrap text-muted-foreground mt-1 break-words max-h-64 overflow-y-auto border rounded p-2 bg-muted/30" style={{maxHeight:'300px'}}>
                  {venue.description?.slice(0, 1000)}
                  {venue.description && venue.description.length > 1000 && <span className="text-xs text-muted-foreground">... (truncated)</span>}
                </div>
              </div>
              <div>
                <span className="font-semibold">Location:</span> {venue.location}
              </div>
              <div>
                <span className="font-semibold">Address:</span> {venue.address || '-'}
              </div>
              <div>
                <span className="font-semibold">Company:</span> {venue.company || '-'}
              </div>
              <div>
                <span className="font-semibold">Contact Number:</span> {venue.contact_number || '-'}
              </div>
              <div>
                <span className="font-semibold">Capacity:</span> {venue.capacity}
              </div>
              <div>
                <span className="font-semibold">Amenities:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {venue.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Price/Hour:</span> {formatPrice(venue.price_per_hour)}
              </div>
              <div>
                <span className="font-semibold">Price/Day:</span> {formatPrice(venue.price_per_day)}
              </div>
              <div>
                <span className="font-semibold">Owner:</span> {venue.ownerName}
              </div>
              <div>
                <span className="font-semibold">Owner Email:</span> {venue.ownerEmail}
              </div>
              <div>
                <span className="font-semibold">Submitted:</span> {formatDate(venue.submittedAt)}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {venue.status}
              </div>
              {venue.map_embed_code && (
                <div>
                  <span className="font-semibold">Map:</span>
                  <div className="mt-2" dangerouslySetInnerHTML={{ __html: venue.map_embed_code }} />
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {venue.status === 'rejected' && venue.rejectionReason && (
            <div className="space-y-2">
              <span className="font-semibold text-destructive">Rejection Reason:</span>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-foreground">{venue.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Rejection Reason Input (if rejecting) */}
          {venue.status === 'pending' && (
            <div className="space-y-2">
              <span className="font-semibold">Rejection Reason (required to reject):</span>
              <input
                type="text"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Enter reason for rejection"
                required
              />
              {isRejecting && !rejectionReason.trim() && (
                <span className="text-destructive text-xs">Rejection reason is required.</span>
              )}
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {venue.status === 'pending' && (
              <>
                <Button variant="default" onClick={handleApprove}>
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}