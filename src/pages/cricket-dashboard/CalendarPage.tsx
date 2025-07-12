
import { DashboardLayout } from "@/components/cricket-dashboard/DashboardLayout";
import { CalendarView } from "@/components/cricket-dashboard/CalendarView";
import { BookingsList } from "@/components/cricket-dashboard/BookingsList";
import { TimeSlots } from "@/components/cricket-dashboard/TimeSlots";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  boxName: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: "confirmed" | "pending" | "cancelled";
  amount: number;
}

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedBox, setSelectedBox] = useState<string>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [boxes] = useState<Array<{id: string; name: string}>>([]);

  const filteredBookings = bookings.filter(booking => {
    const dateMatch = selectedDate ? 
      format(booking.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') : true;
    const boxMatch = selectedBox === "all" || booking.boxName === selectedBox;
    return dateMatch && boxMatch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Calendar & Bookings</h1>
            <p className="text-muted-foreground">Manage your box bookings and schedule</p>
          </div>
          <Button className="bg-gradient-accent hover:bg-accent/90 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Booking
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="overflow-x-auto max-w-full">
            <CalendarView 
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <BookingsList
              bookings={filteredBookings}
              selectedDate={selectedDate}
              selectedBox={selectedBox}
              onBoxChange={setSelectedBox}
              boxes={boxes}
            />

            <TimeSlots bookings={filteredBookings} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
