import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Building, Tag, MapPin, Map, Globe } from 'lucide-react';
import { VenueFormData } from '../VenueListingForm';

interface BasicDetailsStepProps {
  formData: VenueFormData;
  updateFormData: (updates: Partial<VenueFormData>) => void;
  isValid: boolean;
}

const VENUE_TYPES = [
  'Farmhouse',
  'Sports Venue'
];

export default function BasicDetailsStep({ formData, updateFormData }: BasicDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Venue Name */}
        <div className="space-y-2">
          <Label htmlFor="venueName" className="flex items-center gap-2 text-sm font-medium">
            <Building className="w-4 h-4 text-primary" />
            Venue Name *
          </Label>
          <Input
            id="venueName"
            value={formData.venueName}
            onChange={(e) => updateFormData({ venueName: e.target.value })}
            placeholder="Enter your venue name"
            className="transition-all duration-200 focus:shadow-md"
          />
        </div>

        {/* Venue Type */}
        <div className="space-y-2">
          <Label htmlFor="venueType" className="flex items-center gap-2 text-sm font-medium">
            <Tag className="w-4 h-4 text-primary" />
            Venue Type *
          </Label>
          <Select
            value={formData.venueType}
            onValueChange={(value) => updateFormData({ venueType: value })}
          >
            <SelectTrigger className="transition-all duration-200 focus:shadow-md">
              <SelectValue placeholder="Select venue type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-lg">
              {VENUE_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="hover:bg-accent">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4 text-primary" />
          Full Address *
        </Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
          placeholder="Enter complete address with city, state, and ZIP"
          className="transition-all duration-200 focus:shadow-md"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2 text-sm font-medium">
            <Globe className="w-4 h-4 text-primary" />
            Website (Optional)
          </Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => updateFormData({ website: e.target.value })}
            placeholder="https://yourwebsite.com"
            className="transition-all duration-200 focus:shadow-md"
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-accent/50 rounded-lg p-4 border border-accent">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Provide accurate details to help customers find and book your venue easily. 
          Required fields are marked with an asterisk (*).
        </p>
      </div>
    </div>
  );
}