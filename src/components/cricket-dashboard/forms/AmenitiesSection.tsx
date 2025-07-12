
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

const COMMON_AMENITIES = [
  "Air Conditioning", "LED Lights", "Sound System", "Seating Area",
  "Parking", "Refreshments", "Changing Room", "First Aid Kit",
  "CCTV", "Wi-Fi", "Scoreboard", "Equipment Storage"
];

interface AmenitiesSectionProps {
  amenities: string[];
  onAdd: (amenity: string) => void;
  onRemove: (amenity: string) => void;
}

export function AmenitiesSection({ amenities, onAdd, onRemove }: AmenitiesSectionProps) {
  return (
    <div className="space-y-3">
      <Label>Amenities</Label>
      <div className="flex flex-wrap gap-2">
        {COMMON_AMENITIES.map((amenity) => (
          <Button
            key={amenity}
            type="button"
            variant={amenities.includes(amenity) ? "default" : "outline"}
            size="sm"
            onClick={() => amenities.includes(amenity) ? onRemove(amenity) : onAdd(amenity)}
          >
            {amenities.includes(amenity) ? (
              <X className="h-3 w-3 mr-1" />
            ) : (
              <Plus className="h-3 w-3 mr-1" />
            )}
            {amenity}
          </Button>
        ))}
      </div>
      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {amenities.map((amenity) => (
            <Badge key={amenity} variant="secondary" className="text-xs">
              {amenity}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => onRemove(amenity)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
