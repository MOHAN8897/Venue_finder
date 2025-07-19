import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users, Clock, X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Venue } from '@/lib/venueService';

interface VenuePreviewModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow?: (venueId: string) => void;
  onViewDetails?: (venueId: string) => void;
}

export function VenuePreviewModal({ 
  venue, 
  isOpen, 
  onClose, 
  onBookNow, 
  onViewDetails 
}: VenuePreviewModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!venue) return null;

  // Get all available images
  const allImages = venue.photos || venue.images || venue.image_urls || [];
  const mainImage = allImages[selectedImageIndex] || allImages[0] || 'https://via.placeholder.com/800x600?text=No+Image';

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handleBookNow = () => {
    onBookNow?.(venue.id);
  };

  const handleViewDetails = () => {
    onViewDetails?.(venue.id);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const renderStars = (rating: number) => {
    const totalStars = 5;
    const filledStars = Math.round(rating);
    return (
      <div className="flex items-center">
        {[...Array(totalStars)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < filledStars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-full">
          {/* Left side - Main image and content */}
          <div className="flex-1 flex flex-col">
            {/* Main image section */}
            <div className="relative flex-1 bg-gray-100">
              <img
                src={mainImage}
                alt={venue.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center' }}
              />
              
              {/* Image navigation arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Favorite button */}
              <button
                onClick={toggleFavorite}
                className="absolute top-4 left-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
              >
                <Heart 
                  className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                />
              </button>

              {/* Venue type badge */}
              <Badge className="absolute top-4 left-16 bg-black/70 text-white">
                {venue.type}
              </Badge>
            </div>

            {/* Venue details section */}
            <div className="p-6 bg-white">
              <div className="space-y-4">
                {/* Venue name and rating */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {venue.name}
                    </h2>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{venue.address}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {renderStars(venue.average_rating || venue.rating || 0)}
                      <span className="text-sm text-gray-600">
                        {venue.review_count || venue.total_reviews || 0} reviews
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                {venue.amenities && venue.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {venue.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {venue.amenities.length > 3 && (
                      <span className="text-sm text-gray-500">
                        +{venue.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Capacity and pricing */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="text-sm">Up to {venue.capacity} people</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">Available now</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{venue.price_per_hour || venue.hourly_rate}
                    </div>
                    <div className="text-sm text-gray-500">per hour</div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleViewDetails}
                    variant="outline"
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={handleBookNow}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Thumbnail navigation */}
          {allImages.length > 1 && (
            <div className="w-24 bg-gray-50 p-2 overflow-y-auto">
              <div className="space-y-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageClick(index)}
                    className={`w-full aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                      index === selectedImageIndex
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${venue.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: 'center' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 