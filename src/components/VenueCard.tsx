import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { MapPin, Star, Users, Wifi, Car, Snowflake, Coffee, Bath, Phone, Mail, Globe, Clock, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Custom styles for better mobile responsiveness
const swiperStyles = `
  .swiper {
    width: 100%;
    height: 100%;
  }
  .swiper-slide {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .swiper-button-next,
  .swiper-button-prev {
    color: white;
    background: rgba(0, 0, 0, 0.5);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    margin-top: -16px;
  }
  .swiper-button-next:after,
  .swiper-button-prev:after {
    font-size: 14px;
  }
  .swiper-pagination-bullet {
    background: white;
    opacity: 0.7;
  }
  .swiper-pagination-bullet-active {
    opacity: 1;
    background: #3b82f6;
  }
  @media (max-width: 768px) {
    .swiper-button-next,
    .swiper-button-prev {
      width: 28px;
      height: 28px;
      margin-top: -14px;
    }
    .swiper-button-next:after,
    .swiper-button-prev:after {
      font-size: 12px;
    }
  }
`;

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
  clock: <Clock className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
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

interface VenueCardProps {
  venue: {
    id: string;
    name: string;
    address: string;
    capacity: number;
    amenities: string[];
    rating?: number;
    price_per_day?: number;
    price_per_hour?: number;
    hourly_rate?: number;
    images?: string[];
    image_urls?: string[];
    photos?: string[];
  };
  onViewDetails?: (venue: any) => void;
  onBookNow?: (venueId: string) => void;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue, onViewDetails, onBookNow }) => {
  const images = venue.images || venue.image_urls || venue.photos || [];
  const amenities = venue.amenities || [];
  const displayAmenities = amenities.slice(0, 4);
  const remainingCount = amenities.length - 4;

  const renderAmenityIcon = (amenity: string) => {
    const amenityKey = amenity.toLowerCase().replace(/\s+/g, '_');
    return amenityIcons[amenityKey] || <span className="h-4 w-4">•</span>;
  };

  // Generate dummy images if none provided
  const carouselImages = images.length > 0 ? images : [
    'https://picsum.photos/400/225?random=1',
    'https://picsum.photos/400/225?random=2',
    'https://picsum.photos/400/225?random=3',
    'https://picsum.photos/400/225?random=4'
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col h-full">
      {/* Custom Swiper Styles */}
      <style dangerouslySetInnerHTML={{ __html: swiperStyles }} />
      
      {/* Image Carousel */}
      <div className="relative aspect-video w-full">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation={true}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={carouselImages.length > 1}
          className="h-full w-full"
          spaceBetween={0}
          slidesPerView={1}
          breakpoints={{
            640: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 1,
            },
            1024: {
              slidesPerView: 1,
            },
          }}
        >
          {carouselImages.map((image, index) => (
            <SwiperSlide key={index} className="w-full h-full">
              <img
                src={image}
                alt={`${venue.name} - Image ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-yellow-600 text-yellow-600 mr-1" />
            {venue.rating?.toFixed(1) || 'N/A'}
          </Badge>
        </div>
      </div>

      {/* Venue Details */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Venue Name and Location */}
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {venue.name}
          </h3>
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{venue.address}</span>
          </div>
        </div>

        {/* Capacity */}
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Up to {venue.capacity} people</span>
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap gap-2">
              {displayAmenities.map((amenity, index) => (
                <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                  {renderAmenityIcon(amenity)}
                  <span className="capitalize">{amenity}</span>
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                  +{remainingCount} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price and Action Buttons Container */}
        <div className="space-y-3 mt-auto">
          {/* Price */}
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              ₹{venue.price_per_day || venue.price_per_hour || venue.hourly_rate || 0}
            </div>
            <div className="text-sm text-gray-500">per day</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onViewDetails?.(venue)}
            >
              View
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onBookNow?.(venue.id)}
            >
              Book
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueCard; 