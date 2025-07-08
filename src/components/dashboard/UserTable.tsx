import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Edit, Users } from 'lucide-react';
import type { User } from '@/types/dashboard';

interface UserTableProps {
  users: User[];
  userType: 'venue_owners' | 'customers';
  searchQuery: string;
  getRoleBadge: (role: User['role']) => { variant: 'secondary'; className: string };
  getStatusBadge: (status: User['status']) => { variant: 'secondary'; className: string };
  formatDate: (dateString: string) => string;
}

export function UserTable({ 
  users, 
  userType, 
  searchQuery, 
  getRoleBadge, 
  getStatusBadge, 
  formatDate 
}: UserTableProps) {
  const handleViewUser = (user: User) => {
    // This will be implemented with a modal
    console.log('View user:', user.id);
  };

  const handleEditUser = (user: User) => {
    // This will be implemented with a modal
    console.log('Edit user:', user.id);
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No {userType === 'venue_owners' ? 'venue owners' : 'customers'} found
        </h3>
        <p className="text-muted-foreground">
          {searchQuery ? 'Try adjusting your search terms.' : `No ${userType === 'venue_owners' ? 'venue owners' : 'customers'} registered yet.`}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge {...getRoleBadge(user.role)}>
                  {user.role.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge {...getStatusBadge(user.status)}>
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {user.role === 'venue_owner' ? (
                    <span>{user.venuesCount || 0} venues</span>
                  ) : (
                    <span>{user.bookingsCount || 0} bookings</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {formatDate(user.joinedAt)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewUser(user)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}