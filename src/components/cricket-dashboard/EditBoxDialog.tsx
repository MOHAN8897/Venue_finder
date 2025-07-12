
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BasicInfoSection } from "./forms/BasicInfoSection";
import { PricingSection } from "./forms/PricingSection";
import { AmenitiesSection } from "./forms/AmenitiesSection";
import { AvailabilitySection } from "./forms/AvailabilitySection";
import { Box } from "@/pages/BoxesPage";

interface EditBoxDialogProps {
  box: Box;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (box: Box) => void;
}

export function EditBoxDialog({ box, open, onOpenChange, onUpdate }: EditBoxDialogProps) {
  const [formData, setFormData] = useState({
    name: box.name,
    address: box.location.address,
    hourlyRate: box.pricing.hourlyRate.toString(),
    peakHourRate: box.pricing.peakHourRate.toString(),
    amenities: [...box.amenities],
    status: box.status,
    availability: { ...box.availability }
  });

  useEffect(() => {
    setFormData({
      name: box.name,
      address: box.location.address,
      hourlyRate: box.pricing.hourlyRate.toString(),
      peakHourRate: box.pricing.peakHourRate.toString(),
      amenities: [...box.amenities],
      status: box.status,
      availability: { ...box.availability }
    });
  }, [box]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedBox: Box = {
      ...box,
      name: formData.name,
      location: {
        ...box.location,
        address: formData.address
      },
      pricing: {
        hourlyRate: parseInt(formData.hourlyRate),
        peakHourRate: parseInt(formData.peakHourRate)
      },
      amenities: formData.amenities,
      status: formData.status,
      availability: formData.availability
    };

    onUpdate(updatedBox);
    onOpenChange(false);
  };

  const addAmenity = (amenity: string) => {
    if (!formData.amenities.includes(amenity)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity]
      }));
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const updateAvailability = (day: string, field: 'start' | 'end' | 'available', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {box.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoSection
            formData={{ name: formData.name, address: formData.address, status: formData.status }}
            onChange={handleFieldChange}
          />

          <PricingSection
            formData={{ hourlyRate: formData.hourlyRate, peakHourRate: formData.peakHourRate }}
            onChange={handleFieldChange}
          />

          <AmenitiesSection
            amenities={formData.amenities}
            onAdd={addAmenity}
            onRemove={removeAmenity}
          />

          <AvailabilitySection
            availability={formData.availability}
            onChange={updateAvailability}
          />

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
