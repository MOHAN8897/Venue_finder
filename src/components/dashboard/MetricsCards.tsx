import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Check, Eye } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  const trendColor = {
    up: 'text-revenue-positive',
    down: 'text-destructive',
    neutral: 'text-revenue-neutral'
  }[trend];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className={`text-xs ${trendColor}`}>
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

export function MetricsCards() {
  // This will be replaced with real data from backend
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$0.00',
      change: 'No data available',
      icon: <Check className="h-4 w-4" />,
      trend: 'neutral' as const
    },
    {
      title: 'Active Venues',
      value: '0',
      change: 'No venues yet',
      icon: <Calendar className="h-4 w-4" />,
      trend: 'neutral' as const
    },
    {
      title: 'Total Users',
      value: '0',
      change: 'No users yet',
      icon: <Users className="h-4 w-4" />,
      trend: 'neutral' as const
    },
    {
      title: 'Pending Reviews',
      value: '0',
      change: 'No pending reviews',
      icon: <Eye className="h-4 w-4" />,
      trend: 'neutral' as const
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}