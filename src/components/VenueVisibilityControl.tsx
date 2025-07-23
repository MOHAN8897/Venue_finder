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
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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
                        <ReactCalendar
                            selectRange={true}
                            value={dateRange.from && dateRange.to ? [dateRange.from, dateRange.to] : dateRange.from ? dateRange.from : null}
                            onChange={(value) => {
                                if (Array.isArray(value)) {
                                    setDateRange({ from: value[0] ?? undefined, to: value[1] ?? undefined });
                                } else if (value instanceof Date) {
                                    setDateRange({ from: value, to: undefined });
                                } else {
                                    setDateRange({ from: undefined, to: undefined });
                                }
                            }}
                            minDate={new Date(new Date().setHours(0,0,0,0))}
                            tileDisabled={({ date }) => date < new Date(new Date().setHours(0,0,0,0))}
                            tileClassName={({ date }) => {
                                const isSelected = dateRange.from && dateRange.to && date >= dateRange.from && date <= dateRange.to;
                                if (isSelected) {
                                    return 'bg-blue-500 text-white border-blue-700 border-2 scale-105 shadow-md z-10 relative';
                                }
                                if (date < new Date(new Date().setHours(0,0,0,0))) {
                                    return 'opacity-40 pointer-events-none';
                                }
                                return 'bg-green-200 text-green-900 border-green-400 border-2';
                            }}
                            tileContent={({ date }) => {
                                if (date < new Date(new Date().setHours(0,0,0,0))) {
                                    return <span title="Date is unavailable" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }} />;
                                }
                                return null;
                            }}
                            className="rounded-md border"
                            showDoubleView={true}
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