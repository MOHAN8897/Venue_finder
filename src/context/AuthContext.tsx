import React, { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../lib/sessionService';
import { useAuth } from '../hooks/useAuth';

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
  phone?: string;
  created_at: string;
  updated_at?: string;
}

// Define proper types for user profile
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role?: 'user' | 'owner' | 'admin' | 'super_admin';
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  preferences?: Record<string, string | number | boolean>;
  notification_settings?: {
    email_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    booking_reminders: boolean;
    new_venue_alerts: boolean;
  };
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, phone?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

// This component will have access to the router context
const AuthManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const auth = useAuth();

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error);
        return { error: error.message };
      }
      navigate('/');
      return { error: null };
    },
    [navigate]
  );

  const value = {
    ...auth,
    signInWithEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize syncUserProfile to prevent infinite render
  const syncUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      // Always fetch the latest profile from the database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();
      if (error || !profile) {
        // If not found, create a new profile from metadata
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{
            user_id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
            profile_image: supabaseUser.user_metadata?.avatar_url || '',
            avatar_url: supabaseUser.user_metadata?.avatar_url || '',
            phone: supabaseUser.phone,
            created_at: supabaseUser.created_at,
            updated_at: supabaseUser.updated_at || supabaseUser.created_at
          }])
          .select()
          .single();
        setUser(newProfile || null);
      } else {
        setUser(profile);
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
      setUser(null);
    }
  }, []); // No dependencies, or add only if needed

  const handleUserLogin = useCallback(async (supabaseUser: SupabaseUser) => {
    await syncUserProfile(supabaseUser);
    try {
      await sessionService.createSession(supabaseUser.id);
      await sessionService.logUserAction(supabaseUser.id, 'login', {
        method: 'email',
        timestamp: new Date().toISOString()
      });
      sessionService.startPageViewTracking(supabaseUser.id);
    } catch (error) {
      console.error('Error setting up session tracking:', error);
    }
  }, [syncUserProfile]);

  // Memoize handleUserLogout with no dependencies
  const handleUserLogout = useCallback(async (logoutUser?: UserProfile | null) => {
    const targetUser = logoutUser ?? user;
    if (targetUser) {
      try {
        await sessionService.logUserAction(targetUser.user_id, 'logout', {
          method: 'manual',
          timestamp: new Date().toISOString()
        });
        await sessionService.endSession();
      } catch (error) {
        console.error('Error logging logout activity:', error);
      }
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        // Try to restore user from localStorage first (for faster initial load)
        const savedUser = localStorage.getItem('venueFinder_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch {
            console.warn('Failed to parse saved user from localStorage');
            localStorage.removeItem('venueFinder_user');
          }
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await handleUserLogin(session.user as SupabaseUser);
        } else {
          setUser(null);
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change:', event, session?.user?.email);
            if (session?.user) {
              await handleUserLogin(session.user as SupabaseUser);
            } else {
              await handleUserLogout(user);
              setUser(null);
            }
            setLoading(false);
          }
        );
        setLoading(false);
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };
    initializeAuth();
    // Only run once on mount!
  }, [handleUserLogin, handleUserLogout]);

  // Save user to localStorage when user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('venueFinder_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('venueFinder_user');
    }
  }, [user]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    if (error) console.error('Google sign-in error:', error);
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    // This will be overridden by AuthManager, but we need a placeholder
    console.warn('signInWithEmail called outside of Router context');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signUpWithEmail = useCallback(
    async (email: string, password: string, phone?: string): Promise<{ error: string | null }> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            phone,
            name: email.split('@')[0] // Add name to user metadata
          } 
        }
      });
      if (error) return { error: error.message };
      if (data.user) {
        // The trigger function should automatically create the profile
        // Wait a moment for the trigger to execute
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return success without auto sign-in
        return { error: null };
      }
      return { error: 'Failed to create user' };
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      setUser(null);
      localStorage.removeItem('venueFinder_user');
      await handleUserLogout(user);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      window.location.href = '/';
    }
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.user_id)
        .select()
        .single();
      if (error) throw error;
      setUser(data);
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  // Add a method to refresh the user profile from the database
  const refreshUserProfile = useCallback(async () => {
    try {
      if (!user) return;
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.user_id)
        .single();
      if (!error && profile) {
        setUser(profile);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  }, [user]);

  const value: AuthContextType & { refreshUserProfile: () => Promise<void> } = {
    ...{
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      updateProfile
    },
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthManager }; 