import React from 'react';
import { MapPin, Star, Users, Clock, Wifi, Car, Snowflake, Coffee, Bath, Phone, Mail, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface VenueDetailsSectionProps {
  venue: {
    id: string;
    name?: string;
    venue_name?: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    capacity?: number;
    rating?: number;
    review_count?: number;
    avg_rating?: number;
    rating_count?: number;
    amenities?: string[];
    price_per_hour?: number;
    price_per_day?: number;
    hourly_rate?: number;
    daily_rate?: number;
    map_embed_code?: string;
    google_maps_link?: string;
    contact_phone?: string;
    contact_email?: string;
    website?: string;
    [key: string]: any;
  };
}

// Amenity icons mapping
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  ac: <Snowflake className="h-4 w-4" />,
  washroom: <Bath className="h-4 w-4" />,
  restrooms: <Bath className="h-4 w-4" />,
  catering: <Coffee className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  heating: <Snowflake className="h-4 w-4" />,
  ventilation: <Globe className="h-4 w-4" />,
  electricity: <Globe className="h-4 w-4" />,
  lighting: <Globe className="h-4 w-4" />,
  stage: <Globe className="h-4 w-4" />,
  pool: <Globe className="h-4 w-4" />,
  dance_floor: <Globe className="h-4 w-4" />,
  outdoor_games: <Globe className="h-4 w-4" />,
  photo_booth: <Globe className="h-4 w-4" />,
  gym_equipment: <Globe className="h-4 w-4" />,
  covered_parking: <Car className="h-4 w-4" />,
  valet_parking: <Car className="h-4 w-4" />,
  taxi_stand: <Car className="h-4 w-4" />,
  public_transport: <Car className="h-4 w-4" />,
  bike_parking: <Car className="h-4 w-4" />,
  airport_shuttle: <Car className="h-4 w-4" />,
  loading_dock: <Car className="h-4 w-4" />,
  phone_system: <Phone className="h-4 w-4" />,
  av_equipment: <Globe className="h-4 w-4" />,
  sound_system: <Globe className="h-4 w-4" />,
  microphones: <Globe className="h-4 w-4" />,
  projector: <Globe className="h-4 w-4" />,
  router: <Wifi className="h-4 w-4" />,
  printer: <Globe className="h-4 w-4" />,
  tv_screens: <Globe className="h-4 w-4" />,
  accessible_parking: <Car className="h-4 w-4" />,
  service_animal_friendly: <Globe className="h-4 w-4" />,
  elevator: <Globe className="h-4 w-4" />,
  braille_signage: <Globe className="h-4 w-4" />,
  hearing_loop: <Globe className="h-4 w-4" />,
  baby_facilities: <Globe className="h-4 w-4" />,
  accessible_restrooms: <Bath className="h-4 w-4" />,
  wheelchair_access: <Globe className="h-4 w-4" />,
  outdoor_furniture: <Globe className="h-4 w-4" />,
  lounge_seating: <Globe className="h-4 w-4" />,
  tables_chairs: <Globe className="h-4 w-4" />,
  bar_stools: <Globe className="h-4 w-4" />,
  storage_space: <Globe className="h-4 w-4" />,
  bedrooms: <Globe className="h-4 w-4" />,
  reception_desk: <Globe className="h-4 w-4" />,
  coat_check: <Globe className="h-4 w-4" />,
  ride_share_zone: <Car className="h-4 w-4" />,
  access_control: <Globe className="h-4 w-4" />,
  first_aid: <Globe className="h-4 w-4" />,
  fire_safety: <Globe className="h-4 w-4" />,
  security_system: <Globe className="h-4 w-4" />,
  emergency_exits: <Globe className="h-4 w-4" />,
  cctv: <Globe className="h-4 w-4" />,
  security_guard: <Globe className="h-4 w-4" />,
  emergency_lighting: <Globe className="h-4 w-4" />,
};

const VenueDetailsSection: React.FC<VenueDetailsSectionProps> = ({ venue }) => {
  const venueName = venue.venue_name || venue.name || 'Unnamed Venue';
  const rating = venue.avg_rating || venue.rating || 0;
  const reviewCount = venue.rating_count || venue.review_count || 0;
  const amenities = venue.amenities || [];

  const renderAmenityIcon = (amenity: string) => {
    const icon = amenityIcons[amenity.toLowerCase()] || <Globe className="h-4 w-4" />;
    return icon;
  };

  return (
    <div className="space-y-6">
      {/* Venue Name and Rating */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{venueName}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{venue.address}</span>
              {venue.city && <span>, {venue.city}</span>}
              {venue.state && <span>, {venue.state}</span>}
              {venue.pincode && <span> {venue.pincode}</span>}
            </div>
          </div>
        </div>

        {/* Rating and Reviews */}
        {rating > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-lg">{rating.toFixed(1)}</span>
              <span className="text-gray-600">({reviewCount} reviews)</span>
            </div>
            {venue.capacity && (
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="h-4 w-4" />
                <span>Up to {venue.capacity} guests</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Description */}
      {venue.description && (
        <Card>
          <CardHeader>
            <CardTitle>About This Venue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{venue.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  ₹{(venue.price_per_hour || venue.hourly_rate || 0).toLocaleString()}
                </span>
                <span className="text-gray-600">per hour</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Hourly rate</p>
            </div>
            {(venue.price_per_day || venue.daily_rate) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    ₹{(venue.price_per_day || venue.daily_rate || 0).toLocaleString()}
                  </span>
                  <span className="text-gray-600">per day</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Daily rate</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      {amenities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Amenities & Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {amenities.map((amenity, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {renderAmenityIcon(amenity)}
                  <span className="capitalize">{amenity.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      {(venue.map_embed_code || venue.google_maps_link) && (
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
              {venue.map_embed_code ? (
                <iframe
                  srcDoc={venue.map_embed_code}
                  title="Venue Location"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              ) : venue.google_maps_link ? (
                <iframe
                  src={venue.google_maps_link}
                  title="Venue Location"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-gray-500">Map not available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      {(venue.contact_phone || venue.contact_email || venue.website) && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {venue.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <a 
                    href={`tel:${venue.contact_phone}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {venue.contact_phone}
                  </a>
                </div>
              )}
              {venue.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <a 
                    href={`mailto:${venue.contact_email}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {venue.contact_email}
                  </a>
                </div>
              )}
              {venue.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <a 
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Venue ID:</span>
              <span className="ml-2 text-gray-600">{venue.id}</span>
            </div>
            {venue.capacity && (
              <div>
                <span className="font-medium text-gray-700">Capacity:</span>
                <span className="ml-2 text-gray-600">Up to {venue.capacity} people</span>
              </div>
            )}
            {venue.city && (
              <div>
                <span className="font-medium text-gray-700">City:</span>
                <span className="ml-2 text-gray-600">{venue.city}</span>
              </div>
            )}
            {venue.state && (
              <div>
                <span className="font-medium text-gray-700">State:</span>
                <span className="ml-2 text-gray-600">{venue.state}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueDetailsSection; 