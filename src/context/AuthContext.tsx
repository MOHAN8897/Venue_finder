import React, { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sessionService } from '../lib/sessionService';

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
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Move these back to top-level
  const syncUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();
      if (error || !profile) {
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
  };

  const handleUserLogin = async (supabaseUser: SupabaseUser) => {
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
  };

  const handleUserLogout = async (logoutUser?: UserProfile | null) => {
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
  };

  // Enhanced session sync and cleanup logic with profile creation grace period
  useEffect(() => {
    let mounted = true;
    let profileSyncAttempts = 0;
    const MAX_PROFILE_SYNC_ATTEMPTS = 3;

    const initializeAuth = async () => {
      try {
        if (!mounted) return;
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const supabaseUserId = session.user.id;
          // Try to sync/create profile up to MAX_PROFILE_SYNC_ATTEMPTS
          let profileSynced = false;
          while (!profileSynced && profileSyncAttempts < MAX_PROFILE_SYNC_ATTEMPTS) {
            try {
          await handleUserLogin(session.user as SupabaseUser);
              // After sync, check if user is set and matches session
              const newUser = JSON.parse(localStorage.getItem('venueFinder_user') || 'null');
              if (newUser && newUser.user_id === supabaseUserId) {
                profileSynced = true;
                setUser(newUser);
                break;
              }
            } catch {
              // Ignore and retry
            }
            profileSyncAttempts++;
            await new Promise(res => setTimeout(res, 500)); // Wait before retry
          }
          if (!profileSynced) {
            // Could not sync profile after retries, force logout
            localStorage.removeItem('venueFinder_user');
            setUser(null);
            await supabase.auth.signOut();
            window.location.reload();
            return;
          }
        } else {
          setUser(null);
          localStorage.removeItem('venueFinder_user');
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            console.log('Auth state change:', event, session?.user?.email);
            if (session?.user) {
              await handleUserLogin(session.user as SupabaseUser);
            } else {
              await handleUserLogout(user);
              setUser(null);
              localStorage.removeItem('venueFinder_user');
            }
            if (mounted) {
              setLoading(false);
            }
          }
        );
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, []);

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Sign in error:', error);
      return { error: error.message };
    }
    // Fetch and sync user profile after successful login
    if (data && data.user) {
      // Use the same syncUserProfile logic as in AuthProvider
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
        if (!profileError && profile) {
          localStorage.setItem('venueFinder_user', JSON.stringify(profile));
        }
      } catch (err) {
        console.error('Error syncing user profile after email login:', err);
      }
    }
    return { error: null };
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
  }, [handleUserLogout, user]);

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

  const value: AuthContextType = {
      user,
      loading: loading && !initialized, // Only show loading if not initialized
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    updateProfile,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};