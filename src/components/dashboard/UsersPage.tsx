
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Users, User, Eye, Calendar, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserTable } from './UserTable';
import type { User as UserType } from '@/types/dashboard';

export function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('venue_owners');

  // This will be replaced with real data from backend
  const users: UserType[] = [];

  // Filter out admin users and separate by role
  const nonAdminUsers = users.filter(user => 
    user.role === 'venue_owner' || user.role === 'customer'
  );

  const venueOwnerUsers = nonAdminUsers.filter(user => user.role === 'venue_owner');
  const customerUsers = nonAdminUsers.filter(user => user.role === 'customer');

  const getFilteredUsers = (userList: UserType[]) => {
    return userList.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const venueOwners = users.filter(u => u.role === 'venue_owner').length;
  const customers = users.filter(u => u.role === 'customer').length;

  const getRoleBadge = (role: UserType['role']) => {
    const variants = {
      venue_owner: { variant: 'secondary' as const, className: 'bg-primary text-primary-foreground' },
      customer: { variant: 'secondary' as const, className: 'bg-secondary text-secondary-foreground' }
    };
    return variants[role];
  };

  const getStatusBadge = (status: UserType['status']) => {
    const variants = {
      active: { variant: 'secondary' as const, className: 'bg-status-approved text-white' },
      suspended: { variant: 'secondary' as const, className: 'bg-status-rejected text-white' }
    };
    return variants[status];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage registered users and their activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Export Users
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <User className="h-4 w-4 text-status-approved" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Venue Owners
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{venueOwners}</div>
            <p className="text-xs text-muted-foreground">
              Business accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers
            </CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{customers}</div>
            <p className="text-xs text-muted-foreground">
              Individual users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="venue_owners" className="relative">
            Venue Owners
            {venueOwnerUsers.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 bg-primary text-primary-foreground">
                {venueOwnerUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="customers">
            Customers
            {customerUsers.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 bg-secondary text-secondary-foreground">
                {customerUsers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Venue Owners Tab */}
        <TabsContent value="venue_owners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Venue Owners</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable 
                users={getFilteredUsers(venueOwnerUsers)} 
                userType="venue_owners"
                searchQuery={searchQuery}
                getRoleBadge={getRoleBadge}
                getStatusBadge={getStatusBadge}
                formatDate={formatDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable 
                users={getFilteredUsers(customerUsers)} 
                userType="customers"
                searchQuery={searchQuery}
                getRoleBadge={getRoleBadge}
                getStatusBadge={getStatusBadge}
                formatDate={formatDate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
