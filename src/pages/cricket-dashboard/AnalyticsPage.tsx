
import { DashboardLayout } from "@/components/cricket-dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/cricket-dashboard/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cricket-dashboard/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Clock, BarChart3 } from "lucide-react";
import { useState } from "react";

const revenueData = [
  { month: 'Jan', revenue: 45000, bookings: 120 },
  { month: 'Feb', revenue: 52000, bookings: 138 },
  { month: 'Mar', revenue: 48000, bookings: 128 },
  { month: 'Apr', revenue: 61000, bookings: 162 },
  { month: 'May', revenue: 58000, bookings: 154 },
  { month: 'Jun', revenue: 67000, bookings: 178 }
];

const hourlyData = [
  { hour: '6-8', bookings: 15 },
  { hour: '8-10', bookings: 22 },
  { hour: '10-12', bookings: 18 },
  { hour: '12-14', bookings: 12 },
  { hour: '14-16', bookings: 25 },
  { hour: '16-18', bookings: 32 },
  { hour: '18-20', bookings: 28 },
  { hour: '20-22', bookings: 20 }
];

const boxPerformance = [
  { name: 'Premium Box A', value: 45, color: '#2E8B57' },
  { name: 'Standard Box B', value: 30, color: '#DAA520' },
  { name: 'Economy Box C', value: 25, color: '#4682B4' }
];

const AnalyticsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
            <p className="text-muted-foreground">Track your venue performance and insights</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mb-6">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No analytics data yet</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Analytics and reports will appear here once you start managing bookings and boxes.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
