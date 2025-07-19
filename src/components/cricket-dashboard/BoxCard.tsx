
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, Users, Settings, Trash2, Edit, Eye } from "lucide-react";
import { Venue } from "@/pages/cricket-dashboard/VenuesPage";
import { EditVenueDialog } from "./EditVenueDialog";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VenueCardProps {
  venue: Venue;
  onUpdate: (venue: Venue) => void;
  onDelete: (venueId: string) => void;
  onSelect: (venue: Venue) => void;
  layout?: 'grid' | 'list';
}

export function VenueCard({ venue, onUpdate, onDelete, onSelect, layout = 'grid' }: VenueCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const mainImage = (venue as any).featured_image || (venue.photos && venue.photos[0]) || '';
  const allImages = venue.photos || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "maintenance":
        return "bg-warning/10 text-warning border-warning/20";
      case "inactive":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${
        layout === 'list' 
          ? 'w-full flex flex-col sm:flex-row items-start' 
          : 'w-full'
      }`} onClick={() => onSelect(venue)}>
        <CardHeader className={`pb-3 ${layout === 'list' ? 'w-full sm:w-1/3' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold truncate">{venue.name}</CardTitle>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{venue.address}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {mainImage && (
            <div className="relative flex justify-center items-center mb-2">
              <div className="aspect-video w-full rounded-t-xl shadow-lg border-2 border-yellow-400 overflow-hidden">
                <img
                  key={mainImage}
                  src={mainImage}
                  alt={venue.name}
                  className="w-full h-full object-cover transition-all duration-200"
                  style={{ objectPosition: 'center' }}
                />
              </div>
              <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/70 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-lg sm:text-2xl font-bold shadow-lg">
                <span className="hidden sm:inline">{venue.name}</span>
                <span className="sm:hidden text-sm">{venue.name.length > 15 ? venue.name.substring(0, 15) + '...' : venue.name}</span>
              </div>
              <span className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-yellow-400 text-white px-2 sm:px-3 py-1 rounded text-xs font-semibold shadow">Featured</span>
              {/* Status badge overlayed on image, top right */}
              <span className={`absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-3 py-1 rounded text-xs font-semibold shadow ${
                venue.status === 'active' ? 'bg-green-500 text-white' :
                venue.status === 'maintenance' ? 'bg-yellow-400 text-black' :
                venue.status === 'inactive' ? 'bg-red-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {venue.status}
              </span>
            </div>
          )}
          
          {/* Action Buttons - Mobile Optimized */}
          <div className="flex gap-2 p-3 sm:p-4 justify-center">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={e => { e.stopPropagation(); setIsEditDialogOpen(true); }}
              className="flex-1 sm:flex-none h-10 sm:h-9 text-xs sm:text-sm"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> 
              <span className="hidden sm:inline">Edit</span>
              <span className="sm:hidden">Edit</span>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={e => { e.stopPropagation(); onSelect(venue); }}
              className="flex-1 sm:flex-none h-10 sm:h-9 text-xs sm:text-sm"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">View</span>
              <span className="sm:hidden">View</span>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={e => { e.stopPropagation(); onDelete(venue.id); }} 
              className="flex-1 sm:flex-none h-10 sm:h-9 text-xs sm:text-sm text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">Delete</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditVenueDialog
        venue={venue}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdate={onUpdate}
      />

      {/* Image Gallery Modal - Mobile Optimized */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-2xl flex flex-col items-center p-4 sm:p-6">
          {allImages.length > 0 && (
            <div className="relative w-full flex flex-col items-center">
              <img
                src={allImages[galleryIndex]}
                alt={`Venue photo ${galleryIndex + 1}`}
                className="w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg"
              />
              {/* Star icon to mark as featured (does NOT close modal) */}
              <button
                className={`absolute top-2 left-2 text-xl sm:text-2xl ${allImages[galleryIndex] === mainImage ? 'text-yellow-400' : 'text-gray-400'} bg-white/80 rounded-full p-1 shadow`}
                onClick={() => {
                  onUpdate({ ...venue, featured_image: allImages[galleryIndex] });
                }}
                title="Mark as Featured Image"
              >
                ★
              </button>
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                <button
                  onClick={() => setGalleryIndex((galleryIndex - 1 + allImages.length) % allImages.length)}
                  className="bg-white/80 hover:bg-white text-black rounded-full p-2 sm:p-2 shadow"
                  disabled={allImages.length <= 1}
                >
                  &#8592;
                </button>
              </div>
              <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                <button
                  onClick={() => setGalleryIndex((galleryIndex + 1) % allImages.length)}
                  className="bg-white/80 hover:bg-white text-black rounded-full p-2 sm:p-2 shadow"
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
    </>
  );
}
