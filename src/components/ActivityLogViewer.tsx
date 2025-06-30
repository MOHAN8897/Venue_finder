import React, { useEffect, useState } from 'react';
import { ActivityLogService, ActivityLog } from '../lib/activityLogService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';

interface ActivityLogViewerProps {
  venueId: string;
}

const ActivityLogViewer: React.FC<ActivityLogViewerProps> = ({ venueId }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const fetchedLogs = await ActivityLogService.getLogsForVenue(venueId);
        setLogs(fetchedLogs);
      } catch (err) {
        setError('Failed to fetch activity logs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchLogs();
    }
  }, [venueId]);

  if (loading) {
    return <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-red-600">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Venue Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">No activity recorded for this venue yet.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium">{log.details}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()} by {log.user_email}
                  </p>
                </div>
                <Badge variant="secondary">{log.action}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogViewer; 