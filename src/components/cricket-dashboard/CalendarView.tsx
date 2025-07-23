
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import React, { useState } from 'react';
import { ReactCalendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface CalendarViewProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

export function CalendarView({ selectedDate, onDateSelect }) {
  const [internalDate, setInternalDate] = useState(selectedDate || new Date());
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReactCalendar
          value={internalDate}
          onChange={(value) => {
            const date = value as Date;
            if (!date) return;
            if (date < new Date(new Date().setHours(0,0,0,0))) {
              alert('Date is unavailable');
              return;
            }
            setInternalDate(date);
            onDateSelect && onDateSelect(date);
          }}
          minDate={new Date(new Date().setHours(0,0,0,0))}
          tileDisabled={({ date }) => date < new Date(new Date().setHours(0,0,0,0))}
          tileClassName={({ date }) => {
            if (internalDate && date.toDateString() === internalDate.toDateString()) {
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
          className="rounded-md border w-full"
        />
      </CardContent>
    </Card>
  );
}
