
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

interface TimeSlotsProps {
  bookings: Booking[];
}

export function TimeSlots({ bookings }: TimeSlotsProps) {
  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = 6 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Time Slots</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {timeSlots.map((timeSlot) => {
            const isBooked = bookings.some(booking => 
              booking.startTime <= timeSlot && booking.endTime > timeSlot
            );
            
            return (
              <Button
                key={timeSlot}
                variant={isBooked ? "destructive" : "outline"}
                size="sm"
                disabled={isBooked}
                className="text-xs"
              >
                {timeSlot}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
