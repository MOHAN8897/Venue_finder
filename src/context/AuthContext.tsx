import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sessionService } from '../lib/sessionService';
import { toast } from 'sonner';
import { uuidv4 } from '../lib/utils';

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
  role?: 'user' | 'venue_owner' | 'owner' | 'admin';
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
  isActiveTab: boolean;
  handoffPending: boolean;
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

  // Use sessionStorage for tabId, generate if not present, and scope by user role
  const userRoleKey = user?.role || 'guest';
  let tabId = sessionStorage.getItem(`tabId_${userRoleKey}`);
  if (!tabId) {
    tabId = uuidv4();
    sessionStorage.setItem(`tabId_${userRoleKey}`, tabId);
  }

  // --- Single Active Tab Logic (Snapchat Web style) ---
  const [isActiveTab, setIsActiveTab] = useState(true);
  const [handoffPending, setHandoffPending] = useState(false);
  const ACTIVE_TAB_KEY = `venueFinder_active_tab_id_${userRoleKey}`;
  const ACTIVE_TAB_TIMESTAMP_KEY = `venueFinder_active_tab_timestamp_${userRoleKey}`;
  const HANDOFF_DELAY = 3500; // ms

  // BroadcastChannel setup (with fallback)
  const bcRef = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    if ('BroadcastChannel' in window) {
      bcRef.current = new BroadcastChannel(`venueFinder_active_tab_${userRoleKey}`);
    }
    return () => {
      if (bcRef.current) bcRef.current.close();
    };
  }, [userRoleKey]);

  // Helper to broadcast messages
  const broadcast = useCallback((msg: any) => {
    if (bcRef.current) {
      bcRef.current.postMessage(msg);
    } else {
      // Fallback: use localStorage
      localStorage.setItem('venueFinder_broadcast', JSON.stringify({ ...msg, _ts: Date.now() }));
    }
  }, []);

  // Only enable single active tab logic when user is signed in AND user is 'user' or 'venue_owner'
  useEffect(() => {
    if (!user || (user.role !== 'user' && user.role !== 'venue_owner')) {
      setIsActiveTab(true);
      setHandoffPending(false);
      localStorage.removeItem(ACTIVE_TAB_KEY);
      localStorage.removeItem(ACTIVE_TAB_TIMESTAMP_KEY);
      return;
    }
    let handoffTimer: NodeJS.Timeout | null = null;
    const requestActive = () => {
      if (localStorage.getItem(ACTIVE_TAB_KEY) !== tabId) {
        broadcast({ type: 'request_active', tabId });
        setHandoffPending(true);
        handoffTimer = setTimeout(() => {
          broadcast({ type: 'active_now', tabId });
          setIsActiveTab(true);
          setHandoffPending(false);
          localStorage.setItem(ACTIVE_TAB_KEY, tabId);
          localStorage.setItem(ACTIVE_TAB_TIMESTAMP_KEY, String(Date.now()));
        }, HANDOFF_DELAY);
      } else {
        setIsActiveTab(true);
        setHandoffPending(false);
      }
    };
    window.addEventListener('focus', requestActive);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestActive();
    });
    // On mount, check if this tab is active or should claim active
    const activeTabId = localStorage.getItem(ACTIVE_TAB_KEY);
    if (!activeTabId || activeTabId === tabId) {
      localStorage.setItem(ACTIVE_TAB_KEY, tabId);
      localStorage.setItem(ACTIVE_TAB_TIMESTAMP_KEY, String(Date.now()));
      setIsActiveTab(true);
      setHandoffPending(false);
    } else {
      setIsActiveTab(false);
      setHandoffPending(false);
    }
    return () => {
      window.removeEventListener('focus', requestActive);
      document.removeEventListener('visibilitychange', requestActive);
      if (handoffTimer) clearTimeout(handoffTimer);
    };
  }, [tabId, broadcast, user]);

  // Listen for cross-tab messages (only when signed in)
  useEffect(() => {
    if (!user) return;
    const handleMsg = (msg: any) => {
      if (!msg) return;
      if (msg.type === 'request_active') {
        if (localStorage.getItem(ACTIVE_TAB_KEY) === tabId) {
          setIsActiveTab(false);
          setHandoffPending(true);
        }
      } else if (msg.type === 'active_now') {
        setIsActiveTab(msg.tabId === tabId);
        setHandoffPending(false);
        localStorage.setItem(ACTIVE_TAB_KEY, msg.tabId);
        localStorage.setItem(ACTIVE_TAB_TIMESTAMP_KEY, String(Date.now()));
      }
    };
    if (bcRef.current) {
      bcRef.current.onmessage = (e) => handleMsg(e.data);
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'venueFinder_broadcast' && event.newValue) {
        try {
          const msg = JSON.parse(event.newValue);
          handleMsg(msg);
        } catch {}
      }
      if (event.key === ACTIVE_TAB_KEY) {
        setIsActiveTab(localStorage.getItem(ACTIVE_TAB_KEY) === tabId);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      if (bcRef.current) bcRef.current.onmessage = null;
      window.removeEventListener('storage', handleStorage);
    };
  }, [tabId, user]);

  // Stable handleUserLogout for context
  const handleUserLogout = useCallback(async (logoutUser?: UserProfile | null) => {
    const targetUser = logoutUser ?? user;
    if (targetUser) {
      try {
        await sessionService.logUserAction(targetUser.user_id, 'logout', {
          method: 'manual',
          timestamp: new Date().toISOString(),
          tabId
        });
        await sessionService.endSession();
      } catch (error) {}
    }
    setUser(null);
    setLoading(false);
    setVersion(v => v + 1);
    // syncUserStateToLocalStorage(null); // This is now handled inside initializeAuth
    sessionStorage.removeItem('venueFinder_session');
  }, [user, tabId]);

  // Periodic session validity check (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setUser(null);
          setLoading(false);
          setVersion(v => v + 1);
          localStorage.removeItem('venueFinder_user');
          sessionStorage.removeItem('venueFinder_session');
          localStorage.setItem('venueFinder_auth_event', JSON.stringify({
            type: 'session_expired',
            user: null,
            timestamp: Date.now(),
            tabId
          }));
          toast.error('Your session has expired. Please sign in again.');
          await supabase.auth.signOut();
          window.location.href = '/signin';
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
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tabId, user]);

  // Listen for changes to venueFinder_user in localStorage (cross-tab and tab duplication)
  useEffect(() => {
    const handleUserStorageChange = (event: StorageEvent) => {
      if (event.key === 'venueFinder_user') {
        if (event.newValue) {
          try {
            const userData = JSON.parse(event.newValue);
            setUser(userData);
            setVersion(v => v + 1);
          } catch (error) {
            setUser(null);
            setVersion(v => v + 1);
          }
        } else {
          setUser(null);
          setVersion(v => v + 1);
        }
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
      if (userData) {
        localStorage.setItem('venueFinder_user', JSON.stringify(userData));
        localStorage.setItem('venueFinder_auth_event', JSON.stringify({
          type: 'user_updated',
          user: userData,
          timestamp: Date.now(),
          tabId
        }));
      } else {
        localStorage.removeItem('venueFinder_user');
        localStorage.setItem('venueFinder_auth_event', JSON.stringify({
          type: 'user_logout',
          user: null,
          timestamp: Date.now(),
          tabId
        }));
      }
    };

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
          if (newProfile) {
            setUser(newProfile);
            setLoading(false);
            setVersion(v => v + 1);
            syncUserStateToLocalStorage(newProfile);
            sessionStorage.setItem('venueFinder_session', JSON.stringify(newProfile));
          }
        } else {
          setUser(profile);
          setLoading(false);
          setVersion(v => v + 1);
          syncUserStateToLocalStorage(profile);
          sessionStorage.setItem('venueFinder_session', JSON.stringify(profile));
        }
      } catch (error) {
        setUser(null);
        setLoading(false);
        setVersion(v => v + 1);
        syncUserStateToLocalStorage(null);
        sessionStorage.removeItem('venueFinder_session');
      }
    };

    // On sign-in, update active_tab_id in profiles
    const handleUserLogin = async (supabaseUser: SupabaseUser) => {
      await syncUserProfile(supabaseUser);
      try {
        // Update active_tab_id in profiles
        await supabase.from('profiles').update({ active_tab_id: tabId }).eq('user_id', supabaseUser.id);
        await sessionService.createSession(supabaseUser.id);
        await sessionService.logUserAction(supabaseUser.id, 'login', {
          method: 'email',
          timestamp: new Date().toISOString(),
          tabId
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
      const savedUser = localStorage.getItem('venueFinder_user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setLoading(false);
          setVersion(v => v + 1);
        } catch (error) {
          setUser(null);
          setLoading(false);
          setVersion(v => v + 1);
        }
      } else {
        setUser(null);
        setLoading(false);
        setVersion(v => v + 1);
      }
    };
    loadUserFromLocalStorage();

    const initializeAuth = async () => {
      try {
        if (!mounted) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (didTimeout || !mounted) return;
        if (session?.user) {
          const supabaseUserId = session.user.id;
          const savedUser = localStorage.getItem('venueFinder_user');
          if (savedUser) {
            try {
              const userData = JSON.parse(savedUser);
              if (userData.user_id === supabaseUserId) {
                setUser(userData);
                setLoading(false);
                setVersion(v => v + 1);
                sessionStorage.setItem('venueFinder_session', savedUser);
                setInitialized(true);
                if (timeoutId) clearTimeout(timeoutId);
                return;
              }
            } catch (error) {
              localStorage.removeItem('venueFinder_user');
              sessionStorage.removeItem('venueFinder_session');
            }
          }
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
                sessionStorage.setItem('venueFinder_session', JSON.stringify(profile));
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
            localStorage.removeItem('venueFinder_user');
            sessionStorage.removeItem('venueFinder_session');
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
          sessionStorage.removeItem('venueFinder_session');
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            if (event === 'SIGNED_IN' && session?.user && !loginInProgress) {
              const currentUser = JSON.parse(localStorage.getItem('venueFinder_user') || 'null');
              if (!currentUser || currentUser.user_id !== session.user.id) {
                await handleUserLogin(session.user as SupabaseUser);
              }
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
  }, [loginInProgress, tabId, isActiveTab]);

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

  // On sign-out, clear active_tab_id in profiles and sessionStorage
  const signOut = useCallback(async () => {
    try {
      await handleUserLogout(user);
      // Clear active_tab_id in profiles
      if (user) {
        await supabase.from('profiles').update({ active_tab_id: null }).eq('user_id', user.user_id);
      }
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      localStorage.removeItem(ACTIVE_TAB_KEY);
      localStorage.removeItem(ACTIVE_TAB_TIMESTAMP_KEY);
      sessionStorage.removeItem(`tabId_${userRoleKey}`);
      setIsActiveTab(true);
      setHandoffPending(false);
      window.location.href = '/';
    }
  }, [handleUserLogout, user, userRoleKey]);

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
                tabId
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

  const value: AuthContextType & { version: number; isActiveTab: boolean; handoffPending: boolean } = {
      user,
      loading: loading && !initialized, // Only show loading if not initialized
      version, // Add version to context value
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    updateProfile,
    refreshUserProfile,
    isActiveTab,
    handoffPending,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};