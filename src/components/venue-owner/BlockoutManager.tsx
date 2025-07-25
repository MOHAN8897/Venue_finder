import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  X,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

// TypeScript Interfaces
interface VenueBlockout {
  id: string;
  venue_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
  block_type: 'maintenance' | 'personal' | 'event' | 'other';
  is_recurring: boolean;
  recurrence_pattern?: any;
  created_at: string;
  updated_at: string;
}

interface BlockoutFormData {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  block_type: 'maintenance' | 'personal' | 'event' | 'other';
  is_recurring: boolean;
  all_day: boolean;
}

interface BlockoutManagerProps {
  venueId: string;
  onBlockoutChange: () => void;
}

export function BlockoutManager({ venueId, onBlockoutChange }: BlockoutManagerProps) {
  // State Management
  const [blockouts, setBlockouts] = useState<VenueBlockout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlockout, setEditingBlockout] = useState<VenueBlockout | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // React Hook Form Setup with Context7 patterns
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<BlockoutFormData>({
    defaultValues: {
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '17:00',
      reason: '',
      block_type: 'maintenance',
      is_recurring: false,
      all_day: false
    }
  });

  // Watch all_day field to toggle time inputs
  const allDay = watch('all_day');

  // Load blockouts data
  const loadBlockouts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('venue_blockouts')
        .select('*')
        .eq('venue_id', venueId)
        .order('start_date', { ascending: true });

      if (supabaseError) {
        // If table doesn't exist yet, show helpful message
        if (supabaseError.message.includes('relation "venue_blockouts" does not exist')) {
          setError('Blockout system requires database setup. This feature will be available after migration.');
          setBlockouts([]);
          return;
        }
        throw supabaseError;
      }

      setBlockouts(data || []);
    } catch (err: any) {
      console.error('Error loading blockouts:', err);
      setError(err.message || 'Failed to load blockouts');
    } finally {
      setLoading(false);
    }
  };

  // Create or update blockout
  const onSubmit = async (data: BlockoutFormData) => {
    try {
      const blockoutData = {
        venue_id: venueId,
        start_date: data.start_date,
        end_date: data.end_date,
        start_time: data.all_day ? null : data.start_time,
        end_time: data.all_day ? null : data.end_time,
        reason: data.reason || 'No reason specified',
        block_type: data.block_type,
        is_recurring: data.is_recurring,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editingBlockout) {
        // Update existing blockout
        result = await supabase
          .from('venue_blockouts')
          .update(blockoutData)
          .eq('id', editingBlockout.id)
          .select()
          .single();
      } else {
        // Create new blockout
        result = await supabase
          .from('venue_blockouts')
          .insert({
            ...blockoutData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success(editingBlockout ? 'Blockout updated successfully' : 'Blockout created successfully');
      
      // Reset form and close modal
      reset();
      setIsModalOpen(false);
      setEditingBlockout(null);
      
      // Reload blockouts and notify parent
      loadBlockouts();
      onBlockoutChange();

    } catch (err: any) {
      console.error('Error saving blockout:', err);
      toast.error(err.message || 'Failed to save blockout');
    }
  };

  // Delete blockout
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blockout?')) return;

    try {
      setDeletingId(id);

      const { error } = await supabase
        .from('venue_blockouts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Blockout deleted successfully');
      loadBlockouts();
      onBlockoutChange();

    } catch (err: any) {
      console.error('Error deleting blockout:', err);
      toast.error(err.message || 'Failed to delete blockout');
    } finally {
      setDeletingId(null);
    }
  };

  // Edit blockout
  const handleEdit = (blockout: VenueBlockout) => {
    setEditingBlockout(blockout);
    
    // Populate form with existing data
    reset({
      start_date: blockout.start_date,
      end_date: blockout.end_date,
      start_time: blockout.start_time || '09:00',
      end_time: blockout.end_time || '17:00',
      reason: blockout.reason,
      block_type: blockout.block_type,
      is_recurring: blockout.is_recurring,
      all_day: !blockout.start_time
    });
    
    setIsModalOpen(true);
  };

  // Create new blockout
  const handleCreateNew = () => {
    setEditingBlockout(null);
    reset({
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '17:00',
      reason: '',
      block_type: 'maintenance',
      is_recurring: false,
      all_day: false
    });
    setIsModalOpen(true);
  };

  // Get status badge color
  const getStatusBadgeColor = (blockType: string) => {
    switch (blockType) {
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'personal': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Load data on mount and venue change
  useEffect(() => {
    if (venueId) {
      loadBlockouts();
    }
  }, [venueId]);

  return (
    <Card className="w-full max-w-2xl mx-auto mb-4 sm:mb-8 p-2 sm:p-6 rounded-lg shadow-md bg-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Blockout Management
          </CardTitle>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleCreateNew}
                className="bg-gradient-accent hover:bg-accent/90"
                id="create-blockout-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Blockout
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md" id="blockout-modal">
              <DialogHeader>
                <DialogTitle>
                  {editingBlockout ? 'Edit Blockout' : 'Create New Blockout'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="blockout-form">
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4" id="date-range-picker">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      {...register('start_date', { required: 'Start date is required' })}
                      aria-invalid={errors.start_date ? 'true' : 'false'}
                    />
                    {errors.start_date && (
                      <span role="alert" className="text-sm text-red-600">
                        {errors.start_date.message}
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      {...register('end_date', { required: 'End date is required' })}
                      aria-invalid={errors.end_date ? 'true' : 'false'}
                    />
                    {errors.end_date && (
                      <span role="alert" className="text-sm text-red-600">
                        {errors.end_date.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    id="all_day"
                    type="checkbox"
                    {...register('all_day')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="all_day">All Day</Label>
                </div>

                {/* Time Range (conditional) */}
                {!allDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        {...register('start_time')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        {...register('end_time')}
                      />
                    </div>
                  </div>
                )}

                {/* Block Type */}
                <div>
                  <Label htmlFor="block_type">Block Type</Label>
                  <Controller
                    name="block_type"
                    control={control}
                    rules={{ required: 'Block type is required' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select block type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.block_type && (
                    <span role="alert" className="text-sm text-red-600">
                      {errors.block_type.message}
                    </span>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for blockout..."
                    {...register('reason')}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                {/* Recurring (Future Enhancement) */}
                <div className="flex items-center space-x-2">
                  <input
                    id="is_recurring"
                    type="checkbox"
                    {...register('is_recurring')}
                    disabled
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_recurring" className="text-muted-foreground">
                    Recurring (Coming Soon)
                  </Label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingBlockout ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingBlockout ? 'Update Blockout' : 'Create Blockout'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-6">
        {error && (
          <div id="error-boundary">
            <Alert className="mb-4" id="error-message">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button id="retry-button" variant="outline" className="mt-4" onClick={loadBlockouts}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div id="loading-blockouts" className="loading-skeleton flex flex-col items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin loading-spinner mb-3 text-blue-500" />
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-5 w-80 mb-2" />
            <Skeleton className="h-5 w-80 mb-2" />
            <span className="text-muted-foreground mt-4">Loading blockouts...</span>
          </div>
        ) : (
          <div className="space-y-4" id="blockout-list">
            {blockouts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No blockouts scheduled</p>
                <p className="text-sm text-muted-foreground">
                  Create blockouts to prevent bookings during maintenance, events, or personal time.
                </p>
              </div>
            ) : (
              blockouts.map((blockout) => (
                <div 
                  key={blockout.id} 
                  id={`blockout-item-${blockout.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getStatusBadgeColor(blockout.block_type)}>
                        {blockout.block_type}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(blockout.start_date), 'MMM d')} - {format(parseISO(blockout.end_date), 'MMM d, yyyy')}
                      </div>

                      {blockout.start_time && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {blockout.start_time} - {blockout.end_time}
                        </div>
                      )}
                    </div>
                    
                    {blockout.reason && (
                      <p className="text-sm text-muted-foreground">
                        {blockout.reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(blockout)}
                      disabled={deletingId === blockout.id}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(blockout.id)}
                      disabled={deletingId === blockout.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deletingId === blockout.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Summary Stats */}
        {blockouts.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Blockouts:</span>
              <span className="font-medium">{blockouts.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Active This Month:</span>
              <span className="font-medium">
                {blockouts.filter(b => {
                  const start = parseISO(b.start_date);
                  const now = new Date();
                  return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
                }).length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 