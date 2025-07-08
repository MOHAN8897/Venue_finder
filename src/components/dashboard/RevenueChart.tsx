import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function RevenueChart() {
  // This will be replaced with real data from backend
  const data = [
    { month: 'Jan', revenue: 4000, bookings: 240 },
    { month: 'Feb', revenue: 3000, bookings: 300 },
    { month: 'Mar', revenue: 2000, bookings: 180 },
    { month: 'Apr', revenue: 2780, bookings: 210 },
    { month: 'May', revenue: 1890, bookings: 270 },
    { month: 'Jun', revenue: 2390, bookings: 320 },
    { month: 'Jul', revenue: 3490, bookings: 400 },
    { month: 'Aug', revenue: 4200, bookings: 380 },
    { month: 'Sep', revenue: 3800, bookings: 350 },
    { month: 'Oct', revenue: 4100, bookings: 390 },
    { month: 'Nov', revenue: 4500, bookings: 420 },
    { month: 'Dec', revenue: 5200, bookings: 450 },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(266 85% 58%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(266 85% 58%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            dataKey="month" 
            className="text-xs fill-muted-foreground"
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            className="text-xs fill-muted-foreground"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              color: 'hsl(var(--popover-foreground))'
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(266 85% 58%)"
            fillOpacity={1}
            fill="url(#colorRevenue)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}