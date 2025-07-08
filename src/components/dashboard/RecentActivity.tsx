
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, User, Calendar, Check, Eye } from 'lucide-react';

export function RecentActivity() {
  // This will be replaced with real data from backend
  const activities: Array<{
    id: string;
    type: string;
    message: string;
    user: string;
    timestamp: string;
    status: 'approved' | 'rejected' | 'pending' | 'info';
  }> = [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-3 w-3 text-status-approved" />;
      case 'rejected':
        return <Eye className="h-3 w-3 text-status-rejected" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-status-pending" />;
      default:
        return <User className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: { variant: 'secondary' as const, className: 'bg-status-approved text-white' },
      rejected: { variant: 'secondary' as const, className: 'bg-status-rejected text-white' },
      pending: { variant: 'secondary' as const, className: 'bg-status-pending text-black' },
      info: { variant: 'secondary' as const, className: 'bg-muted text-muted-foreground' }
    };
    return variants[status as keyof typeof variants] || variants.info;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No recent activity</h3>
            <p className="text-muted-foreground">
              Admin actions and system events will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="mt-1">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {activity.user.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{activity.user}</span>
                    <Badge {...getStatusBadge(activity.status)}>
                      {activity.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{activity.message}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
