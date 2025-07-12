
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { CalendarDays, Clock, User, Phone, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface ManualBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boxes: Array<{ id: string; name: string; pricing: { hourlyRate: number } }>;
  onBookingCreate: (booking: any) => void;
}

export function ManualBookingDialog({ open, onOpenChange, boxes, onBookingCreate }: ManualBookingDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    boxId: "",
    startTime: "",
    endTime: "",
    notes: "",
    paymentStatus: "pending" as "pending" | "paid" | "partial"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !formData.boxId || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const selectedBox = boxes.find(box => box.id === formData.boxId);
    if (!selectedBox) return;

    const startHour = parseInt(formData.startTime.split(':')[0]);
    const endHour = parseInt(formData.endTime.split(':')[0]);
    const duration = endHour - startHour;
    const amount = duration * selectedBox.pricing.hourlyRate;

    const booking = {
      id: Date.now().toString(),
      ...formData,
      boxName: selectedBox.name,
      date: selectedDate,
      amount,
      status: "confirmed",
      createdAt: new Date(),
      createdBy: "manual"
    };

    onBookingCreate(booking);
    toast.success("Booking created successfully");
    onOpenChange(false);
    
    // Reset form
    setFormData({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      boxId: "",
      startTime: "",
      endTime: "",
      notes: "",
      paymentStatus: "pending"
    });
  };

  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = 6 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Create Manual Booking
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Customer Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    placeholder="Enter customer name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (Optional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any special requirements or notes..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Booking Details</h3>
              
              <div className="space-y-2">
                <Label>Select Date *</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(Date.now() - 86400000)}
                  className="rounded-md border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boxId">Select Box *</Label>
                <Select value={formData.boxId} onValueChange={(value) => setFormData({...formData, boxId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a box" />
                  </SelectTrigger>
                  <SelectContent>
                    {boxes.map((box) => (
                      <SelectItem key={box.id} value={box.id}>
                        {box.name} - ₹{box.pricing.hourlyRate}/hr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Select value={formData.startTime} onValueChange={(value) => setFormData({...formData, startTime: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Select value={formData.endTime} onValueChange={(value) => setFormData({...formData, endTime: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Select value={formData.paymentStatus} onValueChange={(value: any) => setFormData({...formData, paymentStatus: value})}>
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-primary hover:bg-primary/90">
              Create Booking
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
