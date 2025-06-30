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
      // Test basic connection
      const { error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      
      // Test RPC functions if user is authenticated
      if (user) {
        try {
          await supabase.rpc('get_user_profile', {});
        } catch (rpcError) {
          console.warn('RPC functions may not be available:', rpcError);
          // Don't throw error for RPC, just log warning
        }
      }
      
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }, [user]);

  const refreshConnection = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const isConnected = await testConnection();
      setState({
        isConnected,
        isLoading: false,
        error: isConnected ? null : 'Failed to connect to database',
        lastSync: new Date()
      });
    } catch (error) {
      setState({
        isConnected: false,
        isLoading: false,
        error: (error as Error).message,
        lastSync: null
      });
    }
  }, [testConnection]);

  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

  // Refresh connection when user changes
  useEffect(() => {
    if (user) {
      refreshConnection();
    }
  }, [user, refreshConnection]);

  return {
    ...state,
    refreshConnection,
    testConnection
  };
}; 