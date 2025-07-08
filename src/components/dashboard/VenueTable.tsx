import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Check, User, Edit } from 'lucide-react';

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
  // Add any other fields needed for the modal
};

interface VenueTableProps {
  venues: Venue[];
  onViewDetails: (venue: Venue) => void;
  onAction: (venueId: string, action: 'approve' | 'reject', reason?: string) => void;
  searchQuery: string;
  venueStatus?: 'pending' | 'approved' | 'rejected';
}

export function VenueTable({ venues, onViewDetails, onAction, searchQuery, venueStatus }: VenueTableProps) {
  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEmptyStateMessage = () => {
    if (searchQuery) return 'Try adjusting your search terms.';
    
    switch (venueStatus) {
      case 'pending':
        return 'No venues pending review.';
      case 'approved':
        return 'No approved venues yet.';
      case 'rejected':
        return 'No rejected venues.';
      default:
        return 'No venues available.';
    }
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
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (filteredVenues.length === 0) {
    return (
      <div className="text-center py-8">
        <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No venues found</h3>
        <p className="text-muted-foreground">
          {getEmptyStateMessage()}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Venue Details</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Pricing</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVenues.map((venue) => (
            <TableRow key={venue.id} className="hover:bg-muted/50">
              <TableCell>
                <div>
                  <div className="font-medium text-foreground">{venue.name}</div>
                  <div className="text-sm text-muted-foreground">{venue.location}</div>
                  <div className="text-xs text-muted-foreground">
                    Capacity: {venue.capacity} people
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{venue.ownerName}</div>
                    <div className="text-xs text-muted-foreground">{venue.ownerEmail}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-foreground">{formatPrice(venue.price)}</div>
              </TableCell>
              <TableCell>
                <Badge {...getStatusBadge(venue.status)}>
                  {venue.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {formatDate(venue.submittedAt)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(venue)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  {venue.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAction(venue.id, 'approve')}
                        className="border-status-approved text-status-approved hover:bg-status-approved hover:text-white"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAction(venue.id, 'reject')}
                        className="border-status-rejected text-status-rejected hover:bg-status-rejected hover:text-white"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}