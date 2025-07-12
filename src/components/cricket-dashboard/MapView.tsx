
import { useEffect, useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { Box } from "@/pages/BoxesPage";

interface MapViewProps {
  boxes: Box[];
  onBoxSelect: (box: Box) => void;
}

export function MapView({ boxes, onBoxSelect }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [map, setMap] = useState<any>(null);

  const initializeMap = async () => {
    if (!mapboxToken || !mapContainer.current) return;

    try {
      // Dynamically import mapbox-gl
      const mapboxgl = await import('mapbox-gl');
      
      mapboxgl.default.accessToken = mapboxToken;
      
      const mapInstance = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [77.2090, 28.6139], // Delhi coordinates
        zoom: 12,
      });

      // Add markers for each box
      boxes.forEach((box) => {
        const marker = new mapboxgl.default.Marker({
          color: '#2E8B57' // Primary green color
        })
          .setLngLat([box.location.lng, box.location.lat])
          .setPopup(
            new mapboxgl.default.Popup({ offset: 25 }).setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${box.name}</h3>
                <p class="text-sm text-gray-600">${box.location.address}</p>
                <p class="text-sm font-medium">₹${box.pricing.hourlyRate}/hr</p>
              </div>
            `)
          )
          .addTo(mapInstance);

        marker.getElement().addEventListener('click', () => {
          onBoxSelect(box);
        });
      });

      setMap(mapInstance);
      setShowTokenInput(false);
    } catch (error) {
      console.error('Error loading map:', error);
    }
  };

  const handleTokenSubmit = () => {
    if (mapboxToken) {
      initializeMap();
    }
  };

  if (showTokenInput) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Map Integration</h3>
              <p className="text-sm text-muted-foreground">
                Enter your Mapbox public token to view your boxes on the map.
                Get your token from{' '}
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  mapbox.com
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Enter Mapbox public token (pk.xxxxx)"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                type="password"
              />
              <Button onClick={handleTokenSubmit} className="w-full" disabled={!mapboxToken}>
                <Navigation className="h-4 w-4 mr-2" />
                Load Map
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      <div className="absolute top-4 right-4 z-10">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTokenInput(true)}
          className="bg-background/90 backdrop-blur-sm"
        >
          Change Token
        </Button>
      </div>
    </div>
  );
}
