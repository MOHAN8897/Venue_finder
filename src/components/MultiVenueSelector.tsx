import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Venue } from '../lib/venueService';
import { 
  ChevronDown, 
  Building2, 
  CheckCircle,
  Plus
} from 'lucide-react';

interface MultiVenueSelectorProps {
  venues: Venue[];
  selectedVenueId: string;
  onVenueSelect: (venueId: string) => void;
  onAddNewVenue?: () => void;
}

const MultiVenueSelector: React.FC<MultiVenueSelectorProps> = ({
  venues,
  selectedVenueId,
  onVenueSelect,
  onAddNewVenue
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  const handleVenueSelect = (venueId: string) => {
    onVenueSelect(venueId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Venue Selector Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between items-center p-4 h-auto"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {selectedVenue?.name || 'Select Venue'}
            </div>
            <div className="text-sm text-gray-500">
              {selectedVenue ? `${selectedVenue.city}, ${selectedVenue.state}` : 'Choose a venue to manage'}
            </div>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Your Venues ({venues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  onClick={() => handleVenueSelect(venue.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    venue.id === selectedVenueId
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        venue.id === selectedVenueId ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Building2 className={`h-4 w-4 ${
                          venue.id === selectedVenueId ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <div className={`font-medium ${
                          venue.id === selectedVenueId ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {venue.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {venue.city}, {venue.state} • {venue.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {venue.id === selectedVenueId && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Venue Button */}
            {onAddNewVenue && (
              <div className="border-t border-gray-200 p-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    onAddNewVenue();
                    setIsOpen(false);
                  }}
                  className="w-full justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Venue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default MultiVenueSelector;
