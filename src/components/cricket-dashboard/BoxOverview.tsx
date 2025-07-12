
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, Settings, Eye, Plus, Users, IndianRupee } from "lucide-react";
import { ManualBookingDialog } from "./ManualBookingDialog";
import { useState } from "react";

interface BoxData {
  id: string;
  name: string;
  status: "active" | "maintenance" | "disabled";
  todayBookings: number;
  todayRevenue: number;
  occupancyRate: number;
  pricing: {
    hourlyRate: number;
    peakHourRate: number;
  };
  image?: string;
}

interface BoxOverviewProps {
  boxes: BoxData[];
  onBookingCreate: (booking: any) => void;
}

export function BoxOverview({ boxes = [], onBookingCreate }: BoxOverviewProps) {
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "maintenance":
        return "bg-warning/10 text-warning border-warning/20";
      case "disabled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 70) return "text-success";
    if (rate >= 40) return "text-warning";
    return "text-destructive";
  };

  if (boxes.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Box Overview</CardTitle>
          <Button variant="outline" size="sm">
            <Building2 className="h-4 w-4 mr-2" />
            Add Your First Box
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No boxes yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Start by adding your first cricket box to begin managing bookings and revenue.
            </p>
            <Button className="bg-gradient-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Box
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Box Overview ({boxes.length} boxes)
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsBookingDialogOpen(true)}
              size="sm" 
              className="bg-gradient-accent hover:bg-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick Booking
            </Button>
            <Button variant="outline" size="sm">
              <Building2 className="h-4 w-4 mr-2" />
              Manage Boxes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {boxes.map((box) => (
              <div
                key={box.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:shadow-sm transition-all duration-200 gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-foreground">{box.name}</h4>
                      <Badge className={getStatusColor(box.status)}>
                        {box.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{box.todayBookings} bookings today</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        <span>₹{box.todayRevenue} revenue</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className={getOccupancyColor(box.occupancyRate)}>
                          {box.occupancyRate}% occupied
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ManualBookingDialog
        open={isBookingDialogOpen}
        onOpenChange={setIsBookingDialogOpen}
        boxes={boxes}
        onBookingCreate={onBookingCreate}
      />
    </>
  );
}
