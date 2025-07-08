import React from 'react';
import { Calendar, dateFnsLocalizer, EventProps, Event } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent } from './ui/card';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CustomEvent extends Event {
    id: number;
    status: 'confirmed' | 'pending' | 'cancelled';
}

// --- FAKE DATA ---
const events: CustomEvent[] = [
  {
    id: 1,
    title: 'Wedding Reception - Smith',
    start: new Date(2024, 6, 28, 18, 0, 0),
    end: new Date(2024, 6, 28, 23, 0, 0),
    status: 'confirmed',
  },
  {
    id: 2,
    title: 'Corporate Offsite - Acme Inc.',
    start: new Date(2024, 7, 5, 9, 0, 0),
    end: new Date(2024, 7, 7, 17, 0, 0),
    status: 'confirmed',
  },
  {
    id: 3,
    title: 'Birthday Party - Jones (Tentative)',
    start: new Date(2024, 7, 10, 14, 0, 0),
    end: new Date(2024, 7, 10, 18, 0, 0),
    status: 'pending',
  },
];

const EventComponent = ({ event }: EventProps<CustomEvent>) => {
    const statusStyles = {
        confirmed: 'bg-green-500 text-white',
        pending: 'bg-yellow-400 text-black',
        cancelled: 'bg-red-500 text-white line-through',
    };
    const style = statusStyles[event.status] || 'bg-gray-500 text-white';

    return (
        <div className={`p-1 rounded-md text-xs ${style}`}>
            <strong>{event.title}</strong>
        </div>
    );
};


interface BookingCalendarProps {
}

const BookingCalendar: React.FC<BookingCalendarProps> = () => {
  // In a real implementation, you would fetch bookings for a specific venue
  
  return (
    <Card>
        <CardContent className="p-4">
            <div style={{ height: '700px' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    components={{
                        event: EventComponent,
                    }}
                    eventPropGetter={(event: CustomEvent) => {
                        const statusStyles = {
                            confirmed: { className: 'border-l-4 border-green-700' },
                            pending: { className: 'border-l-4 border-yellow-600' },
                            cancelled: { className: 'border-l-4 border-red-700' },
                        };
                        return statusStyles[event.status] || {};
                    }}
                />
            </div>
        </CardContent>
    </Card>
  );
};

export default BookingCalendar; 