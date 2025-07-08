import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Check, Eye } from 'lucide-react';
import { MetricsCards } from './MetricsCards';
import { RecentActivity } from './RecentActivity';
import { RevenueChart } from './RevenueChart';

export function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back to VenueFinder Super Admin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View Reports
          </Button>
          <Button size="sm">
            <Check className="mr-2 h-4 w-4" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <MetricsCards />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivity />
        
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-status-pending" />
                <span className="text-sm">Pending Reviews</span>
              </div>
              <Badge variant="secondary" className="bg-status-pending text-white">
                12
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm">New Users Today</span>
              </div>
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                8
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-status-approved" />
                <span className="text-sm">Completed Bookings</span>
              </div>
              <Badge variant="secondary" className="bg-status-approved text-white">
                156
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}