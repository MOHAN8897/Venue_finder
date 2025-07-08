import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface DatabaseState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
}

interface UseDatabaseReturn extends DatabaseState {
  refreshConnection: () => Promise<void>;
  testConnection: () => Promise<boolean>;
}

export const useDatabase = (): UseDatabaseReturn => {
  const { user } = useAuth();
  const [state, setState] = useState<DatabaseState>({
    isConnected: false,
    isLoading: true,
    error: null,
    lastSync: null
  });

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Simple health check first
      const { data, error } = await supabase.rpc('get_server_time');
      if (error) {
        console.warn('Basic health check failed:', error);
        // Try fallback test
        const { error: fallbackError } = await supabase.from('profiles').select('count').limit(1);
        if (fallbackError) throw fallbackError;
      }
      
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }, []);

  const refreshConnection = useCallback(async () => {
    // Don't set loading if we're already connected
    if (!state.isConnected) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }
    
    try {
      const isConnected = await testConnection();
      
      // Only update state if connection status changed
      if (isConnected !== state.isConnected) {
        setState({
          isConnected,
          isLoading: false,
          error: isConnected ? null : 'Failed to connect to database',
          lastSync: new Date()
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setState({
        isConnected: false,
        isLoading: false,
        error: (error as Error).message,
        lastSync: null
      });
    }
  }, [testConnection, state.isConnected]);

  // Initial connection check
  useEffect(() => {
    let mounted = true;
    
    const initConnection = async () => {
      try {
        const isConnected = await testConnection();
        if (mounted) {
          setState({
            isConnected,
            isLoading: false,
            error: isConnected ? null : 'Failed to connect to database',
            lastSync: new Date()
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            isConnected: false,
            isLoading: false,
            error: (error as Error).message,
            lastSync: null
          });
        }
      }
    };

    initConnection();
    return () => {
      mounted = false;
    };
  }, [testConnection]);

  // Refresh connection when user changes, but only if not already connected
  useEffect(() => {
    if (user && !state.isConnected) {
      refreshConnection();
    }
  }, [user, refreshConnection, state.isConnected]);

  return {
    ...state,
    refreshConnection,
    testConnection
  };
}; 