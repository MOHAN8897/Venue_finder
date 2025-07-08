import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Activity, User, Calendar, Check, X, Plus, Settings } from 'lucide-react';
import type { ActivityLog } from '@/types/dashboard';

export function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // This will be replaced with real data from backend
  const activityLogs: ActivityLog[] = [];

  const filteredLogs = activityLogs.filter(log =>
    log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const venueActions = activityLogs.filter(log => 
    log.action === 'venue_approved' || log.action === 'venue_rejected'
  );
  const userActions = activityLogs.filter(log => log.action === 'user_suspended');
  const adminActions = activityLogs.filter(log => log.action === 'admin_added');
  const paymentActions = activityLogs.filter(log => log.action === 'payment_processed');

  const getActionIcon = (action: ActivityLog['action']) => {
    const icons = {
      venue_approved: Check,
      venue_rejected: X,
      admin_added: Plus,
      user_suspended: User,
      payment_processed: Settings
    };
    return icons[action];
  };

  const getActionBadge = (action: ActivityLog['action']) => {
    const variants = {
      venue_approved: { variant: 'secondary' as const, className: 'bg-status-approved text-white' },
      venue_rejected: { variant: 'secondary' as const, className: 'bg-status-rejected text-white' },
      admin_added: { variant: 'secondary' as const, className: 'bg-primary text-primary-foreground' },
      user_suspended: { variant: 'secondary' as const, className: 'bg-status-pending text-white' },
      payment_processed: { variant: 'secondary' as const, className: 'bg-secondary text-secondary-foreground' }
    };
    return variants[action];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatActionText = (action: ActivityLog['action']) => {
    const texts = {
      venue_approved: 'Venue Approved',
      venue_rejected: 'Venue Rejected',
      admin_added: 'Admin Added',
      user_suspended: 'User Suspended',
      payment_processed: 'Payment Processed'
    };
    return texts[action];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity & Audit Logs</h1>
          <p className="text-muted-foreground">Track all administrative actions and system events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Filter Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Actions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activityLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              All time activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Venue Actions
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{venueActions.length}</div>
            <p className="text-xs text-muted-foreground">
              Approvals & rejections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              User Actions
            </CardTitle>
            <User className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{userActions.length}</div>
            <p className="text-xs text-muted-foreground">
              User management
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admin Actions
            </CardTitle>
            <Plus className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{adminActions.length}</div>
            <p className="text-xs text-muted-foreground">
              Admin management
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payment Actions
            </CardTitle>
            <Settings className="h-4 w-4 text-revenue-positive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{paymentActions.length}</div>
            <p className="text-xs text-muted-foreground">
              Payment processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search activity logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Activity Logs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No activity logs found</h3>
                        <p className="text-muted-foreground">
                          {searchQuery ? 'Try adjusting your search terms.' : 'Administrative actions will appear here once performed.'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const ActionIcon = getActionIcon(log.action);
                      return (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {log.adminName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium text-foreground">{log.adminName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ActionIcon className="h-4 w-4" />
                              <Badge {...getActionBadge(log.action)}>
                                {formatActionText(log.action)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{log.resource}</div>
                            <div className="text-sm text-muted-foreground">ID: {log.resourceId}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-foreground max-w-xs truncate">
                              {log.details}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(log.timestamp)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs with similar structure but filtered data */}
        <TabsContent value="venues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Venue Management Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No venue activity</h3>
                <p className="text-muted-foreground">Venue approval and rejection actions will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No user activity</h3>
                <p className="text-muted-foreground">User management actions will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Management Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No admin activity</h3>
                <p className="text-muted-foreground">Admin addition and management actions will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Processing Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No payment activity</h3>
                <p className="text-muted-foreground">Payment processing actions will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
