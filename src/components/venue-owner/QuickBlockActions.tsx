import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Wrench, 
  Calendar, 
  Clock, 
  X, 
  CheckCircle2, 
  Loader2,
  Zap,
  Shield,
  Ban
} from 'lucide-react';
import { format, addDays, addHours } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// TypeScript Interfaces
interface QuickBlockActionsProps {
  venueId: string;
  selectedDate?: string;
  onBlockoutChange: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  action: () => Promise<void>;
  className?: string;
}

export function QuickBlockActions({ 
  venueId, 
  selectedDate, 
  onBlockoutChange 
}: QuickBlockActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper function to create blockout
  const createQuickBlockout = async (
    startDate: string,
    endDate: string,
    reason: string,
    blockType: 'maintenance' | 'personal' | 'event' | 'other',
    startTime?: string,
    endTime?: string
  ) => {
    try {
      const blockoutData = {
        venue_id: venueId,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime || null,
        end_time: endTime || null,
        reason,
        block_type: blockType,
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('venue_blockouts')
        .insert(blockoutData);

      if (error) {
        // Handle case where table doesn't exist yet
        if (error.message.includes('relation "venue_blockouts" does not exist')) {
          toast.error('Blockout system requires database setup. This feature will be available after migration.');
          return;
        }
        throw error;
      }

      toast.success(`Quick blockout created: ${reason}`);
      onBlockoutChange();

    } catch (err: any) {
      console.error('Error creating quick blockout:', err);
      toast.error(err.message || 'Failed to create blockout');
    }
  };

  // Quick action handlers
  const handleBlockToday = async () => {
    setLoading('today');
    const today = format(new Date(), 'yyyy-MM-dd');
    await createQuickBlockout(
      today,
      today,
      'Emergency maintenance - Today',
      'maintenance'
    );
    setLoading(null);
  };

  const handleBlockTomorrow = async () => {
    setLoading('tomorrow');
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    await createQuickBlockout(
      tomorrow,
      tomorrow,
      'Scheduled maintenance - Tomorrow',
      'maintenance'
    );
    setLoading(null);
  };

  const handleBlockThisWeekend = async () => {
    setLoading('weekend');
    const today = new Date();
    const saturday = addDays(today, 6 - today.getDay()); // Next Saturday
    const sunday = addDays(saturday, 1);
    
    await createQuickBlockout(
      format(saturday, 'yyyy-MM-dd'),
      format(sunday, 'yyyy-MM-dd'),
      'Weekend closure - Personal event',
      'personal'
    );
    setLoading(null);
  };

  const handleBlockNextWeek = async () => {
    setLoading('nextweek');
    const nextMonday = addDays(new Date(), 8 - new Date().getDay()); // Next Monday
    const nextFriday = addDays(nextMonday, 4);
    
    await createQuickBlockout(
      format(nextMonday, 'yyyy-MM-dd'),
      format(nextFriday, 'yyyy-MM-dd'),
      'Weekly maintenance - Next week',
      'maintenance'
    );
    setLoading(null);
  };

  const handleBlockSelectedDate = async () => {
    if (!selectedDate) {
      toast.error('Please select a date first');
      return;
    }
    
    setLoading('selected');
    await createQuickBlockout(
      selectedDate,
      selectedDate,
      `Manual blockout - ${format(new Date(selectedDate), 'MMM d, yyyy')}`,
      'other'
    );
    setLoading(null);
  };

  const handleBlockEveningHours = async () => {
    setLoading('evening');
    const today = format(new Date(), 'yyyy-MM-dd');
    await createQuickBlockout(
      today,
      addDays(new Date(), 7).toISOString().split('T')[0], // 7 days from now
      'Evening hours blocked - After 6 PM',
      'maintenance',
      '18:00',
      '23:59'
    );
    setLoading(null);
  };

  const handleBlockMorningHours = async () => {
    setLoading('morning');
    const today = format(new Date(), 'yyyy-MM-dd');
    await createQuickBlockout(
      today,
      addDays(new Date(), 7).toISOString().split('T')[0], // 7 days from now
      'Morning hours blocked - Before 9 AM',
      'maintenance',
      '00:00',
      '09:00'
    );
    setLoading(null);
  };

  // Quick actions array
  const quickActions: QuickAction[] = [
    {
      id: 'quick-block-today',
      label: 'Block Today',
      description: 'Emergency maintenance for today',
      icon: <AlertTriangle className="h-4 w-4" />,
      variant: 'destructive',
      action: handleBlockToday,
      className: 'btn-block-destructive'
    },
    {
      id: 'quick-block-tomorrow',
      label: 'Block Tomorrow',
      description: 'Scheduled maintenance for tomorrow',
      icon: <Wrench className="h-4 w-4" />,
      variant: 'outline',
      action: handleBlockTomorrow,
      className: 'btn-block-secondary'
    },
    {
      id: 'quick-block-weekend',
      label: 'Block Weekend',
      description: 'Close for personal event this weekend',
      icon: <Calendar className="h-4 w-4" />,
      variant: 'outline',
      action: handleBlockThisWeekend,
      className: 'btn-block-secondary'
    },
    {
      id: 'quick-block-nextweek',
      label: 'Block Next Week',
      description: 'Weekly maintenance schedule',
      icon: <Shield className="h-4 w-4" />,
      variant: 'outline',
      action: handleBlockNextWeek,
      className: 'btn-block-secondary'
    },
    {
      id: 'quick-block-selected',
      label: 'Block Selected Date',
      description: selectedDate 
        ? `Block ${format(new Date(selectedDate), 'MMM d, yyyy')}`
        : 'Select a date first',
      icon: <Ban className="h-4 w-4" />,
      variant: selectedDate ? 'default' : 'secondary',
      action: handleBlockSelectedDate,
      className: 'btn-block-primary',
      disabled: !selectedDate
    },
    {
      id: 'quick-block-evening',
      label: 'Block Evenings',
      description: 'Block after 6 PM for 7 days',
      icon: <Clock className="h-4 w-4" />,
      variant: 'outline',
      action: handleBlockEveningHours,
      className: 'btn-block-secondary'
    },
    {
      id: 'quick-block-morning',
      label: 'Block Mornings',
      description: 'Block before 9 AM for 7 days',
      icon: <Clock className="h-4 w-4" />,
      variant: 'outline',
      action: handleBlockMorningHours,
      className: 'btn-block-secondary'
    }
  ];

  return (
    <Card className="w-full max-w-xl mx-auto mb-4 sm:mb-8 p-2 sm:p-6 rounded-lg shadow-md bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Common blocking scenarios for quick access
        </p>
      </CardHeader>
      
      <CardContent className="p-2 sm:p-6">
        {loading ? (
          <div id="loading-quick-blocks" className="loading-skeleton flex flex-col items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin loading-spinner mb-3 text-blue-500" />
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-5 w-80 mb-2" />
            <span className="text-muted-foreground mt-4">Processing quick block action...</span>
          </div>
        ) : (
        <div id="quick-actions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              id={action.id}
              variant={action.variant}
              size="sm"
              onClick={action.action}
              disabled={loading === action.id || action.disabled}
              className={`h-auto p-3 flex flex-col items-start gap-2 ${action.className || ''}`}
            >
              <div className="flex items-center gap-2 w-full">
                {loading === action.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  action.icon
                )}
                <span className="font-medium">{action.label}</span>
              </div>
              <span className="text-xs opacity-80 text-left">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
        )}

        {error && (
          <div id="error-boundary">
            <Alert className="mb-4" id="error-message">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button id="retry-button" variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quick Actions Available:</span>
            <Badge variant="secondary">{quickActions.length}</Badge>
          </div>
          {selectedDate && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Selected Date:</span>
              <span className="font-medium">
                {format(new Date(selectedDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Quick Block Tips:
              </p>
              <ul className="text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                <li>• Use "Block Today" for emergency maintenance</li>
                <li>• "Block Selected Date" requires selecting a date first</li>
                <li>• Time-based blocks (mornings/evenings) apply for 7 days</li>
                <li>• All quick blocks can be edited or deleted later</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 