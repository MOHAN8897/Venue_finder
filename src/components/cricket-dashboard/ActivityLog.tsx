
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, User, Settings, CreditCard, Building2, Filter } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ActivityLogEntry {
  id: string;
  type: "booking" | "payment" | "box" | "user" | "system";
  action: string;
  description: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

interface ActivityLogProps {
  activities: ActivityLogEntry[];
}

export function ActivityLog({ activities }: ActivityLogProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-4 w-4 text-primary" />;
      case "payment":
        return <CreditCard className="h-4 w-4 text-success" />;
      case "box":
        return <Building2 className="h-4 w-4 text-accent" />;
      case "user":
        return <User className="h-4 w-4 text-warning" />;
      case "system":
        return <Settings className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-primary/10 text-primary";
      case "payment":
        return "bg-success/10 text-success";
      case "box":
        return "bg-accent/10 text-accent";
      case "user":
        return "bg-warning/10 text-warning";
      case "system":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredActivities = filterType === "all" 
    ? activities 
    : activities.filter(activity => activity.type === filterType);

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activity recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log ({activities.length})
        </CardTitle>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="booking">Bookings</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="box">Boxes</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredActivities.slice(0, 20).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className={`text-xs ${getTypeColor(activity.type)}`}>
                    {activity.type}
                  </Badge>
                  <span className="font-medium text-sm text-foreground">
                    {activity.action}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(activity.timestamp, 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
