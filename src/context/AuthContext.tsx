import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sessionService } from '../lib/sessionService';
import { toast } from 'sonner';
import { uuidv4 } from '../lib/utils';
import { ensureUserProfile } from '../lib/userService';

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
  role?: 'user' | 'venue_owner' | 'administrator' | 'super_admin';
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
  version: number;
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
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [version, setVersion] = useState(0); // Used to force re-render in consumers

  // Stable handleUserLogout for context
  const handleUserLogout = useCallback(async (logoutUser?: UserProfile | null) => {
    const targetUser = logoutUser ?? user;
    if (targetUser) {
      try {
        await sessionService.logUserAction(targetUser.user_id, 'logout', {
          method: 'manual',
          timestamp: new Date().toISOString(),
          tabId: uuidv4() // Use a new tabId for logout
        });
        await sessionService.endSession();
      } catch (error) {}
    }
    setUser(null);
    setLoading(false);
    setVersion(v => v + 1);
    // syncUserStateToLocalStorage(null); // This is now handled inside initializeAuth
    sessionStorage.removeItem('venueFinder_session');
  }, [user]);

  // Periodic session validity check (every 5 minutes)
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;
    const checkSession = async (retry = false) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!retry) {
            // Grace period: retry once after 2 seconds before logging out
            retryTimeout = setTimeout(() => checkSession(true), 2000);
            return;
          }
          setUser(null);
          setLoading(false);
          setVersion(v => v + 1);
          localStorage.removeItem('venueFinder_user');
          sessionStorage.removeItem('venueFinder_session');
          localStorage.setItem('venueFinder_auth_event', JSON.stringify({
            type: 'session_expired',
            user: null,
            timestamp: Date.now(),
            tabId: uuidv4()
          }));
          // Only show toast and redirect if not already on sign-in page
          if (!window.location.pathname.includes('signin')) {
            toast.error('Your session has expired. Please sign in again.');
            await supabase.auth.signOut();
            window.location.href = '/signin';
          }
        } else if (session && !user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          if (profile) {
            setUser(profile);
            setLoading(false);
            setVersion(v => v + 1);
            // syncUserStateToLocalStorage(profile); // This is now handled inside initializeAuth
          }
        }
      } catch (error) {
        console.error('Error checking session validity:', error);
      }
    };
    const interval = setInterval(() => checkSession(false), 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [user]);

  // Listen for changes to venueFinder_user in localStorage (cross-tab and tab duplication)
  useEffect(() => {
    const handleUserStorageChange = (event: StorageEvent) => {
      if (event.key === 'venueFinder_user') {
        if (event.newValue === null) {
          setUser(null);
          setVersion(v => v + 1);
        }
        // Do NOT auto-login other tabs if event.newValue is set
      }
    };
    window.addEventListener('storage', handleUserStorageChange);
    return () => {
      window.removeEventListener('storage', handleUserStorageChange);
    };
  }, []);

  // Main initialization effect - only stable dependencies
  useEffect(() => {
    let mounted = true;
    let profileSyncAttempts = 0;
    const MAX_PROFILE_SYNC_ATTEMPTS = 3;
    let timeoutId: NodeJS.Timeout | null = null;
    let didTimeout = false;

    // Move syncUserStateToLocalStorage inside the effect
    const syncUserStateToLocalStorage = (userData: UserProfile | null) => {
      // Remove sensitive data storage - only store non-sensitive session info
      if (userData) {
        // Only store minimal session info, not full user data
        localStorage.setItem('venueFinder_session_active', 'true');
        localStorage.setItem('venueFinder_auth_event', JSON.stringify({
          type: 'user_updated',
          timestamp: Date.now(),
          tabId: uuidv4()
        }));
      } else {
        localStorage.removeItem('venueFinder_session_active');
        localStorage.setItem('venueFinder_auth_event', JSON.stringify({
          type: 'user_logout',
          timestamp: Date.now(),
          tabId: uuidv4()
        }));
      }
    };

    const syncUserProfile = async (supabaseUser: SupabaseUser) => {
      try {
        const profile = await ensureUserProfile(supabaseUser);
        if (profile) {
          setUser(profile);
          setLoading(false);
          setVersion(v => v + 1);
          syncUserStateToLocalStorage(profile);
          // Remove sensitive data from sessionStorage
        } else {
          setUser(null);
          setLoading(false);
          setVersion(v => v + 1);
          syncUserStateToLocalStorage(null);
          // Remove sensitive data from sessionStorage
        }
      } catch (error) {
        setUser(null);
        setLoading(false);
        setVersion(v => v + 1);
        syncUserStateToLocalStorage(null);
        // Remove sensitive data from sessionStorage
      }
    };

    // On sign-in, update active_tab_id in profiles
    const handleUserLogin = async (supabaseUser: SupabaseUser) => {
      await syncUserProfile(supabaseUser);
      try {
        // Update active_tab_id in profiles
        await sessionService.createSession(supabaseUser.id);
        await sessionService.logUserAction(supabaseUser.id, 'login', {
          method: 'email',
          timestamp: new Date().toISOString(),
          tabId: uuidv4()
        });
        sessionService.startPageViewTracking(supabaseUser.id);
      } catch (error) {}
    };

    timeoutId = setTimeout(() => {
      didTimeout = true;
      if (mounted) {
        setLoading(false);
        setInitialized(true);
        setUser(null);
        setVersion(v => v + 1);
        console.error('Auth initialization timed out.');
      }
    }, 12000);

    const loadUserFromLocalStorage = () => {
      // Remove loading sensitive data from localStorage
      // Instead, rely on Supabase session management
      const sessionActive = localStorage.getItem('venueFinder_session_active');
      if (sessionActive === 'true') {
        // Session is active, but don't load user data from localStorage
        // Let Supabase handle session validation
        return true;
      }
      return false;
    };

    // Call the function to check session on mount
    loadUserFromLocalStorage();

    const initializeAuth = async () => {
      try {
        if (!mounted) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (didTimeout || !mounted) return;
        if (session?.user) {
          const supabaseUserId = session.user.id;
                  // Remove loading sensitive data from localStorage
        // Rely on Supabase session validation instead
          let profileSynced = false;
          while (!profileSynced && profileSyncAttempts < MAX_PROFILE_SYNC_ATTEMPTS) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', supabaseUserId)
                .single();
              if (didTimeout || !mounted) return;
              if (profile) {
                setUser(profile);
                setLoading(false);
                setVersion(v => v + 1);
                syncUserStateToLocalStorage(profile);
                // Remove sensitive data from sessionStorage
                profileSynced = true;
                break;
              }
            } catch (error) {}
            profileSyncAttempts++;
            await new Promise(res => setTimeout(res, 1000));
          }
          if (!profileSynced) {
            setUser(null);
            setLoading(false);
            setVersion(v => v + 1);
            syncUserStateToLocalStorage(null);
            localStorage.removeItem('venueFinder_session_active');
            // Remove sensitive data from sessionStorage
            await supabase.auth.signOut();
            if (timeoutId) clearTimeout(timeoutId);
            setInitialized(true);
            return;
          }
        } else {
          setUser(null);
          setLoading(false);
          setVersion(v => v + 1);
          syncUserStateToLocalStorage(null);
          // Remove sensitive data from sessionStorage
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            if (event === 'SIGNED_IN' && session?.user && !loginInProgress) {
              // Remove loading sensitive data from localStorage
              // Always validate with Supabase session
              await handleUserLogin(session.user as SupabaseUser);
            } else if (event === 'SIGNED_OUT') {
              await handleUserLogout(user);
              window.location.href = '/signin';
            }
            if (mounted) {
              setLoading(false);
              setVersion(v => v + 1);
            }
          }
        );
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          setVersion(v => v + 1);
        }
        if (timeoutId) clearTimeout(timeoutId);
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        setUser(null);
        setLoading(false);
        setInitialized(true);
        setVersion(v => v + 1);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
    const cleanupPromise = initializeAuth();
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      cleanupPromise.then(cleanup => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, [loginInProgress]);

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
        // Wait for the profile row to be created (retry up to 5 times)
        let profile = null;
        let attempts = 0;
        while (!profile && attempts < 5) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
          if (profileData) {
            profile = profileData;
            break;
          }
          attempts++;
          await new Promise(res => setTimeout(res, 1000));
        }
        if (!profile) {
          toast.error('Your account was created, but your profile could not be initialized. Please try signing in again or contact support.');
          return { error: 'Profile creation failed. Please try again.' };
        }
        return { error: null };
      }
      return { error: 'Failed to create user' };
    },
    []
  );

  // On sign-out, clear active_tab_id in profiles and sessionStorage
  const signOut = useCallback(async () => {
    try {
      await handleUserLogout(user);
      // Clear active_tab_id in profiles
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      localStorage.removeItem('venueFinder_user');
      localStorage.setItem('venueFinder_auth_event', JSON.stringify({
        type: 'user_logout',
        user: null,
        timestamp: Date.now(),
        tabId: uuidv4()
      }));
      sessionStorage.removeItem('venueFinder_session');
      if (!window.location.pathname.includes('signin')) {
        window.location.href = '/';
      }
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
      // syncUserStateToLocalStorage(data); // This is now handled inside initializeAuth
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
      return { success: false, error: (error as Error).message };
    }
  };

  // Add a method to refresh the user profile from the database
  const refreshUserProfile = useCallback(async (userId?: string) => {
    try {
      const targetUserId = userId || user?.user_id;
      if (!targetUserId) return;
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();
      if (!error && profile) {
        setUser(profile);
        // syncUserStateToLocalStorage(profile); // This is now handled inside initializeAuth
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  }, [user]);

  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      setLoginInProgress(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error);
        setLoginInProgress(false);
        return { error: error.message };
      }
      
      // Immediately fetch and set user profile after successful login
      if (data && data.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
          
          if (!profileError && profile) {
            setUser(profile); // Set user state immediately
            // syncUserStateToLocalStorage(profile); // This is now handled inside initializeAuth
            
            // Set up session tracking
            try {
              await sessionService.createSession(data.user.id);
              await sessionService.logUserAction(data.user.id, 'login', {
                method: 'email',
                timestamp: new Date().toISOString(),
                tabId: uuidv4()
              });
              sessionService.startPageViewTracking(data.user.id);
            } catch (sessionError) {
              console.error('Error setting up session tracking:', sessionError);
            }
            
            // Small delay to ensure state propagation
            await new Promise(resolve => setTimeout(resolve, 100));
            setLoginInProgress(false);
          } else {
            console.error('Profile fetch error:', profileError);
            setLoginInProgress(false);
            return { error: 'Could not fetch user profile' };
          }
        } catch (err) {
          console.error('Error syncing user profile after email login:', err);
          setLoginInProgress(false);
          return { error: 'Failed to sync user profile' };
        }
      }
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setLoginInProgress(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  // Add user-friendly error for missing profile after login
  useEffect(() => {
    if (!loading && !user && initialized) {
      toast.error('Your profile could not be loaded. Please try signing in again or contact support.');
    }
  }, [user, loading, initialized]);

  const value: AuthContextType & { version: number } = {
      user,
      loading: loading && !initialized, // Only show loading if not initialized
      version, // Add version to context value
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    updateProfile,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};