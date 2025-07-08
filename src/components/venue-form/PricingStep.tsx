import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { DollarSign, Calendar, Clock } from 'lucide-react';
import { VenueFormData } from '../VenueListingForm';

interface PricingStepProps {
  formData: VenueFormData;
  updateFormData: (updates: Partial<VenueFormData>) => void;
  isValid: boolean;
}

const AVAILABILITY_OPTIONS = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function PricingStep({ formData, updateFormData }: PricingStepProps) {
  const handleAvailabilityChange = (day: string, checked: boolean) => {
    const updatedAvailability = checked
      ? [...formData.availability, day]
      : formData.availability.filter(d => d !== day);
    updateFormData({ availability: updatedAvailability });
  };

  return (
    <div className="space-y-6">
      {/* Pricing */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="pricePerHour" className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="w-4 h-4 text-primary" />
            Price per Hour
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="pricePerHour"
              type="number"
              value={formData.pricePerHour || ''}
              onChange={(e) => updateFormData({ pricePerHour: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="pl-8 transition-all duration-200 focus:shadow-md"
            />
          </div>
          <p className="text-xs text-muted-foreground">Hourly rate for venue rental</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricePerDay" className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4 text-primary" />
            Price per Day
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="pricePerDay"
              type="number"
              value={formData.pricePerDay || ''}
              onChange={(e) => updateFormData({ pricePerDay: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="pl-8 transition-all duration-200 focus:shadow-md"
            />
          </div>
          <p className="text-xs text-muted-foreground">Full day rate for venue rental</p>
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4 text-primary" />
          Available Days
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AVAILABILITY_OPTIONS.map((day) => (
            <div key={day} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-all duration-200">
              <Checkbox
                id={day}
                checked={formData.availability.includes(day)}
                onCheckedChange={(checked) => handleAvailabilityChange(day, checked as boolean)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor={day} className="cursor-pointer font-medium text-sm">
                {day}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-accent/50 rounded-lg p-4 border border-accent">
        <h3 className="font-semibold text-foreground mb-3">Pricing Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hourly Rate:</span>
            <span className="font-medium">
              {formData.pricePerHour ? `$${formData.pricePerHour.toFixed(2)}` : 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily Rate:</span>
            <span className="font-medium">
              {formData.pricePerDay ? `$${formData.pricePerDay.toFixed(2)}` : 'Not set'}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Days:</span>
              <span className="font-medium">
                {formData.availability.length > 0 
                  ? `${formData.availability.length} day${formData.availability.length > 1 ? 's' : ''}`
                  : 'None selected'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tips */}
      <div className="bg-accent/50 rounded-lg p-6 border border-accent">
        <h3 className="font-semibold text-foreground mb-3">Pricing Tips</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Research competitors:</strong> Check similar venues in your area to set competitive rates.</p>
          <p><strong>Consider value:</strong> Factor in your unique amenities and services when pricing.</p>
          <p><strong>Flexible options:</strong> Offering both hourly and daily rates gives customers more choices.</p>
          <p><strong>Seasonal pricing:</strong> You can adjust rates later based on demand and seasons.</p>
        </div>
      </div>
    </div>
  );
}