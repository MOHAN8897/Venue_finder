
import { DashboardLayout } from "@/components/cricket-dashboard/DashboardLayout";
import { MetricsCard } from "@/components/cricket-dashboard/MetricsCard";
import { RecentBookings } from "@/components/cricket-dashboard/RecentBookings";
import { BoxOverview } from "@/components/cricket-dashboard/BoxOverview";
import { NotificationCenter } from "@/components/cricket-dashboard/NotificationCenter";
import { ActivityLog } from "@/components/cricket-dashboard/ActivityLog";
import { 
  Building2, 
  Calendar, 
  TrendingUp, 
  IndianRupee,
  Users,
  Clock
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";

const Index = () => {
  // State management for all data
  const [boxes, setBoxes] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Handle booking creation
  const handleBookingCreate = (booking: any) => {
    setBookings(prev => [booking, ...prev]);
    
    // Add notification
    const notification = {
      id: Date.now().toString(),
      type: "success",
      title: "Booking Created",
      message: `New booking for ${booking.boxName} by ${booking.customerName}`,
      timestamp: new Date(),
      read: false,
      category: "booking"
    };
    setNotifications(prev => [notification, ...prev]);

    // Add activity log
    const activity = {
      id: Date.now().toString(),
      type: "booking",
      action: "Booking Created",
      description: `Manual booking created for ${booking.boxName} by ${booking.customerName} on ${booking.date.toDateString()}`,
      timestamp: new Date(),
      metadata: { bookingId: booking.id, amount: booking.amount }
    };
    setActivities(prev => [activity, ...prev]);
  };

  // Handle notification actions
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Calculate metrics from actual data
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
  const todayBookings = bookings.filter(booking => {
    const today = new Date();
    const bookingDate = new Date(booking.date);
    return bookingDate.toDateString() === today.toDateString();
  }).length;
  const activeBoxes = boxes.filter(box => box.status === 'active').length;
  const avgOccupancy = boxes.length > 0 
    ? Math.round(boxes.reduce((sum, box) => sum + (box.occupancyRate || 0), 0) / boxes.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in mb-8 no-vertical-border-overlap">
        {/* Welcome Section */}
        <div 
          className="rounded-xl p-6" 
          style={{ 
            backgroundColor: '#16a34a !important', 
            color: 'white !important',
            background: '#16a34a'
          }}
        >
          <h1 
            className="text-2xl font-bold mb-2" 
            style={{ color: 'white !important' }}
          >
            Welcome back, Venue Owner!
          </h1>
          <p 
            style={{ color: 'rgba(255, 255, 255, 0.9) !important' }}
          >
            {boxes.length === 0 
              ? "Start by adding your first cricket box to begin managing bookings"
              : `Managing ${boxes.length} cricket boxes with ${todayBookings} bookings today`
            }
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            change="0%"
            changeType="neutral"
            icon={IndianRupee}
            description="all time"
          />
          <MetricsCard
            title="Today's Bookings"
            value={todayBookings.toString()}
            change="0"
            changeType="neutral"
            icon={Calendar}
            description="new today"
          />
          <MetricsCard
            title="Active Boxes"
            value={activeBoxes.toString()}
            change="0"
            changeType="neutral"
            icon={Building2}
            description={`out of ${boxes.length} total`}
          />
          <MetricsCard
            title="Avg. Occupancy"
            value={`${avgOccupancy}%`}
            change="0%"
            changeType="neutral"
            icon={TrendingUp}
            description="this week"
          />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BoxOverview boxes={boxes} onBookingCreate={handleBookingCreate} />
          <RecentBookings bookings={bookings.slice(0, 5)} />
        </div>

        {/* Notifications and Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDismiss={handleDismissNotification}
          />
          <ActivityLog activities={activities} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
