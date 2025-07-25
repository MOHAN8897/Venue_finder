import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';

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
  created_at: string;
  updated_at: string;
}

interface CreateBlockoutData {
  venue_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
  block_type: 'maintenance' | 'personal' | 'event' | 'other';
  is_recurring?: boolean;
}

interface UpdateBlockoutData {
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  block_type?: 'maintenance' | 'personal' | 'event' | 'other';
  is_recurring?: boolean;
}

interface UseVenueBlockoutsReturn {
  // Data
  blockouts: VenueBlockout[];
  
  // Loading States
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error Handling
  error: string | null;
  
  // CRUD Operations
  createBlockout: (data: CreateBlockoutData) => Promise<VenueBlockout | null>;
  updateBlockout: (id: string, data: UpdateBlockoutData) => Promise<VenueBlockout | null>;
  deleteBlockout: (id: string) => Promise<boolean>;
  refreshBlockouts: () => Promise<void>;
  
  // Computed Values
  stats: {
    total: number;
    active: number;
    upcoming: number;
    past: number;
    byType: Record<string, number>;
  };
  
  // Utilities
  getBlockoutById: (id: string) => VenueBlockout | undefined;
  getActiveBlockouts: () => VenueBlockout[];
  getUpcomingBlockouts: () => VenueBlockout[];
  getPastBlockouts: () => VenueBlockout[];
  getBlockoutsByType: (type: string) => VenueBlockout[];
  getBlockoutsForDate: (date: string) => VenueBlockout[];
  getBlockoutsForDateRange: (startDate: string, endDate: string) => VenueBlockout[];
}

interface UseVenueBlockoutsOptions {
  venueId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  includePast?: boolean;
  includeFuture?: boolean;
  onBlockoutChange?: () => void;
}

export function useVenueBlockouts({
  venueId,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute
  includePast = false,
  includeFuture = true,
  onBlockoutChange
}: UseVenueBlockoutsOptions): UseVenueBlockoutsReturn {
  // State Management
  const [blockouts, setBlockouts] = useState<VenueBlockout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load blockouts from database
  const loadBlockouts = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);

      let query = supabase
        .from('venue_blockouts')
        .select('*')
        .eq('venue_id', venueId)
        .order('start_date', { ascending: true });

      // Apply date filters
      const today = new Date().toISOString().split('T')[0];
      
      if (!includePast) {
        query = query.gte('end_date', today);
      }
      
      if (!includeFuture) {
        query = query.lte('start_date', today);
      }

      const { data, error: blockoutError } = await query;

      if (blockoutError) {
        // Handle case where table doesn't exist yet
        if (blockoutError.message.includes('relation "venue_blockouts" does not exist')) {
          console.log('Blockouts table not available yet:', blockoutError.message);
          setBlockouts([]);
          return;
        }
        throw blockoutError;
      }

      setBlockouts(data || []);

      if (isRefresh) {
        toast.success('Blockouts refreshed successfully');
      }

    } catch (err: any) {
      console.error('Error loading blockouts:', err);
      setError(err.message || 'Failed to load blockouts');
      toast.error('Failed to load blockout data');
    } finally {
      setIsLoading(false);
    }
  }, [venueId, includePast, includeFuture]);

  // Create a new blockout
  const createBlockout = useCallback(async (data: CreateBlockoutData): Promise<VenueBlockout | null> => {
    try {
      setIsCreating(true);
      setError(null);

      const blockoutData = {
        ...data,
        is_recurring: data.is_recurring || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newBlockout, error } = await supabase
        .from('venue_blockouts')
        .insert(blockoutData)
        .select()
        .single();

      if (error) throw error;

      setBlockouts(prev => [...prev, newBlockout]);
      toast.success('Blockout created successfully');
      
      // Call callback if provided
      if (onBlockoutChange) {
        onBlockoutChange();
      }

      return newBlockout;

    } catch (err: any) {
      console.error('Error creating blockout:', err);
      setError(err.message || 'Failed to create blockout');
      toast.error('Failed to create blockout');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [onBlockoutChange]);

  // Update an existing blockout
  const updateBlockout = useCallback(async (id: string, data: UpdateBlockoutData): Promise<VenueBlockout | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: updatedBlockout, error } = await supabase
        .from('venue_blockouts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBlockouts(prev => 
        prev.map(blockout => 
          blockout.id === id ? updatedBlockout : blockout
        )
      );
      toast.success('Blockout updated successfully');
      
      // Call callback if provided
      if (onBlockoutChange) {
        onBlockoutChange();
      }

      return updatedBlockout;

    } catch (err: any) {
      console.error('Error updating blockout:', err);
      setError(err.message || 'Failed to update blockout');
      toast.error('Failed to update blockout');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [onBlockoutChange]);

  // Delete a blockout
  const deleteBlockout = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);

      const { error } = await supabase
        .from('venue_blockouts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBlockouts(prev => prev.filter(blockout => blockout.id !== id));
      toast.success('Blockout deleted successfully');
      
      // Call callback if provided
      if (onBlockoutChange) {
        onBlockoutChange();
      }

      return true;

    } catch (err: any) {
      console.error('Error deleting blockout:', err);
      setError(err.message || 'Failed to delete blockout');
      toast.error('Failed to delete blockout');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [onBlockoutChange]);

  // Refresh blockouts manually
  const refreshBlockouts = useCallback(async () => {
    await loadBlockouts(true);
  }, [loadBlockouts]);

  // Utility functions
  const getBlockoutById = useCallback((id: string) => {
    return blockouts.find(blockout => blockout.id === id);
  }, [blockouts]);

  const getActiveBlockouts = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return blockouts.filter(blockout => 
      blockout.start_date <= today && blockout.end_date >= today
    );
  }, [blockouts]);

  const getUpcomingBlockouts = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return blockouts.filter(blockout => blockout.start_date > today);
  }, [blockouts]);

  const getPastBlockouts = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return blockouts.filter(blockout => blockout.end_date < today);
  }, [blockouts]);

  const getBlockoutsByType = useCallback((type: string) => {
    return blockouts.filter(blockout => blockout.block_type === type);
  }, [blockouts]);

  const getBlockoutsForDate = useCallback((date: string) => {
    return blockouts.filter(blockout => 
      blockout.start_date <= date && blockout.end_date >= date
    );
  }, [blockouts]);

  const getBlockoutsForDateRange = useCallback((startDate: string, endDate: string) => {
    return blockouts.filter(blockout => 
      (blockout.start_date <= endDate && blockout.end_date >= startDate)
    );
  }, [blockouts]);

  // Computed stats
  const stats = useMemo(() => {
    const total = blockouts.length;
    const active = getActiveBlockouts().length;
    const upcoming = getUpcomingBlockouts().length;
    const past = getPastBlockouts().length;
    
    const byType = blockouts.reduce((acc, blockout) => {
      acc[blockout.block_type] = (acc[blockout.block_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, active, upcoming, past, byType };
  }, [blockouts, getActiveBlockouts, getUpcomingBlockouts, getPastBlockouts]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !venueId) return;

    const interval = setInterval(() => {
      refreshBlockouts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, venueId, refreshInterval, refreshBlockouts]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (venueId) {
      loadBlockouts();
    }
  }, [venueId, loadBlockouts]);

  return {
    // Data
    blockouts,
    
    // Loading States
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error Handling
    error,
    
    // CRUD Operations
    createBlockout,
    updateBlockout,
    deleteBlockout,
    refreshBlockouts,
    
    // Computed Values
    stats,
    
    // Utilities
    getBlockoutById,
    getActiveBlockouts,
    getUpcomingBlockouts,
    getPastBlockouts,
    getBlockoutsByType,
    getBlockoutsForDate,
    getBlockoutsForDateRange,
  };
} 