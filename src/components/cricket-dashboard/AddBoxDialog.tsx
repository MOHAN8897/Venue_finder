
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BasicInfoSection } from "./forms/BasicInfoSection";
import { PricingSection } from "./forms/PricingSection";
import { AmenitiesSection } from "./forms/AmenitiesSection";
import { Box } from "@/pages/BoxesPage";

interface AddBoxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBox: (box: Omit<Box, "id" | "stats">) => void;
}

export function AddBoxDialog({ open, onOpenChange, onAddBox }: AddBoxDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    hourlyRate: "",
    peakHourRate: "",
    amenities: [] as string[],
    status: "active" as const
  });

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBox: Omit<Box, "id" | "stats"> = {
      name: formData.name,
      image: "/placeholder.svg",
      location: {
        lat: 28.6139 + (Math.random() - 0.5) * 0.1,
        lng: 77.2090 + (Math.random() - 0.5) * 0.1,
        address: formData.address
      },
      pricing: {
        hourlyRate: parseInt(formData.hourlyRate),
        peakHourRate: parseInt(formData.peakHourRate)
      },
      amenities: formData.amenities,
      status: formData.status,
      availability: {
        monday: { start: "06:00", end: "22:00", available: true },
        tuesday: { start: "06:00", end: "22:00", available: true },
        wednesday: { start: "06:00", end: "22:00", available: true },
        thursday: { start: "06:00", end: "22:00", available: true },
        friday: { start: "06:00", end: "22:00", available: true },
        saturday: { start: "06:00", end: "23:00", available: true },
        sunday: { start: "07:00", end: "21:00", available: true }
      }
    };

    onAddBox(newBox);
    onOpenChange(false);
    setFormData({
      name: "",
      address: "",
      hourlyRate: "",
      peakHourRate: "",
      amenities: [],
      status: "active"
    });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Cricket Box</DialogTitle>
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

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-accent hover:bg-accent/90">
              Add Box
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
