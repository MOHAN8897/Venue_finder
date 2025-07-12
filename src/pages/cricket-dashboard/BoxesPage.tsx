
import { DashboardLayout } from "@/components/cricket-dashboard/DashboardLayout";
import { BoxCard } from "@/components/cricket-dashboard/BoxCard";
import { AddBoxDialog } from "@/components/cricket-dashboard/AddBoxDialog";
import { GoogleMapView } from "@/components/cricket-dashboard/GoogleMapView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Grid3X3, Map, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";

export interface Box {
  id: string;
  name: string;
  image: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  pricing: {
    hourlyRate: number;
    peakHourRate: number;
  };
  amenities: string[];
  status: "active" | "maintenance" | "inactive";
  availability: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  stats: {
    totalBookings: number;
    revenue: number;
    occupancyRate: number;
  };
}

const BoxesPage = () => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);

  const handleAddBox = (newBox: Omit<Box, "id" | "stats">) => {
    const box: Box = {
      ...newBox,
      id: Date.now().toString(),
      stats: {
        totalBookings: 0,
        revenue: 0,
        occupancyRate: 0
      }
    };
    setBoxes([...boxes, box]);
    toast.success("Box added successfully!");
  };

  const handleUpdateBox = (updatedBox: Box) => {
    setBoxes(boxes.map(box => box.id === updatedBox.id ? updatedBox : box));
    toast.success("Box updated successfully!");
  };

  const handleDeleteBox = (boxId: string) => {
    const box = boxes.find(b => b.id === boxId);
    if (box) {
      setBoxes(boxes.filter(box => box.id !== boxId));
      toast.success(`${box.name} deleted successfully!`);
    }
  };

  if (boxes.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Cricket Boxes</h1>
              <p className="text-muted-foreground">Manage your cricket box venues and settings</p>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              className="bg-gradient-accent hover:bg-accent/90 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Box
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6">
              <Building2 className="h-12 w-12 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No boxes yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Start building your cricket venue business by adding your first box. You can manage pricing, availability, and bookings all in one place.
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              size="lg"
              className="bg-gradient-primary hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Box
            </Button>
          </div>

          <AddBoxDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onAddBox={handleAddBox}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Cricket Boxes</h1>
            <p className="text-muted-foreground">
              Managing {boxes.length} cricket box{boxes.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            className="bg-gradient-accent hover:bg-accent/90 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Box
          </Button>
        </div>

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Grid View</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map View</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {boxes.map((box) => (
                <BoxCard
                  key={box.id}
                  box={box}
                  onUpdate={handleUpdateBox}
                  onDelete={handleDeleteBox}
                  onSelect={setSelectedBox}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <div className="h-[400px] sm:h-[600px] rounded-lg border border-border overflow-hidden">
              <GoogleMapView boxes={boxes} onBoxSelect={setSelectedBox} />
            </div>
          </TabsContent>
        </Tabs>

        <AddBoxDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddBox={handleAddBox}
        />
      </div>
    </DashboardLayout>
  );
};

export default BoxesPage;
