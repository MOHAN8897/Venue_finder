
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, Users, Settings, Trash2, Edit } from "lucide-react";
import { Box } from "@/pages/BoxesPage";
import { EditBoxDialog } from "./EditBoxDialog";
import { useState } from "react";

interface BoxCardProps {
  box: Box;
  onUpdate: (box: Box) => void;
  onDelete: (boxId: string) => void;
  onSelect: (box: Box) => void;
}

export function BoxCard({ box, onUpdate, onDelete, onSelect }: BoxCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => onSelect(box)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{box.name}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{box.location.address}</span>
              </div>
            </div>
            <Badge className={getStatusColor(box.status)}>
              {box.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="aspect-video rounded-lg bg-muted overflow-hidden">
            <img
              src={box.image}
              alt={box.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <div>
                <div className="font-medium">₹{box.pricing.hourlyRate}/hr</div>
                <div className="text-xs text-muted-foreground">Regular</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <div className="font-medium">{box.stats.occupancyRate}%</div>
                <div className="text-xs text-muted-foreground">Occupancy</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-accent" />
            <span>Available: 6 AM - 10 PM</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {box.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {box.amenities.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{box.amenities.length - 3} more
              </Badge>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditDialogOpen(true);
              }}
              className="flex-1"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(box.id);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditBoxDialog
        box={box}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdate={onUpdate}
      />
    </>
  );
}
