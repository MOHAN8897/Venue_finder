import React, { useState } from 'react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Venue } from '../lib/venueService';
import { Calendar as CalendarIcon, Power, PowerOff } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface VenueVisibilityControlProps {
  venue: Venue;
  onVisibilityChange: (venueId: string, isPublished: boolean) => Promise<void>;
  onUnavailabilityChange: (venueId: string, dates: DateRange) => Promise<void>;
}

const VenueVisibilityControl: React.FC<VenueVisibilityControlProps> = ({
  venue,
  onVisibilityChange,
  onUnavailabilityChange,
}) => {
  const [isPublished, setIsPublished] = useState(venue.is_published);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handlePublishToggle = async () => {
    const newStatus = !isPublished;
    // We can add optimistic update here if needed
    setIsPublished(newStatus);
    await onVisibilityChange(venue.id, newStatus);
  };

  const handleSetUnavailability = async () => {
    if (dateRange) {
        await onUnavailabilityChange(venue.id, dateRange);
    }
  };

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visibility Control</CardTitle>
            {isPublished ? <Power className="h-4 w-4 text-green-500" /> : <PowerOff className="h-4 w-4 text-red-500" />}
        </CardHeader>
        <CardContent>
            <div className="flex items-center space-x-2">
                <Switch 
                    id={`publish-switch-${venue.id}`} 
                    checked={isPublished}
                    onCheckedChange={handlePublishToggle}
                />
                <Label htmlFor={`publish-switch-${venue.id}`}>{isPublished ? 'Live / Published' : 'Unpublished / Draft'}</Label>
            </div>

            <div className="mt-4">
                <Label>Set Temporary Unavailability</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal mt-1"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
                 <Button onClick={handleSetUnavailability} disabled={!dateRange} className="w-full mt-2">
                    Mark as Unavailable
                </Button>
            </div>
        </CardContent>
    </Card>
  );
};

export default VenueVisibilityControl; 