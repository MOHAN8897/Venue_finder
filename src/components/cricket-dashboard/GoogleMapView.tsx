
import { useEffect, useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { Box } from "@/pages/BoxesPage";

interface GoogleMapViewProps {
  boxes: Box[];
  onBoxSelect: (box: Box) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function GoogleMapView({ boxes, onBoxSelect }: GoogleMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(true);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initializeMap = () => {
    if (!apiKey || !mapContainer.current) return;

    setIsLoading(true);

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      const mapInstance = new window.google.maps.Map(mapContainer.current, {
        center: { lat: 28.6139, lng: 77.2090 }, // Delhi coordinates
        zoom: 12,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // Add markers for each box
      boxes.forEach((box) => {
        const marker = new window.google.maps.Marker({
          position: { lat: box.location.lat, lng: box.location.lng },
          map: mapInstance,
          title: box.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#2E8B57" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">B</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${box.name}</h3>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${box.location.address}</p>
              <p style="margin: 0; font-weight: bold;">₹${box.pricing.hourlyRate}/hr</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
          onBoxSelect(box);
        });
      });

      setMap(mapInstance);
      setIsLoading(false);
    };

    document.head.appendChild(script);

    script.onerror = () => {
      setIsLoading(false);
      console.error('Failed to load Google Maps');
    };
  };

  const handleKeySubmit = () => {
    if (apiKey) {
      setShowKeyInput(false);
      initializeMap();
    }
  };

  if (showKeyInput) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Google Maps Integration</h3>
              <p className="text-sm text-muted-foreground">
                Enter your Google Maps API key to view your boxes on the map.
                Get your API key from{' '}
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Enter Google Maps API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
              />
              <Button 
                onClick={handleKeySubmit} 
                className="w-full" 
                disabled={!apiKey || isLoading}
              >
                <Navigation className="h-4 w-4 mr-2" />
                {isLoading ? 'Loading...' : 'Load Map'}
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
          onClick={() => setShowKeyInput(true)}
          className="bg-background/90 backdrop-blur-sm"
        >
          Change API Key
        </Button>
      </div>
    </div>
  );
}
