import React, { useMemo, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Bell, CheckCheck } from 'lucide-react';
import { Badge } from './ui/badge';

interface Notification {
    id: string;
    type: 'booking' | 'review' | 'system';
    message: string;
    timestamp: string;
    isRead: boolean;
}

// --- FAKE DATA ---
const fakeNotifications: Notification[] = [
    { id: '1', type: 'booking', message: 'New booking received for "Grand Hall" on Aug 10.', timestamp: '15m ago', isRead: false },
    { id: '2', type: 'review', message: 'You received a new 5-star review!', timestamp: '1h ago', isRead: false },
    { id: '3', type: 'system', message: 'Your payout of ₹1,00,000 has been processed.', timestamp: '6h ago', isRead: true },
    { id: '4', type: 'booking', message: 'Booking for "Garden Patio" was cancelled by the user.', timestamp: '1d ago', isRead: true },
];

const NotificationItem = React.memo(({ notification }: { notification: Notification }) => {
    return (
        <div className={`p-4 border-b text-sm flex items-start space-x-3 ${!notification.isRead ? 'bg-blue-50' : 'bg-white'}`}>
            <div>{/* Icon can go here */}</div>
            <div className="flex-1">
                <p className="text-gray-800">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
            </div>
        </div>
    );
});

const NotificationPanel: React.FC = () => {
    const memoizedNotifications = useMemo(() => fakeNotifications, []);
    const unreadCount = useMemo(() => memoizedNotifications.filter(n => !n.isRead).length, [memoizedNotifications]);
    const handleMarkAllAsRead = useCallback(() => {
        // In a real app, this would update state/service
        // For now, just log
        console.log('Mark all as read');
    }, []);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4 font-semibold border-b">Notifications</div>
                <div className="max-h-96 overflow-y-auto">
                    {memoizedNotifications.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} />
                    ))}
                </div>
                <div className="p-2 border-t flex justify-center">
                    <Button variant="link" size="sm" className="text-xs" onClick={handleMarkAllAsRead}>
                        <CheckCheck className="mr-2 h-4 w-4"/>
                        Mark all as read
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationPanel; 