import React, { useState, useMemo } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Users, Square, Check, Wifi, Car, Snowflake, Waves, Music, Utensils, Camera, Shield,
  Search, Plus, X, Zap, Tv, Phone, Printer, Coffee, Wine, Gamepad2, Dumbbell,
  Baby, TreePine, Flower2, Sun, Moon, MapPin, Volume2, Mic,
  Projector, Router, AirVent, Thermometer, Lock, Eye, Lightbulb, Sofa, Bed,
  Bath, Shirt, Bike, Bus, Plane, UtensilsCrossed, ChefHat,
  IceCream, Gift, Heart, Sparkles, Star, Award, Crown, Gem, Activity
} from 'lucide-react';
import { VenueFormData } from '../VenueListingForm';

interface SpecificationsStepProps {
  formData: VenueFormData;
  updateFormData: (updates: Partial<VenueFormData>) => void;
  isValid: boolean;
}

const AMENITY_CATEGORIES = {
  'Basic Facilities': [
    { id: 'wifi', label: 'Wi-Fi Internet', icon: Wifi },
    { id: 'parking', label: 'Parking Space', icon: Car },
    { id: 'ac', label: 'Air Conditioning', icon: Snowflake },
    { id: 'heating', label: 'Heating System', icon: Thermometer },
    { id: 'restrooms', label: 'Restrooms', icon: Bath },
    { id: 'electricity', label: 'Power Supply', icon: Zap },
    { id: 'lighting', label: 'Professional Lighting', icon: Lightbulb },
    { id: 'ventilation', label: 'Ventilation System', icon: AirVent }
  ],
  'Technology & AV': [
    { id: 'sound_system', label: 'Sound System', icon: Music },
    { id: 'microphones', label: 'Microphones', icon: Mic },
    { id: 'av_equipment', label: 'A/V Equipment', icon: Camera },
    { id: 'projector', label: 'Projector', icon: Projector },
    { id: 'tv_screens', label: 'TV/LED Screens', icon: Tv },
    { id: 'router', label: 'High-Speed Router', icon: Router },
    { id: 'phone_system', label: 'Phone System', icon: Phone },
    { id: 'printer', label: 'Printer/Scanner', icon: Printer }
  ],
  'Kitchen & Catering': [
    { id: 'full_kitchen', label: 'Full Kitchen', icon: ChefHat },
    { id: 'catering_prep', label: 'Catering Prep Area', icon: Utensils },
    { id: 'refrigeration', label: 'Refrigeration', icon: IceCream },
    { id: 'dishware', label: 'Plates & Utensils', icon: UtensilsCrossed },
    { id: 'coffee_station', label: 'Coffee Station', icon: Coffee },
    { id: 'bar_setup', label: 'Bar Setup', icon: Wine },
    { id: 'ice_machine', label: 'Ice Machine', icon: Snowflake },
    { id: 'serving_area', label: 'Serving Area', icon: Gift }
  ],
  'Entertainment & Recreation': [
    { id: 'stage', label: 'Stage/Platform', icon: Star },
    { id: 'dance_floor', label: 'Dance Floor', icon: Heart },
    { id: 'gaming_area', label: 'Gaming Area', icon: Gamepad2 },
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
    { id: 'gym_equipment', label: 'Gym Equipment', icon: Dumbbell },
    { id: 'outdoor_games', label: 'Outdoor Games', icon: Sun },
    { id: 'photo_booth', label: 'Photo Booth Area', icon: Camera },
    { id: 'entertainment_system', label: 'Entertainment System', icon: Tv }
  ],
  'Furniture & Seating': [
    { id: 'tables_chairs', label: 'Tables & Chairs', icon: Sofa },
    { id: 'lounge_seating', label: 'Lounge Seating', icon: Sofa },
    { id: 'bar_stools', label: 'Bar Stools', icon: Sofa },
    { id: 'outdoor_furniture', label: 'Outdoor Furniture', icon: TreePine },
    { id: 'bedrooms', label: 'Bedrooms', icon: Bed },
    { id: 'reception_desk', label: 'Reception Desk', icon: MapPin },
    { id: 'storage_space', label: 'Storage Space', icon: Square },
    { id: 'coat_check', label: 'Coat Check', icon: Shirt }
  ],
  'Safety & Security': [
    { id: 'security_system', label: '24/7 Security', icon: Shield },
    { id: 'cctv', label: 'CCTV Cameras', icon: Eye },
    { id: 'fire_safety', label: 'Fire Safety System', icon: Shield },
    { id: 'emergency_exits', label: 'Emergency Exits', icon: MapPin },
    { id: 'first_aid', label: 'First Aid Kit', icon: Plus },
    { id: 'security_guard', label: 'Security Guard', icon: Shield },
    { id: 'access_control', label: 'Access Control', icon: Lock },
    { id: 'emergency_lighting', label: 'Emergency Lighting', icon: Lightbulb }
  ],
  'Accessibility & Special Needs': [
    { id: 'wheelchair_access', label: 'Wheelchair Accessible', icon: Activity },
    { id: 'elevator', label: 'Elevator Access', icon: Square },
    { id: 'accessible_restrooms', label: 'Accessible Restrooms', icon: Bath },
    { id: 'braille_signage', label: 'Braille Signage', icon: Eye },
    { id: 'baby_facilities', label: 'Baby Changing Facilities', icon: Baby },
    { id: 'service_animal_friendly', label: 'Service Animal Friendly', icon: Heart },
    { id: 'hearing_loop', label: 'Hearing Loop System', icon: Volume2 },
    { id: 'accessible_parking', label: 'Accessible Parking', icon: Car }
  ],
  'Outdoor & Garden': [
    { id: 'garden_area', label: 'Garden/Landscaped Area', icon: Flower2 },
    { id: 'outdoor_seating', label: 'Outdoor Seating', icon: TreePine },
    { id: 'gazebo', label: 'Gazebo/Pavilion', icon: TreePine },
    { id: 'bbq_area', label: 'BBQ/Grill Area', icon: ChefHat },
    { id: 'fountain', label: 'Water Fountain', icon: Waves },
    { id: 'playground', label: 'Playground', icon: Gamepad2 },
    { id: 'walking_paths', label: 'Walking Paths', icon: MapPin },
    { id: 'outdoor_lighting', label: 'Outdoor Lighting', icon: Moon }
  ],
  'Transportation & Access': [
    { id: 'valet_parking', label: 'Valet Parking', icon: Car },
    { id: 'public_transport', label: 'Near Public Transport', icon: Bus },
    { id: 'airport_shuttle', label: 'Airport Shuttle', icon: Plane },
    { id: 'bike_parking', label: 'Bicycle Parking', icon: Bike },
    { id: 'loading_dock', label: 'Loading Dock', icon: Square },
    { id: 'taxi_stand', label: 'Taxi Stand', icon: Car },
    { id: 'ride_share_zone', label: 'Ride Share Zone', icon: MapPin },
    { id: 'covered_parking', label: 'Covered Parking', icon: Shield }
  ],
  'Premium Features': [
    { id: 'concierge', label: 'Concierge Service', icon: Crown },
    { id: 'vip_area', label: 'VIP Area', icon: Gem },
    { id: 'red_carpet', label: 'Red Carpet Entry', icon: Award },
    { id: 'champagne_service', label: 'Champagne Service', icon: Wine },
    { id: 'personal_chef', label: 'Personal Chef', icon: ChefHat },
    { id: 'event_coordinator', label: 'Event Coordinator', icon: Star },
    { id: 'luxury_amenities', label: 'Luxury Amenities', icon: Sparkles },
    { id: 'premium_decor', label: 'Premium Decor', icon: Crown }
  ]
};

export { AMENITY_CATEGORIES };
export default function SpecificationsStep({ formData, updateFormData }: SpecificationsStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Basic Facilities');

  // Filter amenities based on search term
  const filteredAmenities = useMemo(() => {
    if (!searchTerm) return AMENITY_CATEGORIES;
    
    const filtered: Partial<typeof AMENITY_CATEGORIES> = {};
    Object.entries(AMENITY_CATEGORIES).forEach(([category, amenities]) => {
      const matchingAmenities = amenities.filter(amenity =>
        amenity.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amenity.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchingAmenities.length > 0) {
        filtered[category as keyof typeof AMENITY_CATEGORIES] = matchingAmenities;
      }
    });
    return filtered;
  }, [searchTerm]);

  const handleAmenityToggle = (amenityId: string) => {
    const isSelected = formData.amenities.includes(amenityId);
    const updatedAmenities = isSelected
      ? formData.amenities.filter(id => id !== amenityId)
      : [...formData.amenities, amenityId];
    updateFormData({ amenities: updatedAmenities });
  };

  const removeAmenity = (amenityId: string) => {
    const updatedAmenities = formData.amenities.filter(id => id !== amenityId);
    updateFormData({ amenities: updatedAmenities });
  };

  const getAmenityById = (id: string) => {
    for (const category of Object.values(AMENITY_CATEGORIES)) {
      const amenity = category.find(a => a.id === id);
      if (amenity) return amenity;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Capacity and Area */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="capacity" className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4 text-primary" />
            Maximum Capacity *
          </Label>
          <Input
            id="capacity"
            type="number"
            value={formData.capacity || ''}
            onChange={(e) => updateFormData({ capacity: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 100"
            min="1"
            className="transition-all duration-200 focus:shadow-md"
          />
          <p className="text-xs text-muted-foreground">Number of people the venue can accommodate</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="area" className="flex items-center gap-2 text-sm font-medium">
            <Square className="w-4 h-4 text-primary" />
            Area (sq.ft) *
          </Label>
          <Input
            id="area"
            type="number"
            value={formData.area || ''}
            onChange={(e) => updateFormData({ area: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 2500"
            min="1"
            className="transition-all duration-200 focus:shadow-md"
          />
          <p className="text-xs text-muted-foreground">Total area in square feet</p>
        </div>
      </div>

      {/* Selected Amenities */}
      {formData.amenities.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              Selected Amenities ({formData.amenities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((amenityId) => {
                const amenity = getAmenityById(amenityId);
                if (!amenity) return null;
                const IconComponent = amenity.icon;
                return (
                  <Badge
                    key={amenityId}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <IconComponent className="w-3 h-3" />
                    {amenity.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAmenity(amenityId)}
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amenities Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add Amenities & Features
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search amenities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-4">
              {Object.keys(filteredAmenities).slice(0, 5).map((category) => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {category.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(filteredAmenities).map(([category, amenities]) => (
              <TabsContent key={category} value={category}>
                <ScrollArea className="h-64">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
                    {amenities.map((amenity) => {
                      const IconComponent = amenity.icon;
                      const isSelected = formData.amenities.includes(amenity.id);
                      return (
                        <div
                          key={amenity.id}
                          onClick={() => handleAmenityToggle(amenity.id)}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:bg-accent/50'
                          }`}
                        >
                          <IconComponent className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="flex-1 font-medium">{amenity.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}

            {/* Additional category tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.keys(filteredAmenities).slice(5).map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="bg-accent/50 rounded-lg p-4 border border-accent">
        <h3 className="font-semibold text-foreground mb-2">Venue Specifications</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Capacity:</strong> {formData.capacity ? `${formData.capacity} people` : 'Not specified'}</p>
          <p><strong>Area:</strong> {formData.area ? `${formData.area} sq.ft` : 'Not specified'}</p>
          <p><strong>Amenities:</strong> {formData.amenities.length > 0 
            ? `${formData.amenities.length} amenities selected`
            : 'None selected'
          }</p>
        </div>
      </div>
    </div>
  );
}