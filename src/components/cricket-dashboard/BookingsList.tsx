
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, Phone } from "lucide-react";
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

interface BookingsListProps {
  bookings: Booking[];
  selectedDate: Date | undefined;
  selectedBox: string;
  onBoxChange: (value: string) => void;
  boxes: Array<{id: string; name: string}>;
}

export function BookingsList({ 
  bookings, 
  selectedDate, 
  selectedBox, 
  onBoxChange, 
  boxes 
}: BookingsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success/10 text-success border-success/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">
            Bookings for {selectedDate ? format(selectedDate, 'PPP') : 'All Days'}
          </CardTitle>
          {boxes.length > 0 && (
            <Select value={selectedBox} onValueChange={onBoxChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Boxes</SelectItem>
                {boxes.map((box) => (
                  <SelectItem key={box.id} value={box.name}>{box.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="font-medium text-foreground">{booking.customerName}</h4>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{booking.boxName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{booking.customerPhone}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-semibold text-foreground">₹{booking.amount}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(booking.date, 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bookings found</p>
              <p className="text-sm">
                {boxes.length === 0 
                  ? "Add your first box to start receiving bookings"
                  : "Create your first booking or wait for customers to book"
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
